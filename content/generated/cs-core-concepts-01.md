# CS Core Subjects (fresher level)

> AI-added — verify. The "explain it" layer that campus and service-company interviews
> drill: OOP as a subject, plus DBMS / OS / Networking quick-reference Q&A. Terse and
> definitional. The CS Fundamentals and SQL tracks go deeper — these are the textbook
> answers you must be able to give cold.

@track id=cs-core | title=CS Core Subjects | kind=fundamentals | order=-2 | blurb=The fresher gate — OOP fundamentals (the four pillars and the classic confusions) plus DBMS, OS, and Networking quick-reference Q&A, at the define-and-explain level interviews expect.

@topic id=cs-core-oop | track=cs-core | title=OOP fundamentals

### concept: The four pillars of OOP
**Encapsulation** — bundle data and the methods that operate on it into one unit (a class), and hide the internal state behind a controlled interface (private fields, public methods) so it can't be put into an invalid state. **Abstraction** — expose *what* an object does and hide *how* (model only the relevant details; e.g. you call `car.Drive()` without knowing the engine internals). **Inheritance** — a class derives from another, reusing and extending its behavior ("is-a"). **Polymorphism** — one interface, many implementations: the same call (`shape.Area()`) behaves correctly for each concrete type.

#### probe: What are the four pillars of OOP?
Encapsulation (bundle data + behavior, hide internal state behind an interface), Abstraction (expose what, hide how), Inheritance (reuse/extend via an "is-a" relationship), and Polymorphism (one interface, many forms — the right implementation runs based on the actual object type). A strong answer gives a one-line example of each and notes that the *judgment* skill on top is knowing when to favor **composition over inheritance** — deep inheritance hierarchies are fragile.

### concept: Abstraction vs Encapsulation (the classic confusion)
They're related but distinct. **Abstraction** is about **design** — deciding *what* to expose and hiding complexity behind a simple interface (an `abstract class` or `interface` showing only essential operations). **Encapsulation** is about **implementation** — *how* you protect an object's state, by making fields private and exposing controlled accessors so invariants hold. Put differently: abstraction hides **complexity**; encapsulation hides **data**. Abstraction is solved at the interface/design level; encapsulation at the access-modifier level.

#### probe: What's the difference between abstraction and encapsulation?
Abstraction hides *complexity* — it's a design-level decision about which essential operations to expose and which details to omit (interfaces, abstract classes). Encapsulation hides *data* — it's an implementation-level mechanism that wraps state and behavior together and restricts direct access (private fields + public methods) to keep the object valid. They often appear together: an interface gives abstraction, private fields behind it give encapsulation. The trap is treating them as synonyms; name the "complexity vs data" / "design vs implementation" distinction.

### concept: Overloading vs overriding (compile-time vs runtime polymorphism)
**Overloading** = same method name, **different parameters**, in the same class — resolved by the compiler at **compile time** based on the argument types (a.k.a. *static* / compile-time polymorphism). **Overriding** = a subclass provides a **new implementation** of a `virtual` method from its base with the **same signature** — resolved at **runtime** based on the actual object type (a.k.a. *dynamic* / runtime polymorphism). Overloading is convenience; overriding is the mechanism behind real polymorphism.

#### probe: Overloading vs overriding — explain with the polymorphism type.
Overloading is **compile-time (static) polymorphism**: multiple methods share a name but differ in parameter list, and the compiler picks the match from the call's arguments — no inheritance needed. Overriding is **runtime (dynamic) polymorphism**: a subclass redefines a `virtual`/`abstract` base method with the identical signature, and the runtime dispatches to the subclass version based on the object's actual type (via the vtable). So overloading is resolved by *signature at compile time*; overriding by *object type at run time*.

### concept: Interface vs abstract class
An **interface** is a pure contract — method/property signatures with no state (and, in modern C#/Java, optional default methods); a class can implement **many** interfaces. An **abstract class** can have **state (fields), constructors, and partial implementation** (some concrete, some abstract methods), but a class can extend only **one**. Rule of thumb: use an **interface** for a capability that unrelated types can share ("can be compared", "can be disposed"); use an **abstract class** when related types share common state/behavior and you want to provide a partial base implementation.

#### probe: When would you use an interface vs an abstract class?
Use an **interface** when you're defining a *capability* that otherwise-unrelated classes can implement, when you need **multiple inheritance** of type, or when you only need a contract with no shared code. Use an **abstract class** when several **related** types share common **state or implementation** and you want to provide that base plus a few `abstract` holes for subclasses to fill, or when you need constructors/fields/access modifiers. Short version: interface = "what it can do" across unrelated types (many allowed); abstract class = "what it is" with shared code (one allowed).

### concept: Association, aggregation, composition (the "has-a" spectrum)
All three are "has-a" relationships of increasing strength. **Association** — objects simply use/know each other, independent lifetimes (a `Teacher` and a `Student`). **Aggregation** — a whole "has" parts, but parts can **outlive** the whole and be shared (a `Team` has `Player`s; players exist without the team). **Composition** — the strongest: parts are **owned** by the whole and die with it (a `House` has `Room`s; destroy the house and the rooms cease to exist). The distinction is **ownership and lifetime**, and it guides whether you share references or own/dispose the parts.

#### probe: Difference between aggregation and composition?
Both are "has-a", but they differ in **ownership and lifetime**. **Aggregation** is a weak ownership where the part can exist independently and may be shared — a `Department` aggregates `Professor`s, but a professor survives the department's deletion. **Composition** is strong ownership where the part's lifetime is bound to the whole — a `House` is composed of `Room`s; destroy the house and its rooms go with it, and they aren't shared elsewhere. In code, composition usually means the whole *creates and owns* (and disposes) the parts, while aggregation receives references to parts created elsewhere.

### exercise: [E] Shapes — abstraction + polymorphism
Design a small class hierarchy so that code can compute the area of any shape uniformly (`Circle`, `Rectangle`), and adding a new shape requires no changes to existing code. Write the C# and name the OOP principles used.
#### solution:
```csharp
public abstract class Shape {           // abstraction: the essential operation only
    public abstract double Area();      // each shape MUST define how
}
public class Circle : Shape {
    public double R { get; init; }
    public override double Area() => Math.PI * R * R;   // overriding (runtime polymorphism)
}
public class Rectangle : Shape {
    public double W { get; init; }
    public double H { get; init; }
    public override double Area() => W * H;
}

// Caller is polymorphic — works for any Shape, including ones added later:
double TotalArea(IEnumerable<Shape> shapes) => shapes.Sum(s => s.Area());
```
**Principles:** **Abstraction** (`Shape` exposes only `Area()`), **Inheritance** (`Circle`/`Rectangle` are-a `Shape`), **Polymorphism** (the caller calls `Area()` without knowing the concrete type; the right override runs). This also satisfies **Open/Closed** — a new `Triangle : Shape` plugs in with zero edits to `TotalArea`. Contrast with a `switch` on a shape-type enum, which you'd have to edit for every new shape.

@topic id=cs-core-dbms | track=cs-core | title=DBMS quick reference

### concept: Normalization (1NF → BCNF)
Normalization organizes columns/tables to reduce **redundancy** and **update anomalies**. **1NF**: every column atomic, no repeating groups. **2NF**: 1NF + no **partial** dependency (no non-key column depends on only *part* of a composite key). **3NF**: 2NF + no **transitive** dependency (non-key columns depend on the key, not on other non-key columns). **BCNF**: a stricter 3NF where every determinant is a candidate key. You normalize for integrity; you **denormalize** deliberately for read performance once measured. (Hands-on practice in the **SQL & Data Modeling** track.)

#### probe: Explain 1NF, 2NF, 3NF with the anomaly each removes.
**1NF** removes repeating groups/multi-valued columns — every cell holds one atomic value. **2NF** removes **partial dependencies** — relevant only with a composite key; every non-key attribute must depend on the *whole* key (else split it out), eliminating redundancy tied to part of the key. **3NF** removes **transitive dependencies** — a non-key attribute must not depend on another non-key attribute (e.g. `zip → city` stored on an orders table; move it out), eliminating update anomalies where changing one fact forces many row updates. Each level builds on the last.

### concept: ACID properties
The guarantees a transaction provides. **Atomicity** — all-or-nothing; either every operation commits or none do (rollback on failure). **Consistency** — a transaction moves the DB from one valid state to another, preserving all constraints/invariants. **Isolation** — concurrent transactions don't corrupt each other; the result is as if they ran in some serial order (tunable via isolation levels). **Durability** — once committed, data survives crashes (via the write-ahead log). The WAL underpins both atomicity (undo) and durability (redo).

#### probe: What does ACID stand for, and which property handles concurrency?
Atomicity (all-or-nothing), Consistency (constraints/invariants always hold), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes). **Isolation** is the concurrency one — and it's a spectrum: Read Uncommitted → Read Committed → Repeatable Read → Serializable, each preventing more anomalies (dirty read, non-repeatable read, phantom, write skew). Higher isolation = more correctness but more locking/coordination cost. (Depth in CS Fundamentals → Databases.)

### concept: Keys and SQL joins
**Keys:** a **super key** uniquely identifies a row; a **candidate key** is a minimal super key; the **primary key** is the chosen candidate (unique + not null); a **foreign key** references another table's primary key (enforces referential integrity); a **composite key** spans multiple columns. **Joins:** **INNER** (rows matching in both), **LEFT/RIGHT OUTER** (all rows of one side + matches, NULLs where none), **FULL OUTER** (all rows of both), **CROSS** (Cartesian product), **SELF** (a table joined to itself, e.g. employee→manager).

#### probe: Difference between an INNER JOIN and a LEFT JOIN?
An **INNER JOIN** returns only rows that have a match on **both** sides — unmatched rows from either table are dropped. A **LEFT (OUTER) JOIN** returns **all** rows from the left table, plus matching right-table columns where they exist and **NULLs** where they don't — so it preserves left rows that have no match. The classic use of LEFT JOIN is the **anti-join**: `LEFT JOIN ... WHERE right.id IS NULL` to find left rows with *no* related right rows (e.g. customers with no orders).

### concept: Indexing — clustered vs non-clustered
An **index** is a sorted structure (usually a **B-tree**) that lets the DB find rows without scanning the whole table — turning O(n) lookups into O(log n). A **clustered index** *is* the table's physical row order (one per table; the primary key by default in many DBs), so range scans on it are very fast. A **non-clustered index** is a separate structure holding the key + a pointer back to the row (you can have many). Indexes speed reads but **slow writes** and cost storage — index the columns you filter/join/sort on, not everything.

#### probe: When would you NOT add an index?
On **write-heavy** tables where index maintenance costs more than the read benefit; on **low-cardinality** columns (a boolean/gender column — the index doesn't narrow enough, the planner scans anyway); on **small** tables (a full scan is cheaper than index overhead); on columns **rarely used** in WHERE/JOIN/ORDER BY; and when the column is already covered by an existing composite index's leftmost prefix. Every index also slows INSERT/UPDATE/DELETE and consumes space — they're added to serve specific, measured query patterns, not by default.

@topic id=cs-core-os | track=cs-core | title=Operating Systems quick reference

### concept: Process vs thread
A **process** is a running program with its **own** address space (memory), file handles, and resources — isolated from other processes (a crash in one doesn't corrupt another); they communicate via heavier **IPC** (pipes, sockets, shared memory). A **thread** is a unit of execution **within** a process; threads of the same process **share** the address space (heap, globals) but each has its **own stack and registers**. Threads are cheaper to create and communicate (shared memory) but must **synchronize** to avoid races. (Depth in CS Fundamentals → OS.)

#### probe: What's shared between threads of the same process, and what isn't?
**Shared:** the address space — heap, global/static variables, code, and open file descriptors. **Not shared (per-thread):** the stack, registers, and program counter. That's why threads can communicate just by reading/writing shared memory (cheap) but must use locks/atomics to avoid **race conditions** on that shared state, whereas processes are isolated and need explicit IPC. It's also why a thread crash can take down the whole process (shared memory) while a process crash is contained.

### concept: Deadlock and the four Coffman conditions
A **deadlock** is a cycle of threads each holding a resource and waiting for one another, so none proceeds. It requires **all four** Coffman conditions simultaneously: **mutual exclusion** (a resource is non-shareable), **hold and wait** (a thread holds one resource while waiting for another), **no preemption** (resources can't be forcibly taken), and **circular wait** (a cycle of waiting threads). Break **any one** to prevent it — the most practical being a **global lock ordering** (always acquire locks in the same order) to kill circular wait.

#### probe: How do you prevent deadlock?
Break one of the four Coffman conditions. The most practical is eliminating **circular wait** by imposing a **global lock-acquisition order** — every thread takes locks in the same defined sequence, so no cycle can form. Others: avoid **hold-and-wait** (acquire all needed locks at once, or none), allow **preemption** via try-lock with timeout and back off, or reduce **mutual exclusion** with lock-free/immutable structures. In practice: keep critical sections small, order your locks, and use timeouts.

### concept: CPU scheduling basics
The scheduler picks which ready process/thread runs next. **FCFS** (first-come-first-served) — simple, but a long job blocks short ones (convoy effect). **SJF** (shortest job first) — optimal average wait, but needs to know burst times and can starve long jobs. **Round Robin** — each gets a fixed time slice; fair and responsive, good for time-sharing; slice size trades context-switch overhead vs responsiveness. **Priority** — highest priority first; risks **starvation**, fixed by **aging** (slowly raising a waiting job's priority). **Preemptive** scheduling can interrupt a running job; non-preemptive runs it to completion/block.

#### probe: Round Robin vs FCFS — when does RR help?
**FCFS** runs jobs to completion in arrival order, so a single long job makes everyone behind it wait (poor responsiveness, the convoy effect). **Round Robin** gives each job a fixed **time quantum** then preempts to the next, cycling around — so short interactive jobs get served quickly even when long jobs are present, which is exactly what a time-sharing/interactive system needs. The cost is **context-switch overhead**: too small a quantum spends all the time switching; too large and RR degrades toward FCFS.

### concept: Virtual memory and paging
**Virtual memory** gives each process a private, contiguous **virtual address space**, larger than physical RAM; the **MMU** translates virtual→physical addresses via **page tables** in fixed-size **pages** (~4 KB). Unused pages live on disk (swap) and are loaded on demand. A **page fault** occurs when an accessed page isn't in RAM — the OS loads it from disk (slow) and updates the page table. The **TLB** caches recent translations to avoid walking the page table each access. This gives isolation and the illusion of more memory than physically exists.

#### probe: What is a page fault?
When a process accesses a virtual page that isn't currently in physical memory, the MMU raises a **page fault** — a trap to the OS. The handler checks the access is legal, finds a free physical frame (evicting another page via the replacement policy if memory is full, writing it to disk first if dirty), reads the needed page from disk/swap into the frame, updates the page table and TLB, and restarts the instruction. A **minor** fault is satisfied from RAM (cheap); a **major** fault needs a disk read (slow). Excessive major faults = **thrashing**. (Depth in CS Fundamentals → OS.)

@topic id=cs-core-cn | track=cs-core | title=Networking quick reference

### concept: OSI and TCP/IP models
The **OSI** model has 7 layers — Physical, Data Link, Network, Transport, Session, Presentation, Application — a teaching reference. The practical **TCP/IP** model collapses these into 4–5: **Link** (Ethernet/Wi-Fi), **Internet/Network** (IP — routes packets between hosts), **Transport** (TCP/UDP — delivers to the right process via ports), **Application** (HTTP, DNS, etc.). What matters in interviews is understanding **L3 (IP, addressing/routing)**, **L4 (TCP/UDP, ports, reliability)**, and **L7 (application protocols)** — and that load balancers operate at L4 (fast, opaque) or L7 (content-aware).

#### probe: Which OSI layer does IP operate at, and which does TCP?
**IP** is the **Network layer (L3)** — it addresses and routes packets between hosts across networks. **TCP** (and UDP) is the **Transport layer (L4)** — it delivers data to the correct *process* on a host via port numbers, and TCP adds reliability/ordering on top of IP's best-effort delivery. A handy mental model: L3 gets a packet to the right *machine*; L4 gets it to the right *application*; L7 is the application protocol (HTTP) itself.

### concept: TCP vs UDP
**TCP** is connection-oriented and reliable: a **3-way handshake** (SYN → SYN-ACK → ACK) sets up the connection; data arrives **in order, without loss or duplication** via sequence numbers, acknowledgements, and retransmission; it has flow control and congestion control. **UDP** is connectionless and unreliable: no handshake, no ordering, no retransmission — just fire datagrams, with lower latency and overhead. Use TCP when correctness matters (web, APIs, file transfer); use UDP when speed beats reliability (live video/voice, gaming, DNS).

#### probe: When would you choose UDP over TCP?
When low latency matters more than guaranteed delivery and the application can tolerate (or handle) loss: **live video/voice** (a dropped frame is better than a stall while TCP retransmits), **online gaming** (stale position data is useless — send the next update instead), **DNS** (a tiny single-round-trip request, retried at the app level if needed), and broadcast/multicast. TCP's handshake, ordering, and retransmission add latency and overhead that these workloads don't want. (HTTP/3 even rebuilds reliability on top of UDP to escape TCP's head-of-line blocking.)

### concept: What happens when you type a URL and press Enter
(1) **DNS resolution** — browser/OS cache, then a resolver queries root → TLD → authoritative nameserver to get the IP (cached per TTL). (2) **TCP connection** — a 3-way handshake to that IP on port 443. (3) **TLS handshake** — for HTTPS, negotiate a cipher, validate the server's certificate up a CA chain, and agree a symmetric session key. (4) **HTTP request** — the browser sends `GET /`, possibly via a CDN/load balancer. (5) **Server processing** — app logic, DB/cache. (6) **Response & render** — parse HTML, build the DOM, fetch CSS/JS/images, run JS, paint. (Full depth in CS Fundamentals → Networking.)

#### probe: Walk through what happens after you hit Enter on a URL.
DNS resolves the hostname to an IP (checking caches, else recursing root → TLD → authoritative). The browser opens a **TCP** connection (3-way handshake) to that IP on port 443, then runs the **TLS** handshake (cert validation + symmetric key agreement). It sends the **HTTP** request, which may traverse a CDN/edge and a load balancer to an app server; the server runs its logic (DB/cache calls) and returns HTML. The browser **parses** it, builds the DOM, fetches subresources (often over multiplexed HTTP/2 from a CDN), executes JS, and **paints**. A strong answer names the DNS cache layers, the TCP+TLS handshakes, and the render pipeline — and can go deeper on any step.

### concept: HTTP methods and status codes
**Methods:** GET (read, safe + idempotent), POST (create, **not** idempotent — why retried payments need an idempotency key), PUT (replace, idempotent), PATCH (partial update), DELETE (idempotent). **Status codes that signal understanding:** 200 OK, 201 Created, 204 No Content, 301/302 (redirect), 304 Not Modified (caching), 400 Bad Request, 401 Unauthorized (not authenticated) vs 403 Forbidden (authenticated, not allowed), 404 Not Found, 409 Conflict, 429 Too Many Requests (rate limited), 500 Internal Server Error, 502/503/504 (gateway/unavailable/timeout).

#### probe: Difference between 401 and 403? And which methods are idempotent?
**401 Unauthorized** means "I don't know who you are" — authentication is missing or invalid (log in). **403 Forbidden** means "I know who you are, but you're not allowed" — authenticated but lacking permission. **Idempotent** methods produce the same result however many times you repeat them: **GET, PUT, DELETE, HEAD** (and safe ones). **POST is not idempotent** — repeating it can create duplicates, which is why retrying a failed payment POST requires an **idempotency key** to dedupe.
