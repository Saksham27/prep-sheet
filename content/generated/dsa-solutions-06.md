# DSA Solutions — Graphs

> AI-added — verify. Idiomatic C# 12 / .NET 8.
> Clone Graph assumes `class Node { public int val; public IList<Node> neighbors; }`.

---

### id: graphs-number-of-islands
```csharp
// Each unvisited land cell starts a flood fill that consumes one island. Sink visited
// cells to avoid recounting.
public int NumIslands(char[][] grid) {
    int m = grid.Length, n = grid[0].Length, count = 0;
    void Dfs(int r, int c) {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1') return;
        grid[r][c] = '0';
        Dfs(r+1,c); Dfs(r-1,c); Dfs(r,c+1); Dfs(r,c-1);
    }
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (grid[r][c] == '1') { count++; Dfs(r, c); }
    return count;
}
```
**Complexity:** O(m·n).

---

### id: graphs-clone-graph
```csharp
// Map original→copy and record the copy BEFORE recursing into neighbors, so cycles don't
// loop forever.
public Node CloneGraph(Node node) {
    var map = new Dictionary<Node, Node>();
    Node Dfs(Node cur) {
        if (cur == null) return null;
        if (map.TryGetValue(cur, out var copy)) return copy;
        copy = new Node(cur.val);
        map[cur] = copy;
        foreach (var nb in cur.neighbors) copy.neighbors.Add(Dfs(nb));
        return copy;
    }
    return Dfs(node);
}
```
**Complexity:** O(V + E).

---

### id: graphs-course-schedule-i-ii
```csharp
// Prerequisites form a DAG; Kahn's topological sort gives a valid order (and detects the
// cycle that means "can't finish"). Returns the order, or empty if impossible.
public int[] FindOrder(int numCourses, int[][] prerequisites) {
    var adj = new List<int>[numCourses];
    for (int i = 0; i < numCourses; i++) adj[i] = new List<int>();
    var indeg = new int[numCourses];
    foreach (var p in prerequisites) { adj[p[1]].Add(p[0]); indeg[p[0]]++; }   // p[1] → p[0]

    var q = new Queue<int>();
    for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.Enqueue(i);
    var order = new List<int>();
    while (q.Count > 0) {
        int u = q.Dequeue(); order.Add(u);
        foreach (int v in adj[u]) if (--indeg[v] == 0) q.Enqueue(v);
    }
    return order.Count == numCourses ? order.ToArray() : Array.Empty<int>();
}
```
**Complexity:** O(V + E).

---

### id: graphs-rotting-oranges
```csharp
// Multi-source BFS where each BFS level = one minute. Seed ALL rotten cells first; check
// for unreachable fresh oranges at the end.
public int OrangesRotting(int[][] grid) {
    int m = grid.Length, n = grid[0].Length, fresh = 0;
    var q = new Queue<(int r, int c)>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++) {
            if (grid[r][c] == 2) q.Enqueue((r, c));
            else if (grid[r][c] == 1) fresh++;
        }
    int minutes = 0;
    int[][] dirs = { new[]{1,0}, new[]{-1,0}, new[]{0,1}, new[]{0,-1} };
    while (q.Count > 0 && fresh > 0) {
        int sz = q.Count;
        for (int i = 0; i < sz; i++) {
            var (r, c) = q.Dequeue();
            foreach (var d in dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr][nc] != 1) continue;
                grid[nr][nc] = 2; fresh--; q.Enqueue((nr, nc));
            }
        }
        minutes++;
    }
    return fresh == 0 ? minutes : -1;
}
```
**Complexity:** O(m·n).

---

### id: graphs-pacific-atlantic-water-flow
```csharp
// Reverse the flow: BFS/DFS INLAND from each ocean's border (water can climb to >= height);
// cells reachable from both oceans are the answer.
public IList<IList<int>> PacificAtlantic(int[][] heights) {
    int m = heights.Length, n = heights[0].Length;
    var pac = new bool[m, n];
    var atl = new bool[m, n];
    void Dfs(int r, int c, bool[,] seen, int prev) {
        if (r < 0 || r >= m || c < 0 || c >= n || seen[r, c] || heights[r][c] < prev) return;
        seen[r, c] = true;
        Dfs(r+1,c,seen,heights[r][c]); Dfs(r-1,c,seen,heights[r][c]);
        Dfs(r,c+1,seen,heights[r][c]); Dfs(r,c-1,seen,heights[r][c]);
    }
    for (int r = 0; r < m; r++) { Dfs(r, 0, pac, int.MinValue); Dfs(r, n-1, atl, int.MinValue); }
    for (int c = 0; c < n; c++) { Dfs(0, c, pac, int.MinValue); Dfs(m-1, c, atl, int.MinValue); }
    var res = new List<IList<int>>();
    for (int r = 0; r < m; r++)
        for (int c = 0; c < n; c++)
            if (pac[r, c] && atl[r, c]) res.Add(new List<int> { r, c });
    return res;
}
```
**Complexity:** O(m·n).

---

### id: graphs-number-of-connected-components-graph-valid-tree
```csharp
// Union-Find counts components. A valid tree has exactly one component AND n-1 edges
// (no cycle).
public int CountComponents(int n, int[][] edges) {
    var parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int Find(int x) { while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    int components = n;
    foreach (var e in edges) {
        int a = Find(e[0]), b = Find(e[1]);
        if (a != b) { parent[a] = b; components--; }
    }
    return components;
}
public bool ValidTree(int n, int[][] edges) =>
    edges.Length == n - 1 && CountComponents(n, edges) == 1;
```
**Complexity:** near O(E·α(n)).

---

### id: graphs-word-ladder
```csharp
// Words are nodes; edges connect words differing by one letter. Shortest transformation =
// BFS; remove a word from the dict when enqueued to mark it visited.
public int LadderLength(string beginWord, string endWord, IList<string> wordList) {
    var dict = new HashSet<string>(wordList);
    if (!dict.Contains(endWord)) return 0;
    var q = new Queue<string>(); q.Enqueue(beginWord);
    int steps = 1;
    while (q.Count > 0) {
        int sz = q.Count;
        for (int i = 0; i < sz; i++) {
            var word = q.Dequeue();
            if (word == endWord) return steps;
            var arr = word.ToCharArray();
            for (int j = 0; j < arr.Length; j++) {
                char orig = arr[j];
                for (char c = 'a'; c <= 'z'; c++) {
                    arr[j] = c;
                    var next = new string(arr);
                    if (dict.Remove(next)) q.Enqueue(next);
                }
                arr[j] = orig;
            }
        }
        steps++;
    }
    return 0;
}
```
**Complexity:** O(words · L · 26).

---

### id: graphs-network-delay-time
```csharp
// Shortest time to reach all nodes = max over single-source shortest paths → Dijkstra.
public int NetworkDelayTime(int[][] times, int n, int k) {
    var adj = new List<(int v, int w)>[n + 1];
    for (int i = 1; i <= n; i++) adj[i] = new List<(int, int)>();
    foreach (var t in times) adj[t[0]].Add((t[1], t[2]));

    var dist = new int[n + 1];
    Array.Fill(dist, int.MaxValue);
    dist[k] = 0;
    var pq = new PriorityQueue<int, int>();
    pq.Enqueue(k, 0);
    while (pq.TryDequeue(out int u, out int d)) {
        if (d > dist[u]) continue;                      // stale entry
        foreach (var (v, w) in adj[u])
            if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.Enqueue(v, dist[v]); }
    }
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == int.MaxValue) return -1;
        ans = Math.Max(ans, dist[i]);
    }
    return ans;
}
```
**Complexity:** O(E log V).

---

### id: graphs-cheapest-flights-within-k-stops
```csharp
// Shortest path with a hop limit → Bellman-Ford for K+1 rounds, relaxing from a FROZEN
// snapshot each round so one round never uses more than one extra hop.
public int FindCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    var dist = new int[n];
    Array.Fill(dist, int.MaxValue);
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {
        var snapshot = (int[])dist.Clone();
        foreach (var f in flights) {
            int u = f[0], v = f[1], w = f[2];
            if (snapshot[u] != int.MaxValue && snapshot[u] + w < dist[v])
                dist[v] = snapshot[u] + w;
        }
    }
    return dist[dst] == int.MaxValue ? -1 : dist[dst];
}
```
**Complexity:** O(K · E).

---

### id: graphs-alien-dictionary
```csharp
// Each adjacent pair reveals one ordering edge at their first differing char; the alphabet
// order is a topological sort. The "abc" before "ab" case is invalid → "".
public string AlienOrder(string[] words) {
    var adj = new Dictionary<char, HashSet<char>>();
    var indeg = new Dictionary<char, int>();
    foreach (var w in words)
        foreach (char c in w) { adj.TryAdd(c, new()); indeg.TryAdd(c, 0); }

    for (int i = 0; i + 1 < words.Length; i++) {
        string a = words[i], b = words[i + 1];
        int min = Math.Min(a.Length, b.Length), j = 0;
        while (j < min && a[j] == b[j]) j++;
        if (j == min) { if (a.Length > b.Length) return ""; continue; }
        if (adj[a[j]].Add(b[j])) indeg[b[j]]++;
    }

    var q = new Queue<char>();
    foreach (var kv in indeg) if (kv.Value == 0) q.Enqueue(kv.Key);
    var sb = new System.Text.StringBuilder();
    while (q.Count > 0) {
        char u = q.Dequeue(); sb.Append(u);
        foreach (char v in adj[u]) if (--indeg[v] == 0) q.Enqueue(v);
    }
    return sb.Length == indeg.Count ? sb.ToString() : "";   // leftover ⇒ cycle
}
```
**Complexity:** O(total characters).

---

### id: graphs-min-cost-to-connect-all-points
```csharp
// Connect all nodes at minimum total edge weight = MST. Prim's: grow the tree, always
// taking the cheapest edge to a node not yet in it (Manhattan distance here).
public int MinCostConnectPoints(int[][] points) {
    int n = points.Length;
    var inMst = new bool[n];
    int total = 0, used = 0;
    var pq = new PriorityQueue<int, int>();      // node keyed by edge cost
    pq.Enqueue(0, 0);
    while (used < n && pq.TryDequeue(out int u, out int cost)) {
        if (inMst[u]) continue;
        inMst[u] = true; total += cost; used++;
        for (int v = 0; v < n; v++) {
            if (inMst[v]) continue;
            int d = Math.Abs(points[u][0] - points[v][0]) + Math.Abs(points[u][1] - points[v][1]);
            pq.Enqueue(v, d);
        }
    }
    return total;
}
```
**Complexity:** O(n² log n) with this heap-of-edges formulation.
