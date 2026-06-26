# DSA — Generated C# Solutions

> **AI-added — verify.** These full solutions are generated to complement the source
> Insight/Approach/Complexity/Watch notes (which are your original content). Each is
> idiomatic C# 12 / .NET 8. The parser merges them onto problems by `id` and flags them
> `needsReview`. Verify correctness before trusting them in an interview.
>
> Format: `### id: <problem-id>` then the solution markdown (prose + a ```csharp block).

---

### id: foundations-single-number
```csharp
// XOR cancels equal pairs (a ^ a = 0; a ^ 0 = a), leaving only the unique element.
public int SingleNumber(int[] nums) {
    int x = 0;
    foreach (int n in nums) x ^= n;
    return x;
}
```
**Complexity:** O(n) time, O(1) space — the O(1)-space answer they want (no hashmap).

---

### id: foundations-number-of-1-bits
```csharp
// Brian Kernighan: n & (n-1) clears the lowest set bit, so the loop runs once per 1-bit.
public int HammingWeight(uint n) {
    int count = 0;
    while (n != 0) { n &= n - 1; count++; }
    return count;
}
```
**Complexity:** O(number of set bits) time, O(1) space. Use `uint` (or `BitOperations.PopCount`) to avoid sign issues.

---

### id: foundations-counting-bits
```csharp
// DP: a number i has the same set bits as i>>1, plus 1 if its lowest bit is set.
public int[] CountBits(int n) {
    var bits = new int[n + 1];
    for (int i = 1; i <= n; i++)
        bits[i] = bits[i >> 1] + (i & 1);
    return bits;
}
```
**Complexity:** O(n) time, O(n) space (for the output array).

---

### id: foundations-single-number-ii
```csharp
// Every value appears 3× except one. For each bit position, the count of 1s across all
// numbers is a multiple of 3 unless the unique number sets that bit.
public int SingleNumber(int[] nums) {
    int result = 0;
    for (int b = 0; b < 32; b++) {
        int sum = 0;
        foreach (int n in nums) sum += (n >> b) & 1;
        if (sum % 3 != 0) result |= 1 << b;
    }
    return result;
}

// O(1)-space alternative: two accumulators tracking bits seen once / twice.
public int SingleNumberOnesTwos(int[] nums) {
    int ones = 0, twos = 0;
    foreach (int n in nums) {
        ones = (ones ^ n) & ~twos;   // add to 'ones' unless already in 'twos'
        twos = (twos ^ n) & ~ones;   // add to 'twos' unless now in 'ones'
    }
    return ones;                      // appears exactly once
}
```
**Complexity:** O(32·n) for the bit-count version, O(n)/O(1) for the ones/twos version.

---

### id: arrays-and-hashing-two-sum
```csharp
// For each x, the partner we need is target - x. Remember values we've already passed;
// check the complement BEFORE inserting x so we never pair an element with itself.
public int[] TwoSum(int[] nums, int target) {
    var seen = new Dictionary<int, int>();         // value -> index
    for (int i = 0; i < nums.Length; i++) {
        int need = target - nums[i];
        if (seen.TryGetValue(need, out int j)) return new[] { j, i };
        seen[nums[i]] = i;
    }
    return Array.Empty<int>();
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: arrays-and-hashing-contains-duplicate
```csharp
// HashSet.Add returns false if the element was already present — first false = duplicate.
public bool ContainsDuplicate(int[] nums) {
    var seen = new HashSet<int>();
    foreach (int n in nums)
        if (!seen.Add(n)) return true;
    return false;
}
```
**Complexity:** O(n) time, O(n) space. (O(1)-space alternative: sort then scan neighbours, O(n log n).)

---

### id: arrays-and-hashing-group-anagrams
```csharp
// Anagrams share a canonical key. A 26-length character-count vector beats a sorted
// string (no O(k log k) sort) and is the stronger answer.
public IList<IList<string>> GroupAnagrams(string[] strs) {
    var groups = new Dictionary<string, IList<string>>();
    foreach (var s in strs) {
        var count = new int[26];
        foreach (char c in s) count[c - 'a']++;
        string key = string.Join(',', count);
        if (!groups.TryGetValue(key, out var list))
            groups[key] = list = new List<string>();
        list.Add(s);
    }
    return groups.Values.ToList();
}
```
**Complexity:** O(n·k) time (k = word length), O(n·k) space.

---

### id: arrays-and-hashing-top-k-frequent-elements
```csharp
// Bucket sort by frequency: index a bucket array by count, then read from high counts
// down. Beats a size-k heap (O(n log k)) and surprises interviewers.
public int[] TopKFrequent(int[] nums, int k) {
    var freq = new Dictionary<int, int>();
    foreach (int n in nums) freq[n] = freq.GetValueOrDefault(n) + 1;

    var buckets = new List<int>[nums.Length + 1];   // buckets[c] = values seen c times
    foreach (var kv in freq)
        (buckets[kv.Value] ??= new List<int>()).Add(kv.Key);

    var res = new List<int>();
    for (int c = nums.Length; c >= 1 && res.Count < k; c--)
        if (buckets[c] != null) res.AddRange(buckets[c]);
    return res.Take(k).ToArray();
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: arrays-and-hashing-product-of-array-except-self
```csharp
// answer[i] = (product of everything left of i) * (product of everything right of i).
// Two passes, no division (which would break on zeros). Output array doesn't count as
// extra space.
public int[] ProductExceptSelf(int[] nums) {
    int n = nums.Length;
    var res = new int[n];
    res[0] = 1;
    for (int i = 1; i < n; i++) res[i] = res[i - 1] * nums[i - 1];   // prefix products
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {                               // multiply suffixes
        res[i] *= suffix;
        suffix *= nums[i];
    }
    return res;
}
```
**Complexity:** O(n) time, O(1) extra space.

---

### id: arrays-and-hashing-valid-sudoku
```csharp
// Validity = no duplicate within any row, column, or 3×3 box. One set per row/col/box.
// Box index = (r/3)*3 + c/3.
public bool IsValidSudoku(char[][] board) {
    var rows = new HashSet<char>[9];
    var cols = new HashSet<char>[9];
    var boxes = new HashSet<char>[9];
    for (int i = 0; i < 9; i++) { rows[i] = new(); cols[i] = new(); boxes[i] = new(); }

    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++) {
            char v = board[r][c];
            if (v == '.') continue;
            int b = (r / 3) * 3 + c / 3;
            if (!rows[r].Add(v) || !cols[c].Add(v) || !boxes[b].Add(v)) return false;
        }
    return true;
}
```
**Complexity:** O(1) — the board is a fixed 81 cells.

---

### id: arrays-and-hashing-longest-consecutive-sequence
```csharp
// Dump into a set; only START counting from a number whose predecessor is absent, so
// each run is walked exactly once → O(n) overall.
public int LongestConsecutive(int[] nums) {
    var set = new HashSet<int>(nums);
    int best = 0;
    foreach (int n in set) {
        if (set.Contains(n - 1)) continue;          // not a run beginning
        int len = 1;
        while (set.Contains(n + len)) len++;
        best = Math.Max(best, len);
    }
    return best;
}
```
**Complexity:** O(n) time, O(n) space. (Without the run-beginning guard it degrades to O(n²).)

---

### id: arrays-and-hashing-first-missing-positive
```csharp
// The answer lies in [1, n+1]. Use the array as a hash: place value v into slot v-1 via
// cyclic-sort swaps, then the first slot where a[i] != i+1 is the answer.
public int FirstMissingPositive(int[] nums) {
    int n = nums.Length;
    for (int i = 0; i < n; i++) {
        while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
            int j = nums[i] - 1;                     // home slot for nums[i]
            (nums[i], nums[j]) = (nums[j], nums[i]);
        }
    }
    for (int i = 0; i < n; i++)
        if (nums[i] != i + 1) return i + 1;
    return n + 1;
}
```
**Complexity:** O(n) time, O(1) space.
