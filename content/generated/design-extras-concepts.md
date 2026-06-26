# System Design extras — more designs + estimation practice

> AI-added — verify. Four more worked designs appended to "Fully worked designs," plus
> back-of-envelope estimation exercises (with hidden worked answers) appended to "The
> estimation toolkit."

@topic id=design-4-fully-worked-designs | track=design | title=Fully worked designs

### concept: Google Drive / Dropbox (file sync & storage)
**Scope:** upload/download files, **sync** across a user's devices, share. Out of scope: real-time collaborative editing.

**Numbers:** storage-dominated; reads/writes are modest vs the byte volume. Sync events (small metadata) are frequent.

**Core ideas:** split files into **chunks** (e.g. 4 MB) and store them in **object storage**, addressed by **content hash** — which gives **deduplication** (identical chunks stored once) and efficient **delta sync** (only changed chunks transfer). A **metadata DB** holds the file tree, versions, and which chunks compose each file. Each client keeps a local view and reconciles against a **change journal / cursor** (poll or push notifications) to pull only what changed.

**Sync & conflicts:** clients watch the local folder, upload changed chunks, and update metadata; other devices learn via the journal and download deltas. Concurrent edits → **conflict resolution** (last-writer-wins with version history, or "conflicted copy").

**Scale & tradeoffs:** object storage for blobs (cheap, elastic) + a CDN for downloads; metadata DB sharded by user. Dedup and delta sync cut bandwidth/storage hugely. Strong-ish consistency on metadata, eventual on propagation. Large-file upload uses **resumable/multipart** uploads.

#### probe: How do you sync efficiently and avoid re-uploading whole files?
**Chunk** files and address chunks by **content hash**. On a change, the client diffs locally and uploads only the chunks whose hashes changed (**delta sync**), updating the file's chunk list in the metadata DB; other devices pull just those chunks via a change journal/cursor. Content-addressing also gives **dedup** — a chunk already in storage (even from another user) isn't re-uploaded. So a one-line edit in a 1 GB file moves one chunk, not a gigabyte. Add resumable multipart uploads for large files.

### concept: Distributed message queue (Kafka-style)
**Scope:** a durable, horizontally-scalable queue/log — producers append messages, consumers read them, with ordering and at-least-once delivery.

**Core design:** model it as a **partitioned, append-only log**. A topic is split into **partitions**; each partition is an ordered, immutable sequence persisted to disk (sequential writes = fast). Producers pick a partition (by key for per-key ordering). Each partition is **replicated** across brokers (a leader + followers) for durability; a write is committed once a quorum/ISR has it.

**Consumption:** consumers track their own **offset** per partition (so reads don't delete data — it's a log, not a destructive queue), enabling **replay** and multiple independent consumer groups. Partitions are distributed across a **consumer group** for parallelism (≤ one consumer per partition).

**Guarantees & tradeoffs:** ordering is **per-partition**, not global (the usual compromise). Delivery is at-least-once (commit offset after processing → possible duplicates → idempotent consumers). **Retention** by time/size. More partitions = more parallelism but more overhead and weaker global ordering. Coordination (leader election, membership) needs consensus (Raft/ZK).

#### probe: How does a partitioned log give both ordering and scale?
By scoping ordering to a **partition**. Each partition is a single append-only, replicated log with a total order; producers route messages with the same key to the same partition, so per-key order is preserved. Scale comes from having **many partitions** spread across brokers and consumed in parallel by a consumer group (one consumer per partition). You trade **global** ordering (which would force a single serial log and kill throughput) for per-partition ordering plus horizontal scale — the standard, pragmatic compromise. Consumers track offsets, so the log is replayable by multiple independent groups.

### concept: Distributed counter / leaderboard
**Scope:** real-time counts and top-N at scale — likes, views, reactions, game scores — read by many, written by many.

**The write problem:** a single row/key for a hot counter becomes a contention hotspot. Spread writes across **N shards** per counter (increment a random shard), and **sum the shards** on read — trading read cost for write throughput. Or buffer increments through a stream (Kafka) and **aggregate** in windows, writing rollups.

**Leaderboard:** a **Redis sorted set** (`ZINCRBY` to update, `ZREVRANGE`/`ZREVRANK` for top-N and rank) gives O(log n) updates and ranked reads in memory. For "global top-N across billions," precompute/approximate and refresh periodically.

**Exact vs approximate:** exact counts need durable aggregation; for **unique** counts at massive scale, **HyperLogLog** estimates cardinality in tiny memory. Dashboards tolerate approximation; billing needs exactness (reconcile from the log).

#### probe: How do you build a high-write counter without a hotspot?
Don't funnel all increments to one key. **Shard the counter** into N sub-counters and increment a random shard per write, then **sum the shards** at read time — spreading write load across keys/nodes at the cost of a slightly more expensive read. Alternatively, push increments through a **stream** and aggregate in time windows into rollups. For ranked data use a **Redis sorted set**; for huge unique counts use **HyperLogLog**. Match exactness to need: approximate + fast for dashboards, durable aggregation/reconciliation for anything billed.

### concept: API gateway (single entry point)
**Scope:** one front door for many backend services — routing, cross-cutting concerns, and protecting the services behind it. (You've built this shape with **YARP**.)

**Responsibilities:** **routing/reverse proxy** to the right service (by path/host/header), **authentication/authorization** (validate the token once at the edge), **rate limiting & throttling** (token bucket in Redis), **TLS termination**, request/response transformation, **aggregation** (fan out to several services, combine — a backend-for-frontend), **caching**, and observability (logging/tracing/metrics for all traffic in one place).

**Reliability:** **circuit breakers** and retries-with-backoff so a failing downstream doesn't cascade; **timeouts** and bulkheads to isolate failures; graceful degradation.

**Scale & tradeoffs:** the gateway is on every request's hot path, so it must be **stateless, horizontally scaled, and HA** (it's a potential single point of failure — run multiple instances behind an LB). It centralizes cross-cutting concerns (huge win) but adds a hop and operational importance — keep its logic thin and fast.

#### probe: What does an API gateway do, and what's the risk of adding one?
It's the single entry point that handles cross-cutting concerns so services don't each reimplement them: routing/reverse-proxy, auth at the edge, rate limiting, TLS termination, request aggregation (BFF), caching, and centralized observability — plus reliability patterns (circuit breakers, retries, timeouts). The risk is that it sits on **every** request and becomes a **single point of failure** and a latency hop, so it must be stateless, horizontally scaled, and highly available, with its logic kept thin. The payoff — one consistent place for auth/limits/telemetry — usually outweighs the added hop.

@topic id=design-1-the-estimation-toolkit | track=design | title=The estimation toolkit

### exercise: [M] QPS from daily volume
A service receives **500 million requests per day**. Estimate the **average** QPS and a reasonable **peak** QPS.
#### solution:
```text
A day ≈ 86,400 s ≈ 10^5 s (the handy shortcut).
Average QPS = 500,000,000 / 10^5 = 5,000 req/s.
Peak is typically 2–3× average → ~10,000–15,000 req/s.
Design for peak, not average.
```
**Note:** memorize "1 day ≈ 10⁵ seconds" — then any /day figure ÷ 10⁵ is average QPS. 1M/day ≈ 12 QPS, 100M/day ≈ 1,200 QPS, 1B/day ≈ 12,000 QPS.

### exercise: [M] Storage sizing with replication
A photo service stores **10 million photos/day**, average **2 MB** each, replicated **3×**. How much storage per **year**?
#### solution:
```text
Per day:  10M × 2 MB = 20,000,000 MB = 20 TB/day.
Per year: 20 TB × 365 ≈ 7.3 PB/year (raw).
With 3× replication: 7.3 PB × 3 ≈ ~22 PB/year.
```
**Note:** powers of two shortcut — 2^10≈10³ (KB), 2^20≈10⁶ (MB), 2^30≈10⁹ (GB), 2^40≈10¹² (TB). Always state assumptions (avg size, replication factor, retention) — the interviewer cares about the method, not a precise number.

### exercise: [M] Cache memory sizing
You want **80%** of **1 million** hot items, each ~**5 KB**, served from an in-memory cache. How much RAM (ignoring overhead)?
#### solution:
```text
Items cached = 0.8 × 1,000,000 = 800,000.
Memory = 800,000 × 5 KB = 4,000,000 KB ≈ 4 GB.
Add ~20–30% for data-structure/overhead → provision ~5 GB.
Fits comfortably on one node → caching is cheap here; the design problem is elsewhere.
```
**Note:** sizing the cache tells you whether it fits in memory (one node vs a distributed cache) and what hit-rate you can afford — a quick calc that often reframes the whole design.

### exercise: [E] Read-heavy or write-heavy? (Twitter-ish)
**200M DAU**, each user **posts 2×/day** and **reads 100 posts/day**. Estimate write and read QPS, and what it implies.
#### solution:
```text
Writes = 200M × 2 = 400M/day  ÷ 10^5 ≈ 4,000 writes/s  (~12k peak).
Reads  = 200M × 100 = 20B/day  ÷ 10^5 ≈ 200,000 reads/s (~500k+ peak).
Read:write ≈ 50:1 → heavily READ-heavy.
Implication: cache aggressively, use read replicas / precomputed feeds,
and the feed fan-out (read vs write) is the real design problem.
```
**Note:** letting the read:write ratio fall out of the numbers — and naming what it implies (cache-first, fan-out strategy) — is exactly the senior move: let the estimate *select the hard problem*.
