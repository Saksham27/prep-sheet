# Fundamentals — Generated Follow-up Probes

> AI-added — verify. One or two drill-down questions per original PROBE, the way an
> interviewer pushes after a good first answer. Merged into each concept's `followups[]`.
> Keyed by concept id.

---

### concept: fundamentals-1-operating-systems-and-concurrency-1-5-4
#### Q: Minor vs major page fault — and which one is "thrashing"?
A **minor (soft) fault** is satisfied from RAM: the page is already resident (e.g. in the page cache or shared by another process) and just needs mapping into this process's page table — costs microseconds. A **major (hard) fault** requires a disk read to bring the page in — costs milliseconds. **Thrashing** is when the active working set exceeds physical memory, so the system spends most of its time servicing major faults (paging in/out) instead of doing useful work; throughput collapses.

#### Q: How does the OS choose which page to evict?
True LRU is too expensive to track per-access, so kernels approximate it. The classic is the **clock / second-chance** algorithm: pages sit on a circular list with a hardware-set **reference bit**; the hand sweeps, giving a referenced page a second chance (clearing its bit) and evicting the first unreferenced one. The **dirty bit** is also consulted — clean pages are cheaper to evict (no write-back), so they're preferred.

---

### concept: fundamentals-1-operating-systems-and-concurrency-1-6-5
#### Q: What is the hardware prefetcher and why does it reward contiguous layout?
The CPU's prefetcher watches the access pattern and, on detecting a sequential or fixed-stride walk, fetches upcoming cache lines **before** they're requested — hiding memory latency. A contiguous array is the ideal case: the stride is constant, so by the time you reach element *i*, *i+1…i+k* are already in cache. A pointer-chasing structure has data-dependent, unpredictable addresses, so the prefetcher can't help and every hop risks a full memory stall.

#### Q: So when does a linked list actually win?
When you need **O(1) splice/insert/delete in the middle while already holding a reference to the node** (e.g. an intrusive LRU list, or moving a node between lists), and you rarely traverse. Arrays pay O(n) to shift on a middle insert; a list just rewires two pointers. The LRU cache is the canonical case — it pairs a hash map (lookup) with a doubly linked list (O(1) reorder).

---

### concept: fundamentals-1-operating-systems-and-concurrency-1-8-7
#### Q: What's a spinlock and when is it better than a mutex?
A **spinlock** busy-waits in a tight loop (often on a CAS) instead of sleeping. It avoids the context-switch cost of blocking, so it wins when the critical section is **very short** and contention is low — typically in kernel/lock-free code on multicore. It's terrible if held for long or oversubscribed (it burns a whole core doing nothing, and can't make progress if the holder is descheduled).

#### Q: What is priority inversion and how is it fixed?
A high-priority thread is blocked on a lock held by a **low**-priority thread, which itself can't run because a **medium**-priority thread is hogging the CPU — so the high-priority thread waits on the medium one indirectly. The fix is **priority inheritance**: while a low-priority thread holds a lock a higher-priority thread wants, it temporarily inherits that higher priority so it can finish and release.

---

### concept: fundamentals-1-operating-systems-and-concurrency-1-9-8
#### Q: How does `ConcurrentDictionary` cut contention internally?
It uses **lock striping**: the buckets are partitioned across N independent locks (the concurrency level), so operations on keys that hash to different stripes proceed in parallel and only collisions on the same stripe contend. Reads are mostly lock-free (volatile reads of the node chain). This is exactly the "split one lock into many keyed by hash" technique applied inside the data structure.

#### Q: Reader-writer locks help read-heavy workloads — what's the catch?
A `ReaderWriterLock` lets many readers run concurrently and only excludes for writers, which is great when reads dominate. The catch is **writer starvation** (a steady stream of readers never lets a writer in) unless the lock is writer-preferring, plus higher per-acquire overhead than a plain lock. If the critical section is tiny, a plain `lock` often beats it; if reads truly dominate and are non-trivial, the RW lock (or copy-on-write immutability) wins.

---

### concept: fundamentals-1-operating-systems-and-concurrency-1-12-11
#### Q: What is thread-pool starvation and how does sync-over-async cause it?
The thread pool has a limited number of worker threads and **injects new ones only slowly** (roughly one per ~0.5–1s past the minimum). If you block pool threads with `.Result`/`.Wait()` on async I/O, each blocked thread is consumed while doing nothing; under a burst, all workers block, new work queues up, and you get latency cliffs, timeouts, and apparent deadlocks. The cure is true async I/O end to end so threads are released during waits.

#### Q: If async doesn't speed up CPU-bound work, what should you use?
Actual **parallelism**: `Task.Run` to offload a CPU-bound unit to the pool, or `Parallel.For`/`Parallel.ForEach`/PLINQ to spread work across cores. `async/await` only helps you *not hold a thread while waiting on I/O*; for compute you need more cores doing work simultaneously, not fewer threads waiting.

---

### concept: fundamentals-2-networking-2-2-13
#### Q: How does QUIC get TCP-like reliability on top of UDP?
QUIC re-implements reliability **in user space** over UDP: it has its own packet sequence numbers, acknowledgements, retransmission, congestion control, and flow control — but per **stream**, so streams are independent. It also folds the transport + TLS 1.3 handshake into one (1-RTT, 0-RTT on resume) and supports **connection migration** (a connection ID survives an IP/port change, e.g. Wi-Fi→cellular).

#### Q: What is TCP head-of-line blocking and how does HTTP/3 avoid it?
With HTTP/2 over TCP, all streams share one ordered byte stream; a single lost packet stalls **every** stream until it's retransmitted, because TCP must deliver in order — transport-layer HOL blocking. HTTP/3 runs over QUIC where each stream has independent delivery, so a lost packet only stalls **its own** stream; the others keep flowing.

---

### concept: fundamentals-2-networking-2-4-15
#### Q: Where does TLS sit in that sequence and what does the handshake exchange?
After the TCP 3-way handshake completes (port 443), the **TLS handshake** runs before any HTTP: client and server agree on a cipher suite, the server presents its **certificate** (validated up a CA chain to a trusted root), and they derive a shared **symmetric** session key via an ephemeral key exchange (ECDHE, giving forward secrecy). Only then is the encrypted `GET` sent. TLS 1.3 does this in ~1 round trip (0-RTT on resumption).

#### Q: Recursive vs iterative DNS resolution — what's the difference?
A **recursive** resolver (your ISP's) takes full responsibility: it does the legwork and returns the final answer, caching along the way per TTL. The authoritative servers it queries answer **iteratively** — each returns a referral ("ask the `.com` TLD server", then "ask the domain's authoritative server") rather than chasing it themselves. So the client→resolver leg is recursive; the resolver→nameservers legs are iterative.

---

### concept: fundamentals-2-networking-2-5-16
#### Q: HTTP/2 multiplexes — so why does it still suffer head-of-line blocking?
The multiplexing is at the **application** layer (many logical streams over one connection), which removes *application*-layer HOL. But all of it still rides a **single TCP** connection, and TCP guarantees in-order byte delivery — so one lost packet blocks **all** streams at the **transport** layer until retransmission. That residual HOL is exactly what HTTP/3 (QUIC over UDP) was built to remove.

#### Q: What was HTTP/2 server push and why is it largely gone?
Server push let the server proactively send resources (e.g. CSS/JS) it predicted the client would request, before the client asked. In practice it was hard to use well — it often pushed things already in the client cache (wasting bandwidth) and was complex to tune — so browsers (Chrome) **deprecated and removed** it; preload hints (`<link rel=preload>` / 103 Early Hints) replaced the use case.

---

### concept: fundamentals-2-networking-2-8-19
#### Q: What are the four gRPC call types?
**Unary** (one request → one response, like a normal RPC); **server streaming** (one request → a stream of responses, e.g. a live feed); **client streaming** (a stream of requests → one response, e.g. uploading chunks); and **bidirectional streaming** (both sides stream independently over the one HTTP/2 connection, e.g. a chat). All four are built on HTTP/2 streams.

#### Q: Why is gRPC awkward from a browser, and what bridges it?
Browsers don't expose enough low-level control over HTTP/2 frames/trailers for native gRPC, so you can't call a gRPC service directly from JS. **gRPC-Web** bridges it: the browser speaks a slightly different, HTTP/1.1- or HTTP/2-friendly wire format, and a proxy (Envoy, or the gRPC-Web server) translates to/from real gRPC.

---

### concept: fundamentals-3-databases-your-strongest-fundamental-make-it-airtight-3-1-21
#### Q: What's a covering index and when does it give an index-only scan?
A **covering index** includes every column a query reads (in the key, or via `INCLUDE` columns in Postgres/SQL Server), so the planner can answer entirely **from the index** without visiting the heap/table rows — an **index-only scan**. It's a big win for hot read paths, at the cost of a wider index and more write/maintenance overhead.

#### Q: Why does column order matter in a composite index?
A B-tree composite index on `(a, b, c)` is sorted by `a`, then `b`, then `c` — so it serves predicates on a **leftmost prefix**: `a`, `a,b`, or `a,b,c`, and range-then-equality must respect that order. A query filtering only on `b` can't use it (no contiguous range), and putting a low-selectivity or range column first can ruin it. Order columns by how queries filter (equality predicates first, range last).

---

### concept: fundamentals-3-databases-your-strongest-fundamental-make-it-airtight-3-3-23
#### Q: Give a concrete write-skew example.
Two on-call doctors each run "is at least one *other* doctor still on call? If yes, I may go off-call." Both read the same snapshot showing the other on call, both pass the check, and both update their own row to off-call — leaving **zero** coverage, violating the invariant. Neither transaction alone is wrong; their disjoint writes together break it. Repeatable Read / snapshot isolation allows this; only Serializable catches it.

#### Q: How does Postgres's Serializable prevent it without locking reads?
Postgres uses **Serializable Snapshot Isolation (SSI)**: it still runs on MVCC snapshots (readers don't block), but it **tracks read/write dependencies** between concurrent transactions and detects the dangerous **rw-dependency cycle** that produces a serialization anomaly. When it spots one, it **aborts** one of the transactions with a serialization failure (which the app retries) — optimistic, not lock-based.

---

### concept: fundamentals-3-databases-your-strongest-fundamental-make-it-airtight-3-4-24
#### Q: What are xmin and xmax, and how is row visibility decided?
Each row version is tagged with **xmin** (the transaction id that created it) and **xmax** (the txn that deleted/superseded it, or 0/null if live). A transaction sees a version if xmin is committed and visible in its snapshot **and** xmax is not (not yet deleted as of the snapshot). An UPDATE writes a new version (new xmin) and stamps the old one's xmax — that's how readers keep seeing the old value while a writer proceeds.

#### Q: What is VACUUM reclaiming, and what's transaction-ID wraparound?
VACUUM reclaims **dead tuples** — old row versions whose xmax is committed and no longer visible to any running snapshot — freeing space and updating the visibility map and statistics. Separately, xids are a 32-bit counter; if a table goes too long without vacuuming, ids can **wrap around** and old rows could suddenly look "in the future" and vanish. Autovacuum runs anti-wraparound freezing to prevent that — neglect here is a real production hazard.

---

### concept: fundamentals-3-databases-your-strongest-fundamental-make-it-airtight-3-6-26
#### Q: In EXPLAIN ANALYZE, what does a big estimated-vs-actual row gap tell you?
It means the planner's **statistics are stale or insufficient**, so it costed the plan on wrong cardinalities and likely picked a bad strategy (e.g. a nested loop expecting 10 rows but getting 100k). Fix: `ANALYZE` to refresh stats, check autovacuum, raise the statistics target on skewed columns, or add extended statistics for correlated columns. The gap, not the raw timing, is the diagnostic.

#### Q: What makes a predicate "sargable," and give a non-sargable example?
**Sargable** = the optimizer can use an index to seek a range rather than scanning every row. Wrapping the indexed column in a function or doing arithmetic on it defeats the index: `WHERE date_trunc('day', created_at) = '2026-06-27'` or `WHERE created_at::date = …` forces a scan, whereas the sargable rewrite `WHERE created_at >= '2026-06-27' AND created_at < '2026-06-28'` lets the planner seek the B-tree (and, for your partitioned tables, prune partitions).

---

### concept: fundamentals-4-distributed-systems-the-senior-staff-differentiator-4-4-31
#### Q: What happens in a split vote, and how do randomized timeouts resolve it?
If two followers time out at nearly the same moment, both become candidates, increment the term, and each may collect some votes but **neither reaches a majority** — a split vote. No leader is elected that term, so they wait out a fresh **randomized** election timeout; whichever fires first becomes the sole candidate and usually wins cleanly. The randomization makes simultaneous candidacies rare and self-correcting term over term.

#### Q: Why must a new leader already have all committed entries?
Raft only grants a vote to a candidate whose log is **at least as up-to-date** as the voter's (by last-entry term, then index). Since an entry is committed only once a **majority** has it, and any winning candidate also needs a majority, the two majorities **overlap** in at least one node — guaranteeing the new leader's log contains every committed entry. This is the safety property that lets Raft never lose committed data.

---

### concept: fundamentals-4-distributed-systems-the-senior-staff-differentiator-4-8-35
#### Q: How do you make a consumer idempotent in practice?
Give each message a stable **idempotency key** (a business id or a producer-assigned message id) and record processed keys in a **dedup table** (or a unique constraint) inside the same transaction as the side effect — so a redelivery hits the constraint and is skipped. Alternatively make the operation **naturally idempotent** (an upsert / "set to X" rather than "increment"). That converts at-least-once delivery into effectively-once processing.

#### Q: What is the outbox pattern and what does it solve?
It solves the **dual-write problem**: you can't atomically write your DB *and* publish to a broker (two systems, no shared transaction). Instead you write the event into an `outbox` table **in the same DB transaction** as the state change; a separate relay (polling the table, or CDC reading the WAL via Debezium) publishes it to the broker afterward. The event fires **iff** the transaction committed — no lost or phantom events.

---

### concept: fundamentals-5-net-clr-runtime-depth-own-your-own-stack-5-2-40
#### Q: What is the Large Object Heap and why isn't it compacted by default?
Objects ≥ **85 KB** (e.g. big arrays/buffers) go on the **LOH**, which is collected together with gen 2. By default it's **not compacted** because moving large blocks is expensive, so it can **fragment** — free gaps too small to reuse, driving memory up. Mitigate by pooling/reusing big buffers (`ArrayPool<T>`), avoiding short-lived large allocations, or occasionally forcing `GCSettings.LargeObjectHeapCompactionMode`.

#### Q: Why are finalizers a last resort, and what's the Dispose pattern?
A finalizable object **survives an extra GC cycle**: it goes on the finalization queue, gets promoted, runs its finalizer on a dedicated thread, then is collected later — hurting GC throughput and delaying cleanup non-deterministically. The pattern: implement `IDisposable` to release unmanaged resources **deterministically** via `using`, call `GC.SuppressFinalize(this)` when disposed, and keep a finalizer only as a backstop for the case the caller forgets to dispose.

---

### concept: fundamentals-5-net-clr-runtime-depth-own-your-own-stack-5-3-41
#### Q: What does `ConfigureAwait(false)` change, and where do you use it?
By default an `await` captures the current **SynchronizationContext** and resumes the continuation on it (the UI thread, or classic ASP.NET request context). `ConfigureAwait(false)` says "I don't need the original context — resume on any thread-pool thread," which avoids the marshal-back, prevents the classic sync-over-async **deadlock**, and is slightly faster. Use it in **library** code; in ASP.NET Core (no SyncContext) it's largely moot, and in UI code you *want* the default when you'll touch UI afterward.

#### Q: Task vs ValueTask — when is ValueTask worth it, and what are its rules?
`Task` is a heap object; `ValueTask` is a struct that **avoids the allocation when the result is usually available synchronously** (cached values, hot paths) — a measured micro-optimization. Its rules are strict: **await it exactly once**, don't block on it (`.Result`/`.GetAwaiter().GetResult()`), don't await it concurrently, and don't store it. Default to `Task`; reach for `ValueTask` only on a profiled hot path.

---

### concept: fundamentals-5-net-clr-runtime-depth-own-your-own-stack-5-5-43
#### Q: How do you correctly use a scoped service (like DbContext) from a BackgroundService?
A `BackgroundService` is itself a **singleton**, so you can't inject a scoped `DbContext` into it (captive dependency). Instead inject **`IServiceScopeFactory`**, and per unit of work do `using var scope = _scopeFactory.CreateScope();` then `var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();`. That gives a fresh, correctly-disposed scoped instance per iteration — the standard pattern for hosted/background services.

#### Q: Transient vs Scoped — when does Transient surprise you?
A **Transient** is created anew on every resolution — but if it's injected into a longer-lived consumer (a singleton or a scoped service that lives the whole request), it's **captured** and effectively lives as long as that consumer, *not* "briefly." So a transient holding per-call state, or an `IDisposable` transient injected into a singleton, won't be recreated or disposed as you'd expect. Lifetime is dictated by the **longest-lived thing that holds it**, which is the same trap as the scoped-into-singleton bug.
