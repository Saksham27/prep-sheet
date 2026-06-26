# DSA Solutions — Stacks · Queues/Deque · Linked Lists

> AI-added — verify. Idiomatic C# 12 / .NET 8.
> Linked-list problems assume `class ListNode { public int val; public ListNode next; }`.

---

### id: stacks-and-monotonic-stack-valid-parentheses
```csharp
// A close must match the most recent open. Reject on a close with empty/mismatched stack,
// or a non-empty stack at the end.
public bool IsValid(string s) {
    var st = new Stack<char>();
    var match = new Dictionary<char, char> { [')'] = '(', [']'] = '[', ['}'] = '{' };
    foreach (char c in s) {
        if (match.TryGetValue(c, out char open)) {
            if (st.Count == 0 || st.Pop() != open) return false;
        } else st.Push(c);
    }
    return st.Count == 0;
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: stacks-and-monotonic-stack-min-stack
```csharp
// A parallel stack of running minimums; push on EVERY push (even when min is unchanged).
public class MinStack {
    private readonly Stack<int> _stack = new();
    private readonly Stack<int> _mins = new();
    public void Push(int val) {
        _stack.Push(val);
        _mins.Push(_mins.Count == 0 ? val : Math.Min(val, _mins.Peek()));
    }
    public void Pop() { _stack.Pop(); _mins.Pop(); }
    public int Top() => _stack.Peek();
    public int GetMin() => _mins.Peek();
}
```
**Complexity:** O(1) per operation.

---

### id: stacks-and-monotonic-stack-daily-temperatures
```csharp
// "Days until warmer" = distance to next-greater. Monotonic decreasing stack of indices.
public int[] DailyTemperatures(int[] temps) {
    var res = new int[temps.Length];
    var st = new Stack<int>();                      // indices
    for (int i = 0; i < temps.Length; i++) {
        while (st.Count > 0 && temps[st.Peek()] < temps[i]) {
            int j = st.Pop();
            res[j] = i - j;
        }
        st.Push(i);
    }
    return res;
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: stacks-and-monotonic-stack-evaluate-reverse-polish-notation
```csharp
// Operands wait on a stack until an operator consumes two. Order matters: b is popped
// first, so compute a op b.
public int EvalRPN(string[] tokens) {
    var st = new Stack<int>();
    foreach (var t in tokens) {
        if (t is "+" or "-" or "*" or "/") {
            int b = st.Pop(), a = st.Pop();
            st.Push(t switch { "+" => a + b, "-" => a - b, "*" => a * b, _ => a / b });
        } else st.Push(int.Parse(t));
    }
    return st.Pop();
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: stacks-and-monotonic-stack-generate-parentheses
```csharp
// Backtracking with a validity invariant: add '(' while opens < n, add ')' while it keeps
// balance (closes < opens).
public IList<string> GenerateParenthesis(int n) {
    var res = new List<string>();
    var sb = new System.Text.StringBuilder();
    void Backtrack(int open, int close) {
        if (sb.Length == 2 * n) { res.Add(sb.ToString()); return; }
        if (open < n) { sb.Append('('); Backtrack(open + 1, close); sb.Length--; }
        if (close < open) { sb.Append(')'); Backtrack(open, close + 1); sb.Length--; }
    }
    Backtrack(0, 0);
    return res;
}
```
**Complexity:** O(Catalan(n)) — the nth Catalan number of valid strings.

---

### id: stacks-and-monotonic-stack-largest-rectangle-in-histogram
```csharp
// Monotonic increasing stack of indices. When a shorter bar arrives, pop and compute area
// = poppedHeight × width, where width spans to the new left/right boundaries. A sentinel
// 0 at the end flushes the stack.
public int LargestRectangleArea(int[] heights) {
    var st = new Stack<int>();
    int best = 0, n = heights.Length;
    for (int i = 0; i <= n; i++) {
        int h = i == n ? 0 : heights[i];
        while (st.Count > 0 && heights[st.Peek()] >= h) {
            int height = heights[st.Pop()];
            int left = st.Count == 0 ? -1 : st.Peek();
            best = Math.Max(best, height * (i - left - 1));
        }
        st.Push(i);
    }
    return best;
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: queues-and-deque-implement-queue-using-stacks
```csharp
// Two stacks; only transfer in→out when out is empty, or you scramble order.
public class MyQueue {
    private readonly Stack<int> _in = new(), _out = new();
    public void Push(int x) => _in.Push(x);
    public int Pop() { Shift(); return _out.Pop(); }
    public int Peek() { Shift(); return _out.Peek(); }
    public bool Empty() => _in.Count == 0 && _out.Count == 0;
    private void Shift() { if (_out.Count == 0) while (_in.Count > 0) _out.Push(_in.Pop()); }
}
```
**Complexity:** amortized O(1) per operation.

---

### id: queues-and-deque-design-circular-deque
```csharp
// Fixed array + head/tail with modular wraparound; an explicit size disambiguates
// full vs empty.
public class MyCircularDeque {
    private readonly int[] _buf;
    private readonly int _cap;
    private int _head, _tail, _size;
    public MyCircularDeque(int k) { _cap = k; _buf = new int[k]; }
    public bool InsertFront(int v) {
        if (IsFull()) return false;
        _head = (_head - 1 + _cap) % _cap; _buf[_head] = v; _size++; return true;
    }
    public bool InsertLast(int v) {
        if (IsFull()) return false;
        _buf[_tail] = v; _tail = (_tail + 1) % _cap; _size++; return true;
    }
    public bool DeleteFront() { if (IsEmpty()) return false; _head = (_head + 1) % _cap; _size--; return true; }
    public bool DeleteLast() { if (IsEmpty()) return false; _tail = (_tail - 1 + _cap) % _cap; _size--; return true; }
    public int GetFront() => IsEmpty() ? -1 : _buf[_head];
    public int GetRear() => IsEmpty() ? -1 : _buf[(_tail - 1 + _cap) % _cap];
    public bool IsEmpty() => _size == 0;
    public bool IsFull() => _size == _cap;
}
```
**Complexity:** O(1) per operation.

---

### id: queues-and-deque-sliding-window-maximum
```csharp
// Monotonic deque of indices (values decreasing): the front is always the window max.
public int[] MaxSlidingWindow(int[] nums, int k) {
    var dq = new LinkedList<int>();
    var res = new int[nums.Length - k + 1];
    for (int i = 0; i < nums.Length; i++) {
        if (dq.Count > 0 && dq.First!.Value <= i - k) dq.RemoveFirst();
        while (dq.Count > 0 && nums[dq.Last!.Value] <= nums[i]) dq.RemoveLast();
        dq.AddLast(i);
        if (i >= k - 1) res[i - k + 1] = nums[dq.First!.Value];
    }
    return res;
}
```
**Complexity:** O(n) time, O(k) space.

---

### id: linked-lists-reverse-linked-list
```csharp
// Rewire each next to point backward; save next BEFORE overwriting it.
public ListNode Reverse(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        var next = cur.next;
        cur.next = prev;
        prev = cur; cur = next;
    }
    return prev;        // new head
}
```
**Complexity:** O(n) time, O(1) space (iterative).

---

### id: linked-lists-merge-two-sorted-lists
```csharp
// A dummy head removes the special case for the first node; splice the smaller head each
// step and attach the leftover tail.
public ListNode MergeTwoLists(ListNode a, ListNode b) {
    var dummy = new ListNode();
    var tail = dummy;
    while (a != null && b != null) {
        if (a.val <= b.val) { tail.next = a; a = a.next; }
        else { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = a ?? b;
    return dummy.next;
}
```
**Complexity:** O(n + m) time, O(1) space.

---

### id: linked-lists-linked-list-cycle-ii
```csharp
// Floyd's: after slow/fast meet, a pointer from head and one from the meeting point
// advance equally and collide at the cycle entrance.
public ListNode DetectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next; fast = fast.next.next;
        if (slow == fast) {
            var p = head;
            while (p != slow) { p = p.next; slow = slow.next; }
            return p;
        }
    }
    return null;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: linked-lists-remove-nth-node-from-end
```csharp
// A gap of n between two pointers locates the target in one pass; a dummy head makes
// removing the actual head a non-special case.
public ListNode RemoveNthFromEnd(ListNode head, int n) {
    var dummy = new ListNode(0, head);
    ListNode fast = dummy, slow = dummy;
    for (int i = 0; i < n; i++) fast = fast.next;
    while (fast.next != null) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: linked-lists-reorder-list
```csharp
// Three composed sub-skills: find middle (fast/slow), reverse second half, merge alternately.
public void ReorderList(ListNode head) {
    if (head?.next == null) return;
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) { slow = slow.next; fast = fast.next.next; }

    ListNode second = slow.next; slow.next = null;     // split (null the first half's tail)
    ListNode prev = null;
    while (second != null) { var nxt = second.next; second.next = prev; prev = second; second = nxt; }

    ListNode first = head;
    while (prev != null) {
        var f = first.next; var s = prev.next;
        first.next = prev; prev.next = f;
        first = f; prev = s;
    }
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: linked-lists-add-two-numbers
```csharp
// Grade-school addition with a carry; the final leftover carry needs an extra node.
public ListNode AddTwoNumbers(ListNode a, ListNode b) {
    var dummy = new ListNode();
    var tail = dummy;
    int carry = 0;
    while (a != null || b != null || carry != 0) {
        int sum = carry + (a?.val ?? 0) + (b?.val ?? 0);
        carry = sum / 10;
        tail.next = new ListNode(sum % 10);
        tail = tail.next;
        a = a?.next; b = b?.next;
    }
    return dummy.next;
}
```
**Complexity:** O(max(n, m)) time.

---

### id: linked-lists-lru-cache
```csharp
// O(1) get/put: a hashmap (key→node) for lookup + a DOUBLY linked list for recency.
// Sentinel head/tail nodes kill edge cases; the double links allow O(1) unlink.
public class LRUCache {
    private class Node { public int Key, Val; public Node Prev, Next; }
    private readonly int _cap;
    private readonly Dictionary<int, Node> _map = new();
    private readonly Node _head = new(), _tail = new();
    public LRUCache(int capacity) { _cap = capacity; _head.Next = _tail; _tail.Prev = _head; }

    private void Remove(Node n) { n.Prev.Next = n.Next; n.Next.Prev = n.Prev; }
    private void AddFront(Node n) { n.Next = _head.Next; n.Prev = _head; _head.Next.Prev = n; _head.Next = n; }

    public int Get(int key) {
        if (!_map.TryGetValue(key, out var n)) return -1;
        Remove(n); AddFront(n);            // touch → most recent
        return n.Val;
    }
    public void Put(int key, int value) {
        if (_map.TryGetValue(key, out var ex)) { ex.Val = value; Remove(ex); AddFront(ex); return; }
        if (_map.Count == _cap) { var lru = _tail.Prev; Remove(lru); _map.Remove(lru.Key); }
        var node = new Node { Key = key, Val = value };
        AddFront(node); _map[key] = node;
    }
}
```
**Complexity:** O(1) per operation.

---

### id: linked-lists-merge-k-sorted-lists
```csharp
// Always pull the global minimum head via a min-heap of the k current heads.
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
**Complexity:** O(n log k) time, O(k) space.

---

### id: linked-lists-reverse-nodes-in-k-group
```csharp
// Reverse each block of k; if fewer than k remain, leave them untouched. Reconnect by
// pointing the old block-head (now the block's tail) at the reversed rest.
public ListNode ReverseKGroup(ListNode head, int k) {
    var node = head;
    for (int i = 0; i < k; i++) { if (node == null) return head; node = node.next; }
    ListNode prev = null, cur = head;
    for (int i = 0; i < k; i++) { var nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
    head.next = ReverseKGroup(cur, k);    // head is the tail of this reversed block
    return prev;                          // new head of this block
}
```
**Complexity:** O(n) time, O(n/k) recursion depth.
