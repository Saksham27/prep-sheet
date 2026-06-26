# DSA — Detailed Reference (Track 1, expanded)

> This replaces the problem-list version of Track 1. Every pattern below has its mechanics + a reusable C# template you can lift into an interview. Every problem has **Insight** (the one realization that unlocks it), **Approach** (how the algorithm actually runs), **Complexity**, and **Watch** (the bug or edge case that fails you). Templates are in C# 12 / .NET 8.
>
> How to use it: read the pattern + template, internalize the template until you can type it blind, then do the problems. The `🔁` problems you re-solve from memory weekly until the template is reflex.

---

## 0. Foundations

### 0.1 Complexity — the part people get wrong
Big-O is the **upper bound on growth as n→∞**, dropping constants and lower terms. But interview-relevant nuance:

- **Amortized vs worst-case.** A dynamic array's `Add` is O(n) on the resize but O(1) *amortized* because resizes double capacity, so the total cost of n inserts is O(2n) → O(1) each. Say "amortized" out loud when it applies; it signals you understand the mechanism, not the headline.
- **Recursion → space.** Every recursive call frame sits on the stack. A recursion of depth d uses O(d) space *even if it returns nothing*. This is why a skewed tree DFS is O(n) space and balanced is O(log n).
- **Recurrences.** Divide-and-conquer cost: T(n) = a·T(n/b) + f(n). Master Theorem shortcut — for T(n)=2T(n/2)+O(n) (merge sort) → O(n log n). Memorize the three common ones: binary search T(n)=T(n/2)+O(1)→O(log n); merge sort →O(n log n); naive Fibonacci T(n)=T(n-1)+T(n-2)→O(2ⁿ).

**Self-test you must pass:** state the time *and space* of anything you write, plus the input that triggers the worst case.

### 0.2 Bit manipulation — the tricks that recur
```csharp
x & 1            // is x odd?
x >> 1           // divide by 2
x << k           // multiply by 2^k
x & (x - 1)      // clears the lowest set bit  -> loop to count set bits
x & (-x)         // isolates the lowest set bit
x ^ x == 0       // XOR of a value with itself cancels
mask | (1 << i)  // set bit i      mask & ~(1 << i)  // clear bit i
(mask >> i) & 1  // read bit i
```
**Why XOR matters:** `a ^ a = 0` and `a ^ 0 = a`, and it's commutative. So XOR-ing a whole array where every element appears twice except one leaves the unique element. This is the entire "Single Number" family.

- ⭐ **[E] Single Number** — *Insight:* pairs cancel under XOR. *Approach:* fold XOR across the array. *Complexity:* O(n)/O(1). *Watch:* don't reach for a hashmap; XOR is the O(1)-space answer they want.
- **[E] Number of 1 Bits** — *Insight:* `n & (n-1)` removes one set bit per step. *Approach:* loop, count, until 0. *Complexity:* O(set bits). *Watch:* in C# use `uint` to avoid sign issues, or `BitOperations.PopCount`.
- **[M] Counting Bits** — *Insight:* `bits[i] = bits[i >> 1] + (i & 1)`. *Approach:* DP using the already-computed half. *Complexity:* O(n). *Watch:* this is secretly a DP problem.
- **[M] Single Number II** (every element thrice but one) — *Insight:* count each bit position mod 3. *Approach:* sum bits per position across all numbers; bits with count%3≠0 belong to the answer. *Complexity:* O(32n). *Watch:* the elegant version uses two accumulators (ones/twos) — know it exists.

### 0.4 Recursion mindset (the prerequisite for half this document)
The mental contract: **assume the recursive call already works on the smaller input; you only handle (a) the base case and (b) combining the smaller result.** This "leap of faith" is what lets you write tree/backtracking/DP code without simulating the whole stack in your head.

```csharp
// Shape every recursion this way:
ReturnType Solve(State s) {
    if (BaseCase(s)) return BaseAnswer;     // (a)
    var smaller = Solve(Reduce(s));         // trust it
    return Combine(s, smaller);             // (b)
}
```
If you can't identify the base case and the "one step smaller," you don't have the recursion yet.

---

## 1. Arrays & Hashing

**Core idea.** A hash map buys O(1) average lookup, converting "for each element, search the rest" (O(n²)) into "for each element, check what I've already seen" (O(n)). The trade is O(n) space.

**Recognition signals.** "Have I seen X?", "how many of X?", "is there a pair/group with property P?", "find the duplicate/missing." Any of these → map or set.

**Template — seen-set / frequency:**
```csharp
var freq = new Dictionary<int,int>();
foreach (var x in nums)
    freq[x] = freq.GetValueOrDefault(x) + 1;
```

**Watch globally:** dictionary lookups are *average* O(1), worst O(n) under adversarial hashing — fine for interviews, but say "average." For values constrained to 1..n, an array (or the array itself, index-as-hash) beats a dictionary and uses O(1) extra space — interviewers love that upgrade.

- ⭐🔁 **[E] Two Sum** — *Insight:* for each x, the partner you need is `target - x`; remember numbers you've passed. *Approach:* one pass; before inserting x, check if its complement is already in the map. *Complexity:* O(n)/O(n). *Watch:* check complement *before* inserting current, or you'll match an element with itself.
- ⭐ **[E] Contains Duplicate** — *Insight:* a set tells you membership in O(1). *Approach:* add as you go, return true on first re-add. *Complexity:* O(n)/O(n). *Watch:* O(1)-space alternative is sort-then-scan at O(n log n) — mention the trade.
- ⭐ **[M] Group Anagrams** — *Insight:* anagrams share a canonical key. *Approach:* key = sorted string *or* a 26-length count vector; group into a `Dictionary<string, List<string>>`. *Complexity:* O(n·k log k) with sorted key, O(n·k) with count key (k = word length). *Watch:* the count-vector key avoids the sort and is the better answer.
- ⭐ **[M] Top K Frequent Elements** — *Insight:* you don't need a full sort. *Approach:* frequency map → bucket array indexed by count (bucket sort), collect from high counts; O(n). Or a size-k min-heap, O(n log k). *Complexity:* O(n) bucket / O(n log k) heap. *Watch:* bucket sort beats the heap here and surprises interviewers.
- **[M] Product of Array Except Self** — *Insight:* answer[i] = (product of everything left) × (product of everything right). *Approach:* prefix pass storing left-products, suffix pass multiplying right-products in place. *Complexity:* O(n)/O(1) extra. *Watch:* division is banned (and breaks on zeros) — that's the whole point.
- **[M] Valid Sudoku** — *Insight:* validity = no duplicate within any row, column, or 3×3 box. *Approach:* 9 sets each for rows/cols/boxes; box index = `(r/3)*3 + c/3`. *Complexity:* O(1) (fixed 81 cells). *Watch:* the box-index formula is the only tricky part.
- **[M] Longest Consecutive Sequence** — *Insight:* only *start counting* a run from a number whose predecessor is absent. *Approach:* dump into a set; for each x with no `x-1` in set, walk x, x+1, x+2… counting. *Complexity:* O(n) (each number visited at most twice). *Watch:* without the "only start at run-beginnings" guard it degrades to O(n²).
- **[H] First Missing Positive** — *Insight:* the answer is in [1, n+1]; use the array indices as a hash. *Approach:* place each value v into slot v-1 by swapping (cyclic sort); then the first slot where `a[i] != i+1` gives the answer. *Complexity:* O(n)/O(1). *Watch:* ignore values ≤0 or >n; the in-place swap loop is the trick that achieves O(1) space.

---

## 2. Two Pointers

**Core idea.** Two indices moving with intent over a (usually sorted) array, so each does O(1) work and together they cover O(n) instead of O(n²).

**Recognition signals.** Sorted array + "find a pair/triple," palindrome checks, in-place dedup/partition, "remove/move elements in place."

**Template — converging (pair on sorted):**
```csharp
int l = 0, r = a.Length - 1;
while (l < r) {
    int sum = a[l] + a[r];
    if (sum == target) { /* found */ break; }
    else if (sum < target) l++;   // need bigger -> raise the floor
    else r--;                     // need smaller -> lower the ceiling
}
```
The correctness argument you must be able to give: at each step the current pair is either the answer or one pointer can be safely discarded forever, because the array is sorted.

- ⭐ **[E] Valid Palindrome** — *Insight:* mirror comparison from both ends. *Approach:* skip non-alphanumerics, lowercase, compare l/r inward. *Complexity:* O(n)/O(1). *Watch:* the filtering (`char.IsLetterOrDigit`) is where bugs hide, not the pointer logic.
- ⭐ **[M] Two Sum II (sorted)** — *Insight:* the converging template directly. *Approach:* see template. *Complexity:* O(n)/O(1). *Watch:* 1-indexed output in the classic version.
- ⭐ **[M] 3Sum** — *Insight:* fix one number, then it's Two-Sum-sorted on the rest. *Approach:* sort; for each i, run converging pointers on (i+1, end) for target `-a[i]`; **skip duplicates** at i and after each match. *Complexity:* O(n²)/O(1) (excluding output). *Watch:* duplicate handling is the whole difficulty — skip equal values at all three positions.
- **[M] Container With Most Water** — *Insight:* area is bounded by the *shorter* wall, so moving the taller one can never help. *Approach:* converge; always move the shorter pointer inward, track max area. *Complexity:* O(n)/O(1). *Watch:* prove why moving the shorter wall is safe — that's the interview question behind the question.
- **[M] Sort Colors (Dutch flag)** — *Insight:* three regions (0s, 1s, 2s) maintained by three pointers. *Approach:* `low`, `mid`, `high`; mid scans, swap 0s to front, 2s to back; don't advance mid after swapping with high. *Complexity:* O(n)/O(1), single pass. *Watch:* after swapping `mid` with `high`, *don't* increment mid (the swapped-in value is unexamined).
- **[H] Trapping Rain Water** — *Insight:* water above index i = min(maxLeft, maxRight) − height[i]. *Approach:* two pointers tracking running maxLeft/maxRight; advance the side with the smaller wall (it bounds the water). *Complexity:* O(n)/O(1). *Watch:* know all three solutions (DP-prefix-max, stack, two-pointer); two-pointer is the O(1)-space flex.

---

## 3. Sliding Window

**Core idea.** Maintain a contiguous range and a running summary; **expand right** to include more, **shrink left** when an invariant breaks. Each index enters and leaves the window once → O(n) instead of O(n²) over all subarrays.

**Recognition signals.** "Longest/shortest/count of substrings or subarrays satisfying condition C" where C is monotonic-ish (adding elements only makes it more/less valid).

**Template — variable window (longest satisfying C):**
```csharp
int left = 0, best = 0;
var state = new Dictionary<char,int>();
for (int right = 0; right < s.Length; right++) {
    Add(s[right], state);                 // include right
    while (!Valid(state)) {                // invariant broken?
        Remove(s[left], state); left++;    // shrink from left
    }
    best = Math.Max(best, right - left + 1);
}
```
For "shortest satisfying C," flip it: shrink *while still valid* and record the min each time the window becomes valid.

- ⭐🔁 **[M] Longest Substring Without Repeating Characters** — *Insight:* window is valid while all chars are unique. *Approach:* on duplicate, shrink left past the previous occurrence. *Complexity:* O(n)/O(min(n,charset)). *Watch:* using a last-seen-index map lets you jump left in O(1) instead of shrinking one step at a time.
- ⭐ **[M] Longest Repeating Character Replacement** — *Insight:* window is valid while `(windowLength − countOfMostFrequentChar) ≤ k` (those are the chars you'd replace). *Approach:* track char counts and the running max frequency; shrink when the replacement budget is exceeded. *Complexity:* O(n). *Watch:* you don't need to recompute maxFreq on shrink — a slightly stale max still yields a correct answer (classic subtlety).
- ⭐ **[M] Minimum Window Substring** — *Insight:* expand until the window covers all required chars, then contract to minimize while it still covers. *Approach:* need-map of target counts + a `have/need` counter; expand right, and while satisfied, record length and shrink left. *Complexity:* O(n). *Watch:* this is the hardest standard window — get the `have==need` bookkeeping exactly right.
- **[E] Best Time to Buy/Sell Stock** — *Insight:* it's a degenerate window — track the minimum price seen and the best profit against it. *Approach:* one pass, `min = Math.Min(min, price)`, `best = Math.Max(best, price - min)`. *Complexity:* O(n)/O(1).
- **[M] Permutation in String** — *Insight:* a permutation = a fixed-size window with matching character counts. *Approach:* fixed window of len(target); slide and compare count vectors. *Complexity:* O(n). *Watch:* compare 26-length vectors, not sorted strings, to stay O(1) per check.
- **[H] Sliding Window Maximum** — *Insight:* maintain a deque of *indices* whose values are decreasing; the front is always the window max. *Approach:* pop smaller values from the back before pushing; pop the front when it slides out of range. *Complexity:* O(n). *Watch:* store indices (to detect expiry), not values; this is the bridge into monotonic structures.

---

## 4. Prefix Sum & Difference Arrays

**Core idea.** Precompute cumulative sums so any range sum is `pre[r+1] − pre[l]` in O(1). The mirror trick — a **difference array** — makes range *updates* O(1), applied lazily with one final pass.

**Template — prefix-sum-equals-k:**
```csharp
var seen = new Dictionary<long,int> { [0] = 1 }; // empty prefix
long sum = 0; int count = 0;
foreach (var x in nums) {
    sum += x;
    count += seen.GetValueOrDefault(sum - k); // a prior prefix that makes (sum - prior)=k
    seen[sum] = seen.GetValueOrDefault(sum) + 1;
}
```

- ⭐ **[M] Subarray Sum Equals K** — *Insight:* subarray (l,r] sums to k iff `pre[r] − pre[l] = k`, i.e. a prior prefix equals `pre[r] − k`. *Approach:* the template above. *Complexity:* O(n)/O(n). *Watch:* seed the map with `{0:1}` for subarrays starting at index 0; handles negatives where sliding window can't.
- **[M] Range Sum Query 2D (Immutable)** — *Insight:* 2D prefix where `pre[i][j]` = sum of the rectangle from origin. *Approach:* inclusion-exclusion to build and to query. *Complexity:* O(mn) build, O(1) query. *Watch:* the four-term inclusion-exclusion (add two, subtract two… plus the corner) is the only tricky part.
- **[M] Corporate Flight Bookings / Car Pooling** — *Insight:* a range `+v` over [l,r] = `diff[l] += v; diff[r+1] -= v`, then prefix-sum the diff array. *Approach:* apply all updates as endpoints, sweep once. *Complexity:* O(n + updates). *Watch:* the `r+1` boundary and array sizing.

---

## 5. Binary Search

**Core idea.** Each step halves a **monotonic** search space. The space is often the array, but the real power is binary-searching the **answer**: when a predicate `feasible(x)` is monotonic (false…false, true…true), find the boundary.

**Template — lower bound (first index with a[i] ≥ target):**
```csharp
int LowerBound(int[] a, int target) {
    int lo = 0, hi = a.Length;        // hi exclusive
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2; // avoids overflow
        if (a[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;                         // insertion point; == a.Length if none
}
```

**Template — binary search on the answer:**
```csharp
int lo = minPossible, hi = maxPossible;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (Feasible(mid)) hi = mid;       // mid works; try smaller
    else lo = mid + 1;                 // mid too small; go bigger
}
return lo;                             // smallest feasible answer
```

**Watch globally:** pick *one* invariant convention (half-open `[lo,hi)` above) and never mix it with inclusive `hi`. Most binary-search bugs are off-by-one from mixing conventions. Always `lo + (hi-lo)/2`.

- ⭐🔁 **[E] Binary Search** — *Insight:* the canonical loop; get boundaries perfect. *Approach:* standard. *Complexity:* O(log n). *Watch:* memorize the half-open template so you never re-derive it under pressure.
- ⭐ **[M] Search in Rotated Sorted Array** — *Insight:* at any mid, *one half is still sorted* — determine which, then decide if target lies in it. *Approach:* compare `a[mid]` to `a[lo]` to identify the sorted half; narrow accordingly. *Complexity:* O(log n). *Watch:* duplicates break the "which half is sorted" test (that's the harder II variant).
- ⭐ **[M] Find First and Last Position** — *Insight:* it's two boundary searches — lower bound of target and lower bound of target+1 minus one. *Approach:* run LowerBound twice. *Complexity:* O(log n). *Watch:* reuse the exact template; don't write two bespoke searches.
- ⭐ **[M] Koko Eating Bananas** — *Insight:* "minimum speed such that she finishes in H hours" is monotonic in speed → binary-search the speed. *Approach:* feasible(speed) = total hours ≤ H; search [1, max pile]. *Complexity:* O(n log maxPile). *Watch:* hours per pile = `ceil(pile/speed)` = `(pile + speed - 1)/speed`.
- **[M] Find Minimum in Rotated Sorted Array** — *Insight:* the min is the single inversion point. *Approach:* compare `a[mid]` to `a[hi]`; if greater, min is right of mid, else at/left. *Complexity:* O(log n). *Watch:* compare against `a[hi]`, not `a[lo]`, to handle the no-rotation case cleanly.
- **[H] Split Array Largest Sum** — *Insight:* "minimize the largest subarray sum across k splits" → binary-search that largest-sum value; feasible(x) = the array can be cut into ≤ k pieces each ≤ x. *Approach:* search [max element, total sum]; greedily count pieces. *Complexity:* O(n log(sum)). *Watch:* this archetype ("minimize the max / maximize the min") is a top-tier FAANG pattern — recognize it instantly.
- **[H] Median of Two Sorted Arrays** — *Insight:* binary-search the partition point of the smaller array so left halves of both = right halves in count, with maxLeft ≤ minRight. *Approach:* partition search on the shorter array. *Complexity:* O(log min(m,n)). *Watch:* the ±∞ sentinels for empty partitions; this is genuinely hard — learn it cold, it's a known filter.

---

## 6. Stacks & Monotonic Stack

**Core idea.** LIFO matches "the most recent unmatched thing." A **monotonic stack** (kept increasing or decreasing) answers "next/previous greater/smaller element" for every index in one O(n) pass.

**Template — next greater element (indices, decreasing stack):**
```csharp
var res = new int[n]; Array.Fill(res, -1);
var st = new Stack<int>();                 // holds indices
for (int i = 0; i < n; i++) {
    while (st.Count > 0 && nums[st.Peek()] < nums[i])
        res[st.Pop()] = nums[i];           // i is the next-greater for popped index
    st.Push(i);
}
```
The invariant: the stack holds indices still *waiting* for their next-greater, in decreasing value order.

- ⭐ **[E] Valid Parentheses** — *Insight:* a close must match the most recent open. *Approach:* push opens, on a close pop and verify the pair. *Complexity:* O(n). *Watch:* reject if the stack is empty on a close, or non-empty at the end.
- ⭐ **[M] Min Stack** — *Insight:* keep a parallel stack of running minimums. *Approach:* on push, store `min(value, currentMin)`; pop both together. *Complexity:* O(1) per op. *Watch:* the parallel-min stack must push on *every* push, even when min doesn't change.
- ⭐ **[M] Daily Temperatures** — *Insight:* "days until a warmer day" = distance to next-greater. *Approach:* monotonic decreasing stack of indices; on a warmer day, pop and set the gap. *Complexity:* O(n). *Watch:* store indices to compute the distance.
- **[M] Evaluate Reverse Polish Notation** — *Insight:* operands wait on a stack until an operator consumes two. *Approach:* push numbers, on operator pop two (order matters for `-` and `/`). *Complexity:* O(n). *Watch:* operand order: `b` is popped first, compute `a op b`.
- **[M] Generate Parentheses** — *Insight:* it's backtracking with a validity invariant (opens used ≤ n, closes ≤ opens). *Approach:* recurse adding `(` if available, `)` if it keeps balance. *Complexity:* O(Catalan(n)). *Watch:* listed here because the validity rule is stack-shaped; the algorithm is backtracking (see §9).
- **[H] Largest Rectangle in Histogram** — *Insight:* for each bar, the widest rectangle of its height extends until a shorter bar on each side — exactly previous-smaller and next-smaller. *Approach:* monotonic increasing stack; when a shorter bar arrives, pop and compute area `height × width` using the new boundaries. *Complexity:* O(n). *Watch:* the boss of this pattern; "Maximal Rectangle" (2D) reduces to running this per row.

---

## 7. Queues & Deque

**Core idea.** FIFO drives level-order/BFS. A deque (O(1) both ends) enables monotonic-queue tricks (window extremes) and circular buffers.

- **[E] Implement Queue using Stacks** — *Insight:* two stacks; reverse lazily. *Approach:* push to `in`; when popping, if `out` empty, drain `in`→`out`. *Complexity:* amortized O(1). *Watch:* only transfer when `out` is empty, or you scramble order.
- **[M] Design Circular Deque** — *Insight:* fixed array + head/tail with modular arithmetic. *Approach:* track size; `(idx + cap) % cap` for wraparound. *Complexity:* O(1). *Watch:* distinguishing full vs empty (keep an explicit count).
- ⭐ **[H] Sliding Window Maximum** — see §3 (deque of decreasing indices). *Watch:* it's a queue problem and a window problem; know it from both angles.

---

## 8. Linked Lists

**Core idea.** Pure pointer surgery. The recurring hazards: losing your `next` before you rewire, and forgetting the head can change (so use a **dummy/sentinel** node). The two power moves: **fast/slow pointers** and **in-place reversal**.

**Template — reverse a list:**
```csharp
ListNode prev = null, cur = head;
while (cur != null) {
    var next = cur.next;   // save before rewiring
    cur.next = prev;       // reverse the link
    prev = cur; cur = next;
}
return prev;               // new head
```
**Template — fast/slow (middle / cycle):**
```csharp
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;          // +1
    fast = fast.next.next;     // +2
    if (slow == fast) { /* cycle detected */ }
}
// when fast hits the end, slow is at the middle
```

- ⭐🔁 **[E] Reverse Linked List** — *Insight:* rewire each `next` to point backward. *Approach:* the template; also know the recursive form. *Complexity:* O(n)/O(1) iter, O(n) stack recursive. *Watch:* save `next` *before* overwriting it.
- ⭐ **[E] Merge Two Sorted Lists** — *Insight:* a dummy head removes the special-case for the first node. *Approach:* splice the smaller head each step; attach the leftover tail. *Complexity:* O(n+m)/O(1). *Watch:* the dummy node is what keeps this clean.
- ⭐ **[M] Linked List Cycle II** (find cycle start) — *Insight:* after Floyd's meeting, a pointer from head and one from the meeting point advance at equal speed and collide at the cycle entrance. *Approach:* detect meeting, then reset one to head, step both by 1. *Complexity:* O(n)/O(1). *Watch:* be able to *derive* why the math works (distance algebra), not just recite it — interviewers push on this.
- ⭐ **[M] Remove Nth Node From End** — *Insight:* a gap of n between two pointers locates the target in one pass. *Approach:* advance `fast` n steps, then move both until `fast` ends; `slow.next` is the node to drop. *Complexity:* O(n)/O(1). *Watch:* use a dummy head so removing the actual head is not a special case.
- **[M] Reorder List** — *Insight:* it's three known sub-skills composed. *Approach:* find middle (fast/slow) → reverse second half → merge the two halves alternately. *Complexity:* O(n)/O(1). *Watch:* split cleanly so the first half's tail is nulled.
- **[M] Add Two Numbers** — *Insight:* simulate grade-school addition with a carry. *Approach:* walk both lists, sum + carry, emit digit. *Complexity:* O(max(n,m)). *Watch:* the final leftover carry needs an extra node.
- **[M] LRU Cache** — *Insight:* O(1) get/put needs hashmap (key→node) + doubly linked list (recency order). *Approach:* on access, move node to front; on overflow, evict the tail. *Complexity:* O(1) per op. *Watch:* a *doubly* linked list (so you can unlink in O(1)); sentinel head+tail nodes kill edge cases. This is also a design favorite.
- **[H] Merge k Sorted Lists** — *Insight:* always pull the global minimum head. *Approach:* min-heap of the k heads (O(n log k)), or divide-and-conquer pairwise merge. *Complexity:* O(n log k). *Watch:* heap comparator on node value; push the popped node's `next`.
- **[H] Reverse Nodes in k-Group** — *Insight:* reverse each block of k, leave a remainder of <k untouched. *Approach:* check k nodes remain, reverse the block, recurse/iterate on the rest, reconnect. *Complexity:* O(n)/O(1). *Watch:* the reconnection between reversed groups is where it breaks.

---

## 9. Recursion & Backtracking

**Core idea.** Walk a decision tree: **choose → explore (recurse) → un-choose (backtrack)**. Prune branches that cannot succeed. Complexity = number of nodes in the explored tree.

**Template — subsets / combinations:**
```csharp
void Backtrack(int start, List<int> path) {
    res.Add(new List<int>(path));            // every node is a valid subset
    for (int i = start; i < nums.Length; i++) {
        path.Add(nums[i]);                   // choose
        Backtrack(i + 1, path);              // explore (i+1 = no reuse)
        path.RemoveAt(path.Count - 1);       // un-choose
    }
}
```
**Template — permutations (used[] array):**
```csharp
void Backtrack(List<int> path, bool[] used) {
    if (path.Count == nums.Length) { res.Add(new(path)); return; }
    for (int i = 0; i < nums.Length; i++) {
        if (used[i]) continue;
        used[i] = true; path.Add(nums[i]);
        Backtrack(path, used);
        path.RemoveAt(path.Count - 1); used[i] = false;
    }
}
```

- ⭐🔁 **[M] Subsets** — *Insight:* each element is independently in or out; the recursion tree's every node is an answer. *Approach:* the combinations template. *Complexity:* O(n·2ⁿ). *Watch:* copy `path` when adding (it's mutated as you backtrack).
- ⭐🔁 **[M] Permutations** — *Insight:* fill positions, marking used elements. *Approach:* the used[] template. *Complexity:* O(n·n!). *Watch:* reset `used[i]=false` on the way back up.
- ⭐ **[M] Combination Sum** — *Insight:* unlimited reuse → recurse with the *same* start index. *Approach:* sort; prune when the remaining target goes negative. *Complexity:* exponential, pruned. *Watch:* `i` (not `i+1`) on the recursive call allows reuse; sorting enables early break.
- ⭐ **[M] Word Search** — *Insight:* DFS from each cell, marking the path to avoid reuse. *Approach:* 4-directional DFS matching the next letter; temporarily overwrite the visited cell, restore on backtrack. *Complexity:* O(m·n·4^L). *Watch:* restore the cell after recursion — the classic "mark and unmark."
- **[M] Letter Combinations of a Phone Number** — *Insight:* cartesian product across digit→letters maps. *Approach:* recurse one digit deep per level. *Complexity:* O(4ⁿ·n). *Watch:* the empty-input edge case.
- **[M] Palindrome Partitioning** — *Insight:* try every prefix; recurse on the rest only if the prefix is a palindrome. *Approach:* backtrack over cut points with a palindrome check. *Complexity:* O(2ⁿ·n). *Watch:* precompute palindrome DP to avoid re-checking.
- **[H] N-Queens** — *Insight:* place one queen per row; track attacked columns and both diagonals as sets. *Approach:* recurse row by row; a cell is safe if its column, `r−c`, and `r+c` are all free. *Complexity:* O(n!). *Watch:* the two diagonal keys (`r−c` and `r+c`) are the elegant part.
- **[H] Sudoku Solver** — *Insight:* backtracking constraint satisfaction. *Approach:* find an empty cell, try 1–9 that don't violate row/col/box, recurse, undo on failure. *Complexity:* exponential, heavily pruned. *Watch:* track row/col/box availability incrementally instead of rescanning.

---

## 10. Trees (Binary Trees)

**Core idea.** Recursion's home. Frame almost everything as: **"what do I return up from each node, given the results from my left and right children?"** Decide top-down (pass context down via parameters) vs bottom-up (return aggregates up).

**Template — iterative traversals (know these; recursion is obvious):**
```csharp
// Inorder (sorted for a BST)
var st = new Stack<TreeNode>(); var cur = root;
while (cur != null || st.Count > 0) {
    while (cur != null) { st.Push(cur); cur = cur.left; }
    cur = st.Pop();
    Visit(cur);
    cur = cur.right;
}

// Level order (BFS)
var q = new Queue<TreeNode>(); q.Enqueue(root);
while (q.Count > 0) {
    int sz = q.Count;                       // freeze this level's size
    for (int i = 0; i < sz; i++) {
        var node = q.Dequeue(); Visit(node);
        if (node.left != null) q.Enqueue(node.left);
        if (node.right != null) q.Enqueue(node.right);
    }
}
```

- ⭐🔁 **[E] Max Depth / Invert Tree / Same Tree** — *Insight:* one-line recursions combining left/right. *Approach:* e.g. depth = `1 + max(L, R)`. *Complexity:* O(n). *Watch:* these build the reflex; do them until trivial.
- ⭐ **[M] Level Order Traversal** — *Insight:* freeze `q.Count` at the start of each level to separate levels. *Approach:* BFS template. *Complexity:* O(n). *Watch:* the per-level size snapshot is what groups nodes correctly.
- ⭐ **[M] Diameter of Binary Tree** — *Insight:* the longest path through a node = leftDepth + rightDepth; the global answer is the max over all nodes, computed during a depth post-order. *Approach:* return depth up, side-effect a max. *Complexity:* O(n). *Watch:* return depth, but *track* diameter separately — they're different quantities.
- ⭐ **[M] Lowest Common Ancestor (general binary tree)** — *Insight:* the LCA is the node where the two targets first appear in different subtrees. *Approach:* post-order; if left and right both return non-null, this node is the LCA; else bubble up whichever is non-null. *Complexity:* O(n). *Watch:* a node is its own ancestor (handle when a target equals the current node).
- **[M] Right Side View** — *Insight:* the last node dequeued at each level. *Approach:* BFS, take the level's final node (or DFS visiting right first, recording first per depth). *Complexity:* O(n).
- **[M] Construct from Preorder + Inorder** — *Insight:* preorder gives the root; its position in inorder splits left/right subtrees. *Approach:* recurse on index ranges; a value→index map on inorder makes the split O(1). *Complexity:* O(n). *Watch:* track preorder cursor and inorder bounds carefully.
- **[H] Binary Tree Maximum Path Sum** — *Insight:* each node returns the best *straight* downward path to a parent, but the answer may *bend* at a node (left + node + right). *Approach:* post-order returns `node + max(0, L, R)` upward; update global with `node + max(0,L) + max(0,R)`. *Complexity:* O(n). *Watch:* clamp negative contributions to 0; distinguish "return value" from "answer candidate."
- **[H] Serialize/Deserialize** — *Insight:* a preorder stream with explicit null markers uniquely encodes a tree. *Approach:* serialize preorder writing `#` for nulls; deserialize by consuming tokens in the same order. *Complexity:* O(n). *Watch:* the null markers are mandatory for unambiguous reconstruction.

---

## 11. Binary Search Trees

**Core idea.** The BST invariant (left < node < right *for the whole subtree*) means an **in-order traversal is sorted**. Exploit that; protect it on insert/delete.

- ⭐ **[M] Validate BST** — *Insight:* local `left<node<right` is *not enough*; every node must lie within an inherited (min,max) range. *Approach:* recurse passing down tightening bounds. *Complexity:* O(n). *Watch:* the classic wrong answer checks only immediate children; use `long` bounds for int-edge values.
- ⭐ **[M] Kth Smallest in BST** — *Insight:* in-order yields ascending order; stop at the kth. *Approach:* iterative in-order, decrement k. *Complexity:* O(h + k). *Watch:* don't traverse the whole tree — stop early.
- **[M] LCA of BST** — *Insight:* use the ordering — if both targets are smaller go left, both larger go right, else split point = LCA. *Approach:* walk down comparing. *Complexity:* O(h). *Watch:* simpler than the general-tree LCA; use the values.
- **[M] Insert/Delete in BST** — *Insight:* insert at the first null leaf by the ordering; delete's hard case is two children. *Approach:* for two-children delete, replace with in-order successor (min of right subtree), then delete that. *Complexity:* O(h). *Watch:* the two-children case is the only real difficulty.

---

## 12. Tries (Prefix Trees)

**Core idea.** A tree where each root-to-node path spells a prefix; shared prefixes share nodes. Prefix/word queries become O(length), independent of how many words are stored.

**Template:**
```csharp
class TrieNode { public TrieNode[] next = new TrieNode[26]; public bool isEnd; }

void Insert(TrieNode root, string w) {
    var cur = root;
    foreach (var c in w) {
        int i = c - 'a';
        cur.next[i] ??= new TrieNode();
        cur = cur.next[i];
    }
    cur.isEnd = true;
}
```

- ⭐ **[M] Implement Trie** — *Insight:* the structure itself. *Approach:* insert/search walk the children; `startsWith` is search without requiring `isEnd`. *Complexity:* O(L) per op. *Watch:* the `isEnd` flag distinguishes a stored word from a mere prefix.
- **[M] Add and Search Words (with `.` wildcard)** — *Insight:* `.` branches into a DFS over all children. *Approach:* recursive search; on `.`, try every non-null child. *Complexity:* O(26^dots · L) worst. *Watch:* the wildcard turns a walk into a search.
- **[H] Word Search II** — *Insight:* build a Trie of the target words, then DFS the grid *guided by the Trie* so you abandon dead prefixes immediately. *Approach:* grid DFS that advances only along existing Trie edges; mark words found. *Complexity:* far better than per-word search. *Watch:* prune found words and dead branches; this Trie+DFS combo is a known hard.

---

## 13. Heaps / Priority Queues

**Core idea.** A binary heap gives O(1) peek at the extreme and O(log n) insert/extract. Reach for it on "k largest/smallest" or "repeatedly take the current best." `PriorityQueue<TElement,TPriority>` ships in .NET 6+.

**Template — top-k largest with a size-k *min*-heap:**
```csharp
var pq = new PriorityQueue<int,int>();          // min-heap by priority
foreach (var x in nums) {
    pq.Enqueue(x, x);
    if (pq.Count > k) pq.Dequeue();             // drop the smallest
}
// pq now holds the k largest; root is the kth largest
```

- ⭐ **[M] Kth Largest Element** — *Insight:* a size-k min-heap keeps exactly the k largest; its root is the answer. *Approach:* template, or quickselect for O(n) average. *Complexity:* O(n log k) heap / O(n) avg quickselect. *Watch:* know quickselect exists — it's the optimal follow-up.
- ⭐ **[M] Top K Frequent Elements** — *Insight:* heap by frequency (or bucket sort, §1). *Approach:* count → size-k heap. *Complexity:* O(n log k). *Watch:* bucket sort is O(n) and the better answer if asked to optimize.
- ⭐ **[M] Task Scheduler** — *Insight:* always run the most frequent remaining task to spread out cooldowns. *Approach:* max-heap by count; run up to (n+1) distinct tasks per cycle, decrement, re-add. *Complexity:* O(total). *Watch:* the closed-form formula `(maxCount-1)*(n+1) + countOfMax` is the elegant alternative.
- **[M] K Closest Points to Origin** — *Insight:* size-k max-heap by squared distance. *Approach:* push, evict the farthest beyond k. *Complexity:* O(n log k). *Watch:* compare squared distances — no `sqrt` needed.
- **[H] Find Median from Data Stream** — *Insight:* two heaps — a max-heap for the lower half, a min-heap for the upper — kept balanced; median is the top(s). *Approach:* push, rebalance so sizes differ by ≤1. *Complexity:* O(log n) add, O(1) median. *Watch:* the rebalancing (move a root across when sizes skew) is the crux.
- **[H] Merge k Sorted Lists** — see §8; heap of heads.

---

## 14. Greedy

**Core idea.** Make the locally optimal choice *when you can prove it's globally safe* (an exchange argument: swapping in the greedy choice never worsens an optimal solution). The proof is the hard part — and the reason DP exists is for when greedy *can't* be proven.

- ⭐ **[M] Jump Game** — *Insight:* track the furthest index reachable so far; you win if it ever reaches the end. *Approach:* one pass, `reach = max(reach, i + nums[i])`, fail if `i > reach`. *Complexity:* O(n). *Watch:* fail fast when an index is unreachable.
- ⭐ **[M] Jump Game II** (min jumps) — *Insight:* greedy BFS by "jump level" — within the current reach, find the furthest next reach. *Approach:* track current-level end; when you pass it, increment jumps and extend. *Complexity:* O(n). *Watch:* this is implicit level-order, not DP.
- **[M] Gas Station** — *Insight:* if total gas ≥ total cost, a unique start exists; reset the candidate start whenever the running tank goes negative. *Approach:* single pass tracking tank and start. *Complexity:* O(n). *Watch:* prove why resetting start to `i+1` is safe.
- **[M] Hand of Straights** — *Insight:* the smallest available card must begin a group. *Approach:* counts (sorted/`SortedDictionary`); greedily form consecutive groups from the minimum. *Complexity:* O(n log n). *Watch:* decrement counts and skip exhausted cards.
- **[H] Candy** — *Insight:* satisfy the left-neighbor and right-neighbor constraints independently, then take the max. *Approach:* left-to-right pass (rising ratings get +1), right-to-left pass, combine by max. *Complexity:* O(n). *Watch:* one pass can't satisfy both directions — that's why it's two.

---

## 15. Intervals

**Core idea.** Sort by start (sometimes end), then sweep. Nearly every interval problem reduces to "sort, then one pass deciding merge / skip / count overlaps."

**Template — merge:**
```csharp
Array.Sort(intervals, (a, b) => a[0] - b[0]);
var res = new List<int[]>();
foreach (var iv in intervals) {
    if (res.Count == 0 || res[^1][1] < iv[0]) res.Add(iv);     // no overlap
    else res[^1][1] = Math.Max(res[^1][1], iv[1]);             // extend
}
```

- ⭐ **[M] Merge Intervals** — *Insight:* sorted by start, overlaps are adjacent. *Approach:* the template. *Complexity:* O(n log n). *Watch:* compare `prevEnd >= curStart` for overlap; use max for the merged end.
- ⭐ **[M] Insert Interval** — *Insight:* three phases — intervals entirely before, the overlapping run to merge, intervals entirely after. *Approach:* copy before, merge the overlapping span, copy after. *Complexity:* O(n). *Watch:* the array is pre-sorted, so no full sort is needed.
- **[M] Non-overlapping Intervals** (min removals) — *Insight:* keep as many as possible → greedily keep the interval that ends earliest. *Approach:* sort by end; count keeps where start ≥ last kept end. *Complexity:* O(n log n). *Watch:* sort by **end**, not start, here.
- **[M] Meeting Rooms II** (min rooms) — *Insight:* rooms needed = max simultaneous overlaps. *Approach:* min-heap of end times (reuse a room when the earliest end ≤ next start), or a sweep of +1/−1 events. *Complexity:* O(n log n). *Watch:* the heap holds *end times*; the sweep-line counter is the cleaner mental model.
- **[H] Employee Free Time** — *Insight:* merge all intervals across everyone, then gaps between merged intervals are free time. *Approach:* flatten, sort, merge, emit gaps. *Complexity:* O(n log n).

---

## 16. Graphs

**Core idea.** Nodes + edges. Most "hard" problems are graphs wearing a costume (grids, dependencies, word ladders). Master the representation + BFS/DFS, then each algorithm below is a labeled variation. **Pick the algorithm by the edge property:** unweighted shortest path → BFS; weighted non-negative → Dijkstra; negative edges → Bellman-Ford; all-pairs → Floyd-Warshall; connectivity/cycle (undirected) → Union-Find; ordering with dependencies → topological sort; cheapest spanning tree → MST.

**Template — BFS (shortest path in unweighted graph / grid):**
```csharp
var q = new Queue<int>(); var dist = new int[n]; Array.Fill(dist, -1);
q.Enqueue(src); dist[src] = 0;
while (q.Count > 0) {
    int u = q.Dequeue();
    foreach (var v in adj[u])
        if (dist[v] == -1) { dist[v] = dist[u] + 1; q.Enqueue(v); }
}
```

**Template — Union-Find (DSU) with path compression + union by rank:**
```csharp
int[] parent, rank;
int Find(int x) => parent[x] == x ? x : (parent[x] = Find(parent[x]));  // path compression
bool Union(int a, int b) {
    int ra = Find(a), rb = Find(b);
    if (ra == rb) return false;                  // already connected (cycle if undirected)
    if (rank[ra] < rank[rb]) (ra, rb) = (rb, ra);
    parent[rb] = ra;
    if (rank[ra] == rank[rb]) rank[ra]++;
    return true;
}
```

**Template — Dijkstra (non-negative weights):**
```csharp
var dist = new int[n]; Array.Fill(dist, int.MaxValue); dist[src] = 0;
var pq = new PriorityQueue<int,int>(); pq.Enqueue(src, 0);
while (pq.TryDequeue(out int u, out int d)) {
    if (d > dist[u]) continue;                   // stale entry, skip
    foreach (var (v, w) in adj[u])
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.Enqueue(v, dist[v]); }
}
```

**Template — Topological sort (Kahn's, also detects cycles):**
```csharp
var indeg = new int[n];
foreach (var u in nodes) foreach (var v in adj[u]) indeg[v]++;
var q = new Queue<int>();
for (int i = 0; i < n; i++) if (indeg[i] == 0) q.Enqueue(i);
var order = new List<int>();
while (q.Count > 0) {
    int u = q.Dequeue(); order.Add(u);
    foreach (var v in adj[u]) if (--indeg[v] == 0) q.Enqueue(v);
}
bool hasCycle = order.Count != n;                // leftover nodes => cycle
```

- ⭐🔁 **[M] Number of Islands** — *Insight:* each unvisited land cell starts a flood fill that consumes one island. *Approach:* iterate cells; on land, BFS/DFS marking the whole component. *Complexity:* O(mn). *Watch:* mark visited (mutate or a visited set) to avoid recount.
- ⭐ **[M] Clone Graph** — *Insight:* traverse while mapping original→copy so cycles don't loop forever. *Approach:* DFS/BFS with a `Dictionary<Node,Node>`; create the clone on first visit. *Complexity:* O(V+E). *Watch:* check the map *before* recursing into neighbors.
- ⭐ **[M] Course Schedule I/II** — *Insight:* prerequisites form a DAG; a valid order exists iff no cycle, and the order is a topological sort. *Approach:* Kahn's template. *Complexity:* O(V+E). *Watch:* "can finish?" = no cycle; "order?" = the topo order itself.
- ⭐ **[M] Rotting Oranges** — *Insight:* multi-source BFS where BFS *levels = minutes elapsed*. *Approach:* enqueue all rotten cells at level 0, BFS outward, count levels. *Complexity:* O(mn). *Watch:* seed *all* sources before starting; check for unreachable fresh oranges at the end.
- **[M] Pacific Atlantic Water Flow** — *Insight:* instead of "can this cell reach both oceans," reverse it — BFS *inland from each ocean's border*; the intersection reaches both. *Approach:* two multi-source BFS/DFS from the two border sets, intersect. *Complexity:* O(mn). *Watch:* reversing the flow direction is the unlock.
- **[M] Number of Connected Components / Graph Valid Tree** — *Insight:* Union-Find counts components; a tree has exactly n−1 edges and no cycle. *Approach:* union each edge; a `Union` returning false (already connected) means a cycle. *Complexity:* near O(E·α). *Watch:* for "valid tree," also verify edge count = n−1.
- **[M] Word Ladder** — *Insight:* words are nodes; an edge connects words differing by one letter; shortest transformation = BFS. *Approach:* BFS, generating neighbors by trying each position × 26 letters. *Complexity:* O(words · L · 26). *Watch:* precompute or generate neighbors efficiently; bidirectional BFS is the optimization.
- ⭐ **[M] Network Delay Time** — *Insight:* shortest time to reach all = max over single-source shortest paths → Dijkstra. *Approach:* Dijkstra template, answer = max finite dist (∞ ⇒ unreachable). *Complexity:* O(E log V). *Watch:* unreachable node ⇒ return −1.
- **[H] Cheapest Flights Within K Stops** — *Insight:* shortest path with a *hop limit* → Bellman-Ford run K+1 times (each round relaxes one more hop), or Dijkstra with (cost, stops) state. *Approach:* Bellman-Ford on a *snapshot* of distances per round so you don't use >K stops in one round. *Complexity:* O(K·E). *Watch:* relax from a frozen copy each round, or you'll overcount hops.
- **[H] Alien Dictionary** — *Insight:* adjacent words reveal one ordering edge at their first differing char; the alphabet order is a topological sort. *Approach:* build the precedence graph from adjacent pairs, Kahn's. *Complexity:* O(total chars). *Watch:* the prefix edge case (`"abc"` before `"ab"` is invalid) and cycle ⇒ no valid order.
- **[H] Min Cost to Connect All Points** — *Insight:* connect all nodes at minimum total edge weight = Minimum Spanning Tree. *Approach:* Prim (heap, grow the tree) or Kruskal (sort edges + Union-Find). *Complexity:* Prim O(n² )/O(E log V); Kruskal O(E log E). *Watch:* on a dense complete graph (all pairs), Prim with an array is competitive.

---

## 17. Dynamic Programming

**Core idea.** Two conditions: **optimal substructure** (the answer builds from answers to subproblems) and **overlapping subproblems** (the same subproblem recurs). The entire skill is **(1) define the state** — what does `dp[i]` / `dp[i][j]` *mean*? — and **(2) the transition** — how does it build from smaller states? Always: write the brute-force recursion first, add a cache (top-down memo), then optionally convert to bottom-up tabulation and squeeze space.

**Template — top-down memo (coin change):**
```csharp
int[] memo;                                   // memo[amt] = min coins, -2 = uncomputed
int Solve(int[] coins, int amt) {
    if (amt == 0) return 0;
    if (amt < 0) return int.MaxValue;
    if (memo[amt] != -2) return memo[amt];
    int best = int.MaxValue;
    foreach (var c in coins) {
        int sub = Solve(coins, amt - c);
        if (sub != int.MaxValue) best = Math.Min(best, sub + 1);
    }
    return memo[amt] = best;
}
```
**Template — bottom-up tabulation (same problem):**
```csharp
var dp = new int[amount + 1]; Array.Fill(dp, amount + 1); dp[0] = 0;
for (int a = 1; a <= amount; a++)
    foreach (var c in coins)
        if (c <= a) dp[a] = Math.Min(dp[a], dp[a - c] + 1);
return dp[amount] > amount ? -1 : dp[amount];
```

**The progression — do strictly in order:**

*1D DP*
- ⭐🔁 **[E] Climbing Stairs** — *Insight:* ways(n) = ways(n−1) + ways(n−2) — it's Fibonacci. *State:* `dp[i]` = ways to reach step i. *Complexity:* O(n)/O(1) with two vars. *Watch:* this is your DP "hello world"; internalize state+transition here.
- ⭐ **[M] House Robber I** — *Insight:* at each house, either skip it (keep `dp[i-1]`) or rob it (`dp[i-2] + value`). *State:* `dp[i]` = max loot through house i. *Transition:* `max(dp[i-1], dp[i-2]+a[i])`. *Complexity:* O(n)/O(1). *Watch:* the include/exclude shape recurs everywhere.
- **[M] House Robber II** (circular) — *Insight:* first and last are now adjacent → run the linear version twice, excluding one end each time. *Approach:* `max(rob(0..n-2), rob(1..n-1))`. *Watch:* the circularity is handled by two linear runs, not new logic.
- **[M] Decode Ways** — *Insight:* like stairs but transitions are conditional on valid 1- and 2-digit codes. *State:* `dp[i]` = decodings of prefix length i. *Complexity:* O(n). *Watch:* zeros are the trap (`"0"` decodes to nothing; `"10"`/`"20"` only as pairs).

*Knapsack family*
- ⭐ **[M] Coin Change** (min coins) — *Insight:* unbounded knapsack. *State:* `dp[a]` = min coins for amount a. *Complexity:* O(amount·coins). *Watch:* unreachable = sentinel; coins reusable ⇒ inner loop over coins, amount ascending.
- **[M] Coin Change II** (count ways) — *Insight:* loop coins *outer*, amount inner, to count combinations not permutations. *Watch:* loop order determines combinations vs permutations — a classic subtlety.
- **[M] Partition Equal Subset Sum** — *Insight:* "can a subset sum to total/2?" = 0/1 subset-sum. *State:* boolean `dp[s]` reachable. *Complexity:* O(n·sum). *Watch:* 0/1 (no reuse) ⇒ iterate the sum dimension *descending*.
- **[M] Target Sum** — *Insight:* assigning ± signs to reach T reduces to a subset-sum (`P − N = T`, `P + N = total`). *Watch:* the algebraic reduction to subset sum is the trick.

*Sequence DP*
- ⭐ **[M] Longest Increasing Subsequence** — *Insight:* `dp[i]` = LIS ending at i = 1 + max dp[j] for j<i with a[j]<a[i]. *Complexity:* O(n²). *Watch:* the O(n log n) "patience" version maintains tails via binary search — learn it; it's expected at FAANG.
- ⭐ **[M] Longest Common Subsequence** — *Insight:* the 2D-DP archetype. *State:* `dp[i][j]` = LCS of prefixes. *Transition:* match ⇒ `dp[i-1][j-1]+1`, else `max(dp[i-1][j], dp[i][j-1])`. *Complexity:* O(mn). *Watch:* this grid recurrence underlies edit distance, diff tools, etc.
- ⭐ **[M] Word Break** — *Insight:* `dp[i]` = prefix of length i is segmentable, if some `dp[j]` true and `s[j..i]` in dict. *Complexity:* O(n²) (with set lookups). *Watch:* a Trie or hashset for the dictionary keeps the inner check cheap.
- **[M] Maximum Product Subarray** — *Insight:* a negative flips min↔max, so track *both* running max and min. *Complexity:* O(n)/O(1). *Watch:* swap max/min when the current number is negative.
- **[M] Longest Palindromic Substring** — *Insight:* expand around each of the 2n−1 centers, *or* `dp[i][j]` = is s[i..j] a palindrome. *Complexity:* O(n²). *Watch:* expand-around-center is O(1) space and simpler to code.

*Grid / 2D*
- ⭐ **[M] Unique Paths / Min Path Sum** — *Insight:* `dp[i][j]` combines the cell above and to the left. *Complexity:* O(mn), O(n) with a rolling row. *Watch:* initialize the first row/column correctly.

*Harder*
- **[H] Edit Distance** — *Insight:* `dp[i][j]` = min edits to turn prefix i into prefix j; choices = insert/delete/replace. *Transition:* match ⇒ diagonal; else `1 + min(insert, delete, replace)`. *Complexity:* O(mn). *Watch:* the three-way min and base cases (empty string ⇒ length).
- **[H] Burst Balloons** — *Insight:* think of which balloon is burst *last* in a range; that fixes the multiplication and splits the range. *State:* `dp[i][j]` = max coins bursting the open interval (i,j). *Complexity:* O(n³). *Watch:* "last to burst," not first — counterintuitive but it's what makes the subproblems independent.
- **[H] Regular Expression Matching** — *Insight:* 2D DP over text/pattern; `*` means "zero of the preceding" or "one more of the preceding." *Complexity:* O(mn). *Watch:* the `*` transition (two branches) and `.` are the whole difficulty.
- **[H] Best Time to Buy/Sell Stock III & IV** (≤k transactions) — *Insight:* state machine — `dp[transactions][holding?]`. *Approach:* track buy/sell profits per allowed transaction. *Complexity:* O(nk). *Watch:* when k ≥ n/2 it degenerates to unlimited transactions (greedy) — handle that to avoid memory blowup.

*DP on trees (FAANG)*
- **[M] House Robber III** — *Insight:* each node returns two values: best-if-robbed and best-if-skipped. *Approach:* post-order returning a pair. *Complexity:* O(n). *Watch:* returning a tuple up the tree is the tree-DP signature.

---

## 18. Strings (specialized pattern matching)

**Core idea.** Beyond window/two-pointer string work, substring *search* has a dedicated toolkit. You'll rarely implement these from scratch, but understanding them is expected and they occasionally appear directly.

- **KMP** — *Insight:* precompute a "failure function" (longest proper prefix that's also a suffix) so on a mismatch you skip ahead without re-examining matched chars. *Complexity:* O(n+m). *Watch:* understand the failure array's meaning even if you don't memorize the build.
- **Rabin-Karp** — *Insight:* a rolling hash compares substrings in O(1); recompute the next window's hash from the previous. *Complexity:* O(n+m) average. *Watch:* hash collisions ⇒ verify on match.
- **[M] Implement strStr()** — *Insight:* substring search; KMP or rolling hash for linear time. *Watch:* naive O(nm) is accepted but the linear method is the "strong" answer.
- **[M] Repeated Substring Pattern** — *Insight:* the KMP failure value of the whole string reveals the smallest repeating unit. *Watch:* the slick check: `s` is repeating iff it's a non-trivial rotation of itself — `(s+s).IndexOf(s, 1) < s.Length`.
- **[H] Shortest Palindrome** — *Insight:* find the longest palindromic *prefix* via KMP on `s + '#' + reverse(s)`. *Complexity:* O(n). *Watch:* the separator `#` prevents overcounting across the join.

---

## 19. Advanced structures (FAANG-hard; awareness → implement once)

- **Segment Tree** — *Insight:* a binary tree over array ranges; each node stores an aggregate (sum/min/max) of its range. Query and point-update in O(log n); **lazy propagation** defers range updates for O(log n) range-update. *Implement once* so the concept is concrete. *Watch:* lazy propagation bookkeeping is the hard part.
- **Fenwick Tree (BIT)** — *Insight:* clever use of low-bit indexing gives prefix sums *with* point updates in O(log n), with far less code than a segment tree. *Use when* you only need prefix-sum-style queries. *Watch:* 1-indexed; `i += i & -i` to update, `i -= i & -i` to query.
- **[M] Range Sum Query — Mutable** — *Insight:* updates + range sums → Fenwick or segment tree. *Complexity:* O(log n) each. *Watch:* Fenwick is the cleaner choice for pure sums.
- **[H] Count of Smaller Numbers After Self** — *Insight:* process right-to-left, querying "how many already-seen values are smaller" → BIT over value-ranks, or a modified merge sort that counts inversions. *Complexity:* O(n log n). *Watch:* coordinate-compress values first for the BIT.

---

## 20. Math & Geometry (occasional / awareness)

- **[M] Happy Number** — *Insight:* iterating digit-square-sums either reaches 1 or cycles → Floyd's cycle detection (fast/slow on the transformation). *Complexity:* O(log n) per step. *Watch:* reuse the linked-list cycle trick on a numeric sequence.
- **[M] Rotate Image** (90°, in place) — *Insight:* transpose then reverse each row. *Complexity:* O(n²)/O(1). *Watch:* the transpose+reverse decomposition avoids fiddly index math.
- **[M] Spiral Matrix** — *Insight:* maintain four shrinking boundaries (top/bottom/left/right). *Approach:* traverse each edge, then contract that boundary. *Complexity:* O(mn). *Watch:* re-check boundaries before the bottom and left passes to avoid double-visiting on non-square grids.

---

## The honest progress metric

For each problem, your tool should track three states, and the only one that counts is the third:

1. **Read** — you understand the editorial.
2. **Solved** — you solved it (possibly with hints).
3. **Cold** — you re-solved it from a blank editor, no references, in interview time.

`🔁` problems aren't "done" until they're **Cold** *and stay Cold a week later*. Patterns become reflexes through spaced repetition, not through volume. Twenty problems brought to Cold beat eighty brought to Solved.
