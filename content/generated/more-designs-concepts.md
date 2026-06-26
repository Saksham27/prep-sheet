# More worked system designs

> AI-added — verify. Five more fully worked designs in the corpus format, appended to
> the System Design "Fully worked designs" topic. These cover the Tier-2/3 designs the
> curriculum names but didn't work out.

@topic id=design-4-fully-worked-designs | track=design | title=Fully worked designs

### concept: Uber / Ride-matching (geospatial)
**Scope:** riders request a ride; match to a nearby available driver; track live driver location. Pricing/ETA detail out of scope.

**Numbers:** the dominant load isn't rides — it's **location updates**. Millions of active drivers pinging every ~4s = millions of writes/sec. Actual matches are comparatively rare. That tells you: keep locations in memory, never hit the DB per ping.

**Core problem — find nearby drivers fast:** index driver positions by a **geospatial grid** — geohash, a quadtree, or **H3 hexagons** — so each cell holds the drivers currently in it. A request looks up the rider's cell **plus neighboring cells** and gets candidates in O(1)-ish. Driver positions live in an in-memory geo store (Redis GEO or a dedicated location service), overwritten on each ping.

**Matching:** the dispatch service pulls nearby *available* drivers, ranks by ETA, and offers to the best; on decline/timeout it moves to the next. The offer must **atomically claim** the driver so two riders can't be matched to the same one.

**Data:** driver location → hot, in-memory, high write, eventually consistent (4s-stale is fine). Trips → durable relational store. Geo index → in-memory per region.

**Scale & tradeoffs:** **partition by geography** (city/region) so load shards naturally and a request only searches local cells. Don't persist every ping — that write volume would crush a DB; memory + periodic snapshots suffice. Eventual consistency on position is acceptable; the trip/payment record is strongly consistent.

#### probe: How do you find nearby drivers quickly at this scale?
Bucket drivers into a **geospatial index** — a geohash/quadtree/H3 cell per area — held in memory and updated on each location ping. A rider's "find drivers near me" becomes a lookup of their cell plus the ring of neighbor cells, returning candidates without scanning all drivers. Partition the whole system by region so each node only owns local cells. A linear scan over millions of drivers per request, or persisting every ping to a DB, is the naive trap; the grid index plus in-memory state is the senior answer.

### concept: Video streaming (YouTube / Netflix)
**Scope:** upload, process, store, and stream video to many viewers at varying network speeds. Recommendations out of scope.

**Numbers:** **storage and egress bandwidth dominate** — video is enormous, and reads vastly outnumber writes. The design problem is moving bytes cheaply to users, not QPS.

**Upload/processing pipeline:** upload → store the raw file in **object storage** → an async **transcoding** pipeline (a job queue + worker fleet — your RabbitMQ-pipeline experience) produces multiple resolutions/bitrates, each chopped into small **segments** (HLS/DASH) → segments written back to object storage.

**Serving — the key move:** segments are delivered from a **CDN edge**, not the origin, so the ~150 ms cross-region round trip and the origin bandwidth are avoided. The client does **adaptive bitrate (ABR)**: it measures throughput and fetches the next segment at a quality it can sustain, switching up/down seamlessly.

**Data:** video metadata in a DB; the bytes in object storage + CDN. 

**Scale & tradeoffs:** CDN absorbs the dominant read-bandwidth cost (push popular titles to edges, lazy-pull the long tail). Transcoding is CPU-heavy and **async** (queue + autoscaled workers). Tier storage (hot/cold) for old/unpopular videos. ABR trades a little complexity for resilience to variable networks — a stall is worse than a quality dip.

#### probe: Why adaptive bitrate over a single file, and where does the CDN fit?
A single fixed-quality file either buffers on slow connections or wastes bandwidth on fast ones; **ABR** splits the video into short segments at several bitrates and lets the *client* pick each segment's quality from current throughput — smooth playback across networks, no stalls. The **CDN** caches those segments at edges near users, so playback streams from a nearby PoP instead of origin — cutting latency and origin egress (the biggest cost). Together: transcode once into segmented ladders, distribute via CDN, let clients adapt.

### concept: Payment system (idempotency & exactly-once)
**Scope:** charge a customer through a third-party gateway reliably — never double-charge, survive network failures and retries. (Anchors to your StorePay integration.)

**Core problem:** a timeout between you and the gateway leaves the charge **ambiguous** — did it go through? Blindly retrying risks a double charge; not retrying risks a lost payment. True exactly-once delivery is impossible, so you engineer **effectively-once**.

**Solution:** the client sends an **idempotency key** per payment intent; the server stores `(key → result)` under a `UNIQUE` constraint and **returns the prior result** on any retry — so retries are safe no-ops. Model the charge as a **state machine** (initiated → authorized → captured → settled / failed). Publish payment events via the **outbox pattern** (event written in the same DB transaction as the state change). **Reconcile** ambiguous charges by polling the gateway, since you can't trust delivery alone.

**Data:** `payments(idempotency_key UNIQUE, status, amount_cents, gateway_ref, ...)` plus a **double-entry ledger** (every transaction debits one account and credits another; debits must equal credits) for auditability. Money stored as integer minor units.

**Scale & tradeoffs:** the money path is **strongly consistent** — no eventual consistency here. Throughput is modest vs other systems; correctness and auditability dominate. Idempotency + reconciliation + a ledger is the trio that makes payments trustworthy.

#### probe: How do you ensure a retried payment doesn't double-charge?
An **idempotency key**: the client generates a unique key for the payment intent and sends it with every (re)try. The server persists the key with the operation's result under a unique constraint; the first request does the charge and records the outcome, and any retry with the same key **returns the stored result instead of charging again**. Combine with a charge state machine and **gateway reconciliation** for the case where you never learned the original outcome (poll the gateway by your reference before deciding to retry). That's effectively-once: at-least-once attempts made safe by idempotent processing.

### concept: Web crawler
**Scope:** start from seed URLs, fetch pages, extract links, crawl the reachable web — without re-crawling, while respecting robots.txt and politeness.

**Core:** a massive **BFS over the web graph**. The heart is the **URL frontier** — a prioritized queue of URLs to fetch, with per-domain **politeness delays** — feeding a fleet of fetchers; a parser extracts new links; a **seen-set** dedups so you never enqueue a URL twice.

**Politeness & correctness:** per-domain rate limiting (never hammer one host), `robots.txt` compliance, and trap avoidance (infinite calendar/URL spaces). Distribute crawlers **partitioned by domain hash** so each worker owns some domains and enforces their politeness locally.

**Storage:** fetched content → object storage; URL metadata + the dedup set → a scalable store; the frontier → a (priority) queue.

**Scale & tradeoffs:** at web scale the seen-set can't be an exact hash set — use a **Bloom filter** (probabilistic, tiny memory, occasional false positives that merely skip a URL — acceptable). Partition by domain to parallelize *and* respect politeness. Schedule **re-crawls** by page importance/change frequency for freshness. The frontier's prioritization (important/fresh pages first) is where crawl quality is won.

#### probe: How do you avoid re-crawling the same URL at web scale?
Maintain a **seen-set** of URLs (normalized — canonicalize scheme/host/params) and check it before enqueuing. An exact set of billions of URLs is too big for memory, so use a **Bloom filter**: O(1) membership in a few bits per URL, with a tunable false-positive rate — a false positive just means you occasionally skip a URL, which is harmless, while false negatives never happen (you never re-crawl). Back it with a durable store for crash recovery and partition by domain so each crawler owns its slice.

### concept: Ad-click aggregation (streaming analytics)
**Scope:** ingest a firehose of ad-click events and produce near-real-time aggregates (clicks per ad per minute) for dashboards and **billing**.

**Numbers:** enormous **write** throughput — millions of events/sec — and two consumers with different needs: billing (must be accurate) and dashboards (can be approximate, must be fast).

**Pipeline:** clients → load-balanced ingestion → **Kafka** (durable, partitioned log that buffers the firehose and decouples ingest spikes from processing) → a **stream processor** (Flink/Spark Streaming or consumer groups) computing **windowed** aggregates → write rollups to a fast **OLAP/time-series store** for queries.

**Hard parts:** **dedup** (a click may arrive twice → dedup by event id), **windowing** (tumbling 1-minute windows, with **watermarks** to handle late events), **fraud filtering**, and the accuracy split — the **billing** path reconciles for exactness (Kafka offsets + idempotent writes), while a **dashboard** path can use approximations (e.g. HyperLogLog for unique users) for speed.

**Scale & tradeoffs:** Kafka absorbs spikes and gives **per-key ordering** when you partition by `ad_id` (also the parallelism unit). Pre-aggregate so the query store stays small. A **lambda/kappa** architecture pairs a fast streaming path (low latency, approximate) with a batch path (slower, exact) that reconciles billing.

#### probe: How do you count clicks exactly for billing when events can be duplicated or arrive late?
Treat delivery as at-least-once and make aggregation **idempotent**: tag each click with a unique event id, dedup on it (a processed-id store or Kafka's exactly-once semantics with transactional offsets), and use **windowing with watermarks** so late events still land in the correct minute (up to a bound). For billing, run a **batch reconciliation** over the durable Kafka log to correct the fast-path approximation — the streaming layer gives low-latency numbers for dashboards, the batch layer gives the auditable exact total. You never rely on the network delivering each click exactly once.
