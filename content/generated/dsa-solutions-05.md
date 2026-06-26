# DSA Solutions — Heaps · Greedy · Intervals

> AI-added — verify. Idiomatic C# 12 / .NET 8. Uses `PriorityQueue<TElement,TPriority>`
> (a min-heap by priority; negate the priority for max-heap behavior).

---

### id: heaps-priority-queues-kth-largest-element
```csharp
// A size-k MIN-heap keeps exactly the k largest; its root is the kth largest.
public int FindKthLargest(int[] nums, int k) {
    var pq = new PriorityQueue<int, int>();
    foreach (int x in nums) {
        pq.Enqueue(x, x);
        if (pq.Count > k) pq.Dequeue();        // drop the smallest
    }
    return pq.Peek();
}
```
**Complexity:** O(n log k). (Quickselect is the O(n)-average optimal follow-up.)

---

### id: heaps-priority-queues-top-k-frequent-elements
```csharp
// Heap variant: count, then keep a size-k min-heap by frequency.
public int[] TopKFrequent(int[] nums, int k) {
    var freq = new Dictionary<int, int>();
    foreach (int n in nums) freq[n] = freq.GetValueOrDefault(n) + 1;
    var pq = new PriorityQueue<int, int>();
    foreach (var kv in freq) {
        pq.Enqueue(kv.Key, kv.Value);
        if (pq.Count > k) pq.Dequeue();
    }
    var res = new int[k];
    for (int i = k - 1; i >= 0; i--) res[i] = pq.Dequeue();
    return res;
}
```
**Complexity:** O(n log k). (Bucket sort, §Arrays, is O(n).)

---

### id: heaps-priority-queues-task-scheduler
```csharp
// Spread out the most-frequent task. Closed form: arrange (maxCount-1) full cycles of
// length (n+1), then append the tasks that tie for max.
public int LeastInterval(char[] tasks, int n) {
    var counts = new int[26];
    foreach (char t in tasks) counts[t - 'A']++;
    int maxCount = counts.Max();
    int numMax = counts.Count(c => c == maxCount);
    int slots = (maxCount - 1) * (n + 1) + numMax;
    return Math.Max(tasks.Length, slots);     // can't be fewer than the tasks themselves
}
```
**Complexity:** O(total tasks). (A max-heap by remaining count is the simulation alternative.)

---

### id: heaps-priority-queues-k-closest-points-to-origin
```csharp
// Size-k MAX-heap by squared distance (no sqrt needed); evict the farthest beyond k.
public int[][] KClosest(int[][] points, int k) {
    var pq = new PriorityQueue<int[], int>();
    foreach (var p in points) {
        int d = p[0] * p[0] + p[1] * p[1];
        pq.Enqueue(p, -d);                    // negate → max-heap
        if (pq.Count > k) pq.Dequeue();
    }
    var res = new int[k][];
    for (int i = 0; i < k; i++) res[i] = pq.Dequeue();
    return res;
}
```
**Complexity:** O(n log k).

---

### id: heaps-priority-queues-find-median-from-data-stream
```csharp
// Two heaps: a max-heap for the lower half and a min-heap for the upper, kept balanced so
// sizes differ by ≤1. Median is the top(s).
public class MedianFinder {
    private readonly PriorityQueue<int, int> _low = new();    // max-heap (lower half)
    private readonly PriorityQueue<int, int> _high = new();   // min-heap (upper half)
    public void AddNum(int num) {
        _low.Enqueue(num, -num);
        int top = _low.Dequeue();             // pass the max of low up to high
        _high.Enqueue(top, top);
        if (_high.Count > _low.Count) {       // rebalance
            int t = _high.Dequeue();
            _low.Enqueue(t, -t);
        }
    }
    public double FindMedian() =>
        _low.Count > _high.Count ? _low.Peek() : (_low.Peek() + _high.Peek()) / 2.0;
}
```
**Complexity:** O(log n) add, O(1) median.

---

### id: heaps-priority-queues-merge-k-sorted-lists
```csharp
// Min-heap of the k current heads; pop the global minimum and push its successor.
public ListNode MergeKLists(ListNode[] lists) {
    var pq = new PriorityQueue<ListNode, int>();
    foreach (var node in lists) if (node != null) pq.Enqueue(node, node.val);
    var dummy = new ListNode(); var tail = dummy;
    while (pq.Count > 0) {
        var node = pq.Dequeue();
        tail.next = node; tail = node;
        if (node.next != null) pq.Enqueue(node.next, node.next.val);
    }
    return dummy.next;
}
```
**Complexity:** O(n log k).

---

### id: greedy-jump-game
```csharp
// Track the furthest reachable index; fail fast the moment an index is unreachable.
public bool CanJump(int[] nums) {
    int reach = 0;
    for (int i = 0; i < nums.Length; i++) {
        if (i > reach) return false;
        reach = Math.Max(reach, i + nums[i]);
    }
    return true;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: greedy-jump-game-ii
```csharp
// Implicit BFS by "jump level": within the current reach, extend to the furthest next
// reach; bump the jump count when you exhaust the current level.
public int Jump(int[] nums) {
    int jumps = 0, curEnd = 0, farthest = 0;
    for (int i = 0; i < nums.Length - 1; i++) {
        farthest = Math.Max(farthest, i + nums[i]);
        if (i == curEnd) { jumps++; curEnd = farthest; }
    }
    return jumps;
}
```
**Complexity:** O(n).

---

### id: greedy-gas-station
```csharp
// If total gas ≥ total cost a unique start exists; reset the candidate start to i+1
// whenever the running tank goes negative.
public int CanCompleteCircuit(int[] gas, int[] cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < gas.Length; i++) {
        int diff = gas[i] - cost[i];
        total += diff; tank += diff;
        if (tank < 0) { start = i + 1; tank = 0; }
    }
    return total >= 0 ? start : -1;
}
```
**Complexity:** O(n).

---

### id: greedy-hand-of-straights
```csharp
// The smallest available card must begin a group; greedily form consecutive runs from it.
public bool IsNStraightHand(int[] hand, int groupSize) {
    if (hand.Length % groupSize != 0) return false;
    var count = new SortedDictionary<int, int>();
    foreach (int c in hand) count[c] = count.GetValueOrDefault(c) + 1;
    while (count.Count > 0) {
        int start = count.Keys.First();
        for (int v = start; v < start + groupSize; v++) {
            if (!count.TryGetValue(v, out int cnt)) return false;
            if (cnt == 1) count.Remove(v); else count[v] = cnt - 1;
        }
    }
    return true;
}
```
**Complexity:** O(n log n).

---

### id: greedy-candy
```csharp
// Satisfy the left-neighbor and right-neighbor constraints in two passes, then take the
// max — one pass can't satisfy both directions.
public int Candy(int[] ratings) {
    int n = ratings.Length;
    var candy = new int[n];
    Array.Fill(candy, 1);
    for (int i = 1; i < n; i++)
        if (ratings[i] > ratings[i - 1]) candy[i] = candy[i - 1] + 1;
    for (int i = n - 2; i >= 0; i--)
        if (ratings[i] > ratings[i + 1]) candy[i] = Math.Max(candy[i], candy[i + 1] + 1);
    return candy.Sum();
}
```
**Complexity:** O(n).

---

### id: intervals-merge-intervals
```csharp
// Sort by start; overlaps become adjacent. Merge when prevEnd >= curStart.
public int[][] Merge(int[][] intervals) {
    Array.Sort(intervals, (a, b) => a[0] - b[0]);
    var res = new List<int[]>();
    foreach (var iv in intervals) {
        if (res.Count == 0 || res[^1][1] < iv[0]) res.Add(new[] { iv[0], iv[1] });
        else res[^1][1] = Math.Max(res[^1][1], iv[1]);
    }
    return res.ToArray();
}
```
**Complexity:** O(n log n).

---

### id: intervals-insert-interval
```csharp
// Three phases on the already-sorted input: copy those entirely before, merge the
// overlapping run, copy those entirely after. No full sort needed.
public int[][] Insert(int[][] intervals, int[] newInterval) {
    var res = new List<int[]>();
    int i = 0, n = intervals.Length;
    while (i < n && intervals[i][1] < newInterval[0]) res.Add(intervals[i++]);
    while (i < n && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.Min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.Max(newInterval[1], intervals[i][1]);
        i++;
    }
    res.Add(newInterval);
    while (i < n) res.Add(intervals[i++]);
    return res.ToArray();
}
```
**Complexity:** O(n).

---

### id: intervals-non-overlapping-intervals
```csharp
// Keep as many as possible → greedily keep the interval that ends earliest. Sort by END.
public int EraseOverlapIntervals(int[][] intervals) {
    Array.Sort(intervals, (a, b) => a[1] - b[1]);
    int kept = 0, lastEnd = int.MinValue;
    foreach (var iv in intervals)
        if (iv[0] >= lastEnd) { kept++; lastEnd = iv[1]; }
    return intervals.Length - kept;
}
```
**Complexity:** O(n log n).

---

### id: intervals-meeting-rooms-ii
```csharp
// Rooms needed = max simultaneous overlaps. Sweep separated start/end events: a meeting
// that has ended frees a room before the next start claims one.
public int MinMeetingRooms(int[][] intervals) {
    int n = intervals.Length;
    int[] starts = new int[n], ends = new int[n];
    for (int i = 0; i < n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
    Array.Sort(starts); Array.Sort(ends);
    int rooms = 0, maxRooms = 0, e = 0;
    for (int s = 0; s < n; s++) {
        while (e < n && ends[e] <= starts[s]) { rooms--; e++; }
        rooms++;
        maxRooms = Math.Max(maxRooms, rooms);
    }
    return maxRooms;
}
```
**Complexity:** O(n log n).

---

### id: intervals-employee-free-time
```csharp
// Flatten all intervals across everyone, sort, merge; the gaps between merged intervals
// are the shared free time.
public IList<int[]> EmployeeFreeTime(int[][][] schedule) {
    var all = new List<int[]>();
    foreach (var emp in schedule) foreach (var iv in emp) all.Add(iv);
    all.Sort((a, b) => a[0] - b[0]);
    var res = new List<int[]>();
    int end = all[0][1];
    foreach (var iv in all) {
        if (iv[0] > end) res.Add(new[] { end, iv[0] });
        end = Math.Max(end, iv[1]);
    }
    return res;
}
```
**Complexity:** O(n log n).
