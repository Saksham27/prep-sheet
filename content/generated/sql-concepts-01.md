# SQL & Data Modeling

> AI-added — verify. A new track filling the biggest gap: hands-on SQL. Concepts stay
> terse; the value is the **exercises** — schema design and query writing with a hidden
> solution you reveal after attempting. Postgres flavor (your stack). Status-track them
> like DSA: Read → Solved → Cold.

@track id=sql | title=SQL & Data Modeling | kind=fundamentals | order=6 | blurb=The hands-on database round: normalization and keys, then schema-design and query-writing exercises (joins, window functions, CTEs, tuning) with hidden solutions.

@topic id=sql-data-modeling | track=sql | title=Data modeling (concepts)

### concept: Normalization 1NF → 3NF (and when to denormalize)
**1NF**: atomic columns, no repeating groups. **2NF**: no partial dependency — every non-key column depends on the *whole* composite key. **3NF**: no transitive dependency — non-key columns depend on the key and nothing but the key. Normalize to eliminate redundancy and update anomalies. **Denormalize deliberately** (duplicate a column, store a precomputed aggregate) only after you've *measured* a read bottleneck — and own the cost: now you must keep the duplicate in sync.

#### probe: When would you denormalize?
When a hot read path requires expensive joins or aggregates that you can't make fast enough normalized — e.g. storing a `comment_count` on `posts` instead of `COUNT(*)`-ing a huge comments table on every feed render, or a reporting table refreshed periodically. You trade write complexity (keeping the copy correct, via triggers, application logic, or a materialized view) for read speed. Do it consciously and locally, never as a default.

### concept: Keys — surrogate vs natural, composite, UUID vs serial
A **primary key** uniquely identifies a row. **Natural keys** (email, SKU) carry meaning but can change and may leak PII; **surrogate keys** (`BIGSERIAL`, UUID) are stable and opaque — usually the PK, with a `UNIQUE` constraint guarding the natural key. **Composite keys** (multiple columns) model junction tables and real-world uniqueness. **UUID vs bigserial**: UUID is globally unique and shard-friendly but larger and *random* (hurts B-tree locality/insert speed) — prefer time-ordered **UUIDv7/ULID** if you need UUIDs.

#### probe: Surrogate vs natural primary key — which and why?
Default to a **surrogate** PK (auto-increment or UUID) and put a `UNIQUE` constraint on the natural key. Natural keys change (people change emails, SKUs get reissued), and a changing PK cascades painfully through every foreign key. Surrogates are stable, compact, and don't expose business data. Use a natural/composite key only when it's genuinely immutable and you want the constraint enforced as the identity (e.g. a junction table's `(a_id, b_id)`).

### concept: Relationships and junction tables
**1:N** — a foreign key on the "many" side (`orders.customer_id`). **M:N** — a **junction table** holding both foreign keys as a composite PK (`enrollments(student_id, course_id)`), optionally with extra columns (enrolled_at). **1:1** — rare; usually a smell that the two tables should merge, or a FK + `UNIQUE` for optional/extension data. Always index the foreign key columns — joins and cascading deletes need them.

#### probe: How do you model a many-to-many relationship?
Introduce a **junction (bridge) table** with one foreign key to each side and a composite primary key of those two columns to prevent duplicates — e.g. `student_course(student_id, course_id, PRIMARY KEY(student_id, course_id))`. Any attributes of the *relationship* itself (grade, enrolled_at) live on the junction table, not on either entity. Index both FK columns so joins from either direction are fast.

### concept: Model for access patterns, then index
Schema and indexes follow the **queries**, not the reverse. List the read paths first, then index the columns you filter/join/order by, respecting the composite **leftmost-prefix** rule. An index on every foreign key is almost always worth it (joins, cascades). Over-indexing slows writes and bloats storage. Heavy analytical queries don't belong on the transactional schema — use a read replica or a separate OLAP store rather than contorting the model.

#### probe: How do you decide which columns to index?
Start from the actual queries: index columns in `WHERE`/`JOIN`/`ORDER BY` that are **selective** (narrow the result a lot). Use composite indexes ordered by equality-then-range to match query shapes, and consider covering (`INCLUDE`) columns for hot read-only queries. Skip low-cardinality columns (a boolean index rarely helps — the planner seq-scans anyway), small tables, and write-heavy tables where the maintenance cost outweighs the read benefit. Always verify with `EXPLAIN ANALYZE`, don't guess.

@topic id=sql-schema-exercises | track=sql | title=Schema design exercises | kind=problem

### exercise: [M] Design a schema for an e-commerce orders system
Model **customers, products, orders, and order line items**. Capture the price **at purchase time** (product prices change later), support an order status lifecycle, and serve "a customer's recent orders" efficiently. Write the Postgres DDL and justify the key choices.
#### solution:
```sql
CREATE TABLE customers (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    sku         TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    price_cents INT NOT NULL CHECK (price_cents >= 0)   -- the *current* price
);

CREATE TABLE orders (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);

CREATE TABLE order_items (
    order_id         BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id       BIGINT NOT NULL REFERENCES products(id),
    quantity         INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL,                       -- SNAPSHOT at purchase time
    PRIMARY KEY (order_id, product_id)
);
```
**Why:** `unit_price_cents` is snapshotted on the line item, not derived from the live product — so a historical order stays correct when the product's price changes. The composite PK `(order_id, product_id)` prevents duplicate lines. `idx_orders_customer (customer_id, created_at DESC)` serves "this customer's recent orders" with an index range + ordering. Money is stored as integer cents to avoid float rounding.

### exercise: [M] Design a schema for a social feed (users, follows, posts)
Users **follow** other users and create **posts**. Support the query "show posts from everyone I follow, newest first." Write the DDL and the feed query.
#### solution:
```sql
CREATE TABLE users (
    id     BIGSERIAL PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL
);

CREATE TABLE follows (
    follower_id BIGINT NOT NULL REFERENCES users(id),
    followee_id BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id),
    CHECK (follower_id <> followee_id)
);
CREATE INDEX idx_follows_followee ON follows(followee_id);

CREATE TABLE posts (
    id         BIGSERIAL PRIMARY KEY,
    author_id  BIGINT NOT NULL REFERENCES users(id),
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_author_time ON posts(author_id, created_at DESC);

-- Feed (fan-out on read):
SELECT p.*
FROM posts p
JOIN follows f ON f.followee_id = p.author_id
WHERE f.follower_id = $1
  AND p.created_at < $2          -- cursor for keyset pagination
ORDER BY p.created_at DESC
LIMIT 50;
```
**Why:** `follows` is a junction table with a composite PK (no duplicate follow) and a self-reference check. Index `posts(author_id, created_at)` powers the join + ordering. This is fan-out-**on-read**; at scale you'd precompute per-user feeds (see System Design → News Feed). Paginate by **keyset** (`created_at < cursor`) not `OFFSET`, which degrades on deep pages.

@topic id=sql-query-exercises | track=sql | title=Query writing exercises | kind=problem

### exercise: [E] Second-highest salary
`employees(id, name, salary)`. Return the **second-highest distinct** salary (NULL if it doesn't exist).
#### solution:
```sql
-- Simple, tie-safe via DISTINCT max-below-max:
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Window-function form (generalizes to Nth highest):
SELECT DISTINCT salary
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees) t
WHERE rnk = 2;
```
**Note:** `DENSE_RANK` handles ties (two people earning the top salary still leaves a real "second"). Returning via the subquery yields NULL automatically when there's no second salary.

### exercise: [M] Top earner per department (window function)
`employees(id, name, dept_id, salary)`. Return the **highest-paid employee in each department**, including ties.
#### solution:
```sql
SELECT id, name, dept_id, salary
FROM (
    SELECT *, RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
    FROM employees
) t
WHERE rnk = 1;
```
**Note:** `PARTITION BY dept_id` restarts the ranking per department; `RANK` (not `ROW_NUMBER`) keeps tied top earners. Swap to `ROW_NUMBER` if you want exactly one per department.

### exercise: [M] Running total of daily revenue
`sales(day DATE, amount NUMERIC)`. Return each day with a **cumulative running total**, ordered by day.
#### solution:
```sql
SELECT day, amount,
       SUM(amount) OVER (ORDER BY day ROWS UNBOUNDED PRECEDING) AS running_total
FROM sales
ORDER BY day;
```
**Note:** the windowed `SUM ... OVER (ORDER BY day)` accumulates; `ROWS UNBOUNDED PRECEDING` makes the frame explicit (everything up to the current row).

### exercise: [E] Find duplicate emails
`users(id, email)`. Return every email that appears more than once.
#### solution:
```sql
SELECT email
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```
**Note:** `HAVING` filters *after* aggregation (you can't put an aggregate in `WHERE`). Add `COUNT(*)` to the SELECT if you want the dup count too.

### exercise: [M] Customers with no orders (anti-join)
`customers(id, name)`, `orders(id, customer_id)`. Return customers who have **never** placed an order.
#### solution:
```sql
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

-- Equivalent LEFT JOIN / IS NULL form:
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```
**Note:** prefer `NOT EXISTS` (clean anti-join, planner-friendly) over `NOT IN (SELECT customer_id ...)` — `NOT IN` silently returns nothing if the subquery contains a NULL.

### exercise: [H] Month-over-month revenue growth (CTE + LAG)
`sales(day DATE, amount NUMERIC)`. Return per-month revenue and the **% change vs the previous month**.
#### solution:
```sql
WITH monthly AS (
    SELECT date_trunc('month', day) AS month, SUM(amount) AS revenue
    FROM sales
    GROUP BY 1
)
SELECT month,
       revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS delta,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
                   / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1) AS pct_change
FROM monthly
ORDER BY month;
```
**Note:** the CTE aggregates to one row per month; `LAG(...) OVER (ORDER BY month)` reaches the previous month's value; `NULLIF(prev, 0)` guards divide-by-zero (and the first month yields NULL, correctly).

### exercise: [M] Make a slow query sargable / prune-able
On a 50M-row, monthly-partitioned table this is slow: `SELECT * FROM events WHERE date_trunc('day', created_at) = '2026-06-27';`. Explain why and fix it.
#### solution:
```sql
-- Why: wrapping created_at in date_trunc() makes the predicate NON-SARGABLE — the planner
-- can't use a B-tree index on created_at and can't prune partitions, so it seq-scans all
-- of them. Rewrite as a half-open RANGE on the raw column:
SELECT *
FROM events
WHERE created_at >= '2026-06-27'
  AND created_at <  '2026-06-28';

-- Now an index on created_at seeks the range, and partition pruning eliminates every
-- month except the relevant one — the 45s-to-sub-second pattern.
-- (An expression index CREATE INDEX ON events ((date_trunc('day', created_at))) also works,
--  but the range rewrite is preferred because it ALSO enables partition pruning.)
```
**Note:** the rule — never apply a function/cast to an indexed (or partition-key) column in the `WHERE` clause if you want the index/pruning to fire. Transform the *constant* side instead.
