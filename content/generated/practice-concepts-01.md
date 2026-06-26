# Coding Practice — Concurrency & LLD machine-coding

> AI-added — verify. Two practice rounds the corpus didn't cover hands-on: writing
> thread-safe code, and machine-coding small systems under time. Each is an exercise:
> attempt it, then reveal the working C# solution. Status-track like DSA.

@track id=practice | title=Coding Practice (applied) | kind=lld | order=7 | blurb=The applied rounds: concurrency coding (thread-safe structures, signaling) and LLD machine-coding (working code under time), each an exercise with a hidden C# solution.

@topic id=practice-concurrency | track=practice | title=Concurrency problems | kind=problem

### exercise: [E] Thread-safe counter — and why `++` races
Implement a counter safe under many threads. Then explain in a comment why `count++` is not safe.
#### solution:
```csharp
public class Counter {
    private long _value;
    public void Increment() => Interlocked.Increment(ref _value);   // single atomic op
    public long Value => Interlocked.Read(ref _value);
}

// Why _value++ is unsafe: it's a read-modify-write (load, add 1, store), not atomic.
// Two threads can both read N, both compute N+1, and both store N+1 — losing an
// increment (a lost update). Interlocked performs the whole op atomically in hardware
// (a CAS-based intrinsic), with no lock. A `lock` works too but is heavier for a counter.
```
**Note:** for compound state beyond a single primitive, use a `lock`; `Interlocked` only covers single-variable atomics (`Increment`, `Add`, `CompareExchange`).

### exercise: [M] Bounded blocking queue
Implement a fixed-capacity queue where `Enqueue` blocks while full and `Dequeue` blocks while empty, safe for multiple producers and consumers.
#### solution:
```csharp
public class BlockingQueue<T> {
    private readonly Queue<T> _q = new();
    private readonly int _capacity;
    private readonly object _lock = new();
    public BlockingQueue(int capacity) => _capacity = capacity;

    public void Enqueue(T item) {
        lock (_lock) {
            while (_q.Count == _capacity) Monitor.Wait(_lock);   // full → release lock & wait
            _q.Enqueue(item);
            Monitor.PulseAll(_lock);                              // wake any waiting consumers
        }
    }
    public T Dequeue() {
        lock (_lock) {
            while (_q.Count == 0) Monitor.Wait(_lock);            // empty → wait
            var item = _q.Dequeue();
            Monitor.PulseAll(_lock);                              // wake any waiting producers
            return item;
        }
    }
}
```
**Note:** use `while` (not `if`) around `Monitor.Wait` — a thread can wake spuriously or lose the race to another waiter, so re-check the condition. `PulseAll` (not `Pulse`) because producers and consumers share the one condition variable. The modern idiomatic alternative is `System.Threading.Channels`.

### exercise: [M] Producer–consumer pipeline with backpressure
Build a producer–consumer pipeline that applies **backpressure** (producers slow down when consumers fall behind), using the idiomatic .NET primitive.
#### solution:
```csharp
using System.Threading.Channels;

public class Pipeline {
    private readonly Channel<int> _channel = Channel.CreateBounded<int>(
        new BoundedChannelOptions(100) { FullMode = BoundedChannelFullMode.Wait });

    public async Task ProduceAsync(IEnumerable<int> items) {
        foreach (var i in items)
            await _channel.Writer.WriteAsync(i);   // awaits (backpressure) when full
        _channel.Writer.Complete();                // signal "no more items"
    }

    public async Task ConsumeAsync() {
        await foreach (var item in _channel.Reader.ReadAllAsync())
            Process(item);                          // multiple consumers can run this concurrently
    }
    private void Process(int x) { /* ... */ }
}
```
**Note:** a **bounded** channel gives backpressure for free — `WriteAsync` suspends (doesn't block a thread) when the buffer is full. `Complete()` lets `ReadAllAsync` finish cleanly. This replaces hand-rolled `BlockingCollection` + threads and is fully async.

### exercise: [M] Alternate two threads (print Foo/Bar in order)
Two threads call `Foo` and `Bar` `n` times; coordinate them to print `FooBarFooBar…` (Foo always before its Bar).
#### solution:
```csharp
public class FooBar {
    private readonly int _n;
    private readonly SemaphoreSlim _foo = new(1, 1);   // starts available → Foo goes first
    private readonly SemaphoreSlim _bar = new(0, 1);   // starts blocked
    public FooBar(int n) => _n = n;

    public async Task Foo(Action printFoo) {
        for (int i = 0; i < _n; i++) {
            await _foo.WaitAsync();
            printFoo();
            _bar.Release();          // hand control to Bar
        }
    }
    public async Task Bar(Action printBar) {
        for (int i = 0; i < _n; i++) {
            await _bar.WaitAsync();
            printBar();
            _foo.Release();          // hand control back to Foo
        }
    }
}
```
**Note:** two semaphores ping-pong the turn. `_foo` starts at 1 and `_bar` at 0, so Foo prints first and each side blocks until the other releases it. This signaling pattern (a semaphore per turn) generalizes to N-way ordering.

### exercise: [H] Thread-safe LRU cache
Make an LRU cache (O(1) get/put) safe for concurrent access. Note the limitation of just using `ConcurrentDictionary`.
#### solution:
```csharp
public class ThreadSafeLru<TKey, TVal> where TKey : notnull {
    private readonly int _cap;
    private readonly Dictionary<TKey, LinkedListNode<(TKey k, TVal v)>> _map = new();
    private readonly LinkedList<(TKey k, TVal v)> _order = new();   // front = most recent
    private readonly object _lock = new();
    public ThreadSafeLru(int capacity) => _cap = capacity;

    public bool TryGet(TKey key, out TVal val) {
        lock (_lock) {
            if (_map.TryGetValue(key, out var node)) {
                _order.Remove(node); _order.AddFirst(node);   // touch → most recent
                val = node.Value.v; return true;
            }
            val = default!; return false;
        }
    }
    public void Put(TKey key, TVal val) {
        lock (_lock) {
            if (_map.TryGetValue(key, out var node)) {
                node.Value = (key, val); _order.Remove(node); _order.AddFirst(node); return;
            }
            if (_map.Count == _cap) {
                var lru = _order.Last!;                         // evict least-recent
                _order.RemoveLast(); _map.Remove(lru.Value.k);
            }
            var n = new LinkedListNode<(TKey, TVal)>((key, val));
            _order.AddFirst(n); _map[key] = n;
        }
    }
}
```
**Note:** a single coarse `lock` is the correct, simple answer — get/put each touch *both* the map and the recency list, so they must move together atomically. `ConcurrentDictionary` alone can't help because it gives no **recency ordering**. For high contention, **shard** the cache by `key.GetHashCode() % N` so independent keys don't contend (lock striping).

@topic id=practice-machine-coding | track=practice | title=LLD machine-coding | kind=problem

### exercise: [M] In-memory key-value store with TTL
Implement a KV store with `Put(key, value, ttl?)` and `TryGet` where expired entries are not returned.
#### solution:
```csharp
public class TtlStore<TKey, TVal> where TKey : notnull {
    private readonly record struct Entry(TVal Value, long ExpiresAtTicks);
    private readonly Dictionary<TKey, Entry> _map = new();
    private readonly object _lock = new();

    public void Put(TKey key, TVal val, TimeSpan? ttl = null) {
        long expires = ttl.HasValue ? DateTime.UtcNow.Add(ttl.Value).Ticks : long.MaxValue;
        lock (_lock) _map[key] = new Entry(val, expires);
    }
    public bool TryGet(TKey key, out TVal val) {
        lock (_lock) {
            if (_map.TryGetValue(key, out var e)) {
                if (DateTime.UtcNow.Ticks < e.ExpiresAtTicks) { val = e.Value; return true; }
                _map.Remove(key);                    // lazy expiry on read
            }
            val = default!; return false;
        }
    }
}
```
**Note:** **lazy expiry** (drop on read) is simple and avoids a timer per key; pair it with a periodic background sweeper to reclaim memory from keys that are never read again — exactly how Redis does it (lazy + sampled active expiry).

### exercise: [M] In-memory Pub/Sub
Implement topic-based publish/subscribe: subscribers register a handler for a topic; publishing a message invokes all that topic's handlers. Support unsubscribe.
#### solution:
```csharp
public class PubSub<T> {
    private readonly Dictionary<string, List<Action<T>>> _subs = new();
    private readonly object _lock = new();

    public IDisposable Subscribe(string topic, Action<T> handler) {
        lock (_lock) {
            if (!_subs.TryGetValue(topic, out var list)) _subs[topic] = list = new();
            list.Add(handler);
        }
        return new Unsub(() => { lock (_lock) { if (_subs.TryGetValue(topic, out var l)) l.Remove(handler); } });
    }

    public void Publish(string topic, T message) {
        List<Action<T>> snapshot;
        lock (_lock) {
            if (!_subs.TryGetValue(topic, out var list) || list.Count == 0) return;
            snapshot = new List<Action<T>>(list);     // copy so we don't hold the lock while invoking
        }
        foreach (var h in snapshot) h(message);       // a handler may (un)subscribe safely
    }

    private sealed class Unsub : IDisposable {
        private readonly Action _dispose;
        public Unsub(Action d) => _dispose = d;
        public void Dispose() => _dispose();
    }
}
```
**Note:** **snapshot** the subscriber list before invoking handlers — otherwise a handler that subscribes/unsubscribes during dispatch mutates the collection you're iterating (and you'd be invoking user code while holding a lock, risking deadlock). Returning an `IDisposable` for unsubscribe is the idiomatic .NET pattern (`IObservable`/`IDisposable`).

### exercise: [M] Logging framework (level filter + pluggable sinks)
Design a logger with level filtering and multiple output sinks (console/file/…), extensible without editing the logger.
#### solution:
```csharp
public enum LogLevel { Debug, Info, Warn, Error }

public interface ILogSink { void Write(LogLevel level, string message); }   // Strategy

public class ConsoleSink : ILogSink {
    public void Write(LogLevel level, string msg) => Console.WriteLine($"[{level}] {msg}");
}
public class FileSink : ILogSink {
    private readonly object _lock = new();
    public void Write(LogLevel level, string msg) {
        lock (_lock) { /* File.AppendAllText(path, $"[{level}] {msg}\n"); */ }
    }
}

public class Logger {
    private readonly LogLevel _min;
    private readonly IReadOnlyList<ILogSink> _sinks;
    public Logger(LogLevel min, params ILogSink[] sinks) { _min = min; _sinks = sinks; }

    public void Log(LogLevel level, string message) {
        if (level < _min) return;                    // level filter
        foreach (var s in _sinks) s.Write(level, message);   // fan-out
    }
    public void Debug(string m) => Log(LogLevel.Debug, m);
    public void Info(string m)  => Log(LogLevel.Info, m);
    public void Warn(string m)  => Log(LogLevel.Warn, m);
    public void Error(string m) => Log(LogLevel.Error, m);
}
```
**Note:** **Strategy** for sinks → add a `DbSink` or `SeqSink` without touching `Logger` (OCP). Level filtering short-circuits cheap. For high throughput, make logging async by pushing formatted records onto a `Channel<T>` that a single background writer drains (decouples callers from slow I/O).

### exercise: [M] Snake game core
Model the core logic of Snake: a board, a moving/growing snake, food, and game-over on wall or self collision. Skip rendering/input.
#### solution:
```csharp
public class SnakeGame {
    private readonly int _w, _h;
    private readonly LinkedList<(int r, int c)> _snake = new();   // head = First
    private readonly HashSet<(int, int)> _occupied = new();      // O(1) collision check
    private (int r, int c) _food;
    private readonly Random _rng = new();
    public bool GameOver { get; private set; }
    public int Score { get; private set; }

    public SnakeGame(int w, int h) {
        _w = w; _h = h;
        var head = (0, 0);
        _snake.AddFirst(head); _occupied.Add(head);
        SpawnFood();
    }

    public void Move((int dr, int dc) dir) {
        if (GameOver) return;
        var head = _snake.First!.Value;
        var next = (head.r + dir.dr, head.c + dir.dc);

        if (next.Item1 < 0 || next.Item1 >= _h || next.Item2 < 0 || next.Item2 >= _w) {
            GameOver = true; return;                            // hit a wall
        }
        bool eating = next == _food;
        if (!eating) {                                          // tail vacates unless we grow
            var tail = _snake.Last!.Value;
            _snake.RemoveLast(); _occupied.Remove(tail);
        }
        if (!_occupied.Add(next)) { GameOver = true; return; }  // self-collision
        _snake.AddFirst(next);
        if (eating) { Score++; SpawnFood(); }
    }

    private void SpawnFood() {
        do { _food = (_rng.Next(_h), _rng.Next(_w)); } while (_occupied.Contains(_food));
    }
}
```
**Note:** a deque (`LinkedList`) for the body gives O(1) head-add/tail-remove; a parallel `HashSet` gives O(1) collision tests. Crucial ordering: **remove the tail before the self-collision check** when not eating — the cell the tail just vacated is a legal destination.
