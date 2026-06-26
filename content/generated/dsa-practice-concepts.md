# Extra DSA practice (LeetCode links)

> AI-added — verify. Link-only problems to grow volume toward the ~250–300 your curriculum
> targets, without diluting the dissected set. These render as status-trackable cards with
> a one-line pattern hint and a LeetCode link (no authored solution — solve them there).
> Format: `### practice: [D] Title | leetcode-slug` then a one-line hint.

@topic id=foundations | track=dsa

### practice: [E] Missing Number | missing-number
XOR all indices and values, or sum formula minus actual sum.
### practice: [E] Reverse Bits | reverse-bits
Shift result left, OR in the next bit of n, 32 times.
### practice: [M] Sum of Two Integers | sum-of-two-integers
Add without `+`: XOR is sum-without-carry, (a&b)<<1 is the carry; loop.

@topic id=arrays-and-hashing | track=dsa

### practice: [E] Valid Anagram | valid-anagram
26-length count vector, or sorted-string key.
### practice: [E] Concatenation of Array | concatenation-of-array
Warmup: build ans of length 2n with ans[i]=ans[i+n]=nums[i].
### practice: [M] Majority Element | majority-element
Boyer–Moore voting: candidate + count.
### practice: [M] Find All Numbers Disappeared in an Array | find-all-numbers-disappeared-in-an-array
Index-as-hash: negate the slot for each value; positives are missing.
### practice: [M] Encode and Decode Strings | encode-and-decode-strings
Length-prefix each string ("4#word") so decoding is unambiguous (premium).
### practice: [M] Replace Elements with Greatest on Right | replace-elements-with-greatest-element-on-right-side
Single right-to-left pass tracking the running max.

@topic id=two-pointers | track=dsa

### practice: [E] Remove Duplicates from Sorted Array | remove-duplicates-from-sorted-array
Slow write-pointer advances only on a new value.
### practice: [E] Move Zeroes | move-zeroes
Partition non-zeros to the front with a write pointer.
### practice: [M] 3Sum Closest | 3sum-closest
Sort + converge; track the sum closest to target.
### practice: [M] 4Sum | 4sum
Two nested fixed indices + a two-pointer inner; skip duplicates.
### practice: [M] Boats to Save People | boats-to-save-people
Sort; pair the lightest with the heaviest that fits, else the heaviest alone.

@topic id=sliding-window | track=dsa

### practice: [E] Maximum Average Subarray I | maximum-average-subarray-i
Fixed-size window sum, slide and track max.
### practice: [M] Fruit Into Baskets | fruit-into-baskets
Longest window with at most 2 distinct values (freq map).
### practice: [M] Max Consecutive Ones III | max-consecutive-ones-iii
Longest window with at most k zeros; shrink when zeros exceed k.
### practice: [M] Subarray Product Less Than K | subarray-product-less-than-k
Shrink the window while the product ≥ k; count windows ending at right.
### practice: [H] Longest Substring with At Most K Distinct | longest-substring-with-at-most-k-distinct-characters
Window + frequency map of size ≤ k (premium).

@topic id=prefix-sum-and-difference-arrays | track=dsa

### practice: [E] Range Sum Query - Immutable | range-sum-query-immutable
Precompute a prefix-sum array; query in O(1).
### practice: [M] Find Pivot Index | find-pivot-index
leftSum == total − leftSum − nums[i].
### practice: [M] Contiguous Array | contiguous-array
Map +1/−1 prefix sums to first-seen index; longest equal 0s/1s.

@topic id=binary-search | track=dsa

### practice: [M] Search a 2D Matrix | search-a-2d-matrix
Treat the matrix as one sorted array; binary search on the flattened index.
### practice: [M] Search a 2D Matrix II | search-a-2d-matrix-ii
Start top-right; go left if larger, down if smaller — eliminate a row/col each step.
### practice: [M] Time Based Key-Value Store | time-based-key-value-store
Per key, store (timestamp,value) sorted; binary search the largest ≤ query.
### practice: [M] Find Peak Element | find-peak-element
Binary search on the slope: move toward the higher neighbor.
### practice: [H] Find in Mountain Array | find-in-mountain-array
Find the peak by binary search, then search each side.

@topic id=stacks-and-monotonic-stack | track=dsa

### practice: [E] Baseball Game | baseball-game
Stack of scores; apply +, D, C operations.
### practice: [M] Asteroid Collision | asteroid-collision
Stack; a right-mover meeting a left-mover resolves by size.
### practice: [M] Car Fleet | car-fleet
Sort by position desc; monotonic stack of arrival times forms fleets.
### practice: [M] Online Stock Span | online-stock-span
Monotonic stack of (price, span); pop smaller-or-equal and accumulate span.
### practice: [M] Decode String | decode-string
Two stacks (counts and partial strings) for nested k[...] patterns.

@topic id=linked-lists | track=dsa

### practice: [E] Middle of the Linked List | middle-of-the-linked-list
Fast/slow pointers; slow lands at the middle.
### practice: [E] Palindrome Linked List | palindrome-linked-list
Find middle, reverse the second half, compare.
### practice: [E] Remove Linked List Elements | remove-linked-list-elements
Dummy head; skip nodes equal to val.
### practice: [M] Swap Nodes in Pairs | swap-nodes-in-pairs
Dummy head + careful pointer surgery per pair.
### practice: [M] Copy List with Random Pointer | copy-list-with-random-pointer
Map original→copy (or interleave clones) then wire random pointers.
### practice: [M] Odd Even Linked List | odd-even-linked-list
Build odd and even chains, then splice even after odd.

@topic id=recursion-and-backtracking | track=dsa

### practice: [M] Subsets II | subsets-ii
Sort; skip a value equal to the previous when not chosen at this level.
### practice: [M] Permutations II | permutations-ii
Sort; skip used duplicates to avoid repeated permutations.
### practice: [M] Combination Sum II | combination-sum-ii
No reuse (i+1); skip duplicate candidates at the same depth.
### practice: [M] Combinations | combinations
Choose k of n; backtrack with a start index.
### practice: [M] Restore IP Addresses | restore-ip-addresses
Partition into 4 octets, each 0–255 and no leading zeros.

@topic id=trees-binary-trees | track=dsa

### practice: [E] Balanced Binary Tree | balanced-binary-tree
Bottom-up: return height, propagate a "−1" sentinel when unbalanced.
### practice: [E] Subtree of Another Tree | subtree-of-another-tree
At each node, run sameTree against the candidate subtree.
### practice: [E] Path Sum | path-sum
DFS subtracting node values; check at leaves.
### practice: [M] Count Good Nodes in Binary Tree | count-good-nodes-in-binary-tree
DFS carrying the max-so-far on the path.
### practice: [M] Binary Tree Zigzag Level Order | binary-tree-zigzag-level-order-traversal
BFS by level, reversing every other level.
### practice: [M] Path Sum II | path-sum-ii
Backtracking: collect root-to-leaf paths summing to target.

@topic id=binary-search-trees | track=dsa

### practice: [E] Convert Sorted Array to BST | convert-sorted-array-to-binary-search-tree
Middle element is the root; recurse on halves for a balanced BST.
### practice: [E] Range Sum of BST | range-sum-of-bst
Prune subtrees outside [low, high] using the ordering.
### practice: [E] Minimum Distance Between BST Nodes | minimum-distance-between-bst-nodes
In-order traversal; track the previous value, min the gaps.

@topic id=heaps-priority-queues | track=dsa

### practice: [E] Last Stone Weight | last-stone-weight
Max-heap; repeatedly smash the two heaviest.
### practice: [M] Kth Largest Element in a Stream | kth-largest-element-in-a-stream
Maintain a size-k min-heap; the root is the kth largest.
### practice: [M] Reorganize String | reorganize-string
Max-heap by frequency; place the two most frequent alternately.
### practice: [M] Single-Threaded CPU | single-threaded-cpu
Sort by available time; min-heap by processing time, advance the clock.
### practice: [H] Smallest Range Covering K Lists | smallest-range-covering-elements-from-k-lists
Min-heap of one element per list; advance the minimum, track the range.

@topic id=greedy | track=dsa

### practice: [M] Maximum Subarray | maximum-subarray
Kadane's: running sum, reset to 0 when it goes negative.
### practice: [M] Partition Labels | partition-labels
Last-occurrence map; extend the partition to the farthest last-seen.
### practice: [M] Valid Parenthesis String | valid-parenthesis-string
Track the min/max possible open count as `*` flexes.
### practice: [M] Merge Triplets to Form Target | merge-triplets-to-form-target-triplet
Keep triplets that never exceed the target; union their maxes.

@topic id=intervals | track=dsa

### practice: [E] Meeting Rooms | meeting-rooms
Sort by start; any overlap means a conflict (premium).
### practice: [M] Car Pooling | car-pooling
Difference array of passenger deltas at each stop; never exceed capacity.
### practice: [H] Minimum Interval to Include Each Query | minimum-interval-to-include-each-query
Sort queries + intervals; min-heap of interval sizes still covering the query.

@topic id=graphs | track=dsa

### practice: [M] Max Area of Island | max-area-of-island
DFS flood fill returning the area; track the max.
### practice: [M] Surrounded Regions | surrounded-regions
DFS from border 'O's to mark survivors; flip the rest.
### practice: [M] Number of Provinces | number-of-provinces
Union-Find (or DFS) counting connected components.
### practice: [M] Redundant Connection | redundant-connection
Union-Find; the first edge whose endpoints are already connected is the answer.
### practice: [M] Walls and Gates | walls-and-gates
Multi-source BFS from all gates simultaneously (premium).
### practice: [H] Swim in Rising Water | swim-in-rising-water
Dijkstra/heap minimizing the max elevation along the path (or binary search + BFS).
### practice: [H] Word Ladder II | word-ladder-ii
BFS to build the layer graph, then backtrack to emit all shortest paths.

@topic id=dynamic-programming | track=dsa

### practice: [E] Min Cost Climbing Stairs | min-cost-climbing-stairs
1D DP: dp[i] = cost[i] + min(dp[i-1], dp[i-2]).
### practice: [M] Combination Sum IV | combination-sum-iv
Order matters → count permutations: amount outer, numbers inner.
### practice: [M] Number of Longest Increasing Subsequence | number-of-longest-increasing-subsequence
LIS DP carrying both length and count per index.
### practice: [M] Partition to K Equal Sum Subsets | partition-to-k-equal-sum-subsets
Backtracking (or bitmask DP) filling k buckets to total/k.
### practice: [M] Interleaving String | interleaving-string
2D DP: can s3[..i+j] be formed from s1[..i] and s2[..j]?
### practice: [M] Stone Game | stone-game
Interval DP on the score difference (or the parity trick).
### practice: [H] Longest Increasing Path in a Matrix | longest-increasing-path-in-a-matrix
DFS + memo on each cell (the DAG has no cycles).
### practice: [H] Distinct Subsequences | distinct-subsequences
2D DP counting ways s forms t; match → add both, else carry.

@topic id=strings-specialized-pattern-matching | track=dsa

### practice: [M] Find the Index of the First Occurrence | find-the-index-of-the-first-occurrence-in-a-string
strStr via KMP or rolling hash.
### practice: [H] Longest Happy Prefix | longest-happy-prefix
The KMP failure value of the whole string.

@topic id=math-and-geometry-occasional-awareness | track=dsa

### practice: [E] Plus One | plus-one
Add one with carry, right to left; prepend on overflow.
### practice: [M] Set Matrix Zeroes | set-matrix-zeroes
Use the first row/column as zero markers for O(1) extra space.
### practice: [M] Pow(x, n) | powx-n
Fast exponentiation by squaring; handle negative n.
### practice: [M] Multiply Strings | multiply-strings
Grade-school multiply into a digit array, then carry.
