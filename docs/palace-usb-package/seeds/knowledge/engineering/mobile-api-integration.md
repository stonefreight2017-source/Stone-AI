# Mobile API Integration — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering / Backend
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Axios, WebSocket, React Query
- **Audience**: Senior Backend Engineer, Senior Frontend Engineer

---

## 1. API Client Architecture

```
┌─────────────────────────────────────────────┐
│              React Query Hooks               │
│  useAgents() useChat() useSubscription()     │
├─────────────────────────────────────────────┤
│              Service Layer                    │
│  agentService  chatService  authService      │
├──────────────────┬──────────────────────────┤
│   REST Client    │    WebSocket Client       │
│   (Axios)        │    (ws/streaming)         │
├──────────────────┴──────────────────────────┤
│              Interceptors                     │
│  Auth Header │ Retry │ Offline Queue │ Log   │
├─────────────────────────────────────────────┤
│              Network Layer                    │
│  Certificate Pinning │ Request Signing        │
└─────────────────────────────────────────────┘
```

---

## 2. REST API Client

### Axios Client Setup

```typescript
// src/services/api/client.ts
import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { Platform } from 'react-native';
import { appConfig } from '@/src/utils/env';
import { tokenManager } from '@/src/services/auth/tokenManager';
import { keychain } from '@/src/services/security/keychain';
import NetInfo from '@react-native-community/netinfo';
import { syncQueue } from '@/src/services/offline/syncQueue';

// Create the base Axios instance
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: appConfig.apiUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Client': 'best-ai-mobile',
      'X-Client-Version': APP_VERSION,
      'X-Platform': Platform.OS,
      'X-Platform-Version': Platform.Version.toString(),
    },
  });

  // Request interceptors
  client.interceptors.request.use(
    authInterceptor,
    (error) => Promise.reject(error)
  );

  client.interceptors.request.use(
    deviceInterceptor,
    (error) => Promise.reject(error)
  );

  // Response interceptors
  client.interceptors.response.use(
    successInterceptor,
    errorInterceptor
  );

  return client;
}

// Auth header injection
async function authInterceptor(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  try {
    const token = await tokenManager.getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Try cached token for offline scenarios
    const cachedToken = await keychain.getAuthToken();
    if (cachedToken) {
      config.headers.Authorization = `Bearer ${cachedToken}`;
    }
  }
  return config;
}

// Device ID and request signing
async function deviceInterceptor(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const deviceId = await keychain.getOrCreateDeviceId();
  config.headers['X-Device-ID'] = deviceId;
  config.headers['X-Timestamp'] = Date.now().toString();
  return config;
}

// Success response handler
function successInterceptor(response: AxiosResponse): AxiosResponse {
  return response;
}

// Error response handler with retry and offline queuing
async function errorInterceptor(error: AxiosError): Promise<never> {
  const config = error.config as InternalAxiosRequestConfig & {
    _retryCount?: number;
    _offlineQueued?: boolean;
  };

  // Token expired — refresh and retry
  if (error.response?.status === 401 && !config._retryCount) {
    config._retryCount = 1;
    try {
      await tokenManager.refreshToken();
      return apiClient.request(config);
    } catch {
      // Refresh failed — sign out
      const { authStore } = await import('@/src/stores/authStore');
      authStore.getState().reset();
    }
  }

  // Rate limited — wait and retry
  if (error.response?.status === 429) {
    const retryAfter = parseInt(
      error.response.headers['retry-after'] ?? '5',
      10
    );
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return apiClient.request(config);
  }

  // Server error — retry with backoff (max 2 retries)
  if (
    error.response?.status &&
    error.response.status >= 500 &&
    (!config._retryCount || config._retryCount < 2)
  ) {
    config._retryCount = (config._retryCount ?? 0) + 1;
    const delay = Math.pow(2, config._retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return apiClient.request(config);
  }

  // Network error — check if we can queue for offline
  if (!error.response && config.method !== 'get' && !config._offlineQueued) {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      config._offlineQueued = true;
      await queueForOffline(config);
      // Return a synthetic response so the UI doesn't error
      return {
        data: { queued: true, offlineId: Date.now() },
        status: 202,
        statusText: 'Queued for sync',
        headers: {},
        config,
      } as any;
    }
  }

  return Promise.reject(error);
}

async function queueForOffline(config: InternalAxiosRequestConfig): Promise<void> {
  const method = config.method?.toUpperCase();
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    await syncQueue.enqueue({
      entityType: 'api_request',
      entityId: `${config.url}-${Date.now()}`,
      operation: method === 'POST' ? 'create' : method === 'PATCH' ? 'update' : 'delete',
      payload: {
        url: config.url,
        method: config.method,
        data: config.data,
      },
    });
  }
}

export const apiClient = createApiClient();
```

---

## 3. Service Layer

### Agent Service

```typescript
// src/services/api/agents.ts
import { apiClient } from './client';
import type { Agent, AgentTier } from '@/src/types/shared';

export const agentService = {
  async getAll(): Promise<Agent[]> {
    const { data } = await apiClient.get<Agent[]>('/api/agents');
    return data;
  },

  async getById(agentId: string): Promise<Agent> {
    const { data } = await apiClient.get<Agent>(`/api/agents/${agentId}`);
    return data;
  },

  async getByTier(tier: AgentTier): Promise<Agent[]> {
    const { data } = await apiClient.get<Agent[]>('/api/agents', {
      params: { tier },
    });
    return data;
  },

  async getCategories(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/api/agents/categories');
    return data;
  },
};
```

### Chat Service

```typescript
// src/services/api/chat.ts
import { apiClient } from './client';
import type { ChatMessage, Conversation } from '@/src/types/shared';

interface ConversationListResponse {
  items: Conversation[];
  nextCursor?: string;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (message: ChatMessage) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export const chatService = {
  async getConversations(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<ConversationListResponse> {
    const { data } = await apiClient.get<ConversationListResponse>(
      '/api/chat/conversations',
      { params }
    );
    return data;
  },

  async getMessages(
    agentId: string,
    params?: { before?: string; limit?: number }
  ): Promise<ChatMessage[]> {
    const { data } = await apiClient.get<ChatMessage[]>(
      `/api/chat/messages/${agentId}`,
      { params }
    );
    return data;
  },

  async sendMessage(params: {
    agentId: string;
    content: string;
    conversationId?: string;
  }): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>(
      '/api/chat/messages',
      params
    );
    return data;
  },

  // Streaming response via Server-Sent Events
  async streamMessage(
    params: {
      agentId: string;
      content: string;
      conversationId?: string;
    },
    callbacks: StreamCallbacks
  ): Promise<void> {
    const token = await (
      await import('@/src/services/auth/tokenManager')
    ).tokenManager.getValidToken();

    const url = `${appConfig.apiUrl}/api/chat/stream`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(params),
        signal: callbacks.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              // Stream complete — final message from server
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'token') {
                fullContent += parsed.content;
                callbacks.onToken(parsed.content);
              } else if (parsed.type === 'complete') {
                callbacks.onComplete(parsed.message);
              } else if (parsed.type === 'error') {
                callbacks.onError(new Error(parsed.message));
              }
            } catch {
              // Non-JSON data line, skip
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Stream was cancelled by user — not an error
        return;
      }
      callbacks.onError(error as Error);
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/api/chat/conversations/${conversationId}`);
  },

  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const { data } = await apiClient.patch<Conversation>(
      `/api/chat/conversations/${conversationId}`,
      updates
    );
    return data;
  },
};
```

### Subscription Service

```typescript
// src/services/api/subscription.ts
import { apiClient } from './client';
import type { Subscription } from '@/src/types/shared';

export const subscriptionService = {
  async getStatus(): Promise<Subscription | null> {
    const { data } = await apiClient.get<Subscription | null>(
      '/api/subscription/status'
    );
    return data;
  },

  async validateReceipt(params: {
    platform: 'apple' | 'google';
    receipt: string;
    productId: string;
  }): Promise<{ valid: boolean; tier: string }> {
    const { data } = await apiClient.post(
      '/api/mobile/receipt/validate',
      params
    );
    return data;
  },

  async syncFromRevenueCat(): Promise<Subscription> {
    const { data } = await apiClient.post('/api/subscription/sync-mobile');
    return data;
  },
};
```

---

## 4. WebSocket Client for Streaming

```typescript
// src/services/api/websocket.ts

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectCount = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isIntentionalClose = false;
  private onConnect: ConnectionHandler | null = null;
  private onDisconnect: ConnectionHandler | null = null;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: appConfig.wsUrl,
      reconnectAttempts: 10,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  async connect(): Promise<void> {
    const token = await tokenManager.getValidToken();
    if (!token) throw new Error('No auth token');

    return new Promise((resolve, reject) => {
      const url = `${this.config.url}/ws?token=${token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectCount = 0;
        this.startHeartbeat();
        this.onConnect?.();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {
          // Invalid JSON
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.onDisconnect?.();

        if (!this.isIntentionalClose) {
          this.attemptReconnect();
        }
      };
    });
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  setConnectionHandlers(
    onConnect: ConnectionHandler,
    onDisconnect: ConnectionHandler
  ): void {
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
  }

  private handleMessage(data: any): void {
    const handlers = this.handlers.get(data.type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }

    // Global handlers
    const globalHandlers = this.handlers.get('*');
    if (globalHandlers) {
      globalHandlers.forEach((handler) => handler(data));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectCount++;
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectCount - 1);
    const jitter = Math.random() * 1000;

    console.log(
      `[WebSocket] Reconnecting in ${delay + jitter}ms (attempt ${this.reconnectCount})`
    );

    await new Promise((resolve) => setTimeout(resolve, delay + jitter));

    try {
      await this.connect();
    } catch {
      // Will trigger onclose → attemptReconnect again
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
```

### WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useCallback } from 'react';
import { wsManager } from '@/src/services/api/websocket';
import { chatStore } from '@/src/stores/chatStore';
import { useAuth } from './useAuth';

export function useWebSocket() {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    // Connect WebSocket
    wsManager.connect().catch(console.error);

    // Handle real-time events
    const unsubTyping = wsManager.on('agent_typing', (data) => {
      chatStore.getState().setAgentTyping(data.agentId, true);
    });

    const unsubStopTyping = wsManager.on('agent_stop_typing', (data) => {
      chatStore.getState().setAgentTyping(data.agentId, false);
    });

    const unsubNewMessage = wsManager.on('new_message', (data) => {
      chatStore.getState().markNewMessage(data.conversationId);
    });

    return () => {
      unsubTyping();
      unsubStopTyping();
      unsubNewMessage();
      wsManager.disconnect();
    };
  }, [isSignedIn]);
}
```

---

## 5. Request Queuing

```typescript
// src/services/api/requestQueue.ts
// Queue requests when offline, replay when online

import NetInfo from '@react-native-community/netinfo';

class RequestQueue {
  private queue: Array<{
    id: string;
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private isProcessing = false;
  private isOnline = true;

  constructor() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOnline) {
      return fn();
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        id: Date.now().toString(),
        fn,
        resolve,
        reject,
      });
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue.shift()!;
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isProcessing = false;
  }
}

export const requestQueue = new RequestQueue();
```

---

## 6. API Response Types

```typescript
// src/types/api.ts

// Standard API response wrapper
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    nextCursor?: string;
  };
}

// Error response
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  status: number;
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  totalCount?: number;
  hasMore: boolean;
}

// Mobile config response
interface MobileConfig {
  featureFlags: {
    offlineMode: boolean;
    voiceInput: boolean;
    bestieV2: boolean;
    forumEnabled: boolean;
  };
  minAppVersion: string;
  latestAppVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

// Sync response
interface SyncResponse {
  conversations: Conversation[];
  messages: ChatMessage[];
  agents: Agent[];
  deletedIds: {
    conversations: string[];
    messages: string[];
  };
  serverTimestamp: string;
}
```

---

## 7. API Error Handling

```typescript
// src/utils/apiErrors.ts
import { AxiosError } from 'axios';
import { toast } from '@/src/components/ui/Toast';

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Please sign in again',
  FORBIDDEN: 'You don\'t have access to this feature',
  NOT_FOUND: 'Content not found',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  TIER_REQUIRED: 'Upgrade your plan to access this agent',
  MAINTENANCE: 'Service is temporarily unavailable',
  NETWORK_ERROR: 'No internet connection',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Something went wrong. We\'re looking into it.',
};

export function handleApiError(error: AxiosError<ApiError>): string {
  // Network error (no response)
  if (!error.response) {
    const message = ERROR_MESSAGES.NETWORK_ERROR;
    toast.error('Connection Error', message);
    return message;
  }

  const { status, data } = error.response;
  const code = data?.error?.code ?? '';

  // Map to user-friendly message
  let message: string;

  switch (status) {
    case 401:
      message = ERROR_MESSAGES.UNAUTHORIZED;
      break;
    case 403:
      message = code === 'TIER_REQUIRED'
        ? ERROR_MESSAGES.TIER_REQUIRED
        : ERROR_MESSAGES.FORBIDDEN;
      break;
    case 404:
      message = ERROR_MESSAGES.NOT_FOUND;
      break;
    case 429:
      message = ERROR_MESSAGES.RATE_LIMITED;
      break;
    case 503:
      message = ERROR_MESSAGES.MAINTENANCE;
      break;
    default:
      message = status >= 500
        ? ERROR_MESSAGES.SERVER_ERROR
        : data?.error?.message ?? 'An error occurred';
  }

  // Show toast for user-actionable errors
  if (status !== 401) { // Don't toast for auth errors (handled by auth flow)
    toast.error('Error', message);
  }

  return message;
}
```

---

## 8. Mobile-Specific Endpoints

```typescript
// Endpoints unique to mobile clients
// These are added to the Stone AI backend alongside existing web endpoints

// POST /api/mobile/device-token
// Register push notification token
// Body: { token, platform, deviceName, osVersion }

// POST /api/mobile/sync
// Bulk sync offline changes
// Body: { changes: [{ entityType, entityId, operation, payload }] }
// Response: { results: [{ entityId, status, serverId? }] }

// GET /api/mobile/sync/status
// Check for changes since last sync
// Query: { since: ISO8601 }
// Response: { conversations, messages, agents, deletedIds }

// GET /api/mobile/config
// Get mobile-specific configuration
// Response: { featureFlags, minAppVersion, maintenanceMode }

// POST /api/mobile/crash-report
// Ingest crash reports (backup to Sentry)
// Body: { error, stack, deviceInfo, appVersion }

// POST /api/mobile/receipt/validate
// Validate App Store / Play Store receipt
// Body: { platform, receipt, productId }
// Response: { valid, tier, expiresAt }
```

This API integration architecture ensures Best AI Mobile communicates reliably with the Stone AI backend across all network conditions, with automatic retry, offline queuing, real-time streaming, and proper error handling for a seamless user experience.
