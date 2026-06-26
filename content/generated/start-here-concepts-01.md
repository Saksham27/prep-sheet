# Start Here & Foundations

> AI-added — verify. The on-ramp for anyone, at any level. Read this track first: it
> explains how interviews actually run in India, how to approach a coding problem, and
> Big-O from scratch — the prerequisites the rest of the app assumes.

@track id=start-here | title=Start Here & Foundations | kind=fundamentals | order=-3 | blurb=Read first. The Indian interview landscape by company tier, the rounds explained, how to approach a coding problem, complexity from scratch, and how to use this app.

@topic id=start-here-how-to-use | track=start-here | title=How to use this app

### concept: The path through this material
If you're early-career, go in this order: **Aptitude → CS Core Subjects → Start Here (this) → DSA → SQL** — those clear service-company and campus loops. Then add **System Design, LLD, Behavioral, Tech Deep-Dives, Coding Practice** for product companies and senior roles. If you're experienced, start at DSA and the depth tracks; skim the basics. The honest metric is not "did I read it" — it's **can I solve it cold and explain it out loud**. Use the status buttons (Read → Solved → **Cold**) and the "Can I explain this out loud?" toggles ruthlessly; only "Cold" counts.

#### probe: What's the single most important habit while using this?
Reps, tracked honestly. Reading an explanation builds *recognition*; solving from a blank editor builds *recall* — and interviews test recall under pressure. So for every DSA problem, bring it to **Cold** (re-solved with no references, in interview time) and let the spaced-repetition "Due today" queue resurface it. For every concept/probe, force yourself to say the answer aloud before revealing it. Twenty problems brought to Cold beat eighty merely read.

### concept: A realistic timeline
There's no fixed number, but a workable shape: **4–8 weeks** to become "switch-ready" for service/startup/GCC roles if you're consistent (~2 hrs/weekday, more on weekends), and **4–6 months** to be FAANG/product-ready. The bottleneck is never the plan — it's showing up daily. Track a weekly count of problems solved and concepts brought to Cold; if that number is moving, you're winning, regardless of how much syllabus remains.

#### probe: How much time on each area?
It depends on the target. **Freshers / service companies:** ~50% DSA + coding basics, ~25% CS-core subjects, ~15% aptitude, ~10% projects/HR. **Mid-level / product companies:** ~50% DSA, ~30% system design + LLD, ~20% behavioral. **FAANG:** DSA and system design dominate, behavioral tightened to the company's bar. Front-load DSA always — it's the slowest skill to build (it's muscle, not knowledge) and it gates everything.

@topic id=start-here-landscape | track=start-here | title=The interview landscape (India)

### concept: Service vs product vs FAANG — three different games
The Indian market is tiered, and the interview is a *different game* per tier. **Service companies** (TCS, Infosys, Wipro, Accenture, Capgemini) hire tens of thousands via standardized **online tests** (aptitude + basic coding) followed by a technical interview on **CS-core subjects** and one language, then HR. **Product companies / unicorns** (Flipkart, PhonePe, Swiggy, CRED, Razorpay) run **FAANG-style** loops: an online coding assessment, multiple DSA rounds, a **machine-coding** round, system design, and a hiring-manager round. **FAANG/MAANG** is the same shape at the highest difficulty. Know your target — preparing for the wrong game wastes months.

#### probe: How does prep differ for a service company vs a product company?
For a **service company**, the gates are **aptitude** and **CS-core fundamentals** (OOP, DBMS, OS, CN) plus basic coding — depth of DSA matters less than breadth of fundamentals and clearing the aptitude cutoff. For a **product company**, aptitude barely matters; it's **DSA depth** (mediums fluently, some hards), a **machine-coding** round (write a working app in 90–120 min), and **system design**. Same candidate, very different study mix — that's why "what's my target tier" is the first question to answer.

### concept: The rounds, explained
- **Online Assessment (OA):** timed, auto-graded. Aptitude + 1–3 coding problems (service), or 2–4 DSA problems (product).
- **DSA / coding rounds:** solve problems live, explaining your approach; optimize; handle edge cases; clean code.
- **Machine coding / LLD:** build a small **working** application (parking lot, Splitwise) in 90–120 min — clean classes, right patterns, a runnable demo.
- **System design (HLD):** for mid/senior — design a scalable system, driving the tradeoffs.
- **CS fundamentals:** OOP/DBMS/OS/CN questions, especially for freshers and service companies.
- **Behavioral / HR:** projects, teamwork, "tell me about yourself," why this company.

#### probe: What is a machine-coding round and how is it different from LLD?
A **machine-coding** round gives you a design-y problem (e.g. "build Splitwise") and expects a **fully working, well-structured application in 90–120 minutes** — runnable, with a demo/driver. A pure **LLD** round usually wants only the **class design / skeleton** and your reasoning about responsibilities and patterns, not working code. So machine coding = LLD *plus* you must actually make it run, fast. The winning move in both: spend the first 10–15 minutes designing classes (on paper/comments), get the happy path working end-to-end, and only then touch edge cases.

@topic id=start-here-approach | track=start-here | title=How to approach a coding problem

### concept: The brute-force → optimize loop
Never jump to the clever solution. The reliable method: (1) **restate** the problem and clarify inputs/edge cases; (2) walk a **small example** by hand; (3) state the **brute force** out loud with its complexity — this proves you understand the problem and gives a fallback; (4) find the **bottleneck** and ask "what repeated work can I cache, sort away, or skip?" — that question is where most optimizations live (a hash map, sorting, two pointers, a heap); (5) code the optimized version; (6) **dry-run** it on your example and an edge case. Interviewers grade the *process*, not just the final answer.

#### probe: You're stuck and can't see the optimal solution — what do you do?
Say the brute force out loud and code it if needed — a working O(n²) beats a broken O(n), and it keeps you in the game. Then attack the bottleneck with the standard levers: "have I seen this before?" → hash map/set; "is it sorted / can I sort?" → two pointers or binary search; "do I need the k best / the running extreme?" → heap; "is it a sequence of overlapping subproblems?" → DP. Think out loud the whole time — interviewers hire on *reasoning*, and a hint usually follows a visible, structured attempt.

### concept: Communicate while you solve
The interview tests communication as much as code. **Think out loud**: narrate your plan before coding, state assumptions, and explain *why* you're choosing a structure ("I'll use a hash map to get O(1) lookups and avoid the nested loop"). Ask clarifying questions early (input size, duplicates, sorted?, empty input?). Call out edge cases proactively. After coding, **dry-run** aloud and state the final time/space complexity. Silence is the enemy — an interviewer can't give you partial credit or a hint for thinking they can't hear.

#### probe: What edge cases should you always consider?
The usual suspects: **empty** input, a **single** element, **all-equal** elements, **duplicates**, **negative numbers / zero**, **overflow** on large inputs, already-**sorted** or reverse-sorted input, and for strings, **empty string / case / non-alphanumeric**. For pointers/trees/lists: null, one node, and cycles. Naming these unprompted signals maturity even before you handle them in code.

### concept: Which language should you use?
Use **one** language you know cold — fluency beats prestige. For Indian service companies, **Java** is the most common and safest default; **Python** is excellent for interviews (concise, fast to write); **C++** is strong for competitive/DSA; **C#** is fine and is what this app's solutions use. The *patterns* (two pointers, sliding window, DP) are identical across languages — this app teaches them in C#, but they translate directly. Pick your language, learn its core library (lists, maps, sets, sorting, a priority queue/heap), and don't switch mid-prep.

#### probe: Does the choice of language affect your chances?
Rarely, for the algorithm itself — interviewers care that you pick the right *approach* and can implement it cleanly. It matters at the margins: know your language's built-ins (a `Dictionary`/`HashMap`, a heap/`PriorityQueue`, sorting with a comparator) so you don't waste time re-implementing them, and know its gotchas (integer overflow in Java/C#, default recursion limits in Python). For service companies that ask "your preferred language," be ready for syntax and OOP questions in it. Pick one, go deep, stay consistent.

@topic id=start-here-complexity | track=start-here | title=Big-O from scratch

### concept: What Big-O actually means
Big-O describes how an algorithm's running time (or memory) **grows as the input n gets large** — it's the *shape of the curve*, not the actual seconds. We drop constants and lower-order terms because they don't matter as n→∞: `3n + 5` is `O(n)`, `2n² + n` is `O(n²)`. The common ladder, fastest to slowest: **O(1)** constant → **O(log n)** (halving each step, e.g. binary search) → **O(n)** (one pass) → **O(n log n)** (good sorts) → **O(n²)** (nested loops) → **O(2ⁿ)** / **O(n!)** (brute-force combinatorics). Moving up this ladder is what "optimizing" usually means.

#### probe: Why do we drop constants and say O(2n) = O(n)?
Because Big-O measures *growth rate*, not exact cost. For large n, a constant multiplier doesn't change the *shape* of how the work scales — an O(2n) algorithm and an O(n) algorithm both grow linearly, and on big inputs the difference between them is dwarfed by the difference between linear and quadratic. We care about which *class* the curve is in (linear vs quadratic vs exponential), because that's what decides whether the algorithm survives at scale. Constants matter in the real world for tuning, but not for classifying the algorithm.

### concept: How to find the Big-O of your code
Count the work as a function of n. **Sequential** statements add (and the biggest term wins). A single **loop** over n is O(n); a loop **nested** in another is O(n²). A loop that **halves** the range each step is O(log n). A loop doing O(n) work inside an O(log n) loop is O(n log n). **Recursion**: multiply the number of calls by the work per call — and remember the call stack costs **space** equal to the recursion depth. Always state **both** time and space, and the **worst-case input** that triggers them.

#### probe: A loop runs from n down to 1, halving i each time — what's its complexity?
**O(log n)**. Each iteration multiplies the progress by a constant factor (halving), so the number of steps to go from n to 1 is log₂(n). This is the signature of binary search and of balanced-tree operations. Contrast it with a loop that *decrements* by 1 (n steps → O(n)) — the difference between subtracting a constant and dividing by a constant is the difference between linear and logarithmic, and recognizing it on sight is a core skill.

### exercise: [E] State the complexity
For each snippet, state the time complexity (assume `n = arr.Length`). 1) a single `for` loop summing `arr`. 2) two separate (not nested) loops over `arr`. 3) a nested loop comparing every pair `arr[i], arr[j]`. 4) a `while` loop that does `i *= 2` from 1 until `i >= n`. 5) `Array.Sort(arr)` then one pass.
#### solution:
```text
1) O(n)        — one pass over n elements.
2) O(n)        — n + n = 2n, drop the constant.
3) O(n²)       — for each of n elements, an inner loop of n (≈ n*n/2 pairs).
4) O(log n)    — i doubles each step: 1,2,4,… reaches n in log2(n) steps.
5) O(n log n)  — the sort dominates; the extra O(n) pass is lower-order and dropped.
```
**Note:** the rule of thumb — **nested loops multiply, sequential loops add, halving/doubling is logarithmic, and the largest term wins.** Sorting is the most common hidden O(n log n); reach for it when "if only this were sorted" would simplify the problem.
