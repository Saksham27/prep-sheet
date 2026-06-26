# DSA Solutions — Backtracking · Trees · BST · Tries

> AI-added — verify. Idiomatic C# 12 / .NET 8.
> Tree problems assume `class TreeNode { public int val; public TreeNode left, right; ... }`
> with the usual LeetCode constructors.

---

### id: recursion-and-backtracking-subsets
```csharp
// Every node of the recursion tree is a valid subset. Copy `path` when adding (it mutates).
public IList<IList<int>> Subsets(int[] nums) {
    var res = new List<IList<int>>();
    var path = new List<int>();
    void Backtrack(int start) {
        res.Add(new List<int>(path));
        for (int i = start; i < nums.Length; i++) {
            path.Add(nums[i]);
            Backtrack(i + 1);                  // i+1 = no reuse
            path.RemoveAt(path.Count - 1);     // un-choose
        }
    }
    Backtrack(0);
    return res;
}
```
**Complexity:** O(n·2ⁿ).

---

### id: recursion-and-backtracking-permutations
```csharp
// Fill positions, marking used elements; reset used[i] on the way back up.
public IList<IList<int>> Permute(int[] nums) {
    var res = new List<IList<int>>();
    var path = new List<int>();
    var used = new bool[nums.Length];
    void Backtrack() {
        if (path.Count == nums.Length) { res.Add(new List<int>(path)); return; }
        for (int i = 0; i < nums.Length; i++) {
            if (used[i]) continue;
            used[i] = true; path.Add(nums[i]);
            Backtrack();
            path.RemoveAt(path.Count - 1); used[i] = false;
        }
    }
    Backtrack();
    return res;
}
```
**Complexity:** O(n·n!).

---

### id: recursion-and-backtracking-combination-sum
```csharp
// Unlimited reuse → recurse with the SAME start index. Sort enables an early break (prune).
public IList<IList<int>> CombinationSum(int[] candidates, int target) {
    Array.Sort(candidates);
    var res = new List<IList<int>>();
    var path = new List<int>();
    void Backtrack(int start, int remain) {
        if (remain == 0) { res.Add(new List<int>(path)); return; }
        for (int i = start; i < candidates.Length; i++) {
            if (candidates[i] > remain) break;          // sorted → no point continuing
            path.Add(candidates[i]);
            Backtrack(i, remain - candidates[i]);       // i, not i+1 → reuse allowed
            path.RemoveAt(path.Count - 1);
        }
    }
    Backtrack(0, target);
    return res;
}
```
**Complexity:** exponential, heavily pruned.

---

### id: recursion-and-backtracking-word-search
```csharp
// DFS from each cell, temporarily overwriting visited cells; restore on backtrack.
public bool Exist(char[][] board, string word) {
    int m = board.Length, n = board[0].Length;
    bool Dfs(int r, int c, int k) {
        if (k == word.Length) return true;
        if (r < 0 || r >= m || c < 0 || c >= n || board[r][c] != word[k]) return false;
        char tmp = board[r][c];
        board[r][c] = '#';
        bool found = Dfs(r+1,c,k+1) || Dfs(r-1,c,k+1) || Dfs(r,c+1,k+1) || Dfs(r,c-1,k+1);
        board[r][c] = tmp;
        return found;
    }
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (Dfs(r, c, 0)) return true;
    return false;
}
```
**Complexity:** O(m·n·4ᴸ).

---

### id: recursion-and-backtracking-letter-combinations-of-a-phone-number
```csharp
// Cartesian product across digit→letters maps; one digit deep per recursion level.
public IList<string> LetterCombinations(string digits) {
    var res = new List<string>();
    if (digits.Length == 0) return res;       // empty-input edge case
    string[] map = { "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz" };
    var sb = new System.Text.StringBuilder();
    void Backtrack(int i) {
        if (i == digits.Length) { res.Add(sb.ToString()); return; }
        foreach (char c in map[digits[i] - '0']) { sb.Append(c); Backtrack(i + 1); sb.Length--; }
    }
    Backtrack(0);
    return res;
}
```
**Complexity:** O(4ⁿ·n).

---

### id: recursion-and-backtracking-palindrome-partitioning
```csharp
// Try every prefix; recurse on the rest only when the prefix is a palindrome.
public IList<IList<string>> Partition(string s) {
    var res = new List<IList<string>>();
    var path = new List<string>();
    bool IsPalin(int l, int r) { while (l < r) if (s[l++] != s[r--]) return false; return true; }
    void Backtrack(int start) {
        if (start == s.Length) { res.Add(new List<string>(path)); return; }
        for (int end = start; end < s.Length; end++) {
            if (!IsPalin(start, end)) continue;
            path.Add(s.Substring(start, end - start + 1));
            Backtrack(end + 1);
            path.RemoveAt(path.Count - 1);
        }
    }
    Backtrack(0);
    return res;
}
```
**Complexity:** O(2ⁿ·n).

---

### id: recursion-and-backtracking-n-queens
```csharp
// One queen per row; track attacked columns and both diagonals (r−c and r+c) as sets.
public IList<IList<string>> SolveNQueens(int n) {
    var res = new List<IList<string>>();
    var cols = new bool[n];
    var diag1 = new bool[2 * n];   // r - c + n
    var diag2 = new bool[2 * n];   // r + c
    var col = new int[n];
    void Backtrack(int r) {
        if (r == n) {
            var sol = new List<string>();
            for (int i = 0; i < n; i++)
                sol.Add(new string('.', col[i]) + "Q" + new string('.', n - col[i] - 1));
            res.Add(sol);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (cols[c] || diag1[r - c + n] || diag2[r + c]) continue;
            cols[c] = diag1[r - c + n] = diag2[r + c] = true; col[r] = c;
            Backtrack(r + 1);
            cols[c] = diag1[r - c + n] = diag2[r + c] = false;
        }
    }
    Backtrack(0);
    return res;
}
```
**Complexity:** O(n!).

---

### id: recursion-and-backtracking-sudoku-solver
```csharp
// Backtracking constraint satisfaction: find an empty cell, try 1–9 that don't violate
// row/col/box, recurse, undo on failure.
public void SolveSudoku(char[][] board) {
    bool Valid(int r, int c, char v) {
        for (int i = 0; i < 9; i++) {
            if (board[r][i] == v || board[i][c] == v) return false;
            if (board[(r / 3) * 3 + i / 3][(c / 3) * 3 + i % 3] == v) return false;
        }
        return true;
    }
    bool Solve() {
        for (int r = 0; r < 9; r++)
            for (int c = 0; c < 9; c++)
                if (board[r][c] == '.') {
                    for (char v = '1'; v <= '9'; v++) {
                        if (!Valid(r, c, v)) continue;
                        board[r][c] = v;
                        if (Solve()) return true;
                        board[r][c] = '.';
                    }
                    return false;            // no valid digit here → backtrack
                }
        return true;                          // no empty cell → solved
    }
    Solve();
}
```
**Complexity:** exponential, heavily pruned.

---

### id: trees-binary-trees-max-depth-invert-tree-same-tree
```csharp
// Three one-line recursions that build the "combine left and right" reflex.
public int MaxDepth(TreeNode root) =>
    root == null ? 0 : 1 + Math.Max(MaxDepth(root.left), MaxDepth(root.right));

public TreeNode InvertTree(TreeNode root) {
    if (root == null) return null;
    (root.left, root.right) = (InvertTree(root.right), InvertTree(root.left));
    return root;
}

public bool IsSameTree(TreeNode p, TreeNode q) {
    if (p == null || q == null) return p == q;
    return p.val == q.val && IsSameTree(p.left, q.left) && IsSameTree(p.right, q.right);
}
```
**Complexity:** O(n) each.

---

### id: trees-binary-trees-level-order-traversal
```csharp
// Freeze q.Count at the start of each level to separate levels.
public IList<IList<int>> LevelOrder(TreeNode root) {
    var res = new List<IList<int>>();
    if (root == null) return res;
    var q = new Queue<TreeNode>(); q.Enqueue(root);
    while (q.Count > 0) {
        int sz = q.Count;
        var level = new List<int>();
        for (int i = 0; i < sz; i++) {
            var node = q.Dequeue(); level.Add(node.val);
            if (node.left != null) q.Enqueue(node.left);
            if (node.right != null) q.Enqueue(node.right);
        }
        res.Add(level);
    }
    return res;
}
```
**Complexity:** O(n).

---

### id: trees-binary-trees-diameter-of-binary-tree
```csharp
// Return depth up the tree, but side-effect the global max of (leftDepth + rightDepth).
public int DiameterOfBinaryTree(TreeNode root) {
    int best = 0;
    int Depth(TreeNode node) {
        if (node == null) return 0;
        int l = Depth(node.left), r = Depth(node.right);
        best = Math.Max(best, l + r);
        return 1 + Math.Max(l, r);
    }
    Depth(root);
    return best;
}
```
**Complexity:** O(n).

---

### id: trees-binary-trees-lowest-common-ancestor-general-binary-tree
```csharp
// Post-order: if both sides return non-null, this node is the LCA; else bubble up the
// non-null one. A node is its own ancestor (handled by the root==p||root==q base case).
public TreeNode LowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    var left = LowestCommonAncestor(root.left, p, q);
    var right = LowestCommonAncestor(root.right, p, q);
    if (left != null && right != null) return root;
    return left ?? right;
}
```
**Complexity:** O(n).

---

### id: trees-binary-trees-right-side-view
```csharp
// BFS, taking the last node dequeued at each level.
public IList<int> RightSideView(TreeNode root) {
    var res = new List<int>();
    if (root == null) return res;
    var q = new Queue<TreeNode>(); q.Enqueue(root);
    while (q.Count > 0) {
        int sz = q.Count;
        for (int i = 0; i < sz; i++) {
            var node = q.Dequeue();
            if (i == sz - 1) res.Add(node.val);
            if (node.left != null) q.Enqueue(node.left);
            if (node.right != null) q.Enqueue(node.right);
        }
    }
    return res;
}
```
**Complexity:** O(n).

---

### id: trees-binary-trees-construct-from-preorder-inorder
```csharp
// Preorder gives the root; its index in inorder splits left/right subtrees. A value→index
// map makes the split O(1).
public TreeNode BuildTree(int[] preorder, int[] inorder) {
    var idx = new Dictionary<int, int>();
    for (int i = 0; i < inorder.Length; i++) idx[inorder[i]] = i;
    int pre = 0;
    TreeNode Build(int lo, int hi) {
        if (lo > hi) return null;
        int rootVal = preorder[pre++];
        var node = new TreeNode(rootVal);
        int mid = idx[rootVal];
        node.left = Build(lo, mid - 1);
        node.right = Build(mid + 1, hi);
        return node;
    }
    return Build(0, inorder.Length - 1);
}
```
**Complexity:** O(n).

---

### id: trees-binary-trees-binary-tree-maximum-path-sum
```csharp
// Each node returns the best STRAIGHT downward path (clamping negatives to 0); the answer
// may BEND at a node = node.val + leftGain + rightGain.
public int MaxPathSum(TreeNode root) {
    int best = int.MinValue;
    int Gain(TreeNode node) {
        if (node == null) return 0;
        int l = Math.Max(0, Gain(node.left));
        int r = Math.Max(0, Gain(node.right));
        best = Math.Max(best, node.val + l + r);    // bent path candidate
        return node.val + Math.Max(l, r);           // straight path returned up
    }
    Gain(root);
    return best;
}
```
**Complexity:** O(n).

---

### id: trees-binary-trees-serialize-deserialize
```csharp
// Preorder stream with explicit null markers ('#') uniquely encodes a tree.
public class Codec {
    public string serialize(TreeNode root) {
        var sb = new System.Text.StringBuilder();
        void Dfs(TreeNode node) {
            if (node == null) { sb.Append("#,"); return; }
            sb.Append(node.val).Append(',');
            Dfs(node.left); Dfs(node.right);
        }
        Dfs(root);
        return sb.ToString();
    }
    public TreeNode deserialize(string data) {
        var tokens = data.Split(',');
        int i = 0;
        TreeNode Build() {
            var t = tokens[i++];
            if (t == "#") return null;
            var node = new TreeNode(int.Parse(t));
            node.left = Build();
            node.right = Build();
            return node;
        }
        return Build();
    }
}
```
**Complexity:** O(n) each way.

---

### id: binary-search-trees-validate-bst
```csharp
// Every node must lie within an inherited (min, max) range — local left<node<right is not
// enough. Use long bounds for int-edge values.
public bool IsValidBST(TreeNode root) {
    bool Valid(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return Valid(node.left, min, node.val) && Valid(node.right, node.val, max);
    }
    return Valid(root, long.MinValue, long.MaxValue);
}
```
**Complexity:** O(n).

---

### id: binary-search-trees-kth-smallest-in-bst
```csharp
// In-order yields ascending order; stop at the kth (don't traverse the whole tree).
public int KthSmallest(TreeNode root, int k) {
    var st = new Stack<TreeNode>();
    var cur = root;
    while (cur != null || st.Count > 0) {
        while (cur != null) { st.Push(cur); cur = cur.left; }
        cur = st.Pop();
        if (--k == 0) return cur.val;
        cur = cur.right;
    }
    return -1;
}
```
**Complexity:** O(h + k).

---

### id: binary-search-trees-lca-of-bst
```csharp
// Use the ordering: both smaller → go left, both larger → go right, else the split is LCA.
public TreeNode LowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    var cur = root;
    while (cur != null) {
        if (p.val < cur.val && q.val < cur.val) cur = cur.left;
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
        else return cur;
    }
    return null;
}
```
**Complexity:** O(h).

---

### id: binary-search-trees-insert-delete-in-bst
```csharp
public TreeNode InsertIntoBST(TreeNode root, int val) {
    if (root == null) return new TreeNode(val);
    if (val < root.val) root.left = InsertIntoBST(root.left, val);
    else root.right = InsertIntoBST(root.right, val);
    return root;
}

// Delete's hard case is two children: replace with the in-order successor (min of the
// right subtree), then delete that successor.
public TreeNode DeleteNode(TreeNode root, int key) {
    if (root == null) return null;
    if (key < root.val) root.left = DeleteNode(root.left, key);
    else if (key > root.val) root.right = DeleteNode(root.right, key);
    else {
        if (root.left == null) return root.right;
        if (root.right == null) return root.left;
        var succ = root.right;
        while (succ.left != null) succ = succ.left;
        root.val = succ.val;
        root.right = DeleteNode(root.right, succ.val);
    }
    return root;
}
```
**Complexity:** O(h).

---

### id: tries-prefix-trees-implement-trie
```csharp
// The isEnd flag distinguishes a stored word from a mere prefix.
public class Trie {
    private readonly Trie[] _next = new Trie[26];
    private bool _isEnd;
    public void Insert(string word) {
        var cur = this;
        foreach (char c in word) cur = cur._next[c - 'a'] ??= new Trie();
        cur._isEnd = true;
    }
    public bool Search(string word) { var n = Walk(word); return n != null && n._isEnd; }
    public bool StartsWith(string prefix) => Walk(prefix) != null;
    private Trie Walk(string s) {
        var cur = this;
        foreach (char c in s) { cur = cur._next[c - 'a']; if (cur == null) return null; }
        return cur;
    }
}
```
**Complexity:** O(L) per operation.

---

### id: tries-prefix-trees-add-and-search-words-with-wildcard
```csharp
// '.' branches into a DFS over all children; a literal char follows a single edge.
public class WordDictionary {
    private class Node { public Node[] Next = new Node[26]; public bool IsEnd; }
    private readonly Node _root = new();
    public void AddWord(string word) {
        var cur = _root;
        foreach (char c in word) cur = cur.Next[c - 'a'] ??= new Node();
        cur.IsEnd = true;
    }
    public bool Search(string word) {
        bool Dfs(Node node, int i) {
            if (node == null) return false;
            if (i == word.Length) return node.IsEnd;
            char c = word[i];
            if (c == '.') {
                foreach (var child in node.Next) if (Dfs(child, i + 1)) return true;
                return false;
            }
            return Dfs(node.Next[c - 'a'], i + 1);
        }
        return Dfs(_root, 0);
    }
}
```
**Complexity:** O(26^dots · L) worst case.

---

### id: tries-prefix-trees-word-search-ii
```csharp
// Build a Trie of the target words, then DFS the grid GUIDED by the Trie so dead prefixes
// are abandoned immediately. Null out a word once found to dedup.
public IList<string> FindWords(char[][] board, string[] words) {
    var root = new TrieNode();
    foreach (var w in words) {
        var cur = root;
        foreach (char c in w) cur = cur.Next[c - 'a'] ??= new TrieNode();
        cur.Word = w;
    }
    int m = board.Length, n = board[0].Length;
    var res = new List<string>();
    void Dfs(int r, int c, TrieNode node) {
        if (r < 0 || r >= m || c < 0 || c >= n) return;
        char ch = board[r][c];
        if (ch == '#') return;
        var nxt = node.Next[ch - 'a'];
        if (nxt == null) return;                          // prune dead prefix
        if (nxt.Word != null) { res.Add(nxt.Word); nxt.Word = null; }
        board[r][c] = '#';
        Dfs(r+1,c,nxt); Dfs(r-1,c,nxt); Dfs(r,c+1,nxt); Dfs(r,c-1,nxt);
        board[r][c] = ch;
    }
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            Dfs(r, c, root);
    return res;
}
class TrieNode { public TrieNode[] Next = new TrieNode[26]; public string Word; }
```
**Complexity:** far better than naive per-word search (Trie prunes shared/dead prefixes).
