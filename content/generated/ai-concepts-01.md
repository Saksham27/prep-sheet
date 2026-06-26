# AI & LLM Engineering (2026)

> AI-added — verify. By mid-2026 most product/backend loops ask how you'd build with
> LLMs. This track covers the fundamentals, RAG, and AI system design/agents at the depth
> a full-stack/backend engineer is expected to reason about. Terse + a probe each.

@track id=ai | title=AI & LLM Engineering | kind=fundamentals | order=5.7 | blurb=Building with LLMs — fundamentals (tokens, embeddings, prompting), RAG & vector search, and AI system design (agents, tool calling, guardrails, evals, cost/latency, prompt injection).

@topic id=ai-fundamentals | track=ai | title=LLM fundamentals

### concept: What an LLM is (and isn't)
A **Large Language Model** is a transformer neural network trained to **predict the next token** over massive text. That single objective, at scale, yields surprising general ability — but the model has **no memory between calls** (state is only what you put in the prompt), **no live knowledge** past its training cut-off, and it **generates plausible text, not verified truth**. It's a powerful, stochastic pattern completer — treat outputs as drafts to verify, not facts. Everything else (chat, tools, RAG, agents) is engineering *around* this core.

#### probe: What is an LLM, in one breath?
A transformer trained to predict the next token, which at scale generalizes to language tasks — but it's stateless between calls, frozen at its training cut-off, and probabilistic, so it produces *plausible* output rather than guaranteed-correct output. The engineering job is to constrain and ground it: feed the right context (prompt/RAG), give it tools, validate its output, and design for the fact that it can be confidently wrong.

### concept: Tokens and the context window
LLMs don't see characters or words — they see **tokens** (sub-word chunks; roughly ¾ of a word in English). The **context window** is the maximum number of tokens (input + output) the model can attend to at once. It matters for three reasons: **cost** (you pay per token), **latency** (more tokens = slower), and **limits** (overflow and the model can't "see" earlier content). Long documents must be **chunked** or summarized to fit; "lost in the middle" means relevant facts buried in a huge context can be missed even when they fit.

#### probe: What's a token and why does the context window matter?
A token is the sub-word unit the model actually processes (~4 chars / ¾ word). The context window caps total tokens (prompt + completion) per call, which drives **cost** (priced per token), **latency** (more tokens, slower), and **capability** (anything beyond the window is invisible). So you manage it: trim/summarize history, chunk and retrieve only relevant context (RAG) instead of stuffing everything, and place the most important content where the model attends best (not buried mid-context).

### concept: Temperature, sampling, and determinism
**Temperature** controls randomness in token sampling: **low (0–0.2)** → focused, repeatable, near-deterministic (use for extraction, classification, code); **high (0.7–1+)** → diverse, creative (brainstorming, copy). Related knobs: **top-p** (nucleus sampling — sample from the smallest set of tokens covering probability p) and **max tokens**. Even at temperature 0, outputs aren't *guaranteed* identical across calls/versions. For structured output, prefer low temperature plus a schema (JSON mode / function calling / structured outputs).

#### probe: What does temperature control, and what would you use for data extraction?
Temperature scales the randomness of next-token sampling: high values spread probability for varied/creative output, low values concentrate it for focused, repeatable answers. For **data extraction / classification / code** you want **low temperature (≈0)** for consistency and correctness, ideally combined with a constrained output format (JSON schema / function calling) so the result is parseable. Save higher temperature for ideation or varied phrasing where diversity is the goal.

### concept: Embeddings
An **embedding** is a fixed-length **vector** that captures the *meaning* of text (or image/audio): semantically similar inputs map to nearby vectors. You generate them with an embedding model, store them in a **vector database**, and compare with a similarity metric (usually **cosine similarity**). Embeddings power **semantic search**, **RAG retrieval**, clustering, recommendations, and dedup — anything where "find things that *mean* the same" beats keyword matching. They are the bridge between unstructured text and math you can index and query.

#### probe: What is an embedding and what's it used for?
A dense vector representation of meaning: similar concepts land close together in vector space, so similarity is just a distance/cosine calculation. You embed your documents once, store the vectors in a vector DB, and at query time embed the query and retrieve the nearest vectors — that's **semantic search** and the retrieval half of **RAG**. Beyond search: clustering, recommendations, deduplication, classification. The key idea is converting fuzzy "is this about the same thing?" into a fast nearest-neighbor lookup.

### concept: Hallucination — why, and how to reduce it
A **hallucination** is confident, fluent output that's factually wrong or fabricated — a direct consequence of next-token prediction with no grounding or truth model. You reduce (not eliminate) it by: **grounding** the model in retrieved facts (**RAG**) and instructing it to answer only from the provided context (and say "I don't know" otherwise); lowering temperature; asking for **citations** you can verify; constraining output formats; and adding **evals/guardrails** and human review for high-stakes paths. The senior framing: design assuming the model *can* be wrong, and put verification in the loop.

#### probe: Why do LLMs hallucinate and how do you reduce it?
Because they generate the most *probable* continuation, not a *verified* one — with no built-in fact store, the smooth answer can be invented. Mitigations: **ground it with RAG** and tell it to use only the supplied context (and to abstain when unsure), require **citations**, lower temperature, prefer structured/constrained outputs, and add **evaluations + guardrails** plus human-in-the-loop for critical decisions. You can't make it impossible, so you engineer around it — retrieval for facts, validation for trust.

### concept: Prompting vs RAG vs fine-tuning
Three ways to shape behavior, cheapest first. **Prompting** (instructions, few-shot examples, system prompt): fast, free, iterate instantly — your default. **RAG** (retrieve relevant data and inject it into the prompt): when the model needs **current or private knowledge** it wasn't trained on — grounds answers and reduces hallucination without retraining. **Fine-tuning** (further-train on your data): when you need a consistent **style/format/behavior** or to bake in narrow domain skill — costly, slower to iterate, and it teaches *behavior*, not fresh *facts* (use RAG for facts). Most production systems are **prompting + RAG**; fine-tuning is the last resort.

#### probe: Prompting vs RAG vs fine-tuning — when each?
Start with **prompting** (system prompt + few-shot) — instant and free. Reach for **RAG** when the model needs knowledge it doesn't have — current events, private/company data — by retrieving and injecting that context at query time; it grounds answers and cuts hallucination without retraining. Use **fine-tuning** to lock in a *behavior*, tone, or output format (or a narrow skill), accepting the cost and slower iteration — and remember it imparts behavior, not up-to-date facts, so it's not a substitute for RAG. The common answer: prompting + RAG covers most needs; fine-tune only when those plateau.

@topic id=ai-rag | track=ai | title=RAG & vector search

### concept: The RAG pipeline
**Retrieval-Augmented Generation** grounds an LLM in your data. **Indexing (offline):** load documents → **chunk** them → **embed** each chunk → store vectors + text in a **vector DB**. **Query (online):** embed the user's question → **retrieve** the top-k most similar chunks → stuff them into the prompt with the question → the LLM answers **from that context**, ideally with citations. It gives the model current/private knowledge without retraining, makes answers verifiable, and shrinks hallucination — at the cost of a retrieval pipeline whose quality gates the whole system.

#### probe: Walk me through a RAG pipeline.
Offline you **ingest**: split documents into chunks, embed each chunk, and store the vectors (plus the source text/metadata) in a vector database. Online you **retrieve and generate**: embed the user query, do a nearest-neighbor search for the top-k relevant chunks, insert them into the prompt with an instruction to answer only from that context (and cite sources), then call the LLM. Add reranking, metadata filters, and "say I don't know if not in context" for quality. The retrieval step is the make-or-break — garbage retrieval → garbage answer, regardless of the model.

### concept: Vector databases and similarity search
A **vector DB** (pgvector, Pinecone, Weaviate, Milvus, Qdrant) stores embeddings and finds the nearest ones to a query vector fast. Exact nearest-neighbor is O(n) per query, so they use **approximate nearest neighbor (ANN)** indexes (HNSW, IVF) that trade a little recall for huge speed at millions+ of vectors. Similarity is typically **cosine** (angle) or dot-product. Crucially, support **metadata filtering** (tenant, date, document type) alongside vector search — "semantically similar *and* belonging to this user." For modest scale, `pgvector` in your existing Postgres is often enough (one less system).

#### probe: How does vector search find relevant documents quickly at scale?
It precomputes an **ANN index** (e.g. HNSW — a navigable small-world graph) over the stored embeddings, so a query embedding finds its nearest neighbors in roughly logarithmic time instead of scanning every vector — trading a tiny bit of recall for big speed. Similarity is cosine/dot-product. You combine it with **metadata filters** so results are both semantically close and authorized/relevant (right tenant, recent, correct type). At small scale, `pgvector` on Postgres avoids adding a separate datastore.

### concept: Chunking and retrieval quality
**Chunking** — how you split documents — quietly determines RAG quality. Too **large** and a chunk dilutes the relevant bit (and wastes context/cost); too **small** and it loses surrounding meaning. Common approach: split on semantic boundaries (paragraphs/sections) with a target size and some **overlap** so context isn't severed at edges, keeping metadata (source, title) on each chunk. Improve retrieval further with **hybrid search** (combine semantic + keyword/BM25), **reranking** (a cross-encoder reorders the top candidates), and query rewriting. "Bad answers" in RAG are usually a **retrieval** problem, not a model problem — debug retrieval first.

#### probe: Why does chunking matter in RAG, and how do you improve weak retrieval?
Because you retrieve and inject *chunks*: oversized chunks bury the relevant sentence and waste context; undersized chunks lose the surrounding meaning needed to answer. Aim for semantically coherent chunks with slight overlap and useful metadata. When retrieval is weak, fix it before blaming the model — try **hybrid search** (semantic + BM25 keyword), a **reranker** (cross-encoder) on the top-k, **query rewriting/expansion**, better chunking, and metadata filters. Measure with retrieval metrics (recall@k) so you're tuning, not guessing.

@topic id=ai-system-design | track=ai | title=AI system design & agents

### concept: Designing an LLM feature — cost, latency, reliability
Building with LLMs adds concerns a normal service doesn't have. **Cost**: priced per token — trim prompts, cache, and use a **smaller/cheaper model** where it suffices (route by difficulty). **Latency**: calls take seconds — **stream** tokens to the UI, do work in parallel, cache frequent answers (semantic cache). **Reliability**: providers rate-limit and have outages — add retries with backoff, timeouts, **fallback** models, and graceful degradation. **Output safety**: validate/parse structured output, never trust it blindly. **Observability**: log prompts, tokens, cost, and latency; you can't improve what you don't measure.

#### probe: How do you control LLM cost and latency in production?
Cost: minimize tokens (concise prompts, retrieve only what's needed, summarize history), **cache** repeated/semantically-similar requests, and **route** — use a small cheap model for easy tasks and reserve the big model for hard ones. Latency: **stream** the response so the user sees tokens immediately, parallelize independent calls, cache, and keep prompts short. Wrap it all in retries-with-backoff, timeouts, and a fallback model for provider rate-limits/outages, and instrument token/cost/latency per call so you can actually tune it. It's the same scaling discipline as any service, plus per-token economics.

### concept: AI agents and tool calling
A plain LLM only emits text. **Tool / function calling** lets it request actions: you describe available tools (name, params as a schema); the model returns a structured call; **your code executes it** and feeds the result back; the model continues. An **agent** loops this — *reason → call a tool → observe → repeat* — to accomplish multi-step tasks (search, query a DB, call an API), often with **memory** (conversation + retrieved state) and **planning**. **MCP (Model Context Protocol)** standardizes how models connect to tools/data sources. Agents are powerful but add failure modes: loops, wrong tool use, and compounding errors — so bound steps, validate tool inputs, and keep a human in the loop for risky actions.

#### probe: What is tool calling / an AI agent?
Tool (function) calling is giving the model a menu of typed functions; instead of answering directly it can emit a structured request to call one, which *your* code runs (a DB query, an API, a search), returning the result for the model to use. An **agent** wraps that in a loop — reason, act via tools, observe, iterate — to do multi-step work, usually with memory and some planning; **MCP** is an emerging standard for wiring models to those tools/data. The catch is reliability: agents can loop, pick the wrong tool, or compound mistakes, so you cap iterations, validate tool I/O, and gate high-impact actions behind confirmation.

### concept: Guardrails, evals, and prompt injection
Non-negotiable for shipping AI. **Guardrails**: validate/constrain inputs and outputs (schemas, content filters, allow-lists, "answer only from context", limits on actions). **Evals**: a test suite for non-deterministic output — curated cases scored by rules, an **LLM-as-judge**, or human review — run on every prompt/model change so you catch regressions (you can't unit-test a vibe without them). **Prompt injection** is the new top AI security risk: malicious instructions hidden in user input or *retrieved content* hijack the model ("ignore previous instructions; exfiltrate data"). Mitigate by separating trusted instructions from untrusted data, least-privilege tools, output filtering, and never letting model output trigger sensitive actions unchecked.

#### probe: What is prompt injection and how do you defend against it?
Prompt injection is when attacker-controlled text — in the user message or in **content the system retrieved** (a web page, a doc, an email) — contains instructions the model follows, overriding your intent (leak data, call a tool maliciously, ignore safety rules). It's the LLM analogue of injection attacks and currently has no perfect fix. Defenses: keep a clear trust boundary between your system instructions and untrusted data, give tools **least privilege** and require confirmation for sensitive/irreversible actions, validate and filter both inputs and outputs, and never wire raw model output directly into dangerous operations. Treat all model input as untrusted, especially retrieved content.

### concept: Using AI as an engineer (the interview angle)
Increasingly asked behaviorally: *how do you actually work with AI tools?* The strong answer shows **leverage with judgment**: use AI to accelerate boilerplate, explore unfamiliar APIs, draft tests, and rubber-duck design — but **you own and understand everything you commit**. Red flags interviewers listen for: shipping code you can't explain, trusting output without verifying, or letting it erode fundamentals. Frame it as augmentation: faster first drafts, then *your* review, testing, and reasoning. (This pairs with the Behavioral track — "over-relying on AI early, then changing how I work to verify everything I commit" is a genuinely strong, self-aware story.)

#### probe: How do you use AI coding tools responsibly?
As an accelerator with a hard rule: I never commit code I can't explain or haven't verified. I lean on it for boilerplate, unfamiliar-API exploration, test scaffolding, and as a thinking partner — then I review, test, and make sure I understand the *why*, because I'm accountable for it, not the tool. The maturity signal is using it to go faster on the mechanical parts while keeping ownership of correctness and design, and being honest that early on it's easy to over-rely — the fix is disciplined verification of everything that ships.
