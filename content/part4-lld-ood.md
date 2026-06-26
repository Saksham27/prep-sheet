# Part 4 — Low-Level Design / OOD

> The track where 6 YOE should shine. LLD interviews test whether you can turn fuzzy requirements into clean, extensible class structures — and whether you reach for the right pattern *and can justify it*. All code is C#. Every pattern is anchored to something real (often your own codebase) so it sticks. Read the SOLID section as spot-the-violation drills; that's how it's actually tested.

---

# 1. OOP at depth (beyond the four pillars)

Everyone recites encapsulation/inheritance/polymorphism/abstraction. The *senior* skills are the judgment calls:

**Composition over inheritance.** Inheritance ("is-a") is rigid: it couples subclass to superclass internals, creates deep fragile hierarchies, and forces a single classification axis. **Composition** ("has-a") assembles behavior from parts you can swap at runtime. Rule of thumb: use inheritance only for a genuine, stable "is-a" with a Liskov-substitutable contract; otherwise compose.

```csharp
// Inheritance trap: a rigid hierarchy that fights you when a duck can't quack
abstract class Duck { public abstract void Quack(); public abstract void Fly(); }
// RubberDuck can't fly, ModelDuck can't quack -> override to throw -> LSP violation

// Composition: behaviors as injected strategies (this is the Strategy pattern)
class Duck {
    private IFlyBehavior _fly;
    private IQuackBehavior _quack;
    public Duck(IFlyBehavior fly, IQuackBehavior quack) { _fly = fly; _quack = quack; }
    public void PerformFly() => _fly.Fly();      // swap FlyWithWings / FlyNoWay at runtime
    public void PerformQuack() => _quack.Quack();
}
```

**Cohesion and coupling** are the quality axes. **High cohesion** = a class does one well-defined thing (its members all serve one purpose). **Loose coupling** = classes depend on each other through narrow, stable abstractions, not concrete internals. Good design maximizes cohesion and minimizes coupling — every pattern below is a tool toward that.

**Encapsulation properly** = hiding *invariants*, not just making fields private. A class should expose operations that keep its state valid and never let callers put it in an illegal state.

---

# 2. SOLID — spot the violation, then refactor

## S — Single Responsibility
*A class should have one reason to change.* Mixing concerns means a change to one drags in the others.

```csharp
// VIOLATION: Invoice computes totals, persists itself, AND emails. Three reasons to change.
class Invoice {
    public decimal Total() { /* business logic */ return 0; }
    public void SaveToDb() { /* persistence */ }
    public void EmailCustomer() { /* notification */ }
}
// REFACTOR: separate the concerns
class Invoice { public decimal Total() { return 0; } }          // domain
class InvoiceRepository { public void Save(Invoice i) { } }      // persistence
class InvoiceNotifier { public void Email(Invoice i) { } }       // notification
```

## O — Open/Closed
*Open for extension, closed for modification.* Adding a new variant shouldn't mean editing existing tested code.

```csharp
// VIOLATION: every new shape edits this switch (and risks breaking others)
double Area(object shape) => shape switch {
    Circle c => Math.PI * c.R * c.R,
    Square s => s.Side * s.Side,
    _ => throw new("unknown")
};
// REFACTOR: polymorphism — a new shape is a new class, no existing code changes
abstract class Shape { public abstract double Area(); }
class Circle : Shape { public double R; public override double Area() => Math.PI * R * R; }
class Square : Shape { public double Side; public override double Area() => Side * Side; }
```

## L — Liskov Substitution
*A subtype must be usable anywhere its base type is, without surprising the caller.* If a subclass weakens a guarantee or throws where the base wouldn't, it's a violation.

```csharp
// VIOLATION: Square "is-a" Rectangle mathematically, but breaks the contract
class Rectangle { public virtual int Width { get; set; } public virtual int Height { get; set; } }
class Square : Rectangle {
    public override int Width { set { base.Width = base.Height = value; } }   // surprises callers
    public override int Height { set { base.Width = base.Height = value; } }
}
// Code that sets Width=5, Height=4 and expects Area 20 gets 16 from a Square -> broken.
// REFACTOR: don't force the inheritance. Model them as separate Shapes implementing IShape,
// or favor composition. "Is-a" in math is not "is-a" in behavior.
```

## I — Interface Segregation
*Don't force a class to implement methods it doesn't need.* Fat interfaces couple clients to things they don't use.

```csharp
// VIOLATION: a simple printer forced to implement Scan and Fax
interface IMachine { void Print(); void Scan(); void Fax(); }
class OldPrinter : IMachine { public void Print(){} public void Scan()=>throw new(); public void Fax()=>throw new(); }
// REFACTOR: small, focused interfaces; a class implements only what it supports
interface IPrinter { void Print(); }
interface IScanner { void Scan(); }
class OldPrinter : IPrinter { public void Print(){} }
class AllInOne : IPrinter, IScanner { public void Print(){} public void Scan(){} }
```

## D — Dependency Inversion
*Depend on abstractions, not concretions.* High-level policy shouldn't be welded to low-level detail.

```csharp
// VIOLATION: OrderService hard-wired to a concrete SQL repo and SMTP sender
class OrderService {
    private SqlOrderRepository _repo = new();   // can't test, can't swap
    private SmtpEmailSender _email = new();
}
// REFACTOR: depend on interfaces, inject them (this is what your DI container does)
class OrderService {
    private readonly IOrderRepository _repo;
    private readonly IEmailSender _email;
    public OrderService(IOrderRepository repo, IEmailSender email) { _repo = repo; _email = email; }
}
```

**The meta-point for interviews:** when shown bad code, *name the principle* and refactor. SOLID isn't trivia — it's the vocabulary for justifying structure.

---

# 3. Design patterns that actually appear (with code + your anchors)

## Creational

**Strategy** *(technically behavioral, but the workhorse — lead with it).* Encapsulate interchangeable algorithms behind a common interface; swap at runtime.
```csharp
interface IPricingStrategy { decimal Price(Ticket t); }
class HourlyPricing : IPricingStrategy { public decimal Price(Ticket t) => t.Hours * 20m; }
class FlatPricing   : IPricingStrategy { public decimal Price(Ticket t) => 100m; }
class ParkingLot {
    private IPricingStrategy _pricing;
    public ParkingLot(IPricingStrategy p) => _pricing = p;   // inject the algorithm
}
```
*Your anchors:* parking-lot pricing, payment methods, discount rules, the fly/quack behaviors above.

**Factory Method / Abstract Factory.** Centralize object creation so callers don't `new` concretes (supports OCP + DIP).
```csharp
interface IVehicleFactory { Vehicle Create(VehicleType t); }
class VehicleFactory : IVehicleFactory {
    public Vehicle Create(VehicleType t) => t switch {
        VehicleType.Car => new Car(),
        VehicleType.Bike => new Bike(),
        _ => throw new ArgumentException()
    };
}
```

**Builder.** Construct a complex object step by step; great for many optional params / immutability.
```csharp
var pizza = new PizzaBuilder().Size("L").AddTopping("mushroom").AddTopping("olive").Build();
```

**Singleton — and why it's usually an anti-pattern.** One instance, global access.
```csharp
public sealed class Config {
    private static readonly Lazy<Config> _i = new(() => new Config());  // thread-safe lazy init
    public static Config Instance => _i.Value;
    private Config() { }
}
```
*Say this in the interview:* Singleton introduces **global mutable state**, **hides dependencies** (callers reach for `Instance` instead of declaring what they need), and **hurts testability** (can't substitute a fake). The modern answer is a **DI-container singleton** — register one instance, but **inject** it as an interface. You get single-instance semantics without the global-state and testing costs.

## Structural

**Decorator.** Wrap an object to add behavior without changing it; compose layers. (.NET streams are decorators: `GZipStream` wraps `FileStream`.)
```csharp
interface ICoffee { decimal Cost(); }
class Espresso : ICoffee { public decimal Cost() => 80m; }
class MilkDecorator : ICoffee {
    private readonly ICoffee _inner;
    public MilkDecorator(ICoffee inner) => _inner = inner;
    public decimal Cost() => _inner.Cost() + 20m;       // add cost, delegate the rest
}
// new MilkDecorator(new Espresso()) -> 100
```

**Proxy.** A stand-in that controls access — adds logging, caching, lazy-loading, or remoting *without* changing the real object's interface. **This is exactly your YARP wrapper:** a transparent layer in front of the real APIs adding observability/logging. Own it.
```csharp
interface IApi { Response Call(Request r); }
class LoggingProxy : IApi {
    private readonly IApi _real;
    public LoggingProxy(IApi real) => _real = real;
    public Response Call(Request r) {
        Log(r);                       // cross-cutting concern added transparently
        var resp = _real.Call(r);
        Log(resp);
        return resp;
    }
}
```

**Adapter.** Make an incompatible interface fit the one your code expects (wrap a third-party SDK). *Your anchor:* the StorePay integration — adapting their SHA-512-hashed, HTML-error-page API to your payment interface.
```csharp
interface IPaymentGateway { PaymentResult Pay(decimal amount); }
class StorePayAdapter : IPaymentGateway {
    private readonly StorePaySdk _sdk;                  // the incompatible third party
    public PaymentResult Pay(decimal amount) {
        var raw = _sdk.Charge(Sha512(amount.ToString())); // translate to their shape
        return Parse(raw);                                 // translate back to ours
    }
}
```

**Facade.** A simple unified interface over a messy subsystem (an `OrderFacade` hiding inventory + payment + shipping calls).

**Composite.** Treat individual objects and compositions uniformly via a tree (file system: a `File` and a `Folder` both implement `IComponent.Size()`).

## Behavioral

**Observer.** Subscribers react to a subject's state changes (publish/subscribe in-process). C# has first-class support via `event`/`IObservable<T>`.
```csharp
class Stock {
    public event Action<decimal>? PriceChanged;          // subject
    public void SetPrice(decimal p) => PriceChanged?.Invoke(p);  // notify observers
}
// stock.PriceChanged += price => Console.WriteLine($"alert {price}");
```
*Anchor:* notification fan-out, your gamification triggers.

**State.** An object alters behavior when its internal state changes — each state is a class; transitions move between them. Replaces sprawling `if/switch` on a status field. *Anchor:* elevator (Idle/Moving/DoorOpen), order lifecycle (Draft→Submitted→Approved).
```csharp
interface IElevatorState { IElevatorState Press(int floor); }
class IdleState : IElevatorState { public IElevatorState Press(int floor) => new MovingState(floor); }
class MovingState : IElevatorState { /* ... */ public IElevatorState Press(int floor) => this; }
```

**Chain of Responsibility.** A request passes along a chain; each handler either handles it or passes it on. **This is ASP.NET Core middleware and your `IExceptionHandler` pipeline.** Own it.
```csharp
abstract class Handler {
    protected Handler? Next;
    public Handler SetNext(Handler n) { Next = n; return n; }
    public abstract void Handle(Request r);   // handle or delegate to Next
}
```

**Command.** Encapsulate a request as an object (with `Execute`/`Undo`) — enables queuing, logging, and undo/redo.
```csharp
interface ICommand { void Execute(); void Undo(); }
```

**Template Method.** A base class defines an algorithm's skeleton; subclasses fill in specific steps.
```csharp
abstract class ReportGenerator {
    public void Generate() { Fetch(); Transform(); Render(); }   // fixed skeleton
    protected abstract void Fetch();        // subclasses customize the steps
    protected abstract void Render();
    protected virtual void Transform() { }  // optional hook
}
```

**Iterator.** Traverse a collection without exposing its internals — `IEnumerable<T>`/`IEnumerator<T>` and `yield return` are this pattern built into C#.

**The pattern-selection skill** (what's actually graded): given a requirement, name the pattern *and the alternative you rejected*. "Pricing varies by lot type and time → Strategy, injected, so adding a pricing scheme is a new class not an edited switch (OCP)." That sentence is the senior signal.

---

# 4. How to drive an LLD interview

1. **Clarify requirements & scope.** List the core use cases; confirm what's in/out. (Parking lot: multiple floors? vehicle types? pricing model? payment?)
2. **Identify the core entities (nouns)** and their relationships → your classes.
3. **Define behaviors (verbs)** → methods and interfaces.
4. **Apply patterns where variation lives** — name them and why (Strategy for pricing, State for lifecycle, Factory for creation).
5. **Draw the class diagram** — classes, key fields/methods, relationships (has-a / is-a / uses).
6. **Handle concurrency** if the domain needs it (seat booking, spot allocation) — locks, atomic reservation, optimistic concurrency.
7. **Walk a use case end to end** through your classes to prove it works; discuss extensibility ("to add electric-vehicle spots, I'd…").

The grading: clean responsibilities (SRP), extensibility without editing existing code (OCP), justified patterns, and not over-engineering a simple ask.

---

# 5. Worked designs

## 5.1 Parking Lot (the canonical)
**Requirements:** multiple floors; spot sizes per vehicle type; assign nearest free spot on entry; issue a ticket; charge by duration on exit; pluggable pricing.
**Entities & structure:**
```csharp
enum VehicleType { Bike, Car, Truck }
abstract class Vehicle { public VehicleType Type { get; init; } public string Plate { get; init; } = ""; }
class Car : Vehicle { public Car() => Type = VehicleType.Car; }

class ParkingSpot {
    public string Id { get; init; } = "";
    public VehicleType Size { get; init; }
    public bool IsFree { get; private set; } = true;
    public Vehicle? Current { get; private set; }
    public bool TryPark(Vehicle v) {            // encapsulated invariant: only park if free & fits
        if (!IsFree || v.Type > Size) return false;
        Current = v; IsFree = false; return true;
    }
    public void Vacate() { Current = null; IsFree = true; }
}

class ParkingFloor {
    private readonly List<ParkingSpot> _spots;
    public ParkingFloor(List<ParkingSpot> spots) => _spots = spots;
    public ParkingSpot? FindSpot(VehicleType t) =>
        _spots.FirstOrDefault(s => s.IsFree && s.Size >= t);
}

class Ticket {
    public string Id { get; init; } = Guid.NewGuid().ToString();
    public ParkingSpot Spot { get; init; } = null!;
    public DateTime EntryTime { get; init; } = DateTime.UtcNow;
}

interface IPricingStrategy { decimal Calculate(Ticket t, DateTime exit); }
class HourlyPricing : IPricingStrategy {
    public decimal Calculate(Ticket t, DateTime exit) =>
        (decimal)Math.Ceiling((exit - t.EntryTime).TotalHours) * 30m;
}

class ParkingLot {
    private readonly List<ParkingFloor> _floors;
    private readonly IPricingStrategy _pricing;          // injected strategy
    private readonly object _lock = new();
    public ParkingLot(List<ParkingFloor> floors, IPricingStrategy pricing)
        { _floors = floors; _pricing = pricing; }

    public Ticket? Enter(Vehicle v) {
        lock (_lock) {                                    // concurrency: avoid double-assigning a spot
            foreach (var floor in _floors) {
                var spot = floor.FindSpot(v.Type);
                if (spot is not null && spot.TryPark(v))
                    return new Ticket { Spot = spot };
            }
            return null;                                  // lot full
        }
    }
    public decimal Exit(Ticket t) {
        var fee = _pricing.Calculate(t, DateTime.UtcNow);
        t.Spot.Vacate();
        return fee;
    }
}
```
**Talking points:** Strategy for pricing (OCP — add surge/weekend pricing as a class), the `_lock` to prevent two cars claiming the same spot (concurrency), encapsulated spot invariants, easy extension to EV spots (new `VehicleType` + spot capability). For huge scale, replace the lock with per-spot atomic reservation or optimistic concurrency.

## 5.2 LRU Cache (hashmap + doubly linked list, O(1))
**Insight:** O(1) get/put needs a hashmap (key→node) for lookup *and* a doubly linked list for recency order (move-to-front on access, evict the tail).
```csharp
class LRUCache {
    private class Node { public int Key, Val; public Node? Prev, Next; }
    private readonly int _cap;
    private readonly Dictionary<int, Node> _map = new();
    private readonly Node _head = new(), _tail = new();   // sentinels kill edge cases
    public LRUCache(int capacity) { _cap = capacity; _head.Next = _tail; _tail.Prev = _head; }

    private void Remove(Node n) { n.Prev!.Next = n.Next; n.Next!.Prev = n.Prev; }
    private void AddFront(Node n) {                        // most-recently-used at front
        n.Next = _head.Next; n.Prev = _head;
        _head.Next!.Prev = n; _head.Next = n;
    }

    public int Get(int key) {
        if (!_map.TryGetValue(key, out var n)) return -1;
        Remove(n); AddFront(n);                            // touch -> move to front
        return n.Val;
    }
    public void Put(int key, int val) {
        if (_map.TryGetValue(key, out var existing)) { existing.Val = val; Remove(existing); AddFront(existing); return; }
        if (_map.Count == _cap) {                          // evict LRU (the tail)
            var lru = _tail.Prev!;
            Remove(lru); _map.Remove(lru.Key);
        }
        var node = new Node { Key = key, Val = val };
        AddFront(node); _map[key] = node;
    }
}
```
**Talking points:** *doubly* linked list so you can unlink any node in O(1); sentinel head/tail remove null-checks; thread-safety would need a lock or a sharded/striped design (and `ConcurrentDictionary` won't give you LRU ordering for free). **LFU** is the harder follow-up (frequency buckets).

## 5.3 Rate Limiter (token bucket, pluggable algorithm)
```csharp
interface IRateLimiter { bool Allow(string clientId); }

class TokenBucketLimiter : IRateLimiter {
    private class Bucket { public double Tokens; public DateTime Last; }
    private readonly int _capacity; private readonly double _refillPerSec;
    private readonly Dictionary<string, Bucket> _buckets = new();
    private readonly object _lock = new();
    public TokenBucketLimiter(int capacity, double refillPerSec)
        { _capacity = capacity; _refillPerSec = refillPerSec; }

    public bool Allow(string clientId) {
        lock (_lock) {
            if (!_buckets.TryGetValue(clientId, out var b))
                b = _buckets[clientId] = new Bucket { Tokens = _capacity, Last = DateTime.UtcNow };
            var now = DateTime.UtcNow;
            b.Tokens = Math.Min(_capacity, b.Tokens + (now - b.Last).TotalSeconds * _refillPerSec); // refill
            b.Last = now;
            if (b.Tokens >= 1) { b.Tokens -= 1; return true; }   // consume
            return false;                                         // throttled
        }
    }
}
```
**Talking points:** token bucket allows bursts up to capacity then steady refill; the interface lets you swap in sliding-window or leaky-bucket (Strategy). For a *distributed* limiter, this state moves to Redis with an atomic Lua script (Part 2 §4.2) — say that, it shows you know the single-node design is only step one. *Your anchor:* you've built rate limiting in production.

## 5.4 Elevator (State pattern + scheduling)
**Requirements:** N floors, requests from inside (destination) and outside (up/down call), efficient scheduling.
**Structure:** an `Elevator` with a current floor, direction, and a `State` (Idle/MovingUp/MovingDown/DoorOpen); a request queue (often two sorted sets — pending stops above and below — served in a sweep, the **SCAN/elevator algorithm**); a `Controller`/`Dispatcher` that assigns external calls to the best elevator (nearest, same-direction).
```csharp
enum Direction { Up, Down, Idle }
class Elevator {
    public int CurrentFloor { get; private set; }
    public Direction Dir { get; private set; } = Direction.Idle;
    private readonly SortedSet<int> _up = new();      // stops above, served ascending
    private readonly SortedSet<int> _down = new(Comparer<int>.Create((a,b)=>b-a));
    public void Request(int floor) {
        if (floor > CurrentFloor) _up.Add(floor); else _down.Add(floor);
    }
    public void Step() {                              // SCAN: exhaust one direction, then reverse
        var queue = Dir == Direction.Down ? _down : _up;
        // ... move toward nearest stop in current direction; reverse when exhausted
    }
}
```
**Talking points:** State pattern for behavior per mode; the SCAN algorithm for efficiency (don't reverse direction with pending same-direction stops); the dispatcher as a separate concern (SRP). Multi-car scheduling is the extension.

## 5.5 Quick sketches for the rest of the common set
- **Notification Service:** `INotificationChannel` (Email/SMS/Push) = **Strategy**; subscribers via **Observer**; a queue + workers for async/retry (Part 2 §4.5). Your RabbitMQ experience is the story.
- **Vending Machine:** **State** pattern (Idle → MoneyInserted → Dispensing → OutOfStock); inventory + change-making.
- **Splitwise:** users, groups, expenses with **split strategies** (equal/exact/percentage = Strategy); a balance sheet (who owes whom) with simplification.
- **Tic-Tac-Toe / Chess:** `Board`, `Piece` hierarchy (each piece's move rules = polymorphism), a rules engine; **Command** for moves + undo.
- **Logging framework:** **Chain of Responsibility** (level-based handlers) + **Strategy** (sinks: file/console/db) + a **Singleton/DI** logger factory.

---

**Part 4 complete.** You now have OOP judgment, SOLID as refactor drills, the ~15 patterns that appear (with your YARP-proxy, StorePay-adapter, and IExceptionHandler-chain anchors), and five+ worked designs with code. Last one: **Part 5 — Behavioral**, where I give you the framework *and pre-draft your actual story bank* from your real work (the Redis crisis, partition pruning, the purging task, mentoring) in STAR form, plus the company-flavor angles. Say *continue* to finish the set.
