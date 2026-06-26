# DSA Solutions — Two Pointers · Sliding Window · Prefix Sum · Binary Search

> AI-added — verify. Idiomatic C# 12 / .NET 8.

---

### id: two-pointers-valid-palindrome
```csharp
// Converge from both ends, skipping non-alphanumerics; compare case-insensitively.
public bool IsPalindrome(string s) {
    int l = 0, r = s.Length - 1;
    while (l < r) {
        while (l < r && !char.IsLetterOrDigit(s[l])) l++;
        while (l < r && !char.IsLetterOrDigit(s[r])) r--;
        if (char.ToLowerInvariant(s[l]) != char.ToLowerInvariant(s[r])) return false;
        l++; r--;
    }
    return true;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: two-pointers-two-sum-ii-sorted
```csharp
// Converging pointers on a sorted array; raise the floor or lower the ceiling by the sum.
public int[] TwoSum(int[] numbers, int target) {
    int l = 0, r = numbers.Length - 1;
    while (l < r) {
        int sum = numbers[l] + numbers[r];
        if (sum == target) return new[] { l + 1, r + 1 };   // problem is 1-indexed
        if (sum < target) l++; else r--;
    }
    return Array.Empty<int>();
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: two-pointers-3sum
```csharp
// Sort, fix one number, then it's Two-Sum-sorted on the rest. Skip duplicates at all
// three positions — that dedup is the whole difficulty.
public IList<IList<int>> ThreeSum(int[] nums) {
    Array.Sort(nums);
    var res = new List<IList<int>>();
    for (int i = 0; i < nums.Length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;          // skip duplicate anchor
        int l = i + 1, r = nums.Length - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) l++;
            else if (sum > 0) r--;
            else {
                res.Add(new List<int> { nums[i], nums[l], nums[r] });
                l++; r--;
                while (l < r && nums[l] == nums[l - 1]) l++;     // skip duplicates
                while (l < r && nums[r] == nums[r + 1]) r--;
            }
        }
    }
    return res;
}
```
**Complexity:** O(n²) time, O(1) extra space (excluding output).

---

### id: two-pointers-container-with-most-water
```csharp
// Area is bounded by the SHORTER wall, so moving the taller pointer can never help —
// always advance the shorter one.
public int MaxArea(int[] height) {
    int l = 0, r = height.Length - 1, best = 0;
    while (l < r) {
        best = Math.Max(best, Math.Min(height[l], height[r]) * (r - l));
        if (height[l] < height[r]) l++; else r--;
    }
    return best;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: two-pointers-sort-colors-dutch-flag
```csharp
// Three regions (0s | 1s | 2s) via low/mid/high. After swapping mid with high, DON'T
// advance mid — the swapped-in value is unexamined.
public void SortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.Length - 1;
    while (mid <= high) {
        if (nums[mid] == 0) { (nums[low], nums[mid]) = (nums[mid], nums[low]); low++; mid++; }
        else if (nums[mid] == 2) { (nums[mid], nums[high]) = (nums[high], nums[mid]); high--; }
        else mid++;
    }
}
```
**Complexity:** O(n) time, O(1) space, single pass.

---

### id: two-pointers-trapping-rain-water
```csharp
// Water above i = min(maxLeft, maxRight) - height[i]. Advance the side with the smaller
// wall, since that wall bounds the water there.
public int Trap(int[] height) {
    int l = 0, r = height.Length - 1, leftMax = 0, rightMax = 0, water = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            leftMax = Math.Max(leftMax, height[l]);
            water += leftMax - height[l];
            l++;
        } else {
            rightMax = Math.Max(rightMax, height[r]);
            water += rightMax - height[r];
            r--;
        }
    }
    return water;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: sliding-window-longest-substring-without-repeating-characters
```csharp
// Window valid while all chars unique. On a duplicate, jump `left` past the previous
// occurrence (O(1)) using a last-seen-index map.
public int LengthOfLongestSubstring(string s) {
    var last = new Dictionary<char, int>();
    int left = 0, best = 0;
    for (int right = 0; right < s.Length; right++) {
        char c = s[right];
        if (last.TryGetValue(c, out int j) && j >= left) left = j + 1;
        last[c] = right;
        best = Math.Max(best, right - left + 1);
    }
    return best;
}
```
**Complexity:** O(n) time, O(min(n, charset)) space.

---

### id: sliding-window-longest-repeating-character-replacement
```csharp
// Window valid while (windowLen - maxFreq) <= k. maxFreq need not be decreased on shrink:
// a slightly stale max still yields a correct answer (classic subtlety).
public int CharacterReplacement(string s, int k) {
    var count = new int[26];
    int left = 0, maxFreq = 0, best = 0;
    for (int right = 0; right < s.Length; right++) {
        maxFreq = Math.Max(maxFreq, ++count[s[right] - 'A']);
        while (right - left + 1 - maxFreq > k) count[s[left++] - 'A']--;
        best = Math.Max(best, right - left + 1);
    }
    return best;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: sliding-window-minimum-window-substring
```csharp
// Expand right until the window covers all required chars (have == need), then contract
// from the left while it still covers, recording the minimum.
public string MinWindow(string s, string t) {
    if (t.Length == 0 || s.Length < t.Length) return "";
    var need = new Dictionary<char, int>();
    foreach (char c in t) need[c] = need.GetValueOrDefault(c) + 1;
    int required = need.Count, formed = 0, left = 0;
    var window = new Dictionary<char, int>();
    int bestLen = int.MaxValue, bestL = 0;
    for (int right = 0; right < s.Length; right++) {
        char c = s[right];
        window[c] = window.GetValueOrDefault(c) + 1;
        if (need.ContainsKey(c) && window[c] == need[c]) formed++;
        while (formed == required) {
            if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestL = left; }
            char lc = s[left++];
            window[lc]--;
            if (need.ContainsKey(lc) && window[lc] < need[lc]) formed--;
        }
    }
    return bestLen == int.MaxValue ? "" : s.Substring(bestL, bestLen);
}
```
**Complexity:** O(|s| + |t|) time.

---

### id: sliding-window-best-time-to-buy-sell-stock
```csharp
// A degenerate window: track the minimum price seen and the best profit against it.
public int MaxProfit(int[] prices) {
    int min = int.MaxValue, best = 0;
    foreach (int p in prices) {
        min = Math.Min(min, p);
        best = Math.Max(best, p - min);
    }
    return best;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: sliding-window-permutation-in-string
```csharp
// A permutation = a fixed-size window whose 26-length char-count vector matches s1's.
public bool CheckInclusion(string s1, string s2) {
    if (s1.Length > s2.Length) return false;
    int[] need = new int[26], win = new int[26];
    foreach (char c in s1) need[c - 'a']++;
    for (int i = 0; i < s2.Length; i++) {
        win[s2[i] - 'a']++;
        if (i >= s1.Length) win[s2[i - s1.Length] - 'a']--;   // slide
        if (i >= s1.Length - 1 && win.SequenceEqual(need)) return true;
    }
    return false;
}
```
**Complexity:** O(26·n) time, O(1) space.

---

### id: sliding-window-sliding-window-maximum
```csharp
// Maintain a deque of INDICES whose values are decreasing; the front is the window max.
// Pop smaller values from the back, and pop the front when it slides out of range.
public int[] MaxSlidingWindow(int[] nums, int k) {
    var dq = new LinkedList<int>();                  // indices
    var res = new int[nums.Length - k + 1];
    for (int i = 0; i < nums.Length; i++) {
        if (dq.Count > 0 && dq.First!.Value <= i - k) dq.RemoveFirst();   // expired
        while (dq.Count > 0 && nums[dq.Last!.Value] <= nums[i]) dq.RemoveLast();
        dq.AddLast(i);
        if (i >= k - 1) res[i - k + 1] = nums[dq.First!.Value];
    }
    return res;
}
```
**Complexity:** O(n) time, O(k) space.

---

### id: prefix-sum-and-difference-arrays-subarray-sum-equals-k
```csharp
// A subarray sums to k iff some earlier prefix equals (currentPrefix - k). Seed {0:1}
// for subarrays starting at index 0. Handles negatives (sliding window can't).
public int SubarraySum(int[] nums, int k) {
    var seen = new Dictionary<long, int> { [0] = 1 };   // prefix sum -> count
    long sum = 0; int count = 0;
    foreach (int x in nums) {
        sum += x;
        count += seen.GetValueOrDefault(sum - k);
        seen[sum] = seen.GetValueOrDefault(sum) + 1;
    }
    return count;
}
```
**Complexity:** O(n) time, O(n) space.

---

### id: prefix-sum-and-difference-arrays-range-sum-query-2d-immutable
```csharp
// 2D prefix sums with inclusion-exclusion. pre[r,c] = sum of the rectangle from origin.
public class NumMatrix {
    private readonly int[,] pre;
    public NumMatrix(int[][] matrix) {
        int m = matrix.Length, n = matrix[0].Length;
        pre = new int[m + 1, n + 1];
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++)
                pre[r + 1, c + 1] = matrix[r][c] + pre[r, c + 1] + pre[r + 1, c] - pre[r, c];
    }
    public int SumRegion(int r1, int c1, int r2, int c2) =>
        pre[r2 + 1, c2 + 1] - pre[r1, c2 + 1] - pre[r2 + 1, c1] + pre[r1, c1];
}
```
**Complexity:** O(mn) build, O(1) per query.

---

### id: prefix-sum-and-difference-arrays-corporate-flight-bookings-car-pooling
```csharp
// Difference array: a range +v over [l, r] becomes diff[l] += v; diff[r+1] -= v. One
// prefix-sum pass materializes the per-seat totals.
public int[] CorpFlightBookings(int[][] bookings, int n) {
    var diff = new int[n + 1];
    foreach (var b in bookings) {       // b = [first, last, seats] (1-indexed flights)
        diff[b[0] - 1] += b[2];
        diff[b[1]] -= b[2];
    }
    var res = new int[n];
    int running = 0;
    for (int i = 0; i < n; i++) { running += diff[i]; res[i] = running; }
    return res;
}
```
**Complexity:** O(n + bookings) time.

---

### id: binary-search-binary-search
```csharp
// The canonical inclusive-bounds loop. Always use lo + (hi-lo)/2 to avoid overflow.
public int Search(int[] nums, int target) {
    int lo = 0, hi = nums.Length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
```
**Complexity:** O(log n).

---

### id: binary-search-search-in-rotated-sorted-array
```csharp
// At any mid, one half is sorted — identify it, then decide if target lies within it.
public int Search(int[] nums, int target) {
    int lo = 0, hi = nums.Length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {                        // left half sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                            // right half sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```
**Complexity:** O(log n).

---

### id: binary-search-find-first-and-last-position
```csharp
// Two boundary searches: lower_bound(target) and lower_bound(target+1) - 1.
public int[] SearchRange(int[] nums, int target) {
    int lo = LowerBound(nums, target);
    if (lo == nums.Length || nums[lo] != target) return new[] { -1, -1 };
    return new[] { lo, LowerBound(nums, target + 1) - 1 };
}
private int LowerBound(int[] a, int t) {
    int lo = 0, hi = a.Length;                    // half-open [lo, hi)
    while (lo < hi) { int mid = lo + (hi - lo) / 2; if (a[mid] < t) lo = mid + 1; else hi = mid; }
    return lo;
}
```
**Complexity:** O(log n).

---

### id: binary-search-koko-eating-bananas
```csharp
// "Min speed to finish in h hours" is monotonic in speed → binary-search the speed.
public int MinEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = piles.Max();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        long hours = 0;
        foreach (int p in piles) hours += (p + mid - 1) / mid;   // ceil(p/mid)
        if (hours <= h) hi = mid; else lo = mid + 1;             // feasible → try slower
    }
    return lo;
}
```
**Complexity:** O(n log(maxPile)).

---

### id: binary-search-find-minimum-in-rotated-sorted-array
```csharp
// Compare against a[hi] (not a[lo]) to handle the no-rotation case cleanly.
public int FindMin(int[] nums) {
    int lo = 0, hi = nums.Length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;   // min is strictly right of mid
        else hi = mid;                            // min is at mid or to its left
    }
    return nums[lo];
}
```
**Complexity:** O(log n).

---

### id: binary-search-split-array-largest-sum
```csharp
// "Minimize the largest subarray sum across k splits" → binary-search that value;
// feasible(x) = the array cuts into <= k pieces each with sum <= x. The archetype.
public int SplitArray(int[] nums, int k) {
    int lo = nums.Max(), hi = nums.Sum();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (Pieces(nums, mid) <= k) hi = mid; else lo = mid + 1;
    }
    return lo;
}
private int Pieces(int[] nums, int cap) {
    int pieces = 1, cur = 0;
    foreach (int x in nums) {
        if (cur + x > cap) { pieces++; cur = x; } else cur += x;
    }
    return pieces;
}
```
**Complexity:** O(n log(sum)).

---

### id: binary-search-median-of-two-sorted-arrays
```csharp
// Binary-search the partition of the SHORTER array so both left halves together hold
// half the elements, with maxLeft <= minRight. ±∞ sentinels guard empty partitions.
public double FindMedianSortedArrays(int[] a, int[] b) {
    if (a.Length > b.Length) (a, b) = (b, a);
    int m = a.Length, n = b.Length, half = (m + n + 1) / 2;
    int lo = 0, hi = m;
    while (lo <= hi) {
        int i = lo + (hi - lo) / 2;   // cut in a
        int j = half - i;            // cut in b
        int aL = i == 0 ? int.MinValue : a[i - 1];
        int aR = i == m ? int.MaxValue : a[i];
        int bL = j == 0 ? int.MinValue : b[j - 1];
        int bR = j == n ? int.MaxValue : b[j];
        if (aL <= bR && bL <= aR) {
            if (((m + n) & 1) == 1) return Math.Max(aL, bL);
            return (Math.Max(aL, bL) + Math.Min(aR, bR)) / 2.0;
        }
        if (aL > bR) hi = i - 1; else lo = i + 1;
    }
    return 0.0;
}
```
**Complexity:** O(log min(m, n)).
