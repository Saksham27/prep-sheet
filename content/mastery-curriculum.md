# The Mastery Curriculum — DSA + Real Engineering Depth

> Written for a ~6 YOE engineer who wants two things: (1) clear any interview at any company, and (2) hold his own in a room full of senior/principal engineers without feeling like a fraud. Those are different goals. DSA gets you *past the gate*. Everything in Tracks 2–5 is what makes you *actually good*. We do both.

## How to read this

Every DSA topic follows the same shape so your tool can parse it:

- **Core idea** — the one mental model. If you can't say it in a sentence, you don't have it yet.
- **Sub-patterns** — the recognizable shapes. Interview problems are these in disguise.
- **Mastery bar** — the honest test for "I own this," not "I've seen this."
- **Problems** — tiered E/M/H. `⭐` = non-negotiable core. `🔁` = re-solve from memory weekly until automatic.

Depth topics (Tracks 2–5) follow: **what to understand → what a strong engineer will probe you on → how it ties to your real work.** The probing questions are your self-test. If you can't answer them out loud, that's the gap.

---

## The meta-plan: sequencing & where your hours go

You are not doing these tracks sequentially. You're doing DSA *daily* as the spine, and rotating the depth tracks alongside. Rough allocation of a ~16 hr/week budget:

| Track | Weeks 1–10 (switch-ready) | Weeks 11–26 (FAANG + real depth) |
|---|---|---|
| DSA | 60% | 45% |
| System Design (HLD) | 15% | 20% |
| LLD / OOD | 10% | 10% |
| CS Fundamentals (OS/Net/DB/Distributed) | 10% | 20% |
| Behavioral | 5% | 5% |

DSA is front-loaded because it's the gate and the slowest skill to build (it's muscle, not knowledge). Fundamentals are back-loaded because they're where *real engineer* lives, and you can absorb them once the panic of "can I even pass coding" is gone.

**The ordering rule for DSA:** do topics in the order below. Each builds on the last. Don't jump to DP before you've internalized recursion. Don't touch graphs before BFS/DFS feel boring.

---

# TRACK 1 — DSA (the coding gate)

## 0. Foundations (do this first, ~1 week)

### 0.1 Complexity analysis
- **Core idea:** Big-O is about *growth*, not speed. You're describing the shape of the curve as n→∞, ignoring constants and lower-order terms.
- **Master:** O(1)/log/n/n log n/n²/2ⁿ/n!; the difference between time and space; **amortized analysis** (why dynamic-array push is O(1) amortized); **recurrence solving** (Master Theorem for divide-and-conquer); how to reason about recursion depth = stack space.
- **Mastery bar:** Given any code you write, you state its time/space complexity *and the worst-case input that triggers it* without thinking.
- **Self-test:** Why is the average case of quicksort O(n log n) but worst case O(n²)? What input causes the worst case, and how does randomized pivot fix it?

### 0.2 Bit manipulation
- **Core idea:** integers are just bit arrays; bitwise ops are O(1) set operations.
- **Master:** AND/OR/XOR/NOT/shifts; `x & (x-1)` clears lowest set bit; `x & -x` isolates it; XOR tricks (find the unique, swap without temp); using an int as a bitmask/set; counting set bits (Brian Kernighan).
- **Problems:**
  - ⭐ [E] Single Number — XOR cancels pairs.
  - [E] Number of 1 Bits — Kernighan's loop.
  - [M] Single Number II — bit-count mod 3.
  - [M] Subsets via bitmask — iterate 0..2ⁿ.
  - [M] Counting Bits — DP on `i >> 1`.

### 0.3 Math you'll actually be asked
- **Master:** GCD/LCM (Euclid), modular arithmetic (`(a*b)%m`, fast exponentiation), primes (Sieve of Eratosthenes), combinatorics basics (nCr, factorials with mod inverse), overflow awareness.
- **Problems:**
  - [E] Pow(x, n) — fast exponentiation, handle negatives.
  - [M] Sieve of Eratosthenes — count primes < n.
  - [M] GCD-based problems — Euclid's algorithm.

### 0.4 Recursion as a mindset
- **Core idea:** define the problem in terms of a smaller version of itself + a base case. Trust the recursion ("recursive leap of faith"). The call stack *is* your bookkeeping.
- **Master:** base case design, the recursion tree, what gets pushed on the stack, converting recursion ↔ iteration, when recursion blows the stack.
- This is the prerequisite for backtracking, trees, and DP. Spend real time here.

---

## 1. Arrays & Hashing
- **Core idea:** a hash map trades space for O(1) lookup, turning many O(n²) brute forces into O(n). "Have I seen X before / how many of X" → reach for a map/set.
- **Sub-patterns:** frequency counting; complement lookup; grouping by a computed key; index-as-hash (when values are 1..n).
- **Mastery bar:** You instinctively ask "what if I store *what I've seen* in a map?" before writing nested loops.
- **Problems:**
  - ⭐🔁 [E] Two Sum — complement in a map.
  - ⭐ [E] Contains Duplicate — set membership.
  - ⭐ [M] Group Anagrams — sorted string / char-count as key.
  - ⭐ [M] Top K Frequent Elements — map + bucket sort or heap.
  - [M] Valid Sudoku — sets per row/col/box.
  - [M] Product of Array Except Self — prefix/suffix products, no division.
  - [M] Longest Consecutive Sequence — set + only start streaks from sequence beginnings (O(n)).
  - [H] First Missing Positive — index-as-hash, in-place.

## 2. Two Pointers
- **Core idea:** two indices moving with intent on a (usually sorted) array — collapsing an O(n²) search into O(n).
- **Sub-patterns:** opposite ends converging (pair-sum); same-direction (fast/slow, dedup in place); partitioning (Dutch national flag).
- **Mastery bar:** You can prove *why* moving a specific pointer never skips a valid answer.
- **Problems:**
  - ⭐ [E] Valid Palindrome — converge from ends.
  - ⭐ [M] Two Sum II (sorted) — converge by comparing sum to target.
  - ⭐ [M] 3Sum — sort + fix one + two-pointer inner; dedup carefully.
  - [M] Container With Most Water — move the shorter wall.
  - [M] Sort Colors — Dutch national flag, 3-way partition.
  - [H] Trapping Rain Water — two pointers tracking max-left/max-right (also a stack/DP problem; learn all three).

## 3. Sliding Window
- **Core idea:** maintain a contiguous window and a running summary; expand the right edge, shrink the left when a constraint breaks. Turns "all subarrays" (O(n²)) into O(n).
- **Sub-patterns:** fixed-size window; variable window with a validity condition; window + frequency map.
- **Mastery bar:** You can articulate the invariant the window maintains and exactly when/why you shrink.
- **Problems:**
  - ⭐🔁 [M] Longest Substring Without Repeating Characters — shrink on duplicate.
  - ⭐ [M] Longest Repeating Character Replacement — window valid while (len − maxFreq) ≤ k.
  - ⭐ [M] Minimum Window Substring — expand to satisfy, contract to minimize (the canonical hard window).
  - [E] Best Time to Buy/Sell Stock — min-so-far is a degenerate window.
  - [M] Permutation in String — fixed window + freq match.
  - [H] Sliding Window Maximum — monotonic deque (bridges to stacks).

## 4. Prefix Sum & Difference Arrays
- **Core idea:** precompute cumulative sums so any range query is O(1); difference arrays make range *updates* O(1).
- **Sub-patterns:** subarray-sum-equals-k (prefix sum + map of seen sums); 2D prefix sums; range-update via diff array then one pass.
- **Problems:**
  - ⭐ [M] Subarray Sum Equals K — count prefix sums seen; map of `sum→count`.
  - [M] Range Sum Query 2D (Immutable) — 2D prefix.
  - [M] Product of Array Except Self — prefix/suffix variant.
  - [M] Car Pooling / Corporate Flight Bookings — difference array.

## 5. Binary Search
- **Core idea:** halve a *monotonic* search space each step. The space doesn't have to be an array — it can be the answer itself.
- **Sub-patterns:** classic find-in-sorted; lower/upper bound (first/last position); **binary search on the answer** (minimize the max / maximize the min); search in rotated array.
- **Mastery bar:** You can write a bug-free `lower_bound` from scratch and you recognize "monotonic predicate" disguised as an optimization problem.
- **Problems:**
  - ⭐🔁 [E] Binary Search — get the boundary conditions perfect.
  - ⭐ [M] Search in Rotated Sorted Array — decide which half is sorted.
  - ⭐ [M] Find First and Last Position — two boundary searches.
  - ⭐ [M] Koko Eating Bananas — binary search on the answer (eating speed).
  - [M] Find Minimum in Rotated Sorted Array — pivot finding.
  - [H] Median of Two Sorted Arrays — partition both arrays by binary search.
  - [H] Split Array Largest Sum — binary search on max subarray sum (the archetype "minimize the max").

## 6. Stacks & Monotonic Stack
- **Core idea:** LIFO for "match the most recent" problems; a *monotonic* stack finds the next/previous greater/smaller element in one pass.
- **Sub-patterns:** matching/validity; expression evaluation; **next greater element**; histogram-style largest-area.
- **Mastery bar:** When you see "next greater," "previous smaller," or "largest rectangle," your hand reaches for a monotonic stack automatically.
- **Problems:**
  - ⭐ [E] Valid Parentheses — push opens, match closes.
  - ⭐ [M] Min Stack — auxiliary stack of running mins.
  - ⭐ [M] Daily Temperatures — monotonic decreasing stack of indices.
  - [M] Evaluate Reverse Polish Notation — operand stack.
  - [M] Next Greater Element I/II — monotonic stack (II is circular).
  - [M] Generate Parentheses — backtracking with a stack-validity invariant.
  - [H] Largest Rectangle in Histogram — monotonic stack; the boss problem for this pattern.

## 7. Queues & Deque
- **Core idea:** FIFO for level-order/BFS; a deque gives O(1) both ends, enabling sliding-window extremes and monotonic queues.
- **Problems:**
  - [E] Implement Queue using Stacks (and vice versa).
  - [M] Design Circular Queue / Deque.
  - ⭐ [H] Sliding Window Maximum — monotonic deque (revisit from §3).
  - [M] Number of Recent Calls — queue eviction by time.

## 8. Linked Lists
- **Core idea:** pointer manipulation. The whole topic is about not losing your `next` while you rewire. Draw it.
- **Sub-patterns:** dummy/sentinel head; fast & slow pointers (cycle, middle); in-place reversal; merge.
- **Mastery bar:** You can reverse a list, detect+locate a cycle, and find the middle without re-deriving any of it.
- **Problems:**
  - ⭐🔁 [E] Reverse Linked List — iterative *and* recursive.
  - ⭐ [E] Merge Two Sorted Lists — dummy head.
  - ⭐ [M] Linked List Cycle II — Floyd's; know *why* the meeting-point math works.
  - ⭐ [M] Remove Nth Node From End — gap of n between two pointers.
  - [M] Reorder List — find middle + reverse second half + merge.
  - [M] Add Two Numbers — carry handling.
  - [M] LRU Cache — hashmap + doubly linked list (also a design classic).
  - [H] Merge k Sorted Lists — heap or divide-and-conquer.
  - [H] Reverse Nodes in k-Group — careful sub-list reversal.

## 9. Recursion & Backtracking
- **Core idea:** explore a decision tree; at each node make a choice, recurse, then *undo it* (backtrack). Prune branches that can't lead to a solution.
- **Sub-patterns:** subsets/combinations/permutations; constraint satisfaction (place + validate); grid/path exploration with visited-marking.
- **Mastery bar:** You can write the subset/permutation templates from memory and explain the time complexity as the size of the search tree.
- **Problems:**
  - ⭐🔁 [M] Subsets — include/exclude each element.
  - ⭐🔁 [M] Permutations — swap-in-place or used[] array.
  - ⭐ [M] Combination Sum — reuse allowed; sort + prune.
  - ⭐ [M] Word Search — DFS on grid with backtracking marks.
  - [M] Letter Combinations of a Phone Number — cartesian product via recursion.
  - [M] Palindrome Partitioning — partition + validity check.
  - [H] N-Queens — the canonical constraint-satisfaction problem.
  - [H] Sudoku Solver — backtracking with row/col/box constraints.

## 10. Trees (Binary Trees)
- **Core idea:** recursion's natural home. Most tree problems = "do something at each node by combining results from left and right subtrees." Decide: top-down (pass info down) or bottom-up (return info up)?
- **Sub-patterns:** the four traversals (pre/in/post/level); recursive divide-and-combine; tree DP (return a tuple up); BFS by level.
- **Mastery bar:** You can write all traversals iteratively *and* recursively, and you instinctively frame tree problems as "what do I return up from each node?"
- **Problems:**
  - ⭐🔁 [E] Maximum Depth / Invert Tree / Same Tree — warmups; build the recursion reflex.
  - ⭐ [M] Binary Tree Level Order Traversal — BFS by level.
  - ⭐ [M] Diameter of Binary Tree — return depth, track max path through node.
  - ⭐ [M] Lowest Common Ancestor (binary tree) — return where left/right meet.
  - [M] Right Side View — BFS last-of-level or DFS depth-first.
  - [M] Construct Tree from Preorder + Inorder — recursion on index ranges.
  - [H] Binary Tree Maximum Path Sum — bottom-up, return best straight path, track best bent path.
  - [H] Serialize and Deserialize Binary Tree — preorder with null markers.

## 11. Binary Search Trees
- **Core idea:** in-order traversal of a BST is sorted. Left < node < right is the invariant you exploit and must protect.
- **Problems:**
  - ⭐ [M] Validate BST — pass down (min, max) bounds; *not* just left<node<right locally.
  - ⭐ [M] Kth Smallest Element in BST — in-order, stop at k.
  - [M] Lowest Common Ancestor of BST — walk down using the ordering.
  - [M] Insert/Delete in a BST — pointer surgery, esp. delete-with-two-children.
  - [M] Convert Sorted Array to BST — middle = root, recurse.

## 12. Tries (Prefix Trees)
- **Core idea:** a tree where each path spells a string; shared prefixes share nodes. Turns prefix queries into O(length), not O(words).
- **Problems:**
  - ⭐ [M] Implement Trie (insert/search/startsWith) — the foundation.
  - [M] Design Add and Search Words — Trie + `.` wildcard via DFS.
  - [H] Word Search II — Trie + grid DFS; prune using the Trie (huge speedup vs naive).

## 13. Heaps / Priority Queues
- **Core idea:** O(1) peek at the extreme, O(log n) insert/extract. Whenever you need "the k largest/smallest" or "the current best repeatedly," think heap.
- **Sub-patterns:** top-K; two-heaps (median); merge k sorted; scheduling by priority.
- **Mastery bar:** You can explain heapify, why build-heap is O(n) not O(n log n), and pick heap-vs-sort by the constraint.
- **Problems:**
  - ⭐ [M] Kth Largest Element in Array — min-heap of size k, or quickselect.
  - ⭐ [M] Top K Frequent Elements — heap or bucket sort.
  - ⭐ [M] Task Scheduler — greedy with a max-heap by frequency.
  - [M] K Closest Points to Origin — heap or quickselect.
  - [H] Find Median from Data Stream — two heaps balanced around the median.
  - [H] Merge k Sorted Lists — min-heap of heads.

## 14. Greedy
- **Core idea:** make the locally optimal choice and *prove* it leads to the global optimum (exchange argument). The hard part is the proof, not the code.
- **Mastery bar:** You can state *why* the greedy choice is safe, and you know greedy's failure mode (when you actually need DP).
- **Problems:**
  - ⭐ [M] Jump Game — track furthest reachable.
  - ⭐ [M] Jump Game II — greedy BFS-by-level over reach.
  - [M] Gas Station — single pass, reset start on deficit.
  - [M] Hand of Straights — greedy grouping from smallest.
  - [H] Candy — two passes (left-to-right, right-to-left).

## 15. Intervals
- **Core idea:** sort by start (or end), then sweep. Almost every interval problem is "sort + one pass deciding merge/skip/count."
- **Mastery bar:** You reach for "sort by start, compare to previous end" reflexively.
- **Problems:**
  - ⭐ [M] Merge Intervals — sort by start, merge overlaps.
  - ⭐ [M] Insert Interval — three phases: before, overlapping, after.
  - [M] Non-overlapping Intervals — sort by end, greedy keep.
  - [M] Meeting Rooms II — min heap of end times, or sweep line of starts/ends.
  - [H] Employee Free Time — merge across all, find gaps.

## 16. Graphs
- **Core idea:** nodes + edges modeling relationships. Most "real" problems are graph problems in disguise (grids, dependencies, networks). Master the representations (adjacency list/matrix) and the two traversals, then everything is a variation.
- **Sub-patterns & algorithms — learn each cold:**
  - **BFS / DFS** — connectivity, reachability, shortest path in *unweighted* graphs (BFS).
  - **Grid as graph** — islands, flood fill, multi-source BFS.
  - **Topological sort** — ordering with dependencies (Kahn's / DFS); cycle detection in directed graphs.
  - **Union-Find (DSU)** — connectivity, cycle detection in undirected, with path compression + union by rank.
  - **Dijkstra** — shortest path, non-negative weights (heap-based).
  - **Bellman-Ford** — handles negative edges, detects negative cycles.
  - **Floyd-Warshall** — all-pairs shortest path.
  - **MST: Kruskal (DSU) / Prim (heap)** — minimum spanning tree.
  - (Awareness-level: A*, bipartite checking, SCC/Tarjan, max-flow — know they exist and what they solve.)
- **Mastery bar:** Given a word problem, you can model it as a graph (what are nodes? edges? weighted?) and pick the right algorithm with its complexity, in under a minute.
- **Problems:**
  - ⭐🔁 [M] Number of Islands — grid DFS/BFS.
  - ⭐ [M] Clone Graph — DFS/BFS with a visited map.
  - ⭐ [M] Course Schedule I/II — cycle detection + topological sort.
  - ⭐ [M] Rotting Oranges — multi-source BFS (time = levels).
  - [M] Pacific Atlantic Water Flow — reverse-direction BFS from borders.
  - [M] Graph Valid Tree / Number of Connected Components — Union-Find.
  - [M] Word Ladder — BFS over word-transformation graph.
  - ⭐ [M] Network Delay Time — Dijkstra.
  - [H] Cheapest Flights Within K Stops — Bellman-Ford / Dijkstra with state.
  - [H] Alien Dictionary — build graph from order + topological sort.
  - [H] Min Cost to Connect All Points — MST (Prim/Kruskal).
  - [H] Word Search II — (Trie + DFS, cross-listed).

## 17. Dynamic Programming
- **Core idea:** optimal substructure + overlapping subproblems → cache subresults. The whole game is *defining the state* (`dp[i]` = answer for prefix ending at i, etc.) and the transition. Always start with the recursive brute force, memoize it, then (optionally) convert to bottom-up tabulation.
- **Progression — do strictly in this order:**
  - **1D DP** — climbing stairs, house robber, decode ways.
  - **Knapsack family** — 0/1 knapsack, subset sum, partition equal subset, coin change (unbounded), target sum.
  - **Sequence DP** — LIS (and the O(n log n) patience-sorting version), LCS, edit distance.
  - **2D grid DP** — unique paths, min path sum, with-obstacles.
  - **String DP** — longest palindromic substring/subsequence, palindrome partitioning II.
  - **Interval DP** — matrix chain, burst balloons.
  - **DP on trees** — house robber III, max path.
  - **Bitmask DP** — TSP-style, "DP over subsets" (advanced).
  - **Digit DP** — count numbers with a property up to N (advanced/awareness).
- **Mastery bar:** You can name the *state* and the *transition* before writing any code, and you can convert top-down ↔ bottom-up and optimize space (rolling array). You stop seeing DP as scary and start seeing it as "smart recursion with a cache."
- **Problems (tiered through the progression):**
  - ⭐🔁 [E] Climbing Stairs — the "hello world" of DP.
  - ⭐ [M] House Robber I & II — include/exclude with adjacency constraint.
  - ⭐ [M] Coin Change — min coins, unbounded knapsack.
  - ⭐ [M] Longest Increasing Subsequence — O(n²) DP then O(n log n).
  - ⭐ [M] Word Break — DP over string with a dictionary.
  - ⭐ [M] Longest Common Subsequence — the 2D-DP archetype.
  - ⭐ [M] Unique Paths / Min Path Sum — grid DP.
  - [M] Partition Equal Subset Sum — subset-sum knapsack.
  - [M] Decode Ways — 1D DP with tricky transitions.
  - [M] Longest Palindromic Substring — expand-around-center or DP.
  - [M] Maximum Product Subarray — track min and max.
  - [H] Edit Distance — 2D DP, the classic.
  - [H] Burst Balloons — interval DP; hard state definition.
  - [H] Regular Expression Matching — 2D DP with `*`/`.`.
  - [H] Best Time to Buy/Sell Stock III/IV — state-machine DP.

## 18. Strings (pattern matching)
- **Core idea:** beyond two-pointer/window string problems, there's a specialized toolkit for substring search and structure.
- **Master:** KMP (failure function — *understand* it, you'll rarely implement it but it shows up), Rabin-Karp (rolling hash), Z-algorithm (awareness), Manacher's for palindromes (awareness).
- **Problems:**
  - [M] Implement strStr() — KMP or rolling hash.
  - [M] Repeated Substring Pattern — KMP failure-function insight.
  - [H] Shortest Palindrome — KMP on s + reverse(s).

## 19. Advanced structures (FAANG-hard / awareness for most)
- **Union-Find deep** — path compression + union by rank/size, near-O(1) amortized (inverse Ackermann). Know the implementation cold; it appears in mediums.
- **Segment Tree** — range query + point/range update in O(log n); lazy propagation for range updates. *Understand* it; implement once.
- **Fenwick Tree (BIT)** — prefix sums with updates in O(log n); cleaner than segment tree when you only need sums.
- **Sqrt decomposition** — the "good enough" middle ground; useful mental model.
- **Problems:**
  - [M] Range Sum Query – Mutable — Fenwick or segment tree.
  - [H] Count of Smaller Numbers After Self — BIT or merge-sort counting.
  - [H] Range Module / My Calendar III — segment tree with lazy.

## 20. Math & Geometry (occasional, mostly awareness)
- Number theory (modular inverse, CRT — awareness), basic computational geometry (orientation test, convex hull — awareness), probability/expected-value reasoning (shows up in design-y interviews).
- **Problems:**
  - [M] Happy Number — cycle detection on digit-square sums.
  - [M] Rotate Image — in-place matrix transpose + reverse.
  - [M] Spiral Matrix — boundary shrinking.

---

# TRACK 2 — Low-Level Design / OOD

This is where 6 YOE *should* shine. Interviewers test whether you can turn fuzzy requirements into clean, extensible class structures.

### 2.1 OOP at depth (not the textbook four pillars)
- Encapsulation, inheritance, polymorphism, abstraction — but the *real* skill is knowing when **composition beats inheritance** ("favor composition"), what an "is-a" vs "has-a" actually buys you, and how to keep objects cohesive and loosely coupled.
- **Probe you'll face:** "Why is deep inheritance a smell? Refactor this hierarchy to composition." Be ready to defend it live.

### 2.2 SOLID — be able to *spot violations*, not recite acronyms
- **S**ingle Responsibility, **O**pen/Closed, **L**iskov Substitution (the subtle one — know a real LSP violation, e.g. Square extends Rectangle), **I**nterface Segregation, **D**ependency Inversion.
- **Mastery bar:** Given a bad class, you name which principle it violates and refactor it.

### 2.3 Design Patterns — the 8–10 that actually appear
- **Creational:** Factory, Abstract Factory, Builder, Singleton (and why Singleton is often an anti-pattern), Prototype.
- **Structural:** Adapter, Decorator, Facade, Proxy (you literally built a YARP proxy layer — own this one), Composite.
- **Behavioral:** Strategy, Observer, State, Command, Template Method, Iterator, Chain of Responsibility (your `IExceptionHandler` pipeline is basically this).
- For each: the problem it solves, the structure, a real example *from your own codebase*. That last part is what separates senior from junior.

### 2.4 LLD interview problems — practice designing these end to end
Design the classes/interfaces, apply patterns, handle concurrency where relevant:
- ⭐ Parking Lot (the canonical) — spots, vehicles, pricing strategy.
- ⭐ LRU / LFU Cache — and discuss thread-safety.
- ⭐ Rate Limiter — token bucket / sliding window (you've built rate limiting; design it cleanly).
- ⭐ Elevator System — state machine + scheduling.
- Tic-Tac-Toe / Chess — board, pieces, rules engine.
- Notification Service — Strategy (email/SMS/push) + Observer.
- BookMyShow / Movie Booking — concurrency on seat selection (your distributed-lock knowledge applies).
- Logging framework / Vending machine / Splitwise — pick 2–3 and do them cold.

---

# TRACK 3 — System Design (HLD)

Your real production experience is a massive advantage here. The goal is to convert *what you built* into the *vocabulary and frameworks* interviewers expect. Don't memorize designs — internalize the building blocks so you can compose any system.

### 3.1 The fundamentals (know each cold)
- **Scalability:** vertical vs horizontal; stateless services as the enabler of horizontal scaling.
- **Latency vs throughput** — define both, know the tradeoff, know rough latency numbers (memory vs SSD vs network vs cross-region).
- **CAP theorem & PACELC** — and what "CP" vs "AP" means for a *real* database choice. Don't quote CAP shallowly; senior engineers will catch that.
- **Consistency models:** strong, eventual, causal, read-your-writes. When each is acceptable.
- **Load balancing:** L4 vs L7, algorithms (round-robin, least-connections, consistent hashing), health checks.
- **Caching:** cache-aside vs read-through vs write-through vs write-back; eviction (LRU/LFU/TTL); **cache stampede / thundering herd** (you solved this with semaphore + IMemoryCache — that's a *gold* story); cache invalidation strategies. Where caches live (client, CDN, app, DB).
- **CDN** — edge caching, when it helps.
- **Database scaling:** replication (leader-follower, replication lag), **sharding/partitioning** (range vs hash vs directory — you live this with 120+ tenant schemas), federation; read replicas; the consistency cost of each.
- **SQL vs NoSQL** — and the *real* axes: data model, consistency, scaling pattern, access patterns. Know KV / document / wide-column / graph and when each fits.
- **Message queues / streaming:** queue vs pub/sub vs log (Kafka); at-least-once vs at-most-once vs exactly-once (and why exactly-once is mostly a lie without idempotency); **idempotency**, dead-letter queues, backpressure, ordering guarantees. You run RabbitMQ pipelines — own the tradeoffs vs Kafka.
- **Rate limiting** (token bucket, leaky bucket, sliding window log/counter).
- **Consensus** (awareness → depth in Track 4): leader election, why you need it.
- **Observability:** logging, metrics, tracing (the three pillars); SLO/SLI/SLA; the difference. (Your YARP observability layer is a story here.)
- **Reliability:** redundancy, failover, circuit breakers, retries with backoff + jitter, bulkheads, graceful degradation.

### 3.2 The interview framework (use every time)
1. **Clarify** requirements (functional + non-functional) and **scope** it.
2. **Estimate** scale — QPS, storage, bandwidth (back-of-envelope; practice the arithmetic).
3. **API design** — the contract first.
4. **High-level diagram** — clients → LB → services → data stores → async workers.
5. **Data model** — schema + storage choice + *why*.
6. **Deep-dive** the 1–2 hardest parts (the interviewer steers here).
7. **Bottlenecks & tradeoffs** — scale it, find the breaking point, mitigate. *This is where seniority shows.*

### 3.3 Designs to practice (do ~12, deep)
Tier 1 (must): URL shortener · Rate limiter · Key-value store · Pastebin · Twitter/news feed · Chat (WhatsApp) · Notification system.
Tier 2: Web crawler · YouTube/Netflix (video) · Uber/Lyft (geo + matching) · Google Drive/Dropbox · Search autocomplete (typeahead) · Distributed cache (lean on your Redis depth) · Payment system (idempotency, exactly-once — you did StorePay).
Tier 3 (staff-flavored): Distributed message queue · Distributed task scheduler · Ad click aggregation · Stock exchange · Multi-tenant SaaS platform (literally your day job — be able to whiteboard *your own system* crisply; it's the best prep you have).

---

# TRACK 4 — CS Fundamentals (the "real engineer" core)

**This is the track that answers your actual fear** — standing in a room of strong engineers and not feeling hollow. DSA passes interviews; *this* makes you peer-level. Pitched at senior depth deliberately.

## 4.1 Operating Systems & Concurrency
- **What to understand:** process vs thread (address space, what's shared); context switching cost; user vs kernel mode, syscalls; **scheduling** (preemptive, priorities, starvation); **virtual memory** (paging, page faults, TLB, why memory feels infinite); the memory hierarchy and **cache locality** (why array beats linked list in practice — *this* is the answer to "but they're both O(n)"); **false sharing**.
- **Concurrency in depth:** race conditions, critical sections, mutex vs semaphore vs spinlock, **deadlock** (the four Coffman conditions + how to prevent), livelock, starvation; **atomicity & memory barriers / memory models** (why `volatile` isn't a lock; reordering); **lock-free / CAS**; the difference between **concurrency and parallelism**; why **async/await is not threads** (I/O-bound vs CPU-bound — critical for .NET).
- **Probe you'll face:** "You have a high-throughput service and lock contention is killing it — what do you do?" (Answer space: reduce critical-section size, lock striping, read-write locks, lock-free structures, sharding state, immutability.) "Walk me through what happens on a page fault." "Difference between a mutex and a semaphore — when each?"
- **Ties to your work:** the 24MB Redis key + AKS memory crisis, multi-pod session sharing, your semaphore-based stampede fix — these are *concurrency and memory* stories. Be able to explain them in OS terms, not just "I added a semaphore."

## 4.2 Networking
- **What to understand:** the layers (don't recite OSI — *understand* L3/L4/L7); **TCP vs UDP** (handshake, reliability, ordering, congestion/flow control — and when UDP wins); **IP, ports, NAT**; **DNS** end-to-end (recursive resolution, caching, TTL, records); **HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)** — head-of-line blocking, multiplexing; **HTTPS/TLS handshake** (symmetric vs asymmetric, certs, why it's secure); **WebSockets** vs long-polling vs SSE; **gRPC / Protobuf** vs REST; **REST vs GraphQL**; idempotent HTTP methods; status codes that matter.
- **Probe you'll face:** "What happens when you type a URL and hit enter?" (the all-time classic — be able to go from DNS → TCP → TLS → HTTP → render, with depth). "Why is HTTP/2 faster?" "When would you choose gRPC over REST?"
- **Ties to your work:** your YARP proxy is an L7 reverse proxy — own the L4/L7 distinction and what a reverse proxy buys you.

## 4.3 Databases (deep — your strongest fundamental, make it airtight)
- **Indexing internals:** **B-tree / B+-tree** (why DBs use them — fanout, disk-page alignment) vs **LSM-tree** (write-optimized, used by Cassandra/RocksDB) vs hash indexes; covering indexes; composite-index column order; when an index *hurts*. You've done partition pruning and index propagation — connect it to the B+-tree mental model.
- **Transactions & ACID** — and the *real* depth: **isolation levels** (read uncommitted → read committed → repeatable read → serializable) and the exact **anomalies** each prevents (dirty read, non-repeatable read, phantom read, write skew). Know which level Postgres defaults to.
- **MVCC** (how Postgres gives you snapshot isolation without read locks; the cost — bloat, VACUUM — which you've *felt* with your purging work).
- **Concurrency control:** pessimistic (locks) vs optimistic; 2-phase locking; deadlock detection in the DB.
- **Query execution:** how the planner picks a plan, `EXPLAIN ANALYZE`, seq scan vs index scan vs bitmap scan, join strategies (nested loop / hash / merge), why your 45s→sub-second fix worked *at the planner level*.
- **Partitioning** (you live this): declarative partitioning, partition pruning, the tradeoffs at 120+ schemas.
- **NoSQL data models & their tradeoffs**; **CAP applied to real databases**; **the dual-write / outbox problem** and why distributed transactions are hard.
- **Probe you'll face:** "Explain repeatable read vs serializable with an anomaly each prevents." "Your query is slow — walk me through diagnosing it." "When would you *not* add an index?"

## 4.4 Distributed Systems (the senior/staff differentiator)
- **What to understand:** **why distributed is hard** (partial failure, no global clock, network is unreliable — the fallacies of distributed computing); **CAP & PACELC** properly; **consistency spectrum** (linearizable → sequential → causal → eventual); **consensus** — **Raft** (understand leader election, log replication; you don't need to implement Paxos, but know *why* consensus exists); **replication** (sync vs async, quorums, read/write quorum `W+R>N`); **partitioning + consistent hashing** (and virtual nodes); **vector clocks / Lamport timestamps** (ordering without a global clock); **idempotency & exactly-once** (and why it's really at-least-once + dedup); **the outbox pattern, sagas, 2PC** (and why 2PC is avoided); **eventual consistency patterns** (CRDTs — awareness); **failure detection, heartbeats, gossip**; **distributed transactions & the dual-write problem**.
- **Probe you'll face:** "How does Raft elect a leader?" "You're writing to a DB and publishing to Kafka — how do you keep them consistent?" (outbox/CDC — and you can tie this to your RabbitMQ pipelines). "What does `W + R > N` give you?" "Why can't you have exactly-once delivery?"
- **Ties to your work:** multi-tenant sharding = partitioning; your RabbitMQ pipelines = at-least-once + idempotency; distributed Redis sessions = replicated state. You've *operated* distributed systems — now learn the theory names for what you already do, and you'll speak as a peer.

## 4.5 .NET / CLR runtime depth (own your own stack)
A principal engineer will assume you know your runtime cold. Make sure you do:
- **Memory:** stack vs heap, value vs reference types, boxing/unboxing cost, `struct` vs `class`, `Span<T>`/`Memory<T>` (zero-copy), `stackalloc`.
- **Garbage collection:** generational GC (gen 0/1/2), the Large Object Heap, workstation vs server GC, GC pauses, what causes gen-2 collections, `IDisposable`/finalizers and *why* finalizers are a last resort.
- **Async internals:** what `async/await` compiles to (state machine), `Task` vs `ValueTask`, the synchronization context, **deadlocks from `.Result`/`.Wait()`**, `ConfigureAwait(false)`, thread-pool starvation.
- **Threading:** `lock`/`Monitor`, `Interlocked`, `SemaphoreSlim` (you used this), `ConcurrentDictionary`, `Channel<T>`.
- **The pipeline:** how ASP.NET Core middleware works (you built `IExceptionHandler` handling — own the request pipeline), DI container lifetimes (singleton/scoped/transient and the captive-dependency trap), `IHostedService`/`BackgroundService`.
- **Probe you'll face:** "What happens when you `await`?" "Why did `.Result` deadlock?" "Walk me through a gen-2 GC." "Scoped service injected into a singleton — what breaks?"

---

# TRACK 5 — Behavioral & Seniority Signaling

Senior interviews are *lost* here as often as in coding. You have the raw material; it's unpackaged.

- **Build a story bank (8–12 STAR stories)** from your real work: the Redis stampede fix, the 24MB key + AKS crisis, partition pruning (45s→sub-second), the multi-schema deployment scripts, the DB purging task with retention policies, the RabbitMQ KT you authored, mentoring 2–3 juniors, the YARP observability layer. For each: **S**ituation, **T**ask, **A**ction (*your* specific decisions), **R**esult (quantified).
- **The seniority signals interviewers grade:** scope (system vs feature), ambiguity handling, tradeoff articulation, influence/mentoring, dealing with failure, disagreement-and-commit, ownership beyond your ticket.
- **Common prompts to have answers for:** hardest technical problem; a time you disagreed with a senior/manager; a project that failed and what you learned; how you mentor; a time you pushed back on scope; how you handle production incidents.
- **Company flavors:** Amazon → 16 Leadership Principles, two stories each. Google → "Googleyness" + general cognitive ability. Most GCCs/product cos → general impact + ownership. Prep the framework, not 200 memorized answers.
- **Drill:** narrate each story out loud in ≤2 minutes. Record yourself once. The gap between "I know what I did" and "I can tell it crisply under pressure" is real, and it's pure reps.

---

# CHECKPOINTS — the bar I'm holding you to

### At 2–3 months (switch-ready)
- **DSA:** mediums solved fluently in ~25–30 min; topics 1–17 covered; ~150+ problems done with the ⭐ set automatic. You rarely get *stuck on the approach* — execution might wobble, approach shouldn't.
- **System Design:** can run the framework end-to-end on any Tier-1/2 problem; can whiteboard your own DR platform crisply.
- **LLD:** can design any 1–2 of the canonical problems live with clean classes + a justified pattern.
- **Fundamentals:** solid on Databases + the OS/concurrency basics; can answer the "URL to render" and "what happens on await" class of questions.
- **Behavioral:** story bank built, each told in ≤2 min.
- **Output:** actively interviewing, real pipeline at GCC/product level.

### At 6 months (FAANG-ready + genuinely strong)
- **DSA:** mediums are routine, hards are *approachable* (you make real progress on a fresh hard in 45 min); graphs and DP — the two filters — are strengths, not survival.
- **System Design:** staff-flavored designs; you drive the tradeoff conversation instead of waiting for prompts.
- **Fundamentals:** all of Track 4 at *peer* depth — you can hold a distributed-systems or DB-internals conversation with a principal engineer and contribute, not nod. **This is the goal you actually stated, and it's the one that outlasts any single job.**
- **Behavioral:** company-tailored, scope-forward, calm under follow-up pressure.

---

## Appendix — wiring this into your tool (optional, since you're building it)

If it helps your data model, every DSA problem here maps cleanly to:

```json
{
  "id": "two-sum",
  "topic": "Arrays & Hashing",
  "title": "Two Sum",
  "difficulty": "Easy",
  "core": true,          // the ⭐ set
  "revisit": false,      // the 🔁 set
  "pattern": "complement-in-hashmap",
  "teaches": "Trade space for O(1) lookup to avoid the nested loop.",
  "status": "todo|doing|done",
  "starred": false,      // your own revision flag
  "notes": ""
}
```

Topics carry order (the sequence above is deliberate — don't shuffle it), and each topic has `coreIdea`, `subPatterns[]`, `masteryBar`, and `problems[]`. The depth tracks (2–5) are better modeled as checklists of *concepts* with a "can I explain this out loud?" boolean rather than problems — that single boolean is the most honest progress metric in this whole document.
