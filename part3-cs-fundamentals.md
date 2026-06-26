# Part 3 — CS Fundamentals: The Peer-Level Depth

> This is the track that answers your actual fear — standing in a room of strong engineers without feeling hollow. DSA passes the coding gate; *this* makes you a peer. Every "PROBE" below is a real question a senior/principal engineer or interviewer asks, with the answer written out. Read the teaching, then cover the answers and try the probes out loud. If you can answer them cold, you're at the level you want.

---

# 1. Operating Systems & Concurrency

## 1.1 Process vs thread
A **process** is an instance of a running program with its *own* address space (virtual memory), file descriptors, and resources. A **thread** is a unit of execution *within* a process; threads of the same process **share** the address space (heap, globals, code) but each has its **own stack and registers (and program counter)**.

Implications: threads communicate cheaply (shared memory) but must synchronize to avoid races; processes are isolated (a crash in one doesn't corrupt another) but communicate via IPC (pipes, sockets, shared memory) which is heavier. Creating a thread is far cheaper than a process.

## 1.2 Context switching
The CPU runs one thread per core at a time. A **context switch** saves the current thread's registers/PC/stack pointer and loads another's. It costs directly (the save/restore, ~1–10 µs) and indirectly (**cache and TLB pollution** — the new thread's working set isn't in cache). This is why spawning thousands of threads hurts: more time switching than working. It's also the argument for async I/O over thread-per-request.

## 1.3 User mode vs kernel mode, syscalls
The CPU runs in **user mode** (restricted) or **kernel mode** (full hardware access). Application code runs in user mode; to do privileged things (I/O, allocate memory, spawn threads) it makes a **syscall**, which traps into the kernel (a mode switch, more expensive than a function call). This boundary is why I/O is "expensive" beyond the device itself, and why batching syscalls (e.g. reading larger buffers) helps.

## 1.4 Scheduling
The OS scheduler decides which ready thread runs next. **Preemptive** scheduling interrupts a running thread (via a timer) to give others a turn — guaranteeing no thread monopolizes the CPU. Concerns: **fairness**, **priority** (higher-priority threads first), **starvation** (a low-priority thread never running — mitigated by priority aging), and throughput vs latency. Common policies: round-robin, multilevel feedback queues (Linux CFS aims for fairness via a virtual-runtime).

## 1.5 Virtual memory, paging, page faults, TLB
Each process sees a private, contiguous **virtual address space**; the **MMU** translates virtual → physical addresses via **page tables**, in fixed-size **pages** (typically 4 KB). This gives isolation (processes can't touch each other's memory) and the *illusion of more memory than physically exists* (unused pages live on disk/swap).

The **TLB** (Translation Lookaside Buffer) caches recent virtual→physical translations so the MMU doesn't walk the page table every access.

**PROBE: Walk me through a page fault.**
> The CPU issues a virtual address. The MMU looks it up — if the translation isn't in the TLB, it walks the page table. If the page-table entry says the page is **not present** in physical memory (valid bit clear), the MMU raises a **page fault**, trapping to the OS. The OS handler checks if the access is legal (within a mapped region — if not, segfault). For a legal fault it (1) finds a free physical frame, evicting one via the page-replacement policy if memory is full (writing the victim to disk if dirty), (2) reads the needed page from disk/swap into the frame, (3) updates the page table and TLB, then (4) restarts the faulting instruction, which now succeeds. A **minor fault** = the page is already in RAM but not mapped into this process (cheap); a **major fault** = a disk read (slow, ~ms). Excessive major faults = **thrashing**, where the system spends more time paging than computing.

## 1.6 Memory hierarchy & cache locality — *the answer to "but they're both O(n)"*
Registers → L1 → L2 → L3 → RAM → SSD → disk, each ~10–100× slower and larger than the last. The CPU loads memory in **cache lines** (~64 bytes), so accessing one element pulls in its neighbors.

**PROBE: An array and a linked list are both O(n) to traverse — why is the array dramatically faster in practice?**
> Big-O ignores constants and the memory hierarchy. An array is **contiguous**, so a traversal has excellent **spatial locality** — each cache line fetch brings in the next several elements, and the hardware **prefetcher** predicts the sequential access. A linked list scatters nodes across the heap, so each `next` is likely a **cache miss** (~100 ns to RAM) and defeats prefetching. The array can be 10–50× faster despite identical asymptotic complexity. This is why `List<T>`/arrays beat `LinkedList<T>` for almost all real workloads, and why data-oriented design (struct-of-arrays) matters in hot paths.

## 1.7 False sharing
When two threads update *different* variables that happen to sit on the *same cache line*, each write invalidates the other core's cached copy, ping-ponging the line between cores even though there's no logical contention. Fix: pad/align hot per-thread data to separate cache lines (or use thread-local storage). A subtle performance killer worth naming — it signals real systems depth.

## 1.8 Concurrency primitives
- **Race condition:** the result depends on unsynchronized timing of threads accessing shared state. The classic: `i++` is read-modify-write, not atomic; two threads can both read 5, both write 6, losing an increment.
- **Critical section:** code that must execute atomically with respect to shared state; protect it with a lock.
- **Mutex:** a lock with **ownership** — only the thread that acquired it can release it. For mutual exclusion (one thread in the critical section).
- **Semaphore:** a **counter** with no ownership; `acquire` decrements (blocks at 0), `release` increments. Used to **limit N concurrent** accesses or for **signaling** between threads. A binary semaphore (count 1) resembles a mutex but lacks ownership semantics.
- **Spinlock:** busy-waits (spins) instead of sleeping. Cheaper than a mutex *if* the wait is very short (avoids the context-switch cost) but wastes CPU if held long.

**PROBE: Mutex vs semaphore — when each?**
> Use a **mutex** for mutual exclusion: protecting a shared resource so exactly one thread uses it at a time, with clear ownership (the locker unlocks). Use a **semaphore** when you want to allow up to **N** concurrent users of a resource (a connection pool of 10, or your `SemaphoreSlim(1)` used to serialize cache repopulation), or for **signaling** (producer signals consumer that an item is ready). Key difference: a mutex is owned and binary; a semaphore is a counter without ownership, so one thread can signal and another can wait.

## 1.9 Deadlock, livelock, starvation
**Deadlock** requires all four **Coffman conditions** simultaneously:
1. **Mutual exclusion** — resources are non-shareable.
2. **Hold and wait** — a thread holds one resource while waiting for another.
3. **No preemption** — resources can't be forcibly taken.
4. **Circular wait** — a cycle of threads each waiting on the next.

Break **any one** to prevent deadlock. Most practical fix: impose a **global lock ordering** (always acquire locks in the same order) to eliminate circular wait. Others: acquire all locks at once (no hold-and-wait), use timeouts/try-lock, or detect-and-recover.

**Livelock:** threads keep changing state in response to each other but make no progress (two people stepping aside in a hallway, repeatedly). **Starvation:** a thread is perpetually denied a resource (always outprioritized) — fixed by fairness/aging.

**PROBE: Your high-throughput service has lock contention killing throughput — what do you do?**
> The goal is to shrink or remove the serialized section. Options, roughly in order: (1) **reduce the critical section** — do only the minimum under the lock, move expensive work outside it; (2) **lock striping / sharding** — split one lock into many keyed by hash (e.g. `ConcurrentDictionary` does this internally) so unrelated keys don't contend; (3) **read-write locks** — if reads dominate, let readers run concurrently and only writers exclude; (4) **immutability / copy-on-write** — readers never lock if data is immutable; (5) **lock-free structures** using CAS for simple state; (6) **partition the state per-thread** and merge later (thread-local accumulation); (7) reduce the *need* to share at all (sharding work by key). I'd profile first to confirm the lock is the bottleneck and measure contention, not guess.

## 1.10 Atomicity, memory models, and why `volatile` isn't a lock
Modern CPUs and compilers **reorder** instructions and cache values in registers for speed. A **memory model** defines what reorderings are allowed and what guarantees about visibility one thread has of another's writes.

`volatile` (in C#/Java) provides **visibility and ordering** guarantees — a volatile read/write isn't cached in a register and certain reorderings around it are forbidden — so one thread sees another's write. But `volatile` does **not** make compound operations atomic: `volatileInt++` is still a non-atomic read-modify-write and still races. **Memory barriers/fences** enforce ordering at specific points. For atomic compound ops you need interlocked/atomic operations or a lock.

## 1.11 Lock-free programming & CAS
**Compare-And-Swap (CAS)** is an atomic CPU primitive: "if this memory location still equals *expected*, set it to *new*, atomically, and report success." It's the foundation of lock-free structures — you compute a new value and CAS it in; if another thread changed it first, you retry. Benefit: no blocking, no deadlock. Pitfall: the **ABA problem** (a value changes A→B→A and CAS wrongly thinks nothing happened — fixed with version tags) and livelock under high contention. `Interlocked.CompareExchange` in .NET exposes it.

## 1.12 Concurrency vs parallelism — and why async ≠ threads
- **Concurrency** = *dealing with* many things at once (structure: interleaving tasks, making progress on multiple, even on one core).
- **Parallelism** = *doing* many things at once (multiple cores executing simultaneously).
You can have concurrency without parallelism (one core time-slicing) and parallelism is one way to *implement* concurrency.

**PROBE: Is `async/await` multithreading?**
> No. `async/await` is about **not blocking a thread while waiting on I/O**, not about using more threads. When you `await` an I/O-bound operation (a DB call, an HTTP request), the thread is **released back to the pool** while the OS/device does the work; when the I/O completes, a continuation is scheduled (often on a different pool thread) to resume. So one thread can service many in-flight requests — high **concurrency** with few threads. This is why async dramatically improves throughput for **I/O-bound** servers (your web APIs): you're not holding a thread per blocked request. It does **not** speed up **CPU-bound** work — for that you need actual parallelism (`Parallel`, multiple threads/cores). Using async for CPU-bound work or blocking inside async just wastes the benefit.

---

# 2. Networking

## 2.1 The layers that matter
Don't recite all seven OSI layers — *understand* the ones in play: **L3 (network/IP)** routes packets between hosts by IP; **L4 (transport/TCP/UDP)** delivers to the right process (ports) with/without reliability; **L7 (application/HTTP, gRPC, DNS)** is your protocols. Load balancers operate at L4 (fast, opaque) or L7 (content-aware) — the distinction your YARP proxy lives in.

## 2.2 TCP vs UDP
**TCP** is connection-oriented and reliable: a **3-way handshake** (SYN → SYN-ACK → ACK) establishes the connection; data is delivered **in order, without loss or duplication** via sequence numbers, acknowledgments, and retransmission. It has **flow control** (the receiver advertises a window so a fast sender doesn't overwhelm it) and **congestion control** (slow-start, then additive-increase/multiplicative-decrease — back off on packet loss to avoid collapsing the network). Teardown is a 4-way FIN/ACK exchange.

**UDP** is connectionless and unreliable: no handshake, no ordering, no retransmission — just send datagrams. Lower latency and overhead.

**PROBE: When choose UDP?** When loss is tolerable and latency matters more than reliability: live video/voice (a dropped frame is better than a stall), DNS (small, one round trip, retry at the app level), gaming. **QUIC/HTTP3** is built on UDP precisely to escape TCP's limitations while re-implementing reliability in user space.

## 2.3 IP, ports, NAT
An **IP address** identifies a host; a **port** identifies a process/socket on it. **NAT** lets many devices behind a router share one public IP by rewriting addresses/ports — the reason your laptop's private IP isn't internet-routable, and a complication for peer-to-peer (hence STUN/TURN).

## 2.4 DNS, end to end
**PROBE: What happens when you type a URL and hit Enter? (the all-time classic — go deep)**
> 1. **DNS resolution:** the browser checks its cache, then the OS cache, then asks a **resolver** (usually the ISP's). If uncached, the resolver queries the **root** nameserver → the **TLD** server (`.com`) → the domain's **authoritative** nameserver, getting the IP (an **A**/**AAAA** record), cached per its **TTL**.
> 2. **TCP connection:** the browser opens a TCP connection to that IP on port 443 — the **3-way handshake**.
> 3. **TLS handshake:** for HTTPS, client and server negotiate a cipher, the server presents its **certificate** (validated up a CA chain), and they establish a shared **symmetric** session key via asymmetric key exchange (ECDHE for forward secrecy). TLS 1.3 does this in ~1 round trip.
> 4. **HTTP request:** the browser sends `GET /` with headers; the request may hit a **CDN/edge**, a **load balancer**, then an app server.
> 5. **Server processing:** app logic, DB/cache calls, response generated.
> 6. **Response & render:** the browser receives HTML, parses it, builds the DOM, fetches subresources (CSS/JS/images — often from a CDN, over multiplexed HTTP/2 streams), runs JS, and paints.
> A strong answer names DNS caching layers, the TCP+TLS handshakes, the CDN/LB hops, and the render pipeline — and can go deeper on any of them when pushed.

## 2.5 HTTP versions
- **HTTP/1.1:** one request at a time per connection (pipelining is broken in practice); browsers open multiple connections. Suffers **head-of-line (HOL) blocking** at the application layer — one slow response blocks the connection.
- **HTTP/2:** **multiplexes** many concurrent **streams** over a **single** TCP connection (binary framing), adds **header compression (HPACK)** and server push. Solves application-layer HOL.

**PROBE: Why is HTTP/2 faster?** Multiplexing (no per-request connection setup, many in flight at once on one connection), header compression (headers repeat heavily across requests), and binary framing (cheaper to parse). *But* it still rides on TCP, so a single lost packet stalls **all** streams — **transport-layer HOL blocking** remains.
- **HTTP/3 (QUIC):** runs over **UDP**, implementing streams that are **independent** at the transport layer, so one lost packet only stalls its own stream — eliminating TCP HOL. It also folds the transport + TLS handshake together for faster connection setup and supports connection migration (survives IP changes).

## 2.6 TLS handshake (why HTTPS is secure)
Asymmetric crypto (public/private key) is used **only to securely agree on a shared symmetric key**; the bulk session then uses fast symmetric encryption. The server's **certificate**, signed by a **Certificate Authority**, proves the server's identity (the client validates the signature chain to a trusted root). Modern handshakes use **ephemeral** key exchange (ECDHE) for **forward secrecy** — capturing the traffic and later stealing the server key still can't decrypt past sessions. TLS 1.3 trimmed it to 1-RTT (0-RTT on resumption).

## 2.7 Real-time: WebSocket vs SSE vs long-polling
- **Long polling:** client requests, server holds the connection open until data is available, then responds; client immediately re-requests. Works everywhere; inefficient.
- **Server-Sent Events (SSE):** a single long-lived HTTP connection, server → client only, text streaming. Good for one-way feeds.
- **WebSocket:** a persistent, **full-duplex** connection (upgraded from HTTP). Both sides push anytime. The right tool for chat, live collaboration, gaming (the chat design in Part 2 uses it).

## 2.8 gRPC vs REST vs GraphQL
**PROBE: When gRPC over REST?**
> Use **gRPC** for **internal service-to-service** communication where you control both ends and want low latency, a strict typed contract, and streaming: it uses HTTP/2 (multiplexed) and **Protobuf** (compact binary, fast to serialize, schema-enforced), supports bidirectional streaming, and generates client/server stubs. Use **REST** for public-facing/CRUD APIs where human-readability, broad client support, browser-friendliness, and HTTP caching matter. Use **GraphQL** when diverse clients need to fetch exactly the fields they want in one round trip (avoiding over-/under-fetching in REST), accepting harder caching and the need to bound query complexity. Trade-off summary: gRPC = performance + typing, REST = simplicity + ubiquity, GraphQL = flexible fetching.

## 2.9 HTTP semantics worth knowing
**Idempotent** methods (same effect if repeated): GET, PUT, DELETE, HEAD. **Not** idempotent: POST — which is why retrying a failed payment POST needs an **idempotency key**. Status codes that signal real understanding: 201 (created), 202 (accepted/async), 304 (not modified — caching), 401 vs 403 (unauthenticated vs unauthorized), 409 (conflict), 429 (rate limited), 502/503/504 (gateway/unavailable/timeout).

---

# 3. Databases (your strongest fundamental — make it airtight)

## 3.1 Indexing internals
**B-tree / B+-tree (the relational default):** a balanced tree with **high fanout** — each node holds many keys and corresponds to a disk page — so even billions of rows are ~3–4 levels deep, meaning a lookup is a handful of page reads. B+-trees keep all data in the leaves, linked for efficient **range scans**. Great for reads, equality, and ranges; writes cost rebalancing.

**LSM-tree (write-optimized stores — Cassandra, RocksDB):** writes go to an in-memory **memtable** + a write-ahead log, then flush as sorted immutable **SSTables**; background **compaction** merges them. Writes are sequential (fast); reads may check several SSTables (**read amplification**, mitigated by **bloom filters** that cheaply rule out SSTables). The core trade: **B-tree = read-optimized, LSM = write-optimized.**

**Index rules that show judgment:**
- **Composite index column order** follows leftmost-prefix: an index on `(a, b)` serves queries filtering on `a` or `a,b`, but not `b` alone.
- A **covering index** includes all columns a query needs, so it's answered from the index without touching the table.
- **Cardinality matters:** an index on a boolean (2 values) is usually useless — the planner will seq-scan anyway.

**PROBE: When would you NOT add an index?**
> On **write-heavy tables** where the index's write/maintenance cost outweighs read benefit; on **low-cardinality** columns (few distinct values — the index doesn't narrow enough); on **small tables** (a sequential scan is cheaper than index overhead); on columns **rarely used** in filters/joins; and when a column is **already the prefix** of an existing composite index (redundant). Every index also costs storage and slows inserts/updates/deletes, so they're not free — you add them to serve specific, measured query patterns.

## 3.2 ACID & transactions
**Atomicity** (all-or-nothing), **Consistency** (constraints hold before and after), **Isolation** (concurrent transactions don't corrupt each other), **Durability** (committed data survives crashes — via the write-ahead log). The WAL is the mechanism behind both atomicity (undo) and durability (redo).

## 3.3 Isolation levels & the anomalies they prevent
Concurrency anomalies, from worst:
- **Dirty read:** reading another transaction's *uncommitted* change.
- **Non-repeatable read:** reading the same row twice in one transaction yields different values because another transaction *committed an update* in between.
- **Phantom read:** re-running the same *query* yields a different *set of rows* because another transaction *inserted/deleted* matching rows.
- **Write skew:** two transactions each read an overlapping set, then make *disjoint* writes that together violate an invariant — even though neither alone does.

The levels, each preventing more:
| Level | Prevents |
|---|---|
| Read Uncommitted | (nothing — allows dirty reads) |
| Read Committed | dirty reads (**Postgres default**) |
| Repeatable Read | + non-repeatable reads |
| Serializable | + phantoms + write skew (behaves as if transactions ran one at a time) |

**PROBE: Repeatable Read vs Serializable — give an anomaly each prevents but the other doesn't.**
> Standard **Repeatable Read** prevents non-repeatable reads but still allows **phantoms** and **write skew**. **Serializable** prevents those too. (A wrinkle worth knowing and stating: PostgreSQL's Repeatable Read is implemented as **snapshot isolation**, which actually *does* prevent phantoms — but it still permits **write skew**. PostgreSQL's Serializable uses **Serializable Snapshot Isolation (SSI)**, which detects and aborts the dangerous read-write dependency cycles that cause write skew.) The canonical **write skew** example: two on-call doctors each run "is at least one *other* doctor on call? yes → I can go off-call," both read the same snapshot showing the other on call, and both go off-call — leaving zero coverage, violating the invariant. Only Serializable catches this.

## 3.4 MVCC (Multi-Version Concurrency Control)
**PROBE: How does Postgres let readers not block writers (and vice versa)?**
> **MVCC.** Instead of overwriting a row, an update creates a **new version** of the row, tagged with transaction IDs (`xmin` = creating txn, `xmax` = deleting/superseding txn). Each transaction sees a **snapshot**: the set of row versions visible as of its start (or statement, depending on level). So **readers see a consistent snapshot without taking read locks**, and writers create new versions without blocking those readers. The cost is **bloat** — dead/old row versions accumulate and must be reclaimed by **VACUUM** (and the visibility map / autovacuum manage this). This is exactly why your `dr_transaction` purging and retention work matters operationally: dead tuples and table bloat directly hurt performance and disk usage if not vacuumed/purged.

## 3.5 Concurrency control
- **Pessimistic** (locking): assume conflict, lock rows/tables (e.g. `SELECT ... FOR UPDATE`). **Two-phase locking (2PL)** — acquire all locks (growing phase), then release (shrinking phase) — guarantees serializability but risks deadlock.
- **Optimistic** (versioning): assume no conflict, proceed, then **check a version/timestamp at commit**; if it changed, abort and retry. Better under low contention; wasteful under high contention.

## 3.6 Query execution & tuning (your 45s→sub-second story, explained)
The **cost-based planner** estimates the cheapest plan using table statistics. Scan types: **sequential scan** (read the whole table — best when returning a large fraction), **index scan** (walk the B-tree — best for selective filters), **bitmap heap scan** (build a bitmap of matching pages from an index, then fetch — for medium selectivity). Join strategies: **nested loop** (small or indexed inner), **hash join** (build a hash table on one side — for large unsorted equality joins), **merge join** (both inputs sorted — for sorted/range joins).

**PROBE: A query suddenly takes 45 seconds. Walk me through diagnosing it.**
> Run **`EXPLAIN ANALYZE`** and compare **estimated vs actual rows** — a big gap means the planner's statistics are stale, so I'd `ANALYZE` (refresh stats) or check autovacuum. Look for a **sequential scan** where an index scan should apply (missing/unusable index, or a function/implicit-cast on the column defeating the index, or low selectivity making the planner choose seq scan). Check whether **partition pruning** is happening — if the query can't be pruned to the relevant partitions it scans all of them (this was central to your work: a query that should touch one monthly partition scanning 120 of them). Check for a bad **join order/strategy** (a nested loop over a huge set), **lock waits** (`pg_stat_activity`), **I/O vs CPU** bound, and whether the result set ballooned. The fix is usually one of: add/repair an index, make the predicate sargable, ensure partition pruning fires, refresh statistics, or rewrite the query to let the planner prune — which is precisely how a 45-second report collapses to sub-second.

## 3.7 SQL vs NoSQL & the outbox problem
(See Part 2 §2.5 for the data-model families and partitioning.) The senior point to internalize: **you cannot atomically write to your database and publish to a message broker** (two systems, no shared transaction) — the **dual-write problem**. The fix is the **transactional outbox**: write the event into an `outbox` table inside the *same* DB transaction as the state change; a separate relay (polling the table, or **CDC** reading the WAL via Debezium) publishes it to the broker. The event fires **iff** the transaction committed. This ties directly to your RabbitMQ pipelines.

---

# 4. Distributed Systems (the senior/staff differentiator)

## 4.1 Why distributed systems are hard
The **fallacies of distributed computing**: the network is *not* reliable, latency is *not* zero, bandwidth is *not* infinite, the topology *changes*, there's *no* single clock. The defining difficulty is **partial failure** — in one process, code either runs or the process dies; in a distributed system, a node can be up while the *network* to it is down, and you often **can't tell the difference** between a slow node, a dead node, and a partitioned network. And there's **no global clock**, so "what happened first" is genuinely ambiguous across nodes.

## 4.2 CAP & PACELC (state these precisely)
**CAP:** during a **network partition**, a distributed store must choose between **Consistency** (refuse or delay to avoid returning stale data) and **Availability** (keep serving, possibly stale). It is *only* a forced choice **during a partition** — a common shallow mistake is treating it as "pick 2 of 3 always."
**PACELC** completes the picture: **if Partitioned, choose A or C; Else (normal operation), choose between Latency and Consistency.** Even with no partition, stronger consistency (more coordination) costs latency. Saying PACELC unprompted signals depth.

## 4.3 The consistency spectrum
**Linearizable/strong** (every read sees the latest write, as if one copy — requires coordination, expensive) → **sequential** → **causal** (causally-related operations are seen in order everywhere; concurrent ones may differ) → **read-your-writes** (you always see your own updates) → **eventual** (replicas converge *eventually* if writes stop). **Design rule:** choose the **weakest** model the use case tolerates. A bank balance needs strong; a follower count, a like, a view count tolerates eventual — and that choice buys you availability and latency.

## 4.4 Consensus — Raft
**PROBE: How does Raft elect a leader and replicate a log?**
> Nodes are in one of three states: **follower**, **candidate**, **leader**, and time is divided into numbered **terms**. **Election:** each follower has a **randomized election timeout**; if it goes that long without hearing a heartbeat from a leader, it becomes a **candidate**, increments the term, votes for itself, and sends **RequestVote** RPCs. Each node grants **at most one vote per term** (to the first valid candidate whose log is at least as up-to-date as its own). A candidate that gets votes from a **majority** becomes leader and starts sending heartbeats. Randomized timeouts make simultaneous candidacies (split votes) rare, and any split simply resolves in the next term. **Log replication:** clients send commands to the leader, which appends to its log and sends **AppendEntries** RPCs to followers; once a **majority** have replicated an entry, the leader marks it **committed**, applies it to its state machine, and informs followers. Safety comes from the majority-overlap (any two majorities share a node) and the up-to-date-log voting rule, guaranteeing a new leader has all committed entries. Systems like **etcd** (and thus Kubernetes' control plane) and Consul run on Raft.

## 4.5 Replication & quorums
**Synchronous** replication (wait for replicas to ack) = no data loss on failover but higher latency and an availability risk if a replica is down; **asynchronous** = fast but can lose the last few writes if the leader dies before replicas catch up (**replication lag**, which also causes stale reads on followers and read-your-writes violations). **Quorum:** with N replicas, requiring write quorum W and read quorum R such that **W + R > N** guarantees a read set overlaps the latest write set — so a read sees the newest value. Tuning W/R trades consistency against latency/availability (e.g. W=N, R=1 favors reads; W=1, R=N favors writes).

## 4.6 Partitioning & consistent hashing
To split data across nodes, **consistent hashing** maps both keys and nodes onto a hash ring; a key belongs to the next node clockwise. Adding/removing a node only remaps the keys between it and its neighbor — **~1/N of keys move**, not everything (as naive `hash % N` would). **Virtual nodes** (each physical node owns many points on the ring) smooth out load imbalance and make rebalancing even. This underlies Dynamo/Cassandra and the distributed-cache design in Part 2.

## 4.7 Ordering without a clock: Lamport & vector clocks
**Lamport timestamps** give a logical counter that produces a *total order consistent with causality* (if A causally precedes B, A's timestamp < B's) — but equal/Lamport-ordered events might actually be concurrent; it can't *detect* concurrency. **Vector clocks** (a counter per node) can: comparing two vector clocks tells you whether one happened-before the other or they're **concurrent** (a conflict). Used to detect conflicting writes in leaderless replication, then resolved by last-write-wins, app logic, or **CRDTs** (data types that merge concurrent updates deterministically — e.g. a grow-only counter).

## 4.8 Idempotency & the exactly-once myth
**PROBE: Why can't you have exactly-once delivery?**
> Because the network can't distinguish a **lost message** from a **lost acknowledgment**. If a sender doesn't get an ack, it must either retry (risking a **duplicate** if the original actually arrived) or not (risking **loss**). So end-to-end you get **at-most-once** (may lose) or **at-least-once** (may duplicate) — true exactly-once *delivery* is impossible in the general asynchronous model. What people *call* "exactly-once" is **at-least-once delivery + idempotent processing**: the consumer deduplicates (by message ID / idempotency key / a processed-IDs table) so duplicates have no effect, yielding **effectively-once** semantics. Always design consumers to be idempotent and never assume the broker gives you real exactly-once.

## 4.9 Distributed transactions: 2PC, sagas, outbox
**Two-phase commit (2PC):** a coordinator asks all participants to **prepare** (vote), then **commit** if all voted yes. It gives atomicity across systems but is **blocking** (if the coordinator dies after prepare, participants are stuck holding locks) and hurts availability — so it's avoided at scale. **Sagas** replace one distributed transaction with a **sequence of local transactions**, each with a **compensating action** to undo on failure (book flight → book hotel → if hotel fails, cancel flight). Eventual consistency, no global lock. **Outbox/CDC** (from §3.7) solves the specific DB-plus-broker dual-write atomically. The senior instinct: **design to avoid distributed transactions**; reach for sagas/outbox/idempotency instead.

## 4.10 Failure detection
Nodes detect each other's liveness via **heartbeats** (periodic "I'm alive") with timeouts, or **gossip** protocols (nodes randomly exchange membership/health info, scaling to large clusters without a central monitor — used by Cassandra/Dynamo). The hard truth (from §4.1): a timeout can't distinguish *dead* from *slow/partitioned*, so failure detection is always a probabilistic judgment, and acting on a false positive (declaring a live node dead) can cause split-brain — which is why you need consensus/quorums for decisions like leader election.

---

# 5. .NET / CLR Runtime Depth (own your own stack)

A principal engineer assumes you know your runtime cold. This is where a .NET candidate either sounds senior or gets exposed.

## 5.1 Memory: stack, heap, value vs reference
**Value types** (`struct`, `int`, `bool`) hold their data inline — on the **stack** if local, or **inline within** their containing object on the heap. **Reference types** (`class`) live on the **heap**; the variable holds a **reference** (pointer). Assigning a value type **copies** it; assigning a reference type copies the reference (both point to the same object).

**Boxing** wraps a value type in a heap object to treat it as `object`/an interface — it **allocates and copies**, and **unboxing** copies back. In hot paths (e.g. a value type going through a non-generic collection or `object` API) boxing causes hidden GC pressure. **struct vs class:** prefer a `struct` for small, immutable, short-lived data to avoid heap allocation (e.g. coordinates, `DateTime`); prefer a `class` for larger or identity-bearing objects. **`Span<T>`** is a stack-only `ref struct` that gives a typed, bounds-checked **window over contiguous memory** (an array, `stackalloc` buffer, or native memory) with **zero allocation and zero copy** — ideal for slicing/parsing in hot paths; **`Memory<T>`** is the heap-storable cousin usable across `await` (a `ref struct` can't live on the heap or cross awaits). **`stackalloc`** allocates a buffer on the stack (no GC) for short-lived scratch space.

## 5.2 Garbage collection
**PROBE: Walk me through a gen-2 GC.**
> .NET's GC is **generational** and **mark-sweep-compact**. Objects start in **gen 0** (small, cheap, collected very frequently); survivors are promoted to **gen 1** (a buffer), then **gen 2** (long-lived). The generational hypothesis — most objects die young — means most collections are cheap gen-0s. A **gen-2 (full) collection** scans the **entire** managed heap: it **marks** all objects reachable from the **roots** (stack references, statics, GC handles), **sweeps** the unreachable, and **compacts** survivors (moving them together to defragment, then fixing up all references) — this is the expensive part and the source of noticeable **pauses**. Large objects (≥ **85 KB**) live on the **Large Object Heap**, which is collected *with* gen 2 and, by default, **not compacted** (to avoid copying big blocks), so it can fragment. Gen-2 collections are triggered by exceeding the gen-2 allocation budget, LOH allocations, memory pressure, or an induced `GC.Collect()`. **Workstation GC** (default for client apps) favors low latency on one heap; **Server GC** (default for ASP.NET Core on servers) uses **one heap and GC thread per core** for higher throughput. **Background/concurrent GC** does most gen-2 marking concurrently with your threads to shrink pauses. The takeaway for performance: minimize allocations (especially LOH and boxing), reuse buffers (`ArrayPool<T>`, `Span<T>`), and avoid promoting short-lived objects.

**`IDisposable` and finalizers:** `IDisposable.Dispose()` deterministically releases **unmanaged** resources (file handles, sockets, DB connections) — call it via `using`. A **finalizer** (`~Type()`) is a non-deterministic safety net the GC runs before reclaiming an object with unmanaged resources, but finalizable objects **survive an extra GC cycle** (they go on a finalization queue, get promoted, and are collected later) — so finalizers hurt GC performance and are a **last resort**. The pattern: implement `Dispose`, suppress finalization (`GC.SuppressFinalize`) when disposed, keep a finalizer only as a backstop.

## 5.3 async/await internals
**PROBE: What actually happens when you `await`?**
> The C# compiler rewrites an `async` method into a **state machine** (a struct implementing `IAsyncStateMachine`). At an `await` on an incomplete `Task`, the method **doesn't block** — it registers a **continuation** (the rest of the method, captured as the next state) with the awaited task and **returns** to the caller, freeing the thread. When the awaited operation completes, the continuation is scheduled to run — by default **back on the captured `SynchronizationContext`** (in UI/classic-ASP.NET) or on the **thread pool** (ASP.NET Core has no SyncContext). For I/O, no thread is consumed during the wait (it's an OS completion callback), which is why async scales I/O-bound work. **`Task` vs `ValueTask`:** `Task` is a heap object; `ValueTask` is a struct that avoids the allocation when the result is frequently available **synchronously** (cached values, hot paths) — but it has rules (await it **once**, don't block on it, don't await concurrently), so use `Task` by default and `ValueTask` for measured hot paths.

**PROBE: Why did calling `.Result` (or `.Wait()`) deadlock?**
> In an environment with a **single-threaded SynchronizationContext** (a UI thread, or classic ASP.NET request context), you call an async method and then **block** the context thread on `.Result`. Inside, the method `await`s and, by default, captures the context so its **continuation must resume on that same context thread**. But that thread is **blocked** waiting on `.Result` — which can't complete until the continuation runs, which can't run until the thread is free. **Circular wait → deadlock.** Fixes: **don't block on async** (await all the way up — "async all the way"); or, in library code, use **`ConfigureAwait(false)`** so the continuation resumes on the **thread pool** instead of the captured context, breaking the cycle. ASP.NET **Core** removed the SynchronizationContext, so this specific deadlock is rare there — but **sync-over-async still causes thread-pool starvation**.

**Thread-pool starvation:** blocking pool threads (sync-over-async, or `Task.Run` wrapping blocking I/O) consumes the limited pool; the pool **injects new threads slowly** (roughly one per ~0.5–1 s once past the minimum), so a burst of blocked threads causes latency cliffs, timeouts, and apparent deadlocks. The cure is true async I/O end to end.

## 5.4 Threading primitives in .NET
- **`lock` (Monitor):** mutual exclusion with ownership — the everyday critical-section guard.
- **`Interlocked`:** atomic ops (`Increment`, `CompareExchange`) without a lock — lock-free counters.
- **`SemaphoreSlim`:** limit N concurrent (or `(1,1)` to serialize, **async-friendly** — your cache-stampede fix used this to ensure one repopulation while others await).
- **`ConcurrentDictionary` / concurrent collections:** internally lock-striped/lock-free for safe, low-contention concurrent access.
- **`Channel<T>`:** an async producer/consumer queue with backpressure — the idiomatic in-process pipeline primitive (a clean alternative to hand-rolled `BlockingCollection`).

## 5.5 ASP.NET Core pipeline & DI (own this — it's your daily surface)
**Middleware** is a pipeline of delegates, each receiving the `HttpContext` and a `next` — it can do work, call `next()`, and do more on the way back (a **Russian-doll** model where the request flows in and the response flows out). Your `IExceptionHandler` / exception-handling middleware sits early so it can wrap everything downstream — conceptually a **Chain of Responsibility**.

**DI lifetimes:** **Singleton** (one instance for the app), **Scoped** (one per request/scope), **Transient** (a new instance per resolution).

**PROBE: What breaks if you inject a Scoped service into a Singleton?**
> The **captive dependency** problem. The singleton is constructed once and **holds its dependencies for the app's lifetime**, so a scoped service injected into it is effectively **promoted to singleton** — it never gets a fresh per-request instance. That's a bug when the scoped service carries per-request state or isn't thread-safe: the classic case is injecting a **`DbContext`** (scoped, not thread-safe, tracks entities) into a singleton — you get a single shared context used concurrently across requests, causing race conditions, stale tracked entities, and connection-lifetime issues. .NET's DI container **validates against this** at startup (scope validation in Development) and throws. The correct pattern is to inject **`IServiceScopeFactory`** (or `IServiceProvider`) into the singleton and **create a scope per unit of work** to resolve the scoped dependency freshly. Background services (`BackgroundService`, themselves singletons) hit this constantly — they must create a scope per iteration to use scoped services like a `DbContext`.

---

**Part 3 complete.** You now have the peer-level depth track with the answers written out — cover them and quiz yourself; the bar is answering each probe cold, out loud. Next on the roadmap: **Part 4 — LLD/OOD** (SOLID with violation-spotting, the patterns that actually appear with code, and worked designs like parking lot / LRU / rate limiter), then **Part 5 — Behavioral** (the framework plus your story bank pre-drafted from your real work). Say *continue* for Part 4.
