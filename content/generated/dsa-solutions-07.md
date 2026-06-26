# DSA Solutions — Dynamic Programming

> AI-added — verify. Idiomatic C# 12 / .NET 8. Most use bottom-up tabulation with rolling
> arrays where possible.

---

### id: dynamic-programming-climbing-stairs
```csharp
// ways(n) = ways(n-1) + ways(n-2) — Fibonacci, with two rolling variables.
public int ClimbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 2; i <= n; i++) { int c = a + b; a = b; b = c; }
    return b;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: dynamic-programming-house-robber-i
```csharp
// At each house: skip it (keep dp[i-1]) or rob it (dp[i-2] + value).
public int Rob(int[] nums) {
    int prev = 0, cur = 0;        // best through i-2, i-1
    foreach (int x in nums) {
        int next = Math.Max(cur, prev + x);
        prev = cur; cur = next;
    }
    return cur;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: dynamic-programming-house-robber-ii
```csharp
// First and last are adjacent (circular) → run the linear version twice, excluding one
// end each time.
public int Rob(int[] nums) {
    if (nums.Length == 1) return nums[0];
    return Math.Max(RobLine(nums, 0, nums.Length - 2),
                    RobLine(nums, 1, nums.Length - 1));
}
private int RobLine(int[] nums, int lo, int hi) {
    int prev = 0, cur = 0;
    for (int i = lo; i <= hi; i++) { int next = Math.Max(cur, prev + nums[i]); prev = cur; cur = next; }
    return cur;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: dynamic-programming-decode-ways
```csharp
// Like climbing stairs, but transitions are conditional on valid 1- and 2-digit codes.
// Zeros are the trap.
public int NumDecodings(string s) {
    if (s.Length == 0 || s[0] == '0') return 0;
    int prev2 = 1, prev1 = 1;       // dp[i-2], dp[i-1]
    for (int i = 1; i < s.Length; i++) {
        int cur = 0;
        if (s[i] != '0') cur += prev1;                       // valid single digit
        int two = (s[i - 1] - '0') * 10 + (s[i] - '0');
        if (two >= 10 && two <= 26) cur += prev2;            // valid pair
        prev2 = prev1; prev1 = cur;
    }
    return prev1;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: dynamic-programming-coin-change
```csharp
// Unbounded knapsack: dp[a] = min coins for amount a. Coins reusable → amount ascending.
public int CoinChange(int[] coins, int amount) {
    var dp = new int[amount + 1];
    Array.Fill(dp, amount + 1);      // sentinel "infinity"
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        foreach (int c in coins)
            if (c <= a) dp[a] = Math.Min(dp[a], dp[a - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```
**Complexity:** O(amount · coins).

---

### id: dynamic-programming-coin-change-ii
```csharp
// Count combinations (not permutations): loop coins OUTER, amount inner.
public int Change(int amount, int[] coins) {
    var dp = new int[amount + 1];
    dp[0] = 1;
    foreach (int c in coins)
        for (int a = c; a <= amount; a++)
            dp[a] += dp[a - c];
    return dp[amount];
}
```
**Complexity:** O(amount · coins).

---

### id: dynamic-programming-partition-equal-subset-sum
```csharp
// "Can a subset sum to total/2?" = 0/1 subset-sum. 0/1 (no reuse) → iterate sum DESCENDING.
public bool CanPartition(int[] nums) {
    int sum = nums.Sum();
    if ((sum & 1) == 1) return false;
    int target = sum / 2;
    var dp = new bool[target + 1];
    dp[0] = true;
    foreach (int x in nums)
        for (int s = target; s >= x; s--)
            dp[s] |= dp[s - x];
    return dp[target];
}
```
**Complexity:** O(n · sum).

---

### id: dynamic-programming-target-sum
```csharp
// Assigning ± signs to reach T reduces to subset-sum: P - N = T, P + N = total
// ⇒ count subsets summing to P = (total + T) / 2.
public int FindTargetSumWays(int[] nums, int target) {
    int total = nums.Sum();
    if (Math.Abs(target) > total || ((total + target) & 1) == 1) return 0;
    int p = (total + target) / 2;
    var dp = new int[p + 1];
    dp[0] = 1;
    foreach (int x in nums)
        for (int s = p; s >= x; s--)
            dp[s] += dp[s - x];
    return dp[p];
}
```
**Complexity:** O(n · sum).

---

### id: dynamic-programming-longest-increasing-subsequence
```csharp
// O(n log n) "patience" version: tails[k] = smallest possible tail of an increasing
// subsequence of length k+1; binary-search the insertion point.
public int LengthOfLIS(int[] nums) {
    var tails = new List<int>();
    foreach (int x in nums) {
        int lo = 0, hi = tails.Count;
        while (lo < hi) { int mid = (lo + hi) / 2; if (tails[mid] < x) lo = mid + 1; else hi = mid; }
        if (lo == tails.Count) tails.Add(x); else tails[lo] = x;
    }
    return tails.Count;
}
```
**Complexity:** O(n log n).

---

### id: dynamic-programming-longest-common-subsequence
```csharp
// The 2D-DP archetype: match ⇒ diagonal + 1, else max(up, left).
public int LongestCommonSubsequence(string a, string b) {
    int m = a.Length, n = b.Length;
    var dp = new int[m + 1, n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i, j] = a[i - 1] == b[j - 1] ? dp[i - 1, j - 1] + 1
                                            : Math.Max(dp[i - 1, j], dp[i, j - 1]);
    return dp[m, n];
}
```
**Complexity:** O(m·n).

---

### id: dynamic-programming-word-break
```csharp
// dp[i] = prefix of length i is segmentable if some dp[j] is true and s[j..i] is in dict.
public bool WordBreak(string s, IList<string> wordDict) {
    var dict = new HashSet<string>(wordDict);
    var dp = new bool[s.Length + 1];
    dp[0] = true;
    for (int i = 1; i <= s.Length; i++)
        for (int j = 0; j < i; j++)
            if (dp[j] && dict.Contains(s.Substring(j, i - j))) { dp[i] = true; break; }
    return dp[s.Length];
}
```
**Complexity:** O(n²) with hashset lookups.

---

### id: dynamic-programming-maximum-product-subarray
```csharp
// A negative flips min↔max, so track BOTH running max and min.
public int MaxProduct(int[] nums) {
    int max = nums[0], min = nums[0], best = nums[0];
    for (int i = 1; i < nums.Length; i++) {
        int x = nums[i];
        if (x < 0) (max, min) = (min, max);
        max = Math.Max(x, max * x);
        min = Math.Min(x, min * x);
        best = Math.Max(best, max);
    }
    return best;
}
```
**Complexity:** O(n) time, O(1) space.

---

### id: dynamic-programming-longest-palindromic-substring
```csharp
// Expand around each of the 2n-1 centers (odd and even). O(1) space, simpler than DP.
public string LongestPalindrome(string s) {
    if (s.Length < 2) return s;
    int start = 0, maxLen = 1;
    void Expand(int l, int r) {
        while (l >= 0 && r < s.Length && s[l] == s[r]) { l--; r++; }
        int len = r - l - 1;
        if (len > maxLen) { maxLen = len; start = l + 1; }
    }
    for (int i = 0; i < s.Length; i++) { Expand(i, i); Expand(i, i + 1); }
    return s.Substring(start, maxLen);
}
```
**Complexity:** O(n²) time, O(1) space.

---

### id: dynamic-programming-unique-paths-min-path-sum
```csharp
// Grid DP: each cell combines the cell above and to the left. Rolling row → O(n) space.
public int UniquePaths(int m, int n) {
    var dp = new int[n];
    Array.Fill(dp, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[j] += dp[j - 1];
    return dp[n - 1];
}

public int MinPathSum(int[][] grid) {
    int m = grid.Length, n = grid[0].Length;
    var dp = new int[n];
    dp[0] = grid[0][0];
    for (int j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
    for (int i = 1; i < m; i++) {
        dp[0] += grid[i][0];
        for (int j = 1; j < n; j++) dp[j] = Math.Min(dp[j], dp[j - 1]) + grid[i][j];
    }
    return dp[n - 1];
}
```
**Complexity:** O(m·n) time, O(n) space.

---

### id: dynamic-programming-edit-distance
```csharp
// dp[i,j] = min edits to turn a[..i] into b[..j]. Match ⇒ diagonal; else 1 + min(insert,
// delete, replace).
public int MinDistance(string a, string b) {
    int m = a.Length, n = b.Length;
    var dp = new int[m + 1, n + 1];
    for (int i = 0; i <= m; i++) dp[i, 0] = i;     // delete all
    for (int j = 0; j <= n; j++) dp[0, j] = j;     // insert all
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i, j] = a[i - 1] == b[j - 1]
                ? dp[i - 1, j - 1]
                : 1 + Math.Min(dp[i - 1, j - 1], Math.Min(dp[i - 1, j], dp[i, j - 1]));
    return dp[m, n];
}
```
**Complexity:** O(m·n).

---

### id: dynamic-programming-burst-balloons
```csharp
// Think which balloon bursts LAST in an open interval (left, right); that fixes the
// multiplication and splits the range into independent subproblems.
public int MaxCoins(int[] nums) {
    int n = nums.Length;
    var b = new int[n + 2];
    b[0] = b[n + 1] = 1;
    for (int i = 0; i < n; i++) b[i + 1] = nums[i];
    var dp = new int[n + 2, n + 2];
    for (int len = 1; len <= n; len++)
        for (int left = 1; left + len - 1 <= n; left++) {
            int right = left + len - 1;
            for (int k = left; k <= right; k++) {          // k = last burst in (left,right)
                int coins = b[left - 1] * b[k] * b[right + 1] + dp[left, k - 1] + dp[k + 1, right];
                dp[left, right] = Math.Max(dp[left, right], coins);
            }
        }
    return dp[1, n];
}
```
**Complexity:** O(n³).

---

### id: dynamic-programming-regular-expression-matching
```csharp
// dp[i,j] = does s[..i] match p[..j]. '*' means zero of the preceding, or one more of it.
public bool IsMatch(string s, string p) {
    int m = s.Length, n = p.Length;
    var dp = new bool[m + 1, n + 1];
    dp[0, 0] = true;
    for (int j = 1; j <= n; j++)
        if (p[j - 1] == '*') dp[0, j] = dp[0, j - 2];           // x* matches empty
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++) {
            if (p[j - 1] == '*') {
                dp[i, j] = dp[i, j - 2];                         // zero of preceding
                if (p[j - 2] == '.' || p[j - 2] == s[i - 1]) dp[i, j] |= dp[i - 1, j];  // one more
            } else if (p[j - 1] == '.' || p[j - 1] == s[i - 1]) {
                dp[i, j] = dp[i - 1, j - 1];
            }
        }
    return dp[m, n];
}
```
**Complexity:** O(m·n).

---

### id: dynamic-programming-best-time-to-buy-sell-stock-iii-and-iv
```csharp
// State machine over (transaction count, holding?). When k ≥ n/2 it degenerates to
// unlimited transactions (greedy) — handle that to avoid memory blowup.
public int MaxProfit(int k, int[] prices) {
    int n = prices.Length;
    if (n == 0) return 0;
    if (k >= n / 2) {
        int profit = 0;
        for (int i = 1; i < n; i++)
            if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
        return profit;
    }
    var buy = new int[k + 1];
    var sell = new int[k + 1];
    Array.Fill(buy, int.MinValue);
    foreach (int price in prices)
        for (int t = 1; t <= k; t++) {
            buy[t] = Math.Max(buy[t], sell[t - 1] - price);   // hold after t-th buy
            sell[t] = Math.Max(sell[t], buy[t] + price);      // profit after t-th sell
        }
    return sell[k];
}
```
**Complexity:** O(n·k).

---

### id: dynamic-programming-house-robber-iii
```csharp
// Tree DP: each node returns (robThis, skipThis); returning a tuple up is the signature.
public int Rob(TreeNode root) {
    (int rob, int skip) Dfs(TreeNode node) {
        if (node == null) return (0, 0);
        var l = Dfs(node.left);
        var r = Dfs(node.right);
        int rob = node.val + l.skip + r.skip;     // rob node ⇒ must skip children
        int skip = Math.Max(l.rob, l.skip) + Math.Max(r.rob, r.skip);
        return (rob, skip);
    }
    var res = Dfs(root);
    return Math.Max(res.rob, res.skip);
}
```
**Complexity:** O(n).
