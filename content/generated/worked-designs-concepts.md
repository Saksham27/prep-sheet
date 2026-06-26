# Generated worked designs (step 4)

> AI-added — verify. Appended to the existing "worked designs" topics in System Design
> and LLD, matching the corpus format. Each renders with the "AI-added — verify" badge.

@topic id=design-4-fully-worked-designs | track=design | title=Fully worked designs

### concept: Pastebin (worked design)
**Scope:** store a text blob, return a short URL; read it back by URL. Optional: TTL/expiry, syntax highlighting, unlisted pastes. Out of scope: editing, accounts.

**Numbers:** ~10M new pastes/month ≈ **~4 writes/s** avg (~12/s peak); ~10:1 read:write → **~40 reads/s**. Avg paste ~10 KB → 10M × 10 KB × 12 × 5 ≈ **~6 TB over 5 years**. Read-heavy; blob *storage* dominates, not QPS.

**API:** `POST /paste {content, ttl?} → {id, url}`; `GET /{id} → content` (404 if missing, 410 if expired).

**Data model:** keep DB rows tiny — metadata only: `{ id, createdAt, expiresAt, size, storageKey }`. The blob itself lives in **object storage** (S3/Blob), not the DB. `id` = base62 of a counter, or a random 7–8 char key with a collision check.

**Read path:** `GET /{id}` → look up metadata (hot ids cached in Redis) → if `expiresAt` passed, return 410 → fetch the blob from object storage (or a CDN edge for popular pastes) → return. Recent/popular pastes dominate, so cache hit rate is high.

**Write path:** generate `id` → write the blob to object storage → write the metadata row → return the URL.

**Expiry:** lazy (check `expiresAt` on read) plus an object-store **lifecycle policy** / background sweeper to actually reclaim space.

**Scale & tradeoffs:** blobs in object storage decouple storage growth from the DB and let a CDN absorb popular reads; the DB stays lean (small metadata) and shards trivially by `id` hash if needed. The cost is an extra network hop to fetch the blob vs storing it inline — worth it to keep the DB small and storage elastic.

#### probe: Why store the blob in object storage instead of inline in the database?
Pastes are large and read-mostly. Keeping them in the DB bloats row/page size, hurts the buffer-cache hit rate, makes backups/replication heavy, and couples storage scaling to the DB. Object storage is cheap, effectively infinite, CDN-frontable, and lets the relational/KV layer hold only tiny metadata rows that index and shard cleanly. You trade one network hop for a far more scalable, cheaper system.

### concept: Search Autocomplete / Typeahead (worked design)
**Scope:** as the user types a prefix, return the top-K most-likely completions ranked by popularity, in <~100 ms. Out of scope: full search and spell-correction (note them as extensions).

**Numbers:** every keystroke is a query → e.g. 100M searches/day × ~4 keystrokes ≈ **~5,000 QPS** avg, several times that at peak. Extremely read-heavy and latency-critical → it **must serve from memory**.

**Core structure:** a **Trie** where each node caches the **precomputed top-K completions** of its prefix. A query walks O(prefix length) to the node, then reads its cached top-K in O(1) — no per-query ranking.

**Build/update path:** a batch job aggregates query logs (counts per term, **time-decayed** so trending terms surface and old spikes fade), recomputes each node's top-K, and publishes a fresh in-memory Trie periodically (e.g. hourly). Writes are async — autocomplete tolerates staleness.

**Serving:** the Trie lives in memory on the suggest service, **sharded by prefix** (e.g. by first letters) across nodes. API: `GET /suggest?q=lea → ["learn","league",…]`. A CDN/edge cache keyed by prefix absorbs the hottest prefixes.

**Scale & tradeoffs:** precomputing top-K at each node trades memory + rebuild cost for **O(1) query-time ranking** — the right trade for a read-dominated, latency-bound path. Sharding by prefix balances load. Time-decayed counts keep results fresh. Personalization (per-user history) is a later layer merged at read time.

#### probe: Why precompute top-K at each Trie node instead of ranking at query time?
At ~5,000+ QPS with a <100 ms budget, you can't afford to gather all completions under a prefix and sort them on every keystroke. Precomputing the top-K once per refresh turns each query into a pointer-walk plus an O(1) read of a tiny cached list. You pay memory and a periodic batch rebuild — cheap and offline — to make the hot path trivial. It's the classic precompute-on-write to make reads O(1).

@topic id=lld-5-worked-designs | track=lld | title=Worked designs

### concept: Vending Machine (State pattern)
**Requirements:** accept coins, select a product, dispense it with change; handle out-of-stock and insufficient funds; be easy to extend (e.g. a maintenance mode).

**Structure — the State pattern** replaces a sprawling `if/switch` on a status field; each state owns its valid transitions.
```csharp
enum Coin { Nickel = 5, Dime = 10, Quarter = 25, Dollar = 100 }

interface IVendingState {
    IVendingState InsertCoin(Coin c);
    IVendingState SelectProduct(string code);
}

class VendingMachine {
    public Inventory Inventory { get; } = new();
    public int Balance { get; set; }
    public IVendingState State { get; private set; }
    public VendingMachine() => State = new IdleState(this);
    public void InsertCoin(Coin c) => State = State.InsertCoin(c);
    public void Select(string code) => State = State.SelectProduct(code);
}

class IdleState : IVendingState {                 // waiting for money
    private readonly VendingMachine _m;
    public IdleState(VendingMachine m) => _m = m;
    public IVendingState InsertCoin(Coin c) { _m.Balance += (int)c; return new HasMoneyState(_m); }
    public IVendingState SelectProduct(string code) => this;   // ignore until paid
}

class HasMoneyState : IVendingState {             // coins inserted, can select
    private readonly VendingMachine _m;
    public HasMoneyState(VendingMachine m) => _m = m;
    public IVendingState InsertCoin(Coin c) { _m.Balance += (int)c; return this; }
    public IVendingState SelectProduct(string code) {
        var p = _m.Inventory.Get(code);
        if (p is null || p.Stock == 0) return this;       // out of stock → stay
        if (_m.Balance < p.Price) return this;            // need more money → stay
        p.Stock--;
        int change = _m.Balance - p.Price;
        _m.Balance = 0;
        Dispense(p, change);
        return new IdleState(_m);
    }
    private void Dispense(Product p, int change) { /* emit product + change */ }
}
```
**Talking points:** adding a `MaintenanceState` is a new class, not an edit to a giant switch (OCP). Change-making is a separate concern (greedy for canonical coin sets, DP otherwise). For a networked fleet, the inventory decrement must be atomic (optimistic concurrency) so two buyers don't claim the last item.

#### probe: Why the State pattern here instead of an enum + a switch?
A status enum forces every method (`InsertCoin`, `SelectProduct`, `Dispense`) to switch on the status and handle all cases, so the transition logic is scattered and every new status touches every method. The State pattern localizes each status's behavior **and** its valid transitions in one class; illegal transitions are simply not implemented, a new state is a new class, and the machine just delegates to `State`. It's the OCP-friendly way to model a lifecycle.

### concept: Splitwise (split strategies + balance sheet)
**Requirements:** users in groups log shared expenses; each expense splits among participants (equal / exact / percentage); the system tracks who owes whom and can settle up.

```csharp
interface ISplitStrategy {
    // returns userId -> amount owed for this expense
    Dictionary<string, decimal> Split(decimal amount, IReadOnlyList<string> participants, object? config);
}
class EqualSplit : ISplitStrategy {
    public Dictionary<string, decimal> Split(decimal amount, IReadOnlyList<string> p, object? _) {
        decimal each = Math.Round(amount / p.Count, 2);
        return p.ToDictionary(u => u, _ => each);
    }
}
class PercentSplit : ISplitStrategy {            // config = Dictionary<string, decimal> percentages
    public Dictionary<string, decimal> Split(decimal amount, IReadOnlyList<string> p, object? config) {
        var pct = (Dictionary<string, decimal>)config!;
        return p.ToDictionary(u => u, u => Math.Round(amount * pct[u] / 100m, 2));
    }
}

class Expense {
    public string PaidBy = "";
    public decimal Amount;
    public Dictionary<string, decimal> Owed = new();   // produced by an ISplitStrategy
}

class BalanceSheet {
    // _net[a][b] = how much a owes b (net)
    private readonly Dictionary<string, Dictionary<string, decimal>> _net = new();
    public void Apply(Expense e) {
        foreach (var (user, share) in e.Owed) {
            if (user == e.PaidBy) continue;
            _net.TryAdd(user, new());
            _net[user][e.PaidBy] = _net[user].GetValueOrDefault(e.PaidBy) + share;
        }
    }
    public decimal Balance(string a, string b) =>
        (_net.GetValueOrDefault(a)?.GetValueOrDefault(b) ?? 0)
      - (_net.GetValueOrDefault(b)?.GetValueOrDefault(a) ?? 0);
}
```
**Talking points:** Strategy for split types → a new split rule is a new class (OCP). The balance sheet nets pairwise debts. Debt **simplification** (settle a group in the fewest transfers) is the hard follow-up. Concurrency on a shared group ledger needs transactional updates.

#### probe: How would you simplify debts so a group settles in the fewest transactions?
Compute each person's **net balance** (total paid − total owed). Drop everyone at zero. Then greedily match the largest creditor with the largest debtor, transfer `min(|credit|, |debt|)`, update both, and repeat — each transfer zeroes at least one person, bounding it to ≤ n−1 transfers. (Optimal minimization is NP-hard in general — subset-sum-ish — but the greedy max-creditor/max-debtor heuristic is what's used in practice and is what an interviewer wants to hear.)

### concept: Tic-Tac-Toe (board + rules, extensible to Chess)
**Requirements:** an N×N board, two players alternating, detect win/draw, reject illegal moves; design so it generalizes to richer games.
```csharp
enum Mark { Empty, X, O }

class Board {
    private readonly Mark[,] _cells;
    public int N { get; }
    public Board(int n = 3) { N = n; _cells = new Mark[n, n]; }

    public bool Place(int r, int c, Mark m) {
        if (_cells[r, c] != Mark.Empty) return false;     // encapsulated invariant
        _cells[r, c] = m; return true;
    }

    // Only check the line through the just-placed cell → O(N), not a full O(N²) scan.
    public Mark WinnerAfter(int r, int c) {
        Mark m = _cells[r, c];
        bool row = true, col = true, diag = true, anti = true;
        for (int i = 0; i < N; i++) {
            if (_cells[r, i] != m) row = false;
            if (_cells[i, c] != m) col = false;
            if (_cells[i, i] != m) diag = false;
            if (_cells[i, N - 1 - i] != m) anti = false;
        }
        return (row || col || (r == c && diag) || (r + c == N - 1 && anti)) ? m : Mark.Empty;
    }
}

class Game {
    private readonly Board _board = new();
    private Mark _turn = Mark.X;
    private int _moves;
    public (bool ok, Mark winner, bool draw) Move(int r, int c) {
        if (!_board.Place(r, c, _turn)) return (false, Mark.Empty, false);
        var w = _board.WinnerAfter(r, c);
        bool draw = w == Mark.Empty && ++_moves == _board.N * _board.N;
        _turn = _turn == Mark.X ? Mark.O : Mark.X;
        return (true, w, draw);
    }
}
```
**Talking points:** check only the placed line for a winner (O(N)). To generalize to **Chess**: a `Piece` hierarchy where each piece's `LegalMoves(board, pos)` is polymorphic, a rules engine for check/checkmate, and the **Command** pattern for moves to enable undo/redo and game history.

#### probe: How does this design extend to Chess?
Replace `Mark` with a `Piece` abstraction and make move generation polymorphic — each piece type (`Pawn`, `Knight`, …) implements `LegalMoves(board, from)`, so adding a piece is a new class (OCP) rather than editing a giant rules switch. Add a rules engine for board-level concerns (check, checkmate, castling, en passant) and wrap each move as a **Command** with `Execute`/`Undo` so you get history, takebacks, and replay for free. The `Board`/`Game` separation already mirrors the structure you'd keep.
