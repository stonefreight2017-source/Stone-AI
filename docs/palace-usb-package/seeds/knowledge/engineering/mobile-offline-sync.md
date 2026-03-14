# Mobile Offline Sync — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native, SQLite (expo-sqlite), WatermelonDB, Zustand
- **Audience**: Senior Frontend Engineer, Senior Backend Engineer (Mobile)

---

## 1. Offline-First Architecture Overview

Best AI Mobile is designed as an **offline-first** application. Users can compose messages, browse cached agents, and view conversation history without network connectivity. Changes are queued and synced when the connection is restored.

### Design Principles

1. **Local-first reads**: All data displayed comes from the local database first. Network responses update the local cache.
2. **Optimistic writes**: User actions take effect immediately in the UI. Sync happens in the background.
3. **Conflict resolution**: Server wins by default, with user notification for meaningful conflicts.
4. **Minimal sync payloads**: Only changed data is transmitted. Timestamps and version vectors track changes.
5. **Battery awareness**: Sync frequency adapts to battery level and network quality.

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                       │
│              (React Native Screens)               │
└────────────────────┬────────────────────────────┘
                     │
           ┌─────────┴─────────┐
           │                   │
    ┌──────┴──────┐    ┌──────┴──────┐
    │  Zustand    │    │ React Query │
    │  (UI State) │    │ (API Cache) │
    └──────┬──────┘    └──────┬──────┘
           │                   │
    ┌──────┴───────────────────┴──────┐
    │         Sync Engine              │
    │  (Coordinator + Queue Manager)   │
    └──────┬───────────────────┬──────┘
           │                   │
    ┌──────┴──────┐    ┌──────┴──────┐
    │  Local DB   │    │  REST API   │
    │  (SQLite)   │    │  (Server)   │
    └─────────────┘    └─────────────┘
```

---

## 2. Local Database Setup

### SQLite with expo-sqlite

```typescript
// src/services/offline/database.ts
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

class LocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.db = await SQLite.openDatabaseAsync('bestai.db');

    // Enable WAL mode for better concurrent read/write performance
    await this.db.execAsync('PRAGMA journal_mode = WAL;');
    await this.db.execAsync('PRAGMA foreign_keys = ON;');
    await this.db.execAsync('PRAGMA cache_size = -8000;'); // 8MB cache

    await this.createTables();
    this.initialized = true;
  }

  private async createTables(): Promise<void> {
    await this.db!.execAsync(`
      -- Conversations cache
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL,
        last_message TEXT,
        last_message_at TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        server_version INTEGER DEFAULT 0,
        local_version INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'synced' CHECK(sync_status IN ('synced', 'pending', 'conflict'))
      );

      -- Messages cache
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL,
        server_version INTEGER DEFAULT 0,
        local_version INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'synced',
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      -- Agents cache (read-only, synced from server)
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        agent_number INTEGER NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        tier TEXT NOT NULL,
        avatar TEXT,
        capabilities TEXT,
        is_active INTEGER DEFAULT 1,
        updated_at TEXT NOT NULL
      );

      -- Sync queue for offline mutations
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 5,
        created_at TEXT NOT NULL,
        last_attempted_at TEXT,
        error TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'failed', 'completed'))
      );

      -- Sync metadata
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at);
      CREATE INDEX IF NOT EXISTS idx_messages_sync ON messages(sync_status);
    `);
  }

  getDb(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const localDb = new LocalDatabase();
```

### Data Access Layer

```typescript
// src/services/offline/repositories/conversationRepo.ts
import { localDb } from '../database';
import type { Conversation, ChatMessage } from '@/src/types/shared';

export const conversationRepo = {
  async getAll(options?: {
    archived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]> {
    const db = localDb.getDb();
    const archived = options?.archived ? 1 : 0;
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const rows = await db.getAllAsync<Conversation>(
      `SELECT * FROM conversations
       WHERE is_archived = ?
       ORDER BY is_pinned DESC, last_message_at DESC
       LIMIT ? OFFSET ?`,
      [archived, limit, offset]
    );

    return rows;
  },

  async getById(id: string): Promise<Conversation | null> {
    const db = localDb.getDb();
    return db.getFirstAsync<Conversation>(
      'SELECT * FROM conversations WHERE id = ?',
      [id]
    );
  },

  async upsert(conversation: Conversation, fromServer = false): Promise<void> {
    const db = localDb.getDb();
    const syncStatus = fromServer ? 'synced' : 'pending';

    await db.runAsync(
      `INSERT INTO conversations (id, agent_id, title, last_message, last_message_at,
        message_count, is_pinned, is_archived, created_at, updated_at,
        server_version, local_version, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        last_message = excluded.last_message,
        last_message_at = excluded.last_message_at,
        message_count = excluded.message_count,
        is_pinned = excluded.is_pinned,
        is_archived = excluded.is_archived,
        updated_at = excluded.updated_at,
        server_version = CASE WHEN ? THEN excluded.server_version ELSE server_version END,
        local_version = CASE WHEN ? THEN local_version ELSE local_version + 1 END,
        sync_status = ?`,
      [
        conversation.id,
        conversation.agentId,
        conversation.title,
        conversation.lastMessage ?? null,
        conversation.lastMessageAt,
        conversation.messageCount,
        conversation.isPinned ? 1 : 0,
        conversation.isArchived ? 1 : 0,
        conversation.createdAt,
        conversation.updatedAt,
        0, // server_version placeholder
        0, // local_version placeholder
        syncStatus,
        fromServer ? 1 : 0,
        fromServer ? 1 : 0,
        syncStatus,
      ]
    );
  },

  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string }
  ): Promise<ChatMessage[]> {
    const db = localDb.getDb();
    const limit = options?.limit ?? 50;

    if (options?.before) {
      return db.getAllAsync<ChatMessage>(
        `SELECT * FROM messages
         WHERE conversation_id = ? AND created_at < ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [conversationId, options.before, limit]
      );
    }

    return db.getAllAsync<ChatMessage>(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [conversationId, limit]
    );
  },

  async addMessage(message: ChatMessage, fromServer = false): Promise<void> {
    const db = localDb.getDb();
    const syncStatus = fromServer ? 'synced' : 'pending';

    await db.runAsync(
      `INSERT INTO messages (id, conversation_id, role, content, agent_id,
        metadata, created_at, server_version, local_version, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
       ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        metadata = excluded.metadata,
        sync_status = ?`,
      [
        message.id,
        message.conversationId,
        message.role,
        message.content,
        message.agentId,
        message.metadata ? JSON.stringify(message.metadata) : null,
        message.createdAt,
        syncStatus,
        syncStatus,
      ]
    );
  },

  async getPendingCount(): Promise<number> {
    const db = localDb.getDb();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM messages WHERE sync_status = 'pending'"
    );
    return result?.count ?? 0;
  },

  async search(query: string): Promise<Conversation[]> {
    const db = localDb.getDb();
    return db.getAllAsync<Conversation>(
      `SELECT c.* FROM conversations c
       INNER JOIN messages m ON c.id = m.conversation_id
       WHERE m.content LIKE ? OR c.title LIKE ?
       GROUP BY c.id
       ORDER BY c.last_message_at DESC
       LIMIT 20`,
      [`%${query}%`, `%${query}%`]
    );
  },
};
```

---

## 3. WatermelonDB Alternative

For apps with complex relational data and high-frequency updates, WatermelonDB provides a more structured approach:

```typescript
// src/services/offline/watermelon/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'conversations',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'agent_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'last_message', type: 'string', isOptional: true },
        { name: 'last_message_at', type: 'number', isIndexed: true },
        { name: 'message_count', type: 'number' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'agent_id', type: 'string' },
        { name: 'metadata', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'agents',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'agent_number', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'tier', type: 'string' },
        { name: 'avatar', type: 'string', isOptional: true },
        { name: 'capabilities', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
```

```typescript
// src/services/offline/watermelon/models/Conversation.ts
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, lazy } from '@nozbe/watermelondb/decorators';

export class ConversationModel extends Model {
  static table = 'conversations';
  static associations = {
    messages: { type: 'has_many' as const, foreignKey: 'conversation_id' },
  };

  @field('server_id') serverId!: string;
  @field('agent_id') agentId!: string;
  @field('title') title!: string;
  @field('last_message') lastMessage!: string | null;
  @date('last_message_at') lastMessageAt!: Date;
  @field('message_count') messageCount!: number;
  @field('is_pinned') isPinned!: boolean;
  @field('is_archived') isArchived!: boolean;
  @field('sync_status') syncStatus!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('messages') messages!: any;

  @lazy recentMessages = this.messages
    .extend(Q.sortBy('created_at', Q.desc))
    .extend(Q.take(20));
}
```

**Decision: SQLite vs WatermelonDB**

For Best AI Mobile v1, **expo-sqlite is the choice** because:
- Simpler setup, fewer native dependencies
- Direct SQL control for performance tuning
- Lighter bundle size
- The data model (conversations + messages) is straightforward
- WatermelonDB's reactive queries are nice but not critical for chat

If the app grows to need complex relational queries with live-updating list views across many tables, migrate to WatermelonDB.

---

## 4. Sync Queue

### Queue Manager

```typescript
// src/services/offline/syncQueue.ts
import { localDb } from './database';
import { generateId } from '@/src/utils/ids';

interface SyncQueueItem {
  id: number;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  lastAttemptedAt: string | null;
  error: string | null;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
}

export const syncQueue = {
  async enqueue(item: {
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    payload: object;
  }): Promise<void> {
    const db = localDb.getDb();
    await db.runAsync(
      `INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        item.entityType,
        item.entityId,
        item.operation,
        JSON.stringify(item.payload),
        new Date().toISOString(),
      ]
    );
  },

  async getPending(limit = 20): Promise<SyncQueueItem[]> {
    const db = localDb.getDb();
    return db.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue
       WHERE status IN ('pending', 'failed')
       AND retry_count < max_retries
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit]
    );
  },

  async markInProgress(id: number): Promise<void> {
    const db = localDb.getDb();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'in_progress', last_attempted_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), id]
    );
  },

  async markCompleted(id: number): Promise<void> {
    const db = localDb.getDb();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'completed' WHERE id = ?`,
      [id]
    );
  },

  async markFailed(id: number, error: string): Promise<void> {
    const db = localDb.getDb();
    await db.runAsync(
      `UPDATE sync_queue SET
        status = 'failed',
        error = ?,
        retry_count = retry_count + 1,
        last_attempted_at = ?
       WHERE id = ?`,
      [error, new Date().toISOString(), id]
    );
  },

  async clearCompleted(): Promise<void> {
    const db = localDb.getDb();
    await db.runAsync("DELETE FROM sync_queue WHERE status = 'completed'");
  },

  async getQueueSize(): Promise<{ pending: number; failed: number }> {
    const db = localDb.getDb();
    const result = await db.getFirstAsync<{ pending: number; failed: number }>(
      `SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM sync_queue
       WHERE status IN ('pending', 'failed')`
    );
    return result ?? { pending: 0, failed: 0 };
  },

  async deduplicateQueue(): Promise<void> {
    // Remove redundant operations on the same entity
    // e.g., multiple updates to the same message — keep only the latest
    const db = localDb.getDb();
    await db.runAsync(
      `DELETE FROM sync_queue
       WHERE id NOT IN (
         SELECT MAX(id) FROM sync_queue
         WHERE status = 'pending'
         GROUP BY entity_type, entity_id, operation
       )
       AND status = 'pending'`
    );
  },
};
```

### Enqueueing Offline Mutations

```typescript
// src/services/offline/offlineMutations.ts
import { syncQueue } from './syncQueue';
import { conversationRepo } from './repositories/conversationRepo';
import { generateUUID } from '@/src/utils/ids';
import type { ChatMessage } from '@/src/types/shared';

export const offlineMutations = {
  async sendMessage(params: {
    conversationId: string;
    agentId: string;
    content: string;
  }): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: generateUUID(),
      conversationId: params.conversationId,
      role: 'user',
      content: params.content,
      agentId: params.agentId,
      metadata: { offline: true, synced: false },
      createdAt: new Date().toISOString(),
    };

    // Save to local DB immediately
    await conversationRepo.addMessage(message, false);

    // Queue for sync
    await syncQueue.enqueue({
      entityType: 'message',
      entityId: message.id,
      operation: 'create',
      payload: {
        conversationId: params.conversationId,
        agentId: params.agentId,
        content: params.content,
        clientMessageId: message.id,
      },
    });

    return message;
  },

  async createConversation(agentId: string): Promise<string> {
    const id = generateUUID();
    const now = new Date().toISOString();

    const conversation = {
      id,
      userId: '', // Will be filled by server
      agentId,
      title: 'New Conversation',
      lastMessageAt: now,
      messageCount: 0,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    await conversationRepo.upsert(conversation as any, false);

    await syncQueue.enqueue({
      entityType: 'conversation',
      entityId: id,
      operation: 'create',
      payload: { agentId, clientId: id },
    });

    return id;
  },

  async pinConversation(id: string, pinned: boolean): Promise<void> {
    const db = (await import('./database')).localDb.getDb();
    await db.runAsync(
      `UPDATE conversations SET is_pinned = ?, sync_status = 'pending' WHERE id = ?`,
      [pinned ? 1 : 0, id]
    );

    await syncQueue.enqueue({
      entityType: 'conversation',
      entityId: id,
      operation: 'update',
      payload: { isPinned: pinned },
    });
  },
};
```

---

## 5. Sync Engine

### Core Sync Coordinator

```typescript
// src/services/offline/syncEngine.ts
import { syncQueue } from './syncQueue';
import { conversationRepo } from './repositories/conversationRepo';
import { localDb } from './database';
import { apiClient } from '../api/client';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';

interface SyncConfig {
  batchSize: number;
  intervalMs: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  lowBatteryThreshold: number;
}

const DEFAULT_CONFIG: SyncConfig = {
  batchSize: 20,
  intervalMs: 30_000,       // 30 seconds
  retryDelayMs: 5_000,      // 5 seconds initial retry
  maxRetryDelayMs: 300_000,  // 5 minutes max retry
  lowBatteryThreshold: 0.15, // 15%
};

class SyncEngine {
  private config: SyncConfig;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private isOnline = true;
  private appState: AppStateStatus = 'active';
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    // Listen for network changes
    NetInfo.addEventListener(this.handleNetworkChange);

    // Listen for app state changes
    AppState.addEventListener('change', this.handleAppStateChange);

    // Initial network check
    const netState = await NetInfo.fetch();
    this.isOnline = netState.isConnected ?? false;

    // Start periodic sync
    this.startPeriodicSync();

    // Do an initial sync if online
    if (this.isOnline) {
      await this.sync();
    }
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private startPeriodicSync(): void {
    this.syncTimer = setInterval(async () => {
      if (this.isOnline && this.appState === 'active') {
        await this.sync();
      }
    }, this.config.intervalMs);
  }

  private handleNetworkChange = (state: NetInfoState) => {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected ?? false;

    if (wasOffline && this.isOnline) {
      // Came back online — trigger immediate sync
      console.log('[SyncEngine] Back online, triggering sync');
      this.sync();
    }

    this.notifyListeners();
  };

  private handleAppStateChange = (nextState: AppStateStatus) => {
    const wasBackground = this.appState !== 'active';
    this.appState = nextState;

    if (wasBackground && nextState === 'active' && this.isOnline) {
      // App foregrounded — sync
      console.log('[SyncEngine] App foregrounded, triggering sync');
      this.sync();
    }
  };

  async sync(): Promise<SyncResult> {
    if (this.isSyncing || !this.isOnline) {
      return { pushed: 0, pulled: 0, conflicts: 0, errors: [] };
    }

    this.isSyncing = true;
    this.notifyListeners();

    const result: SyncResult = {
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Check battery — reduce sync frequency if low
      const batteryLevel = await Battery.getBatteryLevelAsync();
      if (batteryLevel < this.config.lowBatteryThreshold) {
        console.log('[SyncEngine] Low battery, skipping non-critical sync');
        // Only push critical items (new messages)
        await this.pushCriticalOnly(result);
      } else {
        // Full sync cycle
        await this.pushChanges(result);
        await this.pullChanges(result);
      }

      // Cleanup completed items
      await syncQueue.clearCompleted();
      await syncQueue.deduplicateQueue();

    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown sync error'
      );
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return result;
  }

  private async pushChanges(result: SyncResult): Promise<void> {
    const items = await syncQueue.getPending(this.config.batchSize);

    for (const item of items) {
      try {
        await syncQueue.markInProgress(item.id);
        const payload = JSON.parse(item.payload);

        const response = await this.pushSingleItem(
          item.entityType,
          item.operation,
          payload
        );

        // If server returns a different ID (e.g., server-generated),
        // update local references
        if (response?.serverId && response.serverId !== item.entityId) {
          await this.remapEntityId(
            item.entityType,
            item.entityId,
            response.serverId
          );
        }

        await syncQueue.markCompleted(item.id);
        result.pushed++;

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (this.isConflict(error)) {
          result.conflicts++;
          await this.resolveConflict(item, error);
        } else if (this.isRetryable(error)) {
          await syncQueue.markFailed(item.id, message);
        } else {
          // Non-retryable error — mark as permanently failed
          await syncQueue.markFailed(item.id, `PERMANENT: ${message}`);
          result.errors.push(message);
        }
      }
    }
  }

  private async pushSingleItem(
    entityType: string,
    operation: string,
    payload: any
  ): Promise<any> {
    switch (`${entityType}:${operation}`) {
      case 'message:create':
        return apiClient.post('/api/chat/messages', payload);
      case 'conversation:create':
        return apiClient.post('/api/chat/conversations', payload);
      case 'conversation:update':
        return apiClient.patch(
          `/api/chat/conversations/${payload.id}`,
          payload
        );
      case 'conversation:delete':
        return apiClient.delete(
          `/api/chat/conversations/${payload.id}`
        );
      default:
        throw new Error(`Unknown sync operation: ${entityType}:${operation}`);
    }
  }

  private async pullChanges(result: SyncResult): Promise<void> {
    const lastSyncTime = await this.getLastSyncTime();

    try {
      // Pull conversations updated since last sync
      const { data } = await apiClient.get('/api/mobile/sync', {
        params: {
          since: lastSyncTime,
          entities: ['conversations', 'messages', 'agents'],
        },
      });

      // Apply server changes to local DB
      if (data.conversations) {
        for (const conv of data.conversations) {
          await conversationRepo.upsert(conv, true);
          result.pulled++;
        }
      }

      if (data.messages) {
        for (const msg of data.messages) {
          await conversationRepo.addMessage(msg, true);
          result.pulled++;
        }
      }

      if (data.agents) {
        await this.updateAgentsCache(data.agents);
        result.pulled += data.agents.length;
      }

      // Update last sync time
      await this.setLastSyncTime(new Date().toISOString());

    } catch (error) {
      result.errors.push(
        `Pull failed: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  private async pushCriticalOnly(result: SyncResult): Promise<void> {
    const db = localDb.getDb();
    const items = await db.getAllAsync<any>(
      `SELECT * FROM sync_queue
       WHERE status = 'pending'
       AND entity_type = 'message'
       AND operation = 'create'
       ORDER BY created_at ASC
       LIMIT 10`
    );

    for (const item of items) {
      try {
        await syncQueue.markInProgress(item.id);
        const payload = JSON.parse(item.payload);
        await this.pushSingleItem('message', 'create', payload);
        await syncQueue.markCompleted(item.id);
        result.pushed++;
      } catch {
        await syncQueue.markFailed(item.id, 'Low battery push failed');
      }
    }
  }

  private isConflict(error: any): boolean {
    return error?.response?.status === 409;
  }

  private isRetryable(error: any): boolean {
    const status = error?.response?.status;
    if (!status) return true; // Network error — retryable
    return status >= 500 || status === 429;
  }

  private async resolveConflict(item: any, error: any): Promise<void> {
    // Default strategy: server wins
    // Pull the server version and overwrite local
    const serverVersion = error?.response?.data?.serverVersion;

    if (serverVersion && item.entityType === 'conversation') {
      await conversationRepo.upsert(serverVersion, true);
    }

    await syncQueue.markCompleted(item.id);
  }

  private async remapEntityId(
    entityType: string,
    localId: string,
    serverId: string
  ): Promise<void> {
    const db = localDb.getDb();

    if (entityType === 'conversation') {
      await db.runAsync(
        'UPDATE conversations SET id = ? WHERE id = ?',
        [serverId, localId]
      );
      await db.runAsync(
        'UPDATE messages SET conversation_id = ? WHERE conversation_id = ?',
        [serverId, localId]
      );
    } else if (entityType === 'message') {
      await db.runAsync(
        'UPDATE messages SET id = ? WHERE id = ?',
        [serverId, localId]
      );
    }
  }

  private async getLastSyncTime(): Promise<string> {
    const db = localDb.getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM sync_metadata WHERE key = 'last_sync_time'"
    );
    return row?.value ?? new Date(0).toISOString();
  }

  private async setLastSyncTime(time: string): Promise<void> {
    const db = localDb.getDb();
    await db.runAsync(
      `INSERT INTO sync_metadata (key, value, updated_at)
       VALUES ('last_sync_time', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
      [time, time, time, time]
    );
  }

  private async updateAgentsCache(agents: any[]): Promise<void> {
    const db = localDb.getDb();
    for (const agent of agents) {
      await db.runAsync(
        `INSERT INTO agents (id, name, agent_number, description, category, tier,
          avatar, capabilities, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          category = excluded.category,
          tier = excluded.tier,
          avatar = excluded.avatar,
          capabilities = excluded.capabilities,
          is_active = excluded.is_active,
          updated_at = excluded.updated_at`,
        [
          agent.id, agent.name, agent.agentNumber, agent.description,
          agent.category, agent.tier, agent.avatar,
          JSON.stringify(agent.capabilities), agent.isActive ? 1 : 0,
          agent.updatedAt,
        ]
      );
    }
  }

  // Status listeners for UI sync indicators
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const status: SyncStatus = {
      isSyncing: this.isSyncing,
      isOnline: this.isOnline,
    };
    this.listeners.forEach((fn) => fn(status));
  }
}

interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

interface SyncStatus {
  isSyncing: boolean;
  isOnline: boolean;
}

export const syncEngine = new SyncEngine();
```

---

## 6. Conflict Resolution

### Conflict Resolution Strategies

```typescript
// src/services/offline/conflictResolver.ts

export type ConflictStrategy = 'server_wins' | 'client_wins' | 'merge' | 'ask_user';

interface ConflictInfo {
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  localTimestamp: string;
  serverTimestamp: string;
}

export class ConflictResolver {
  private strategies: Map<string, ConflictStrategy> = new Map([
    ['message', 'server_wins'],       // Messages: server is authoritative
    ['conversation', 'merge'],         // Conversations: merge non-conflicting fields
    ['agent', 'server_wins'],          // Agents: server-only data
    ['user_preference', 'client_wins'], // Preferences: user's device is authoritative
  ]);

  async resolve(conflict: ConflictInfo): Promise<any> {
    const strategy = this.strategies.get(conflict.entityType) ?? 'server_wins';

    switch (strategy) {
      case 'server_wins':
        return this.resolveServerWins(conflict);
      case 'client_wins':
        return this.resolveClientWins(conflict);
      case 'merge':
        return this.resolveMerge(conflict);
      case 'ask_user':
        return this.resolveAskUser(conflict);
    }
  }

  private resolveServerWins(conflict: ConflictInfo): any {
    return conflict.serverVersion;
  }

  private resolveClientWins(conflict: ConflictInfo): any {
    return conflict.localVersion;
  }

  private resolveMerge(conflict: ConflictInfo): any {
    const merged = { ...conflict.serverVersion };

    // For conversations, merge non-conflicting fields
    // Title: use whichever was modified more recently
    if (conflict.entityType === 'conversation') {
      const localTime = new Date(conflict.localTimestamp).getTime();
      const serverTime = new Date(conflict.serverTimestamp).getTime();

      // Pin/archive status: use most recent
      if (localTime > serverTime) {
        merged.isPinned = conflict.localVersion.isPinned;
        merged.isArchived = conflict.localVersion.isArchived;
      }

      // Title: use most recent
      if (
        conflict.localVersion.title !== conflict.serverVersion.title &&
        localTime > serverTime
      ) {
        merged.title = conflict.localVersion.title;
      }

      // Message count: use server (authoritative)
      merged.messageCount = conflict.serverVersion.messageCount;
    }

    return merged;
  }

  private async resolveAskUser(conflict: ConflictInfo): Promise<any> {
    // Store the conflict for user resolution
    // UI will show a conflict resolution dialog
    const db = (await import('./database')).localDb.getDb();
    await db.runAsync(
      `UPDATE ${conflict.entityType}s SET sync_status = 'conflict' WHERE id = ?`,
      [conflict.entityId]
    );

    // Return server version as temporary resolution
    return conflict.serverVersion;
  }
}

export const conflictResolver = new ConflictResolver();
```

### Three-Way Merge for Complex Cases

```typescript
// Three-way merge when both client and server have diverged from a common ancestor
function threeWayMerge<T extends Record<string, any>>(
  base: T,     // Common ancestor (last synced version)
  local: T,    // Client's current version
  server: T,   // Server's current version
): { merged: T; conflicts: string[] } {
  const merged = { ...base } as T;
  const conflicts: string[] = [];

  const allKeys = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(server),
  ]);

  for (const key of allKeys) {
    const baseVal = base[key];
    const localVal = local[key];
    const serverVal = server[key];

    if (localVal === baseVal && serverVal === baseVal) {
      // No change
      continue;
    }

    if (localVal === baseVal && serverVal !== baseVal) {
      // Only server changed
      (merged as any)[key] = serverVal;
    } else if (localVal !== baseVal && serverVal === baseVal) {
      // Only client changed
      (merged as any)[key] = localVal;
    } else if (localVal === serverVal) {
      // Both changed to same value
      (merged as any)[key] = localVal;
    } else {
      // True conflict — both changed differently
      conflicts.push(key);
      // Default: server wins for conflicting fields
      (merged as any)[key] = serverVal;
    }
  }

  return { merged, conflicts };
}
```

---

## 7. Background Sync

### Background Fetch Setup

```typescript
// src/services/offline/backgroundSync.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncEngine } from './syncEngine';

const BACKGROUND_SYNC_TASK = 'BEST_AI_BACKGROUND_SYNC';

// Register the background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const result = await syncEngine.sync();

    if (result.pushed > 0 || result.pulled > 0) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundSync] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes minimum
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('[BackgroundSync] Registered successfully');
  } catch (error) {
    console.error('[BackgroundSync] Registration failed:', error);
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
}
```

### Network-Aware Sync Scheduling

```typescript
// src/services/offline/syncScheduler.ts
import NetInfo from '@react-native-community/netinfo';

interface SyncSchedule {
  interval: number;     // ms between syncs
  batchSize: number;    // items per batch
  fullSync: boolean;    // whether to do full pull
}

export function getSyncSchedule(networkType: string | null): SyncSchedule {
  switch (networkType) {
    case 'wifi':
      return {
        interval: 15_000,    // 15 seconds on WiFi
        batchSize: 50,
        fullSync: true,
      };
    case 'cellular':
      return {
        interval: 60_000,    // 1 minute on cellular
        batchSize: 10,
        fullSync: false,      // Only push, selective pull
      };
    case 'none':
    case 'unknown':
    default:
      return {
        interval: 0,          // No sync when offline
        batchSize: 0,
        fullSync: false,
      };
  }
}
```

---

## 8. React Hook Integration

```typescript
// src/hooks/useOfflineSync.ts
import { useEffect, useState, useCallback } from 'react';
import { syncEngine } from '@/src/services/offline/syncEngine';
import { localDb } from '@/src/services/offline/database';
import { registerBackgroundSync } from '@/src/services/offline/backgroundSync';

interface SyncStatus {
  isSyncing: boolean;
  isOnline: boolean;
  pendingCount: number;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    isOnline: true,
    pendingCount: 0,
  });

  useEffect(() => {
    // Initialize database and sync engine
    const init = async () => {
      await localDb.initialize();
      await syncEngine.start();
      await registerBackgroundSync();
    };

    init();

    // Listen for sync status changes
    const unsubscribe = syncEngine.onStatusChange((syncStatus) => {
      setStatus((prev) => ({
        ...prev,
        isSyncing: syncStatus.isSyncing,
        isOnline: syncStatus.isOnline,
      }));
    });

    return () => {
      unsubscribe();
      syncEngine.stop();
    };
  }, []);

  const forceSync = useCallback(async () => {
    return syncEngine.sync();
  }, []);

  return { ...status, forceSync };
}
```

```typescript
// src/hooks/useOfflineMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { conversationRepo } from '@/src/services/offline/repositories/conversationRepo';
import { offlineMutations } from '@/src/services/offline/offlineMutations';
import { useNetworkStatus } from './useNetworkStatus';
import type { ChatMessage } from '@/src/types/shared';

export function useOfflineMessages(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Load messages from local DB
  useEffect(() => {
    const loadMessages = async () => {
      const localMessages = await conversationRepo.getMessages(conversationId);
      setMessages(localMessages.reverse()); // Oldest first for display
    };
    loadMessages();
  }, [conversationId]);

  // Send message (works offline)
  const sendMessage = useCallback(
    async (content: string, agentId: string) => {
      const message = await offlineMutations.sendMessage({
        conversationId,
        agentId,
        content,
      });

      // Optimistically add to local state
      setMessages((prev) => [...prev, message]);

      return message;
    },
    [conversationId]
  );

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldest = messages[0];
    const olderMessages = await conversationRepo.getMessages(conversationId, {
      limit: 50,
      before: oldest.createdAt,
    });

    setMessages((prev) => [...olderMessages.reverse(), ...prev]);
    setIsLoadingMore(false);
  }, [conversationId, messages, isLoadingMore]);

  return {
    messages,
    sendMessage,
    loadMore,
    isLoadingMore,
    isOnline,
  };
}
```

---

## 9. Offline UI Indicators

```typescript
// src/components/common/OfflineBanner.tsx
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useOfflineSync } from '@/src/hooks/useOfflineSync';
import { useTheme } from '@/src/theme';

export function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    height: withTiming(isOnline ? 0 : 32, { duration: 300 }),
    opacity: withTiming(isOnline ? 0 : 1, { duration: 300 }),
  }));

  if (isOnline && !isSyncing) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: isOnline
            ? theme.colors.warning
            : theme.colors.error,
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>
        {!isOnline
          ? `Offline — ${pendingCount} changes pending`
          : 'Syncing...'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
});
```

---

## 10. Data Migration Strategy

```typescript
// src/services/offline/migrations.ts
// Handle local database schema migrations across app versions

interface Migration {
  version: number;
  up: (db: any) => Promise<void>;
  description: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema',
    up: async () => {
      // Handled by createTables in database.ts
    },
  },
  {
    version: 2,
    description: 'Add full-text search index',
    up: async (db) => {
      await db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
        USING fts5(content, conversation_id UNINDEXED);

        INSERT INTO messages_fts (rowid, content, conversation_id)
        SELECT rowid, content, conversation_id FROM messages;
      `);
    },
  },
  {
    version: 3,
    description: 'Add bestie conversations table',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS bestie_conversations (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );
      `);
    },
  },
];

export async function runMigrations(db: any): Promise<void> {
  // Get current version
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`
  );

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version'
  );
  const currentVersion = row?.version ?? 0;

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`[Migration] Running v${migration.version}: ${migration.description}`);
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_version (version) VALUES (?)',
        [migration.version]
      );
    }
  }
}
```

This offline sync architecture ensures Best AI Mobile users have a seamless experience regardless of network conditions, with intelligent conflict resolution and battery-aware sync scheduling.
