# Tech Deep-Dives — RabbitMQ · Redis · PostgreSQL

> AI-added — verify. A new track of technology deep-dives anchored to your production
> stack. Senior depth, each concept with a probe an interviewer would actually ask.

@track id=tech | title=Tech Deep-Dives (your stack) | kind=fundamentals | order=5 | blurb=RabbitMQ, Redis, PostgreSQL, .NET/C#, and JavaScript at the depth a principal engineer expects you to own your own stack.

@topic id=tech-rabbitmq | track=tech | title=RabbitMQ

### concept: Core model — exchanges, queues, bindings
Publishers never write to a queue directly — they publish to an **exchange** with a **routing key**. The exchange routes to bound **queues** per its type: **direct** (exact routing-key match), **topic** (wildcard patterns like `order.*.created`), **fanout** (broadcast to all bound queues, ignoring the key), and **headers** (match on message headers). A **binding** is the rule connecting an exchange to a queue. This indirection is what lets you add or re-route consumers without touching publishers.

#### probe: How does a message get from a publisher to the right queue?
The publisher sends to an exchange with a routing key; it never names a queue. The exchange consults its **bindings** and type — e.g. a topic exchange matches the routing key against each binding pattern — and copies the message to every matching queue (zero, one, or many). If nothing matches, the message is dropped (or sent to an alternate exchange if configured). Consumers then pull from their queue. The decoupling means producers don't know who consumes.

### concept: Acknowledgements, prefetch, and at-least-once
With **manual acks**, a message is redelivered unless the consumer explicitly acks it — so a consumer that crashes mid-processing causes redelivery, giving **at-least-once** delivery (hence: make consumers idempotent). **Prefetch (QoS / `basicQos`)** caps how many unacked messages a consumer holds, preventing one greedy consumer from grabbing the whole queue and enabling fair round-robin across workers. Auto-ack (ack on delivery) is faster but loses messages on a crash — avoid it for work you can't lose.

#### probe: A consumer crashes after receiving a message but before finishing — is it lost?
Not with manual acks. The broker holds the message as "unacked"; when the consumer's connection/channel drops without an ack, RabbitMQ **requeues** it for another consumer. That's at-least-once delivery — the message survives, but it may be processed twice (the original consumer might have done partial work), so processing must be **idempotent**. With auto-ack it would be lost, because the broker considers it delivered the moment it's sent.

### concept: Not losing a message end-to-end
A message can be lost at three points; closing all three gives durability: (1) **durable queue** + (2) **persistent message** (`delivery_mode=2`) so the broker survives a restart, and (3) **publisher confirms** so the publisher knows the broker actually persisted it (a plain publish is fire-and-forget). On the consumer side, **manual ack** after the work is committed. Miss any one — e.g. persistent messages to a non-durable queue, or no publisher confirms — and there's still a window where a message vanishes.

#### probe: What does it take to guarantee a message isn't lost?
End to end: publisher confirms (broker acked the persist) + durable queue + persistent message (survives broker restart) + consumer manual-ack only after the side effect is durably committed. And because that whole chain is at-least-once, the consumer must dedupe. People often set "durable queue" and assume safety, but without publisher confirms a broker crash between accept and disk loses the message silently.

### concept: Dead-letter exchanges, TTL, and retry with backoff
A queue can declare a **dead-letter exchange (DLX)**: messages that are rejected/nacked, expire (per-message or queue **TTL**), or exceed a length limit get routed there instead of being dropped — your **poison-message** quarantine. The idiomatic **retry-with-backoff** uses a *wait queue*: nack the message to a delay queue with a TTL (e.g. 30s); when it expires, the DLX routes it back to the work queue for another attempt, tracking an attempt count in headers and giving up to a parking/DLQ after N tries.

#### probe: How do you implement retry-with-backoff and a poison-message queue?
Set the work queue's DLX to a retry exchange. On a processing failure, nack (no requeue) so the message dead-letters into a **delay queue** that has a message TTL and *its own* DLX pointing back at the work queue. After the TTL it re-enters the work queue — that's the backoff. Carry a retry count in a header; once it hits the limit, route to a permanent **dead-letter/parking queue** for human inspection instead of looping forever.

### concept: RabbitMQ vs Kafka — pick by the access pattern
**RabbitMQ** is a smart broker: flexible routing, per-message ack/redelivery, priorities, TTL/DLX — ideal for **task queues** and RPC-style work distribution where each message is handled once and then gone. **Kafka** is a partitioned, append-only **log**: messages are retained and **replayable**, consumers track their own offset, ordering is per-partition, and throughput is enormous — ideal for event streaming, event sourcing, and multiple independent consumers re-reading the same stream. Rule of thumb: transient work that's consumed and discarded → RabbitMQ; a durable, replayable event stream with many consumers → Kafka.

#### probe: When would you pick Kafka over RabbitMQ?
When you need **retention and replay** (re-process history, add a new consumer that reads from the beginning), very high sustained throughput, or strict **per-key ordering** at scale (partition by key). Kafka keeps messages after consumption; RabbitMQ deletes on ack. So event sourcing, stream processing, and audit/replay pipelines lean Kafka; per-message routing, priorities, complex retry topologies, and "do this job once" task queues lean RabbitMQ.

@topic id=tech-redis | track=tech | title=Redis

### concept: It's single-threaded — and that's a feature
Redis executes commands on a **single thread** (an event loop), so every command is **atomic** with respect to others — no locks needed, no races between commands. It's fast because everything is in memory and there's no lock contention or context switching on the command path. The danger is the flip side: a single **O(N) command on a big collection** (`KEYS *`, `SMEMBERS` on a huge set, `HGETALL` on a giant hash) **blocks every other client** for the duration. Use `SCAN`/`HSCAN` cursors and avoid unbounded operations.

#### probe: Redis is single-threaded — why is that fine, and what's the danger?
It's fine because operations are in-memory and microsecond-scale, and the single thread gives free atomicity (no inter-command races). The danger is that one slow command stalls the whole server — there's no parallelism to absorb it. A `KEYS *` over millions of keys, a big `ZRANGE`, or deleting a huge collection with `DEL` can spike latency for everyone. Mitigate with `SCAN`, `UNLINK` (async delete), and keeping value/collection sizes bounded.

### concept: Data structures and what they unlock
Beyond strings: **hashes** (objects/fields), **lists** (queues/stacks via LPUSH/RPOP), **sets** (membership, intersections), **sorted sets** (leaderboards, priority queues, sliding-window rate limits via score=timestamp), **streams** (an append-only log with consumer groups), plus HyperLogLog, bitmaps, and geo. Picking the right structure turns app logic into one atomic server-side command — e.g. a leaderboard is `ZADD` + `ZREVRANGE`, a token-bucket limiter is a tiny Lua script over a hash.

#### probe: How would you build a rate limiter or leaderboard in Redis?
**Leaderboard:** a sorted set keyed by score; `ZADD board score member`, read the top with `ZREVRANGE board 0 9 WITHSCORES`, a player's rank with `ZREVRANK` — all O(log N). **Rate limiter (sliding window):** a sorted set per client with score = timestamp; on each request `ZREMRANGEBYSCORE` to drop entries older than the window, `ZCARD` to count, add the new one, set a TTL — wrapped in a **Lua script** so the read-modify-write is atomic. Token bucket is similar with a hash holding tokens + last-refill.

### concept: Persistence — RDB vs AOF
**RDB** takes point-in-time **snapshots** (fork + dump): compact, fast to restore, low runtime overhead — but you lose everything written since the last snapshot on a crash. **AOF** logs every write command and replays it on restart: far better durability (with `appendfsync everysec` you lose ≤1s), but a larger file and slower restart. They're combinable (AOF for durability + periodic RDB for fast restore). Redis is often used as a cache where losing data is acceptable — then you may disable both.

#### probe: RDB vs AOF — which and why?
If Redis is a **cache**, durability barely matters — RDB (or nothing) is fine and cheap. If it's a **source of truth** (sessions, a queue, counters you can't lose), use **AOF with `everysec`** for a ≤1-second loss window, optionally plus RDB for fast restarts. The tradeoff is durability vs write overhead and restart time. Many setups run both: AOF guarantees recency, RDB gives a quick-loading baseline.

### concept: Eviction, big keys, and hot keys
With `maxmemory` set, Redis evicts per policy — usually **allkeys-lru** (or **lfu**), or **volatile-ttl**/**noeviction**. Two operational hazards: a **big key** (your 24 MB value lesson) fragments memory, makes every fetch a latency spike, and amplifies eviction pressure — cap value sizes and chunk large blobs. A **hot key** (one key with disproportionate traffic) can saturate a single shard — mitigate with client-side/local caching of that key, or splitting it across replicas/sub-keys.

#### probe: What's the danger of a large value, and how do you handle a hot key?
A large value (tens of MB) means each `GET` transfers and allocates that much, spiking latency and memory, and in a constrained pod can trigger OOM/eviction churn that destabilizes the whole cache — exactly the failure mode behind the 24 MB-key incident. Cap value sizes, chunk or store big blobs elsewhere, and add guardrails. For a **hot key**, the bottleneck is one shard, not memory — fix it with a short-TTL **local cache** in front of Redis, request coalescing, or replicating/sharding the key so reads spread across nodes.

### concept: Cache-aside and stampede protection
The default pattern is **cache-aside**: read cache; on miss, load from the DB and populate the cache with a TTL. Its failure mode is the **thundering herd** — a hot key expires and thousands of concurrent misses hammer the DB to recompute the same value. Fixes: a **lock/semaphore so only one caller recomputes** while others wait or serve stale (your `SemaphoreSlim` + `IMemoryCache` fix), **TTL jitter** (randomize expiry so keys don't expire together), probabilistic early recomputation, or request coalescing.

#### probe: How do you prevent a thundering herd on a hot key's expiry?
Serialize the recompute: on a miss, the first caller takes a per-key lock (a `SemaphoreSlim(1)` locally, or a short Redis lock distributed), recomputes and repopulates, while everyone else awaits the result or serves the slightly-stale value — so the DB sees one query, not thousands. Complement it with **TTL jitter** so a batch of keys doesn't all expire at the same instant, and consider probabilistic early refresh (recompute slightly before expiry under load). That's the production-hardened cache-aside.

@topic id=tech-postgres | track=tech | title=PostgreSQL

### concept: MVCC, dead tuples, and VACUUM
Postgres never updates a row in place — an UPDATE/DELETE writes a **new version** and marks the old one dead (tagged with `xmin`/`xmax`), so readers see a consistent snapshot without blocking writers. The cost is **bloat**: dead tuples accumulate and must be reclaimed by **VACUUM** (autovacuum normally), which also updates the visibility map and prevents transaction-ID **wraparound**. Neglected vacuuming on a high-churn table (like your purged `dr_transaction`) bloats tables/indexes and degrades performance and disk usage — operationally real.

#### probe: Why does Postgres need VACUUM, and what happens without it?
Because MVCC leaves dead row versions behind on every update/delete; VACUUM reclaims that space, refreshes planner statistics, and freezes old transaction ids to avoid wraparound. Without it, tables and indexes **bloat** (more pages to scan → slower queries, more disk), the planner works off stale stats and picks bad plans, and in the extreme, anti-wraparound failure can force the database read-only. High-write/high-delete tables need autovacuum tuned aggressively.

### concept: Index types beyond the B-tree
The default **B-tree** serves equality and range on scalar columns. But Postgres has more: **GIN** for "contains" queries over composite values — JSONB keys, array elements, full-text `tsvector` — by indexing each element to its rows; **GiST** for geometric/range/nearest-neighbor; **partial** indexes (`WHERE status='active'`) that index only the rows you query, staying small; **expression** indexes (`lower(email)`) so a functional predicate stays sargable; and `INCLUDE` **covering** indexes for index-only scans. Matching the index type to the query is a senior signal.

#### probe: When would you use a GIN index instead of a B-tree?
When the column holds a **composite value you query by membership** rather than by equality/range: JSONB (`data @> '{"k":"v"}'` or key existence), arrays (`tags @> ARRAY['x']`), or full-text search (`tsvector @@ query`). A B-tree indexes the whole scalar value and can't answer "contains this element"; GIN inverts the structure — element → list of rows — so containment queries are fast. The trade is slower writes and a larger index, so use it where those containment queries are the access pattern.

### concept: The planner and EXPLAIN ANALYZE
The **cost-based planner** uses table statistics to pick scan types (sequential / index / bitmap heap) and join strategies (nested loop / hash / merge). `EXPLAIN ANALYZE` runs the query and shows estimated vs **actual** rows and time per node — the gap is your main diagnostic: a large mismatch means stale stats and likely a bad plan. Watch for an unexpected **seq scan** (missing/unusable index, non-sargable predicate, or low selectivity) and a **nested loop** over a huge set (bad row estimate).

#### probe: A query is suddenly slow — walk me through diagnosing it.
Run `EXPLAIN ANALYZE` and compare estimated vs actual rows; a big gap → `ANALYZE` to refresh stats (or check autovacuum). Look for a seq scan where an index should apply — missing index, a function/implicit cast making the predicate non-sargable, or low selectivity. For partitioned tables, confirm **partition pruning** fired (else it scans every partition — the 45s→sub-second case). Check the join strategy, lock waits (`pg_stat_activity`), and whether the result set ballooned. Fix is usually: add/repair an index, make the predicate sargable, ensure pruning, or refresh stats.

### concept: Partitioning and pruning
**Declarative partitioning** splits a big table into child partitions by range/list/hash (e.g. one partition per month). The win is **partition pruning**: when a query's predicate matches the partition key, the planner skips irrelevant partitions entirely — turning a scan of 120 partitions into a scan of one. Pruning only fires when the predicate is **sargable on the partition key** (no wrapping function, and the key is actually in the WHERE/JOIN). It also makes bulk deletes cheap (drop a whole partition instead of `DELETE`).

#### probe: How does partition pruning help, and when does it fail to fire?
It lets the planner (or executor, for runtime pruning) eliminate partitions that can't contain matching rows, so a time-bounded query touches one monthly partition instead of all of them — the core of the 45s→sub-second fix. It **fails** when the query doesn't filter on the partition key, when a function/cast hides it (`date_trunc('day', ts)=...` instead of a range), or when the key is parameterized in a way the planner can't prune at plan time (then runtime pruning may still help). Keep predicates sargable on the partition key.

### concept: Connections are expensive — pool them
A Postgres connection is a **forked backend process** with its own memory; opening one is costly and each idle connection consumes RAM. Thousands of app threads each holding a connection will exhaust the server (and `max_connections` is modest). The fix is **pooling**: an app-side pool (Npgsql's built-in pool) reuses connections, and for many app instances a server-side pooler like **PgBouncer** (transaction-mode) multiplexes thousands of client connections onto a small set of real backends. This is essential under Kubernetes where many pods each have their own pool.

#### probe: Why pool connections, and what does PgBouncer add?
Because establishing a Postgres connection spawns a backend process and round-trips auth — too slow to do per request — and idle connections cost server memory, so you reuse a bounded pool. An app pool helps within one process; but with N pods × M pooled connections you can still blow past `max_connections`. **PgBouncer** sits in front and, in transaction mode, hands a real backend to a client only for the duration of a transaction, multiplexing thousands of clients onto a few dozen backends — decoupling app concurrency from database backend count.
