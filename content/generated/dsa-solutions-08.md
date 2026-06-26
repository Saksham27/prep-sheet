# DSA Solutions — Strings · Advanced Structures · Math & Geometry

> AI-added — verify. Idiomatic C# 12 / .NET 8.

---

### id: strings-specialized-pattern-matching-implement-strstr
```csharp
// KMP: precompute the failure (lps) array — longest proper prefix that's also a suffix —
// so on a mismatch we skip ahead without re-examining matched chars.
public int StrStr(string haystack, string needle) {
    if (needle.Length == 0) return 0;
    var lps = BuildLps(needle);
    int i = 0, j = 0;
    while (i < haystack.Length) {
        if (haystack[i] == needle[j]) {
            i++; j++;
            if (j == needle.Length) return i - j;
        } else if (j > 0) j = lps[j - 1];
        else i++;
    }
    return -1;
}
private int[] BuildLps(string p) {
    var lps = new int[p.Length];
    int len = 0;
    for (int i = 1; i < p.Length; ) {
        if (p[i] == p[len]) lps[i++] = ++len;
        else if (len > 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    return lps;
}
```
**Complexity:** O(n + m).

---

### id: strings-specialized-pattern-matching-repeated-substring-pattern
```csharp
// s is a repeated unit iff it's a non-trivial rotation of itself: drop the first and last
// char of (s + s) and check it still contains s.
public bool RepeatedSubstringPattern(string s) {
    var doubled = (s + s).Substring(1, 2 * s.Length - 2);
    return doubled.Contains(s);
}
```
**Complexity:** O(n) (with KMP-based search; the slick rotation check above conveys the insight).

---

### id: strings-specialized-pattern-matching-shortest-palindrome
```csharp
// The longest palindromic PREFIX of s = the KMP lps value of s + '#' + reverse(s). Prepend
// the remaining suffix, reversed.
public string ShortestPalindrome(string s) {
    if (s.Length == 0) return s;
    string rev = new string(s.Reverse().ToArray());
    string combined = s + "#" + rev;            // '#' prevents overcounting across the join
    var lps = new int[combined.Length];
    int len = 0;
    for (int i = 1; i < combined.Length; ) {
        if (combined[i] == combined[len]) lps[i++] = ++len;
        else if (len > 0) len = lps[len - 1];
        else lps[i++] = 0;
    }
    string suffix = s.Substring(lps[^1]);
    return new string(suffix.Reverse().ToArray()) + s;
}
```
**Complexity:** O(n).

---

### id: advanced-structures-faang-hard-awareness-implement-once-range-sum-query-mutable
```csharp
// Fenwick tree (Binary Indexed Tree): prefix sums WITH point updates in O(log n). 1-indexed;
// i += i & (-i) to update, i -= i & (-i) to query.
public class NumArray {
    private readonly int[] _tree;
    private readonly int[] _nums;
    private readonly int _n;
    public NumArray(int[] nums) {
        _n = nums.Length;
        _nums = new int[_n];
        _tree = new int[_n + 1];
        for (int i = 0; i < _n; i++) Update(i, nums[i]);
    }
    public void Update(int index, int val) {
        int delta = val - _nums[index];
        _nums[index] = val;
        for (int i = index + 1; i <= _n; i += i & (-i)) _tree[i] += delta;
    }
    public int SumRange(int left, int right) => Prefix(right + 1) - Prefix(left);
    private int Prefix(int i) {
        int sum = 0;
        for (; i > 0; i -= i & (-i)) sum += _tree[i];
        return sum;
    }
}
```
**Complexity:** O(log n) per update and per range query.

---

### id: advanced-structures-faang-hard-awareness-implement-once-count-of-smaller-numbers-after-self
```csharp
// Process right-to-left; for each value query "how many already-seen values are smaller"
// via a Fenwick tree over coordinate-compressed ranks.
public IList<int> CountSmaller(int[] nums) {
    var sorted = nums.Distinct().OrderBy(x => x).ToArray();
    var rank = new Dictionary<int, int>();
    for (int i = 0; i < sorted.Length; i++) rank[sorted[i]] = i + 1;   // 1-indexed
    int n = sorted.Length;
    var tree = new int[n + 1];
    void Add(int i) { for (; i <= n; i += i & (-i)) tree[i]++; }
    int Query(int i) { int s = 0; for (; i > 0; i -= i & (-i)) s += tree[i]; return s; }

    var res = new int[nums.Length];
    for (int i = nums.Length - 1; i >= 0; i--) {
        int r = rank[nums[i]];
        res[i] = Query(r - 1);     // strictly-smaller values already seen
        Add(r);
    }
    return res;
}
```
**Complexity:** O(n log n).

---

### id: math-and-geometry-occasional-awareness-happy-number
```csharp
// Iterating digit-square-sums either reaches 1 or cycles → Floyd's fast/slow on the
// numeric transformation.
public bool IsHappy(int n) {
    int slow = n, fast = n;
    do {
        slow = Next(slow);
        fast = Next(Next(fast));
    } while (slow != fast);
    return slow == 1;
}
private int Next(int x) {
    int sum = 0;
    while (x > 0) { int d = x % 10; sum += d * d; x /= 10; }
    return sum;
}
```
**Complexity:** O(log n) per step.

---

### id: math-and-geometry-occasional-awareness-rotate-image
```csharp
// Transpose, then reverse each row → 90° clockwise, in place (avoids fiddly index math).
public void Rotate(int[][] matrix) {
    int n = matrix.Length;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            (matrix[i][j], matrix[j][i]) = (matrix[j][i], matrix[i][j]);
    foreach (var row in matrix) Array.Reverse(row);
}
```
**Complexity:** O(n²) time, O(1) space.

---

### id: math-and-geometry-occasional-awareness-spiral-matrix
```csharp
// Maintain four shrinking boundaries; re-check before the bottom and left passes to avoid
// double-visiting on non-square grids.
public IList<int> SpiralOrder(int[][] matrix) {
    var res = new List<int>();
    int top = 0, bottom = matrix.Length - 1, left = 0, right = matrix[0].Length - 1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) res.Add(matrix[top][c]);
        top++;
        for (int r = top; r <= bottom; r++) res.Add(matrix[r][right]);
        right--;
        if (top <= bottom) { for (int c = right; c >= left; c--) res.Add(matrix[bottom][c]); bottom--; }
        if (left <= right) { for (int r = bottom; r >= top; r--) res.Add(matrix[r][left]); left++; }
    }
    return res;
}
```
**Complexity:** O(m·n).
