# Part 2 — System Design: The Complete Handbook

> Self-contained. Read it top to bottom once, then use the worked designs as drill material. Pitched at senior/staff level — the goal isn't to recite components, it's to *reason about tradeoffs* the way the strong engineers in the room do. Your own production experience (multi-tenant SaaS, Redis, RabbitMQ, Elasticsearch, K8s) is woven in as anchors, because the fastest path to depth for you is attaching theory names to things you already operate.

---

## 0. What a system design interview actually tests

Junior candidates list components. Senior candidates make **defensible tradeoffs under constraints**. The interviewer is grading five things:

1. **Requirements & scoping** — do you nail down what to build before building it?
2. **Estimation** — can you size the problem (QPS, storage, bandwidth) and let the numbers drive decisions?
3. **High-level structure** — clean data flow, sensible component boundaries.
4. **Deep dives** — when pushed on the hard part (the bottleneck), do you go deep with real mechanisms?
5. **Tradeoff articulation** — every choice has a cost; do you name it and justify it? *This is where seniority is won or lost.*

The fatal mistake at your level: jumping to a diagram before clarifying requirements, or naming "Kafka" / "Redis" without saying *why* and *what it costs*. Drive with the numbers and the tradeoffs.

---

## 1. The estimation toolkit

You can't reason about scale you can't size. Memorize these.

### Latency numbers (orders of magnitude — say "roughly")
| Operation | Time |
|---|---|
| L1 cache reference | ~1 ns |
| Branch mispredict | ~3 ns |
| Mutex lock/unlock | ~20 ns |
| Main memory reference | ~100 ns |
| Compress 1 KB (Snappy) | ~2 µs |
| Send 1 KB over 1 Gbps network | ~10 µs |
| SSD random read | ~100 µs |
| Round trip within a datacenter | ~0.5 ms |
| Read 1 MB sequentially from SSD | ~1 ms |
| HDD seek | ~10 ms |
| Round trip across the world (e.g. US↔EU) | ~150 ms |

**The takeaways that drive design:** memory is ~1000× faster than SSD, SSD ~100× faster than spinning disk, and a cross-region round trip costs ~150 ms — which is why you cache aggressively, keep hot data in RAM, and put compute near data and users (CDN/edge).

### Powers of two & data sizes
- 2¹⁰ ≈ 1 thousand (KB), 2²⁰ ≈ 1 million (MB), 2³⁰ ≈ 1 billion (GB), 2⁴⁰ ≈ 1 trillion (TB).
- ASCII char = 1 byte; UTF-8 = 1–4; `long`/`double` = 8 bytes; a UUID = 16 bytes; a typical row with a few fields = ~hundreds of bytes.

### The QPS shortcut
A day has ~86,400 seconds ≈ **10⁵**. So:
- **1 million requests/day ≈ ~12 QPS** (1M / 10⁵).
- **100 million/day ≈ ~1,200 QPS.**
- **1 billion/day ≈ ~12,000 QPS.**
- **Peak** is typically **2–3× average** — size for peak.

### Worked example (do this out loud in interviews)
*"Design a URL shortener handling 100M new URLs/month."*
- Writes: 100M/month ÷ (30 × 10⁵ s) ≈ **~40 writes/s** average, ~120/s peak.
- Reads: assume 100:1 read:write ratio → **~4,000 reads/s** average. *This tells you it's a read-heavy system → cache the redirects.*
- Storage: 100M/month × 12 months × 5 years × ~500 bytes/record ≈ 6B records × 500 B ≈ **~3 TB over 5 years.** *Fits comfortably; not a storage-bound problem.*
- The numbers just told you: read-heavy, cache-first, storage is trivial, the short-code generation + low-latency redirect is the real design problem.

That move — letting back-of-envelope numbers *select the hard problem* — is the senior signal.

---

## 2. The building blocks (in depth)

### 2.1 Scaling: vertical vs horizontal, and the stateless prerequisite
- **Vertical** (bigger machine): simple, but a ceiling and a single point of failure.
- **Horizontal** (more machines): the real answer for scale, but requires your services to be **stateless** — no per-request state stored in process memory — so any instance can serve any request behind a load balancer. Push state to a shared store (DB, Redis).
- *Your anchor:* your multi-pod K8s session-sharing fix is exactly this — moving session state out of pod memory into distributed Redis so pods became stateless and horizontally scalable. That's the textbook lesson, lived.

### 2.2 Load balancers
- **L4 (transport):** routes by IP/port, doesn't inspect content. Fast, protocol-agnostic.
- **L7 (application):** inspects HTTP — can route by path/header/cookie, do TLS termination, sticky sessions. More capable, slightly more overhead. *Your YARP proxy is an L7 reverse proxy* — own that distinction.
- **Algorithms:** round-robin, weighted, least-connections, least-latency, and **consistent hashing** (critical when backends hold state/cache — minimizes reshuffling when a node joins/leaves).
- **Health checks** remove dead backends; LBs are themselves made HA in pairs.

### 2.3 Caching (know this cold — it's the most-asked block)
**Why:** absorb read load and cut latency by keeping hot data close (RAM, edge).

**Strategies:**
- **Cache-aside (lazy):** app checks cache; on miss, reads DB and populates cache. Most common. Risk: stale data, and a cold cache thundering the DB.
- **Read-through:** the cache layer itself loads from DB on miss (app only talks to cache).
- **Write-through:** writes go to cache *and* DB synchronously — consistent but slower writes.
- **Write-back (write-behind):** write to cache, flush to DB async — fast but risks data loss on crash.

**Eviction:** LRU (most common), LFU, FIFO, TTL-based. Size + eviction policy determine hit rate.

**The two hard problems:**
- **Cache stampede / thundering herd:** a hot key expires and thousands of concurrent requests all miss and hammer the DB simultaneously. Fixes: a **lock/semaphore so only one request recomputes** while others wait or serve stale (*your exact fix — semaphore + IMemoryCache*), probabilistic early expiration, or request coalescing. This is a gold interview story for you — tell it.
- **Cache invalidation:** "the second hard thing in CS." Strategies: TTL (simple, eventual staleness), write-through (consistent, costly), explicit invalidation on write (precise, complex), versioned keys. Name the staleness tolerance the use case allows.

**Where caches live:** client → CDN/edge → load balancer → application (in-process or Redis/Memcached) → database (buffer pool). Each layer absorbs load before the next.

**Redis vs Memcached:** Memcached is a simple in-memory KV cache; Redis adds rich data structures (sorted sets, hashes, streams), persistence, pub/sub, Lua, and clustering. You run Redis — be ready to discuss the 24 MB-key memory blowup (large values fragment memory and cause eviction pressure / OOM in constrained pods) as a real operational lesson.

### 2.4 CDN
Geographically distributed edge servers cache static (and increasingly dynamic) content near users, cutting latency and origin load. Pull (lazy fill on first request) vs push (you upload). Use for images/video/JS/CSS and cacheable API responses. The win is the ~150 ms cross-region round trip you *avoid*.

### 2.5 Databases — the heart of most designs

**SQL vs NoSQL — choose on the real axes, not hype:**
- **Relational (Postgres/MySQL):** structured schema, **ACID transactions**, joins, strong consistency. Best when relationships and integrity matter and you need ad-hoc queries. Scales vertically easily, horizontally with effort (sharding/read replicas). *Your DigitalReceipt is here.*
- **NoSQL families:**
  - **Key-value (Redis, DynamoDB):** O(1) lookups by key, massive scale, simple model.
  - **Document (MongoDB):** flexible JSON docs, good when the access pattern is "fetch this whole object."
  - **Wide-column (Cassandra, HBase):** write-optimized, linear horizontal scale, tunable consistency — built for huge write throughput and time-series.
  - **Graph (Neo4j):** relationship-heavy traversals (social graphs).
- **The honest framing:** NoSQL trades joins/transactions/flexibility-of-query for horizontal scale and write throughput. Pick by *access pattern*: model the queries first, then the schema. "We need ad-hoc reporting and integrity → relational. We need 100k writes/s of time-series with known access patterns → wide-column."

**Indexing internals (a likely deep-dive):**
- **B-tree / B+-tree** (the relational default): balanced, high fanout so the tree is shallow (3–4 levels for billions of rows), each node ≈ a disk page → few disk reads per lookup. Great for reads and range scans. Updates cost (rebalancing, write amplification). *Your partition pruning + index propagation work lives at this layer — pruning lets the planner skip whole partitions' B-trees.*
- **LSM-tree** (Cassandra, RocksDB, modern write-heavy stores): buffers writes in memory (memtable), flushes sorted runs to disk (SSTables), merges them via compaction. **Write-optimized** (sequential writes) at the cost of read amplification (may check several SSTables; mitigated by bloom filters). The B-tree-vs-LSM tradeoff = read-optimized vs write-optimized; name it.
- **Practical index rules:** composite-index column order matters (leftmost-prefix); covering indexes serve a query entirely from the index; over-indexing slows writes and bloats storage; an index on a low-cardinality column is often useless.

**Replication:**
- **Leader–follower (primary–replica):** writes to the leader, reads can fan out to followers (scales reads). **Replication lag** means followers can serve stale reads → **read-your-own-writes** problems. Sync replication = consistent but slower/availability-risk; async = fast but can lose recent writes on leader failure.
- **Multi-leader / leaderless (Dynamo-style quorums):** higher availability, but write conflicts need resolution (last-write-wins, vector clocks, CRDTs).
- **Quorum math:** with N replicas, if **W + R > N** (write quorum + read quorum), a read is guaranteed to see the latest write. Tune W/R for consistency-vs-latency.

**Partitioning / sharding (you live this with 120+ tenant schemas):**
- **Why:** when data or write throughput exceeds one machine, split it.
- **Strategies:** **range** (by key range — good for range queries, risks hotspots), **hash** (even distribution, loses range queries), **directory/lookup** (a mapping service — flexible, adds a hop), and **by tenant** (your model — natural isolation, but uneven tenant sizes create hot shards).
- **The hard parts:** rebalancing when adding shards (consistent hashing minimizes movement), cross-shard queries and joins (avoid or fan-out-and-merge), cross-shard transactions (avoid — they're slow and complex), and **hotspots** (a celebrity user / huge tenant). Discuss how you'd detect and split a hot shard.

**Transactions & isolation (deep-dive bait — see Part 3 for full depth):** ACID, isolation levels (read committed → repeatable read → serializable) and the anomalies each prevents, and MVCC (how Postgres gives snapshot isolation without read locks — and the VACUUM cost you've felt). Know that distributed transactions across shards/services are the thing you *design around*, not toward.

### 2.6 Consistency models & CAP
- **CAP:** during a **network partition**, you must choose **Consistency** (reject/stall to avoid stale reads) or **Availability** (serve possibly-stale data). It's only a forced choice *during a partition*.
- **PACELC** completes it: **else** (no partition), you still trade **Latency vs Consistency**. A more honest framing than CAP alone — say it and you sound senior.
- **The consistency spectrum:** **strong/linearizable** (everyone sees the latest write immediately — expensive, needs coordination) → **sequential** → **causal** (causally-related ops seen in order) → **read-your-writes** → **eventual** (replicas converge eventually). Pick the *weakest* model the use case tolerates — strong consistency is a tax. A bank balance wants strong; a like-count tolerates eventual.

### 2.7 Message queues, streaming & async (you run RabbitMQ — own this)
**Why async:** decouple producers from consumers, absorb spikes (buffering/backpressure), smooth load, enable retries and fan-out. Turns a slow synchronous chain into a resilient pipeline.

- **Queue (RabbitMQ, SQS):** work distribution — each message consumed by one worker. Good for task pipelines (your data-pipeline workers).
- **Pub/Sub:** one message → many subscribers (fan-out).
- **Log (Kafka):** an append-only, partitioned, *replayable* log; consumers track their own offset. Built for high-throughput streaming, event sourcing, and multiple independent consumers reading the same stream. **RabbitMQ vs Kafka:** RabbitMQ = flexible routing, per-message ack, good for task queues; Kafka = ordered partitions, retention/replay, massive throughput, good for event streams. Know when each fits.

**Delivery semantics (must-know):**
- **At-most-once:** may lose messages (fire and forget).
- **At-least-once:** never lost, but may **duplicate** (redelivery on failed ack) — the common default.
- **Exactly-once:** the holy grail, and *practically a lie* end-to-end. You achieve effective exactly-once with **at-least-once delivery + idempotent consumers** (dedupe by message ID / idempotency key). Say this — it's a senior tell.

**Related patterns:**
- **Idempotency:** processing the same message twice yields the same result. Implement with idempotency keys, dedupe tables, or naturally-idempotent operations (upserts).
- **Dead-letter queue (DLQ):** messages that repeatedly fail go here for inspection instead of blocking the queue.
- **Backpressure:** when consumers fall behind, signal producers to slow down (or the queue buffers/sheds).
- **Ordering:** global ordering is expensive; partition-level ordering (Kafka per-partition) is the usual compromise — partition by a key (e.g. userId) to keep per-key order.
- **The dual-write / outbox problem:** you can't atomically write to a DB *and* publish to a queue (two systems, no shared transaction). Solution: the **transactional outbox** — write the event into an `outbox` table in the *same* DB transaction, then a separate process (or CDC) publishes it. This guarantees the event fires iff the DB write committed. (Ties directly to your RabbitMQ pipelines.)

### 2.8 Consensus & coordination (awareness → Part 3 depth)
When multiple nodes must agree (who's the leader, is this committed), you need **consensus**. **Raft** is the one to understand: a leader is elected by majority vote; the leader appends entries to a replicated log; an entry commits once a majority has it. Used by etcd, Consul, etc., for leader election and config. You rarely implement it — you *use* systems built on it (Kubernetes' control plane uses etcd/Raft). Know *why* it exists: to get agreement despite failures, without a single point of truth.

### 2.9 Rate limiting (common standalone question and component)
- **Token bucket:** tokens refill at a rate; each request consumes one; burst-friendly up to bucket size. The usual default.
- **Leaky bucket:** processes at a fixed rate, smoothing bursts (a queue draining steadily).
- **Fixed window counter:** count per time window — simple but allows 2× bursts at window edges.
- **Sliding window log / counter:** smooths the edge problem; sliding-window-counter is the practical balance.
- **Distributed rate limiting:** the counter must be shared → Redis (atomic INCR + TTL, or a Lua script for atomicity). *You've built rate limiting — design it cleanly with token bucket in Redis.*

### 2.10 API design
- **REST:** resource-oriented, HTTP verbs, stateless, cacheable. Default for public/CRUD APIs. Know idempotent methods (GET/PUT/DELETE idempotent; POST not) and **idempotency keys** for safe retries on POST (payments!).
- **gRPC:** binary (Protobuf), HTTP/2, streaming, low latency, strongly-typed contracts. Best for **internal service-to-service** comms.
- **GraphQL:** client specifies exactly the fields it needs — solves over/under-fetching for complex, varied clients; cost: caching is harder, query complexity must be bounded.
- **Pagination:** offset (simple, slow + inconsistent at scale) vs **cursor/keyset** (stable, efficient — paginate by `WHERE id > last_seen`). Use cursor for large/changing datasets.

### 2.11 Search (you run Elasticsearch — a free deep-dive)
Full-text search uses an **inverted index**: a map from each term → the list of documents containing it (a posting list). Querying intersects/unions posting lists, then ranks (TF-IDF / BM25). Elasticsearch shards the index for scale and replicates for availability. Use it when you need relevance-ranked text search, not exact lookups (that's what your DB does). Be ready to contrast: a B-tree index answers "rows where col = X"; an inverted index answers "documents *about* X, ranked."

### 2.12 Observability & reliability
- **The three pillars:** **logs** (discrete events), **metrics** (aggregated numbers/time-series — counters, gauges, histograms), **traces** (a request's path across services). *Your YARP observability layer = a metrics/tracing story.*
- **SLI/SLO/SLA:** SLI = the measured indicator (p99 latency), SLO = your internal target (p99 < 200ms 99.9% of the time), SLA = the contractual promise with penalties. Design to the SLO.
- **Reliability patterns:**
  - **Timeouts** — never wait forever on a dependency.
  - **Retries with exponential backoff + jitter** — retry transient failures, but back off and randomize to avoid retry storms synchronizing.
  - **Circuit breaker** — after N failures, "open" the circuit and fail fast for a cooldown, giving the dependency room to recover (Polly in .NET).
  - **Bulkhead** — isolate resource pools so one failing dependency can't exhaust all threads/connections.
  - **Graceful degradation** — serve stale cache / a reduced experience instead of erroring (e.g. show cached feed if the ranking service is down).
  - **Idempotency + dead-letter** for async paths.

---

## 3. The interview framework (run this every time)

**Step 1 — Clarify & scope (don't skip; ~5 min).** Functional requirements (what it does) and non-functional (scale, latency, consistency, availability). Cut scope explicitly: "I'll focus on posting and the feed, and leave out DMs." Get the interviewer to confirm.

**Step 2 — Estimate.** QPS (read vs write), storage, bandwidth. Use the toolkit above. Let the numbers flag the hard problem (read-heavy? write-heavy? storage-bound?).

**Step 3 — API contract.** Define the few core endpoints (request/response). Concrete signatures anchor the rest of the discussion.

**Step 4 — High-level design.** Draw the data flow: client → LB → services → data stores → async workers. Keep services stateless. Name the datastore per component.

**Step 5 — Data model.** Schema + storage choice + *why*. Access patterns drive this. Mention partitioning/sharding key.

**Step 6 — Deep dive.** The interviewer steers to the hard part (the feed fan-out, the dedupe, the geo-index). Go deep with real mechanisms. This is most of the interview.

**Step 7 — Scale, bottlenecks, tradeoffs.** Where does it break? (hot keys, single points of failure, the DB.) Add caching, replication, sharding, queues — and *name what each costs*. Discuss failure modes and reliability patterns. End on tradeoffs.

What "good" looks like: you drive, you quantify, you justify each choice and name its cost, and when pushed you have a real mechanism — not a logo.

---

## 4. Fully worked designs

### 4.1 URL Shortener (the warm-up that tests fundamentals)
**Scope:** shorten a long URL → short code; redirect short→long. Custom aliases optional; analytics optional.
**Numbers:** (from §1) ~40 writes/s, ~4,000 reads/s, ~3 TB/5yr. **Read-heavy, cache-first, storage trivial.**
**API:** `POST /shorten {url} → {shortCode}`; `GET /{shortCode} → 302 redirect`.
**Short code generation — the core problem:**
- Base62 (`[A-Za-z0-9]`) encoding of a unique ID. 62⁷ ≈ 3.5 trillion codes in 7 chars — plenty.
- *Option A — counter + base62:* a distributed counter (or DB auto-increment, or a range-allocator giving each app server a block of IDs to avoid a per-write coordination hop). Encode the integer to base62. Simple, no collisions, but codes are sequential/guessable.
- *Option B — hash (e.g. MD5/SHA of URL) + take first 7 chars:* risk of collisions → check-and-retry. Handles dedup of identical URLs naturally.
- Choose A with range-allocation for collision-free, low-coordination generation.
**Data model:** KV is ideal — `shortCode → longURL`. A KV store (DynamoDB) or a sharded relational table keyed by shortCode.
**Read path (the hot path):** `GET /{code}` → check **Redis cache** → on miss, DB lookup, populate cache → `302`. Cache hit rate will be high (popular links dominate). CDN can even cache the redirect at the edge.
**Scale/tradeoffs:** read-heavy → cache + read replicas; storage is trivial so no sharding pressure early, but shard by shortCode hash when needed; analytics go through an **async queue** (don't block the redirect — fire an event, aggregate offline). Custom aliases → check uniqueness on write.

### 4.2 Distributed Rate Limiter
**Scope:** limit each user/API-key to N requests per window, across many app servers.
**Algorithm:** token bucket (burst-friendly) — each key has a bucket of tokens refilling at rate r.
**Distributed state:** the bucket must be shared across servers → **Redis**. Store `tokens` and `lastRefill` per key. On each request, run a **Lua script** (atomic) that: computes tokens refilled since lastRefill, adds them (capped at bucket size), and if ≥1, decrements and allows; else denies. Atomicity via Lua avoids race conditions between read and write.
**Tradeoffs:** Redis is now in the hot path → keep it co-located/low-latency, and **fail open or closed** deliberately (if Redis is down, do you allow all traffic or block it? Usually fail-open for availability, with a local fallback limiter). Sliding-window-counter is the alternative if you want smoother edges. Sharding the limiter by key spreads Redis load.

### 4.3 News Feed / Twitter (the fan-out classic)
**Scope:** users post; users see a feed of posts from people they follow, newest-first.
**Numbers:** assume 100M DAU, ~2 posts/user/day → ~2,300 writes/s; feed reads far higher → read-heavy, but writes fan out massively.
**The core tension — fan-out on write vs read:**
- **Fan-out on write (push):** when you post, immediately write the post ID into the precomputed feed cache of every follower. **Feed reads are O(1)** (just read your cache). Cost: a celebrity with 50M followers triggers 50M writes per post — the **"hot user" problem.**
- **Fan-out on read (pull):** store posts once; when a user opens their feed, fetch recent posts from everyone they follow and merge. Cheap writes, but **expensive reads** (fan-in across thousands of followees).
- **The hybrid (the senior answer):** push for normal users; for celebrities, *don't* fan out — instead, at read time, merge the (cached) push-feed with a pull of the few celebrities the user follows. Best of both.
**Data model:** posts in a store keyed by postId (sharded by postId or userId); the social graph (follower/followee) in its own store; per-user feed = a cached list of post IDs (Redis sorted set by timestamp).
**Read path:** read the user's feed (post IDs from Redis) → hydrate posts (batch fetch, cache) → merge celebrity posts → return. Pagination via cursor (timestamp/ID).
**Scale/tradeoffs:** the feed cache (Redis) absorbs reads; fan-out workers run async via a **queue** (posting returns immediately, fan-out happens in the background); ranking (if not pure chronological) adds an async scoring service. Eventual consistency is fine here — a post appearing a second late is acceptable (name that tolerance).

### 4.4 Chat / Messaging (WhatsApp-lite)
**Scope:** 1:1 messaging, delivery + read receipts, online presence, message history.
**Core challenge:** real-time, bidirectional delivery → **persistent connections** (WebSocket), not request/response polling.
**Design:** clients hold a WebSocket to a **connection/gateway service**. Because users connect to *different* gateway servers, you need a way to route a message to the server holding the recipient's connection: a **presence/routing registry** (Redis: `userId → gatewayServerId`). Message flow: sender → their gateway → lookup recipient's gateway via registry → forward → recipient's gateway pushes over its WebSocket. If the recipient is offline, persist and push via mobile notification; deliver on reconnect.
**Storage:** messages in a write-heavy, time-ordered store — **wide-column (Cassandra)** keyed by `(conversationId, timestamp)` fits the access pattern (recent messages per conversation, huge write volume). 
**Delivery guarantees:** at-least-once + message IDs for client-side dedup; ack-based delivery/read receipts; ordering per conversation via timestamps/sequence numbers.
**Scale/tradeoffs:** millions of concurrent WebSockets → many gateway servers, the registry is the coordination point (keep it fast, replicated). Presence is high-churn → eventual consistency and TTL-based heartbeats. Group chat = fan-out to N members (push to each connected member's gateway).

### 4.5 Notification System (multi-channel)
**Scope:** send notifications via email / SMS / push, at scale, reliably, without spamming.
**Design:** a **notification service** receives events → applies user preferences & rate limits / dedup → enqueues per-channel jobs onto a **message queue** → channel-specific **workers** (email worker, SMS worker, push worker) call third-party providers (SES, Twilio, FCM). 
**Reliability:** the queue gives retries + buffering; failed sends → **DLQ**; **idempotency keys** prevent duplicate sends on retry (don't email someone twice because a worker crashed after sending but before acking). Provider rate limits → token-bucket per provider. 
**Tradeoffs:** template rendering and personalization as a separate concern; user preference checks and quiet-hours upfront; analytics (delivered/opened) via an async event stream. This is a near-perfect showcase for *your* RabbitMQ pipeline experience — frame it in those terms.

### 4.6 Distributed Cache (design Redis-as-a-service — leans on your strength)
**Scope:** a horizontally-scalable in-memory KV cache with get/put/TTL.
**Design:** partition the keyspace across N cache nodes via **consistent hashing** (so adding/removing a node only remaps ~1/N of keys, not everything). A client library (or a proxy) hashes the key to find its node. 
**Replication:** each shard has a primary + replica(s) for availability; reads can hit replicas (eventual consistency) or primary (strong). 
**Eviction:** LRU per node when memory is full; TTLs for staleness control. 
**The hard parts (your operational scars apply):** **hot keys** (one key getting disproportionate traffic — mitigate with client-side caching or key replication/splitting), **large values** (your 24 MB-key lesson — big values fragment memory and cause eviction pressure; consider value-size limits and chunking), **thundering herd** on expiry (request coalescing — your semaphore fix), and **cache coherence** with the backing DB (TTL vs write-through vs explicit invalidation). 
**Tradeoffs:** consistency vs availability on replica reads; memory cost vs hit rate; eviction policy vs workload.

### 4.7 The meta-design — your own multi-tenant SaaS platform
The single best prep you have: **be able to whiteboard DigitalReceipt crisply.** Structure it as: multi-tenancy strategy (schema-per-tenant — discuss the isolation/operational tradeoffs vs shared-schema-with-tenant-id vs DB-per-tenant), the ingestion pipeline (RabbitMQ workers processing millions of bills, partitioned PostgreSQL with monthly partition management and partition pruning), the caching layer (Redis with stampede protection), search (Elasticsearch inverted index), the API/proxy layer (YARP for observability), and the deployment (AKS, distributed sessions). For each, state the tradeoff you actually made. An interviewer who hears you reason about *your own* production system at this level knows immediately you operate at senior+. Rehearse it until it's a tight 10-minute narrative.

---

## 5. Senior signals & the mistakes that sink candidates

**Signals that read as senior/staff:**
- Driving the conversation and scoping *before* designing.
- Quantifying with estimation and letting numbers pick the hard problem.
- Naming the tradeoff and cost of every choice ("Redis here cuts read latency but adds a failure mode and a consistency question — I'll fail open").
- Choosing the *weakest* consistency the use case tolerates, deliberately.
- Going deep on mechanisms (outbox, consistent hashing, fan-out hybrid) not logos.
- Discussing failure modes and how the system degrades.

**Mistakes that sink it:**
- Jumping to a diagram before requirements.
- Name-dropping tech without justifying it ("I'll use Kafka" — why? what does it cost?).
- Ignoring scale (a single DB serving 50k QPS) or over-engineering trivial scale.
- Hand-waving the hard part the interviewer is probing.
- Claiming "exactly-once delivery" without idempotency, or "strongly consistent" everything (expensive and usually unnecessary).
- Forgetting the data flow has to *fail gracefully*.

---

**Part 2 complete.** Next on the roadmap: **Part 3 — CS Fundamentals**, where I write out the actual answers to every "probe you'll face" question from the master curriculum (OS/concurrency, networking, DB internals, distributed systems, the .NET runtime) — the part that makes you peer-level, not just interview-ready. Say *continue* and I'll write it in full.
