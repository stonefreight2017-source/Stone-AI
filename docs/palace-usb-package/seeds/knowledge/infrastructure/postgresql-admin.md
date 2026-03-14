# PostgreSQL Administration — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Performance Tuning

### Memory Parameters

```sql
-- Check current settings
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
SHOW maintenance_work_mem;
```

| Parameter | Formula | Stone AI (8GB DB RAM) | What It Does |
|---|---|---|---|
| `shared_buffers` | 25% of DB RAM | `2GB` | PostgreSQL's own cache |
| `effective_cache_size` | 75% of DB RAM | `6GB` | Planner hint for OS cache |
| `work_mem` | RAM / (max_connections * 3) | `16MB` | Per-operation sort/hash memory |
| `maintenance_work_mem` | 5-10% of RAM | `512MB` | VACUUM, CREATE INDEX, etc. |
| `wal_buffers` | Auto (usually 64MB) | `64MB` | WAL write buffer |

### Configuration File

```bash
# Find config file location
docker exec stoneai-db psql -U postgres -c "SHOW config_file;"
# Typically: /var/lib/postgresql/data/postgresql.conf

# Edit inside container
docker exec -it stoneai-db bash
vi /var/lib/postgresql/data/postgresql.conf

# Or mount a custom config
# In docker-compose.yml:
volumes:
  - ./postgresql.conf:/var/lib/postgresql/data/postgresql.conf
```

### Essential Tuning for Stone AI

```ini
# postgresql.conf

# Memory
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 16MB
maintenance_work_mem = 512MB

# Connections
max_connections = 100
# Note: Prisma uses connection pooling, so 100 is plenty

# WAL
wal_buffers = 64MB
checkpoint_completion_target = 0.9
wal_level = replica  # Required for PITR

# Planner
random_page_cost = 1.1  # For SSD (default 4.0 is for HDD)
effective_io_concurrency = 200  # For SSD

# Logging
log_min_duration_statement = 1000  # Log queries > 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
```

After changing config:
```bash
# Reload config (no restart needed for most settings)
docker exec stoneai-db psql -U postgres -c "SELECT pg_reload_conf();"

# Some settings require restart (like shared_buffers)
docker compose restart db
```

---

## 2. Indexing

### Index Types

| Type | Use For | Example |
|---|---|---|
| **B-tree** (default) | Equality, range, sorting | `CREATE INDEX ON users(email)` |
| **GIN** | Full-text search, JSONB, arrays | `CREATE INDEX ON posts USING gin(to_tsvector('english', content))` |
| **GiST** | Geometric, range types, proximity | `CREATE INDEX ON locations USING gist(coordinates)` |
| **BRIN** | Large tables with natural ordering | `CREATE INDEX ON logs USING brin(created_at)` |
| **Hash** | Equality only (rare use) | `CREATE INDEX ON sessions USING hash(token)` |

### B-tree Index Patterns

```sql
-- Single column
CREATE INDEX idx_users_email ON users(email);

-- Composite (column order matters!)
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at DESC);
-- This index serves: WHERE user_id = X AND created_at > Y
-- Also serves: WHERE user_id = X (uses first column)
-- Does NOT serve: WHERE created_at > Y (needs the leading column)

-- Partial index (index only rows matching a condition)
CREATE INDEX idx_users_active ON users(email) WHERE is_active = true;
-- Smaller index, faster lookups for the common case

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Expression index
CREATE INDEX idx_users_lower_email ON users(lower(email));
-- Serves: WHERE lower(email) = 'user@example.com'
```

### Composite Column Ordering Rules

1. **Equality columns first**: Columns used with `=` go leftmost
2. **Range columns last**: Columns used with `>`, `<`, `BETWEEN` go rightmost
3. **Most selective first**: Among equality columns, put the most unique first

```sql
-- Query: WHERE tenant_id = X AND status = Y AND created_at > Z
-- Index: (tenant_id, status, created_at)
--         ^equality   ^equality  ^range
```

### EXPLAIN ANALYZE

```sql
-- Always use ANALYZE to get actual execution times
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM messages
WHERE user_id = 'abc123'
ORDER BY created_at DESC
LIMIT 20;

-- Key things to look for:
-- Seq Scan        = Full table scan (usually bad for large tables)
-- Index Scan      = Using an index (good)
-- Index Only Scan = Everything from index, no table lookup (best)
-- Bitmap Scan     = Multiple index conditions combined (good for OR)
-- Sort            = In-memory or on-disk sorting (check if needed)
-- actual time     = First row..last row in milliseconds
-- rows            = Actual rows processed (compare with "rows" estimate)
-- Buffers: shared hit  = Pages from cache (good)
-- Buffers: shared read = Pages from disk (slow)
```

### Index Maintenance

```sql
-- Check index usage (are your indexes being used?)
SELECT
  schemaname, tablename, indexname,
  idx_scan,  -- Number of times index was used
  idx_tup_read,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
-- Indexes with idx_scan = 0 may be unnecessary (wasting write performance)

-- Check index bloat
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size,
  pg_size_pretty(pg_indexes_size(tablename::regclass)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Rebuild a bloated index (locks the table briefly)
REINDEX INDEX idx_users_email;

-- Rebuild without locking (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
```

---

## 3. pgvector — Vector Search

### Index Types for Vectors

| Index | Build Speed | Query Speed | Recall | Memory | Best For |
|---|---|---|---|---|---|
| **IVFFlat** | Fast | Fast | Good | Low | < 1M vectors |
| **HNSW** | Slow | Fastest | Excellent | High | Any size, best quality |
| No index | N/A | Slow (brute force) | Perfect | None | < 10K vectors |

### IVFFlat Configuration

```sql
-- Create IVFFlat index
-- lists = sqrt(row_count) is a good starting point
-- For 100K vectors: lists = ~316
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 316);

-- Query must set probes (higher = better recall, slower)
SET ivfflat.probes = 10;  -- Default is 1 (too low for good recall)
-- Rule of thumb: probes = sqrt(lists) for good recall
-- For lists=316: probes = ~18

SELECT * FROM embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

### HNSW Configuration

```sql
-- Create HNSW index
-- m = max connections per node (default 16, higher = better recall, more memory)
-- ef_construction = build-time search width (default 64, higher = better index, slower build)
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Query-time parameter
SET hnsw.ef_search = 100;  -- Default is 40. Higher = better recall, slower.
-- For production: 100-200 is good balance

SELECT * FROM embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
```

### Distance Operators

| Operator | Distance Type | Index Ops Class |
|---|---|---|
| `<=>` | Cosine distance | `vector_cosine_ops` |
| `<->` | L2 (Euclidean) distance | `vector_l2_ops` |
| `<#>` | Inner product (negative) | `vector_ip_ops` |

Stone AI uses **cosine distance** (`<=>`) for semantic similarity.

### Monitoring Vector Index Performance

```sql
-- Check index size
SELECT pg_size_pretty(pg_relation_size('embeddings_embedding_idx'));

-- Check if index is being used
EXPLAIN (ANALYZE)
SELECT * FROM embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;
-- Should show: Index Scan using embeddings_embedding_idx
-- If showing Seq Scan, the index isn't being used (check probes/ef_search)
```

---

## 4. Connection Pooling

### The Problem

Each PostgreSQL connection uses ~5-10MB of RAM. 100 connections = 500MB-1GB just for connections.

### Prisma Pool Settings (Stone AI)

```
# In .env / DATABASE_URL
DATABASE_URL="postgresql://user:pass@localhost:5432/stoneai?connection_limit=20&pool_timeout=10"
```

| Parameter | Default | Recommendation | Why |
|---|---|---|---|
| `connection_limit` | 5 | 10-20 | Matches expected concurrency |
| `pool_timeout` | 10s | 10s | How long to wait for a free connection |

### PgBouncer (For Higher Scale)

```ini
# pgbouncer.ini
[databases]
stoneai = host=localhost port=5432 dbname=stoneai

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction      # Release connection after each transaction
default_pool_size = 20       # Connections per database
max_client_conn = 200        # Max client connections to PgBouncer
reserve_pool_size = 5        # Emergency extra connections
reserve_pool_timeout = 3
server_idle_timeout = 600
```

**Pool Modes:**
- `session` — Connection held until client disconnects (like no pooling)
- `transaction` — Connection released after each transaction (recommended)
- `statement` — Connection released after each statement (breaks multi-statement transactions)

### Connection Pool Sizing

```
Optimal pool size = (cores * 2) + effective_spindle_count
```

For SSD: `effective_spindle_count` = 1
For Stone AI (8 cores, SSD): pool size = (8 * 2) + 1 = **17** (round to 20)

---

## 5. Backup and Recovery

### pg_dump (Logical Backup)

```bash
# Custom format (compressed, most flexible for restore)
docker exec stoneai-db pg_dump -U postgres -Fc stoneai > backup-$(date +%Y%m%d).dump

# Plain SQL (readable, larger)
docker exec stoneai-db pg_dump -U postgres stoneai > backup-$(date +%Y%m%d).sql

# Schema only
docker exec stoneai-db pg_dump -U postgres --schema-only stoneai > schema.sql

# Data only
docker exec stoneai-db pg_dump -U postgres --data-only stoneai > data.sql

# Specific tables
docker exec stoneai-db pg_dump -U postgres -t users -t messages stoneai > partial.dump
```

### pg_restore

```bash
# Restore custom format (drop existing objects first)
docker exec -i stoneai-db pg_restore -U postgres --clean --if-exists -d stoneai < backup.dump

# Restore to a different database name
docker exec stoneai-db createdb -U postgres stoneai_restored
docker exec -i stoneai-db pg_restore -U postgres -d stoneai_restored < backup.dump

# Restore specific table only
docker exec -i stoneai-db pg_restore -U postgres -t users -d stoneai < backup.dump
```

### Automated Backup Script

```bash
#!/bin/bash
# backup-db.sh — Daily database backup with rotation
set -euo pipefail

BACKUP_DIR="/var/backups/postgresql"
DB_CONTAINER="stoneai-db"
DB_USER="postgres"
DB_NAME="stoneai"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

echo "[$TIMESTAMP] Starting backup..."

# Create backup
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_FILE"

# Verify backup is not empty
SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
if [ "$SIZE" -lt 1000 ]; then
  echo "ERROR: Backup file suspiciously small (${SIZE} bytes)"
  rm "$BACKUP_FILE"
  exit 1
fi

echo "Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Rotate old backups
find "$BACKUP_DIR" -name "*.dump" -mtime +$KEEP_DAYS -delete
echo "Old backups (>${KEEP_DAYS} days) removed"

# Count remaining backups
COUNT=$(find "$BACKUP_DIR" -name "*.dump" | wc -l)
echo "Total backups: $COUNT"
```

### PITR (Point-in-Time Recovery) Concepts

For production, continuous WAL archiving enables recovery to any point in time:

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/backups/wal/%f'
```

Recovery:
1. Restore base backup
2. Replay WAL files up to the desired timestamp
3. This gives second-level granularity for recovery

For Stone AI's current scale, daily pg_dump is sufficient. PITR is for when data loss of even minutes is unacceptable.

---

## 6. VACUUM and Maintenance

### How VACUUM Works

PostgreSQL uses MVCC — updates create new row versions, deletes mark rows as dead. VACUUM reclaims dead row space.

### Autovacuum Configuration

```sql
-- Check autovacuum settings
SELECT name, setting FROM pg_settings WHERE name LIKE 'autovacuum%';

-- Recommended settings
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '1min';
ALTER SYSTEM SET autovacuum_vacuum_threshold = 50;
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;  -- Vacuum when 10% dead
ALTER SYSTEM SET autovacuum_analyze_threshold = 50;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;  -- Analyze when 5% changed
SELECT pg_reload_conf();
```

### Manual VACUUM

```sql
-- Regular vacuum (reclaims space, doesn't lock table)
VACUUM messages;

-- Vacuum with ANALYZE (updates statistics too)
VACUUM ANALYZE messages;

-- Full vacuum (rewrites entire table, LOCKS it — use sparingly)
VACUUM FULL messages;

-- After bulk operations (imports, large deletes)
VACUUM ANALYZE;  -- All tables
```

### Dead Tuple Monitoring

```sql
-- Check dead tuples per table
SELECT
  schemaname, relname,
  n_live_tup,
  n_dead_tup,
  ROUND(100.0 * n_dead_tup / GREATEST(n_live_tup + n_dead_tup, 1), 1) AS dead_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Tables with high dead tuple percentage need attention
-- > 20% dead = investigate why autovacuum isn't keeping up
```

### Troubleshooting Autovacuum

**Symptom**: Table has high dead tuple count, autovacuum isn't running.

**Diagnosis**:
```sql
-- Check if autovacuum is being blocked by long transactions
SELECT pid, now() - xact_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Check if autovacuum workers are all busy
SELECT * FROM pg_stat_activity WHERE backend_type = 'autovacuum worker';
```

**Fix**: Kill long-running idle transactions that block vacuum:
```sql
-- Find and terminate long idle-in-transaction connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
AND now() - xact_start > interval '10 minutes';
```

---

## 7. Monitoring

### Active Queries

```sql
-- All active connections
SELECT
  pid, usename, application_name, client_addr,
  state, now() - query_start AS duration,
  LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill a specific query
SELECT pg_cancel_backend(<pid>);    -- Graceful cancel
SELECT pg_terminate_backend(<pid>); -- Force terminate
```

### Table Statistics

```sql
-- Table sizes and row counts
SELECT
  relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  pg_size_pretty(pg_indexes_size(relid)) AS index_size,
  n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Slow Query Detection (pg_stat_statements)

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries by total time
SELECT
  LEFT(query, 80) AS query,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_ms,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  ROUND(max_exec_time::numeric, 2) AS max_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Top 10 most called queries
SELECT LEFT(query, 80), calls, mean_exec_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Reset stats
SELECT pg_stat_statements_reset();
```

### Lock Detection

```sql
-- Find blocked queries
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query,
  now() - blocked.query_start AS blocked_duration
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid
JOIN pg_locks bl2 ON bl2.locktype = bl.locktype
  AND bl2.database IS NOT DISTINCT FROM bl.database
  AND bl2.relation IS NOT DISTINCT FROM bl.relation
  AND bl2.page IS NOT DISTINCT FROM bl.page
  AND bl2.tuple IS NOT DISTINCT FROM bl.tuple
  AND bl2.pid != bl.pid
JOIN pg_stat_activity blocking ON blocking.pid = bl2.pid
WHERE NOT bl.granted;
```

### Database Size

```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size('stoneai'));

-- All databases
SELECT
  datname,
  pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;
```

---

## 8. Common Operations

### Create and Manage Users

```sql
-- Create a read-only user
CREATE ROLE readonly_user LOGIN PASSWORD 'securepass';
GRANT CONNECT ON DATABASE stoneai TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Create an application user
CREATE ROLE app_user LOGIN PASSWORD 'securepass';
GRANT CONNECT ON DATABASE stoneai TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### Bulk Operations

```sql
-- Before bulk import
SET maintenance_work_mem = '1GB';
-- Drop indexes before bulk load, recreate after

-- COPY is fastest for bulk inserts
COPY users(email, name) FROM '/tmp/users.csv' WITH CSV HEADER;

-- After bulk import
VACUUM ANALYZE users;
```

### Schema Management with Prisma

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes (dev only — no migration files)
npx prisma db push

# Create a migration
npx prisma migrate dev --name "add_user_preferences"

# Apply migrations in production
npx prisma migrate deploy

# Reset database (DESTROYS ALL DATA)
npx prisma migrate reset

# View current migration status
npx prisma migrate status
```

---

## 9. Quick Reference Card

| Task | Command |
|---|---|
| Connect | `docker exec -it stoneai-db psql -U postgres -d stoneai` |
| Backup | `docker exec stoneai-db pg_dump -U postgres -Fc stoneai > backup.dump` |
| Restore | `docker exec -i stoneai-db pg_restore -U postgres --clean -d stoneai < backup.dump` |
| DB size | `SELECT pg_size_pretty(pg_database_size('stoneai'));` |
| Table sizes | `SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;` |
| Active queries | `SELECT pid, state, LEFT(query,80) FROM pg_stat_activity WHERE state != 'idle';` |
| Kill query | `SELECT pg_cancel_backend(<pid>);` |
| Vacuum table | `VACUUM ANALYZE tablename;` |
| Dead tuples | `SELECT relname, n_dead_tup FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;` |
| Index usage | `SELECT indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan;` |
| Reload config | `SELECT pg_reload_conf();` |
| Current settings | `SHOW ALL;` or `SELECT name, setting FROM pg_settings WHERE name = 'X';` |
