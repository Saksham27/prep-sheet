# Tech Deep-Dives — .NET/C# · JavaScript/TypeScript

> AI-added — verify. Continues the Tech Deep-Dives track (the @track is declared in
> tech-concepts-01.md).

@topic id=tech-dotnet | track=tech | title=.NET / C#

### concept: Value vs reference types, struct vs class
**Value types** (`struct`, `int`, `DateTime`) hold their data inline — on the stack if local, or embedded in the containing object — and **copy on assignment**. **Reference types** (`class`) live on the heap; the variable holds a pointer, and assignment copies the reference. **Boxing** wraps a value type in a heap object to treat it as `object`/an interface — it allocates and copies, a hidden source of GC pressure in hot paths. Prefer a small, immutable `struct` for short-lived data (coordinates, a key) to avoid heap allocations; prefer a `class` for larger or identity-bearing objects.

#### probe: When would you choose a struct over a class?
For small, immutable, short-lived data where avoiding a heap allocation matters — e.g. a 2D point, a money value, a dictionary key in a hot loop. Structs avoid GC pressure and improve cache locality when packed in arrays (struct-of-arrays). But large structs are costly to copy, mutable structs are bug-prone (copies don't share state), and a struct used through an interface or non-generic collection **boxes** — so keep them small (≲16–24 bytes), immutable, and avoid boxing.

### concept: Span<T>, Memory<T>, and zero-copy
**`Span<T>`** is a stack-only `ref struct` giving a typed, bounds-checked **window over contiguous memory** — an array, a `stackalloc` buffer, or native memory — with **zero allocation and zero copy**. It's ideal for slicing and parsing in hot paths: `text.AsSpan().Slice(...)` instead of `Substring` (which allocates). Because it's stack-only it **can't live on the heap or cross an `await`**; for that there's **`Memory<T>`**, its heap-storable cousin. Together with `ArrayPool<T>` they're how high-performance .NET code avoids per-operation allocations.

#### probe: Why can't a Span<T> cross an await or live in a field?
`Span<T>` is a `ref struct`, which the runtime guarantees lives only on the **stack** — it may point at `stackalloc` memory or carry a managed pointer the GC must track precisely, neither of which is safe to park on the heap. An `await` can suspend the method and resume on another thread, which would require capturing locals into a heap state-machine object — impossible for a stack-only type. Same reason it can't be a class field or boxed. Use `Memory<T>` when the buffer must survive an await or live on the heap.

### concept: async/await is a state machine
The compiler rewrites an `async` method into a **state machine**: at an `await` on an incomplete task, it registers the rest of the method as a **continuation** and **returns**, freeing the thread — no thread is consumed during I/O waits, which is why async scales I/O-bound servers. By default the continuation resumes on the captured **SynchronizationContext** (UI/classic ASP.NET) or the thread pool (ASP.NET Core has none). Blocking on async (`.Result`/`.Wait()`) on a captured context **deadlocks**; even where it can't deadlock, sync-over-async causes **thread-pool starvation**.

#### probe: Why does `.Result` on an async method sometimes deadlock?
On a single-threaded SynchronizationContext (a UI thread, classic ASP.NET), you block that thread on `.Result`; inside, the awaited continuation is scheduled back **onto that same context thread** — which is blocked waiting for the result. Circular wait → deadlock. Fixes: await all the way up ("async all the way"), or in library code use `ConfigureAwait(false)` so the continuation resumes on the thread pool instead of the captured context. ASP.NET Core removed the context, so it's rare there — but sync-over-async still starves the thread pool.

### concept: LINQ — deferred execution and IEnumerable vs IQueryable
LINQ query operators are **deferred**: `Where`/`Select` build an expression that executes only when enumerated (`foreach`, `ToList`, `First`). Two consequences: **multiple enumeration** re-runs the whole pipeline (and re-hits the DB/IO) — materialize once with `ToList` if you'll iterate twice; and a query can capture a variable whose value changes before enumeration. **`IEnumerable<T>`** runs in memory (LINQ-to-Objects); **`IQueryable<T>`** builds an expression tree the provider (EF Core) translates to SQL — so calling a non-translatable C# method, or `.AsEnumerable()` too early, silently pulls the whole table into memory and filters client-side.

#### probe: What's the gotcha with deferred execution and IQueryable?
Deferred execution means the query hasn't run yet, so enumerating it twice executes it twice (two DB round-trips), and predicates capture variables by reference at enumeration time. With `IQueryable`, the bigger trap is **where filtering happens**: as long as you stay in `IQueryable`, EF translates `Where`/`Select` to SQL; but switching to `IEnumerable` (e.g. `.AsEnumerable().Where(x => SomeCSharpMethod(x))`) makes the rest run **client-side** — EF fetches every row, then filters in memory. So a missing index or an accidental client-eval turns a cheap query into a full-table pull.

### concept: DI lifetimes and the captive dependency
The container offers **Singleton** (one for the app), **Scoped** (one per request/scope), and **Transient** (new per resolution). The classic bug is the **captive dependency**: inject a *shorter*-lived service into a *longer*-lived one and the short one is captured for the longer's lifetime — a scoped `DbContext` injected into a singleton becomes a single shared, non-thread-safe context across all requests. .NET validates scopes at startup (Development) and throws. The fix: inject **`IServiceScopeFactory`** and create a scope per unit of work — exactly what a `BackgroundService` must do to use a `DbContext`.

#### probe: What breaks if you inject a Scoped service into a Singleton?
The scoped service is **promoted to singleton lifetime** — constructed once and held forever, never refreshed per request. For a `DbContext` (scoped, stateful, not thread-safe) that's a correctness disaster: one shared context used concurrently across requests, causing race conditions, stale tracked entities, and connection issues. The container's scope validation throws on this in Development. The correct pattern is to inject `IServiceScopeFactory` into the singleton and `CreateScope()` per operation to resolve the scoped dependency freshly.

@topic id=tech-javascript | track=tech | title=JavaScript / TypeScript

### concept: The event loop — microtasks vs macrotasks
JavaScript is single-threaded with an **event loop**. Synchronous code runs to completion on the call stack; async callbacks wait in queues. **Microtasks** (Promise `.then`/`await` continuations, `queueMicrotask`) and **macrotasks** (`setTimeout`, I/O, events) are *different* queues, and the rule is: after each macrotask (and the initial script), the engine **drains the entire microtask queue** before the next macrotask or render. So a resolved Promise's `.then` always runs **before** a `setTimeout(…, 0)` scheduled at the same time.

#### probe: What's the output order of a setTimeout vs a Promise.then?
```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```
Output: **A, D, C, B**. The synchronous `A` and `D` run first. Then the microtask queue drains — `C` (the Promise continuation) runs before any macrotask. Only after microtasks are empty does the event loop pick up the `setTimeout` macrotask, printing `B`. The takeaway: promises/`await` always resolve ahead of timers queued in the same tick.

### concept: Closures, scope, and the classic loop bug
A **closure** is a function that captures variables from its lexical scope and keeps them alive after the outer function returns. `var` is function-scoped and **hoisted**; `let`/`const` are block-scoped with a **temporal dead zone** (referencing before declaration throws). The classic bug: a `for (var i...)` loop with an async callback captures the *single* shared `i`, so all callbacks see the final value; `let` creates a **fresh binding per iteration**, fixing it.

#### probe: Why does a `var` loop with setTimeout print the wrong numbers, and how does `let` fix it?
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 3, 3, 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 0, 1, 2
```
With `var`, there's one function-scoped `i`; all three closures capture the *same* variable, and by the time the timers fire (after the loop) it's 3. With `let`, each iteration gets a **new block-scoped binding** of `i`, so each closure captures its own value — 0, 1, 2. It's the canonical demonstration of closures capturing variables (not values) plus block vs function scope.

### concept: `this` binding and arrow functions
In JS `this` is determined by **how a function is called**, not where it's defined: as a method (`obj.fn()` → `this` = `obj`), standalone (`fn()` → `undefined` in strict mode / global otherwise), with `new` (a fresh object), or explicitly via **`call`/`apply`/`bind`**. **Arrow functions** don't have their own `this` — they capture it **lexically** from the enclosing scope, which is exactly why they're used for callbacks (event handlers, `setTimeout`, array methods) where you want the surrounding `this` instead of a dynamically-rebound one.

#### probe: How is `this` determined, and why do arrow functions help in callbacks?
`this` is set at call time by the call form: method call → the receiver; plain call → undefined/global; `new` → the new instance; `call/apply/bind` → the explicit value. A normal function passed as a callback loses its intended `this` (it's called plainly), causing the classic "`this` is undefined in my handler" bug. An **arrow function** has no own `this` — it lexically inherits the surrounding `this` — so an arrow used as a callback keeps the enclosing object's `this`, which is why class methods often use arrow fields for handlers.

### concept: Promises and async/await error handling
`async` functions return a Promise; `await` pauses until it settles, and a rejected awaited promise **throws**, caught with `try/catch`. For concurrency: **`Promise.all`** runs in parallel and rejects fast on the first failure (losing the others' results); **`Promise.allSettled`** waits for all and reports each as fulfilled/rejected; **`Promise.race`** settles on the first to finish (timeouts); **`Promise.any`** resolves on the first *success*. A common bug is sequential `await`s in a loop when the calls are independent — use `Promise.all` to parallelize.

#### probe: Promise.all vs Promise.allSettled — when each?
Use **`Promise.all`** when you need *all* to succeed and want to **fail fast** — if any rejects, the whole thing rejects immediately and you don't care about partial results (e.g. load everything required to render a page). Use **`Promise.allSettled`** when you want **every** result regardless of individual failures — e.g. fan out to several services and show whichever succeeded, or run independent jobs and report which failed. `all` throws away successful siblings on the first rejection; `allSettled` never rejects and hands you per-promise status.

### concept: TypeScript — structural typing, unknown vs any, type vs interface
TypeScript is **structurally typed**: compatibility is by shape, not by name — anything with the right members fits. **`any`** opts out of checking entirely (it infects everything it touches); **`unknown`** is the safe top type — you can hold anything but must **narrow** it (typeof/instanceof/guards) before using it, so prefer `unknown` at boundaries (parsed JSON, `catch` clauses). **`interface`** vs **`type`**: interfaces are extendable/mergeable and ideal for object/class contracts; type aliases also express unions, intersections, tuples, and mapped/conditional types. Generics keep functions type-safe across types without `any`.

#### probe: `unknown` vs `any` — why prefer unknown?
`any` disables type checking — you can call anything on it and it silently spreads, defeating the type system. `unknown` is the type-safe counterpart: it accepts any value, but the compiler **forbids using it** until you narrow it to a concrete type via a guard (`typeof x === 'string'`, `instanceof`, a custom type predicate). So `unknown` forces you to prove the shape before access — exactly what you want for external/untrusted data like `JSON.parse` results or a `catch (e: unknown)`. Reach for `unknown` at the boundary and narrow inward; reserve `any` for genuine escape hatches.
