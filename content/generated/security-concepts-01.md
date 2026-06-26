# Security & Auth

> AI-added — verify. The security round, increasingly asked for backend/full-stack:
> authentication & authorization, and the OWASP web-security essentials. Terse + a probe
> each. Pairs with CS Fundamentals → Networking (TLS) and SQL & Data Modeling (injection).

@track id=security | title=Security & Auth | kind=fundamentals | order=3.5 | blurb=AuthN vs AuthZ, sessions/JWT/OAuth2, password storage, and the OWASP top risks (injection, XSS, CSRF) — the security questions backend and full-stack interviews now expect.

@topic id=security-auth | track=security | title=Authentication & authorization

### concept: Authentication vs authorization
**Authentication (AuthN)** = *who are you?* — verifying identity (password, OTP, biometric, a token). **Authorization (AuthZ)** = *what are you allowed to do?* — checking permissions on a resource after identity is established. AuthN always comes first; AuthZ governs access afterward. In HTTP terms, failing AuthN is **401 Unauthorized** (you're not identified), failing AuthZ is **403 Forbidden** (identified, but not permitted). Common AuthZ models: role-based (RBAC) and attribute/policy-based (ABAC).

#### probe: Difference between authentication and authorization?
Authentication establishes **identity** ("prove you are who you claim" — credentials, tokens, MFA); authorization decides **access** ("given who you are, can you do this?" — roles, permissions, ownership checks). AuthN runs first and produces a verified principal; AuthZ runs on every protected action. The HTTP signal: **401** = not authenticated, **403** = authenticated but not authorized. Conflating them is the classic mistake — e.g. returning 403 when the user simply isn't logged in.

### concept: Sessions vs tokens (JWT)
**Session-based:** the server creates a session record on login and hands the client a **session id** in a cookie; state lives server-side (in memory/Redis/DB). Easy to **revoke** (delete the session), but requires shared session storage to scale horizontally. **Token-based (JWT):** the server issues a signed **JSON Web Token** (header.payload.signature) the client sends on each request; it's **stateless** — the server verifies the signature without a lookup, great for scaling and microservices. The catch: JWTs are hard to **revoke** before expiry, so keep access tokens short-lived and pair them with a refresh token.

#### probe: Session-based vs JWT auth — tradeoffs?
Sessions store state server-side and return an opaque cookie id: trivial to revoke instantly, but you need shared session storage (e.g. Redis) for multiple servers. JWTs are self-contained and signed, so any server validates them statelessly (no lookup) — ideal for horizontal scale and service-to-service — but you can't easily revoke one before it expires, and the payload is only base64 (readable, so never put secrets in it). The standard pattern: **short-lived access JWT + a revocable refresh token**, getting statelessness without losing control. Always send tokens/cookies over HTTPS; mark auth cookies `HttpOnly`, `Secure`, `SameSite`.

### concept: OAuth2 and OpenID Connect
**OAuth2** is a **delegated authorization** framework: it lets an app access resources on a user's behalf **without the user's password** — the user consents, and the app receives an **access token** (e.g. "Sign in with Google" granting calendar access). It defines flows (the **Authorization Code** flow, with **PKCE** for public/mobile clients, is the modern default). OAuth2 alone is about *authorization*, not identity. **OpenID Connect (OIDC)** is a thin layer **on top of OAuth2** that adds an **ID token** (a JWT with verified user identity) — so OIDC is how you do *authentication* ("who is this user") via an identity provider.

#### probe: What problem does OAuth2 solve, and how is OIDC different?
OAuth2 solves **delegated access**: a third-party app can act on your resources without ever seeing your password — you authorize a scoped access token via a consent flow (Authorization Code + PKCE today). But OAuth2 is about *authorization*, so using it to "log in" is technically a misuse. **OIDC** fixes that by layering an **ID token** (a signed JWT asserting identity + claims) on top, giving you standardized *authentication* and a userinfo endpoint. Short version: OAuth2 = "can this app access my stuff," OIDC = "who is this user, verified by an identity provider."

### concept: Storing passwords securely
**Never store plaintext, and never *encrypt* passwords** (encryption is reversible — if the key leaks, all passwords leak). **Hash** them with a slow, salted, adaptive algorithm: **bcrypt, scrypt, or Argon2** (Argon2id is the modern recommendation). A **unique random salt per user** defeats rainbow tables and means identical passwords hash differently. The hash must be **deliberately slow** (tunable work factor) to resist brute force — which is exactly why fast hashes like **MD5/SHA-256 are wrong** for passwords. On login you hash the input with the stored salt and compare.

#### probe: How do you store passwords securely?
Hash, never encrypt (encryption is reversible; a leaked key exposes everything). Use a **slow, salted, adaptive** hash — **Argon2id** (or bcrypt/scrypt) — with a **unique per-user salt** so rainbow tables and identical-password collisions don't help an attacker, and a **work factor** tuned high enough to make brute force expensive. Don't use MD5/SHA family alone — they're fast, which is the opposite of what you want. Add MFA and rate-limiting/lockout on login attempts as defense in depth.

### concept: Encryption — in transit, at rest, symmetric vs asymmetric
**In transit:** TLS/HTTPS encrypts data on the wire (see Networking → TLS handshake). **At rest:** encrypt stored data (disk/DB/field-level) so a stolen disk or backup is useless. **Symmetric** encryption (AES) uses one shared key — fast, for bulk data. **Asymmetric** (RSA/ECC) uses a public/private key pair — slower, used to exchange a symmetric key or to sign/verify (the basis of TLS and JWT signatures). **Secrets** (DB passwords, API keys) belong in a **secrets manager / vault** (or injected env vars), never hard-coded in source or committed to git.

#### probe: Where should application secrets live, and symmetric vs asymmetric?
Secrets (DB credentials, API keys, signing keys) belong in a dedicated **secrets manager** (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) or securely injected configuration — never hard-coded, never committed to the repo, rotated periodically and access-controlled. **Symmetric** crypto (AES) uses one shared key, is fast, and handles bulk encryption (data at rest, TLS session traffic); **asymmetric** (RSA/ECC) uses a key pair and is used to securely exchange the symmetric key, and to **sign/verify** (TLS certs, JWT signatures). Real systems combine them: asymmetric to bootstrap trust/keys, symmetric for the heavy lifting.

@topic id=security-owasp | track=security | title=Web security (OWASP)

### concept: SQL injection
**SQL injection** happens when user input is concatenated into a SQL string, letting an attacker inject SQL (e.g. input `' OR '1'='1` turning a login check always-true, or `'; DROP TABLE users;--`). It's one of the oldest and most damaging web vulnerabilities. **Prevention: parameterized queries / prepared statements** (the input is bound as data, never parsed as SQL), plus an ORM that parameterizes by default, least-privilege DB accounts, and input validation. **Never** build SQL by string concatenation with user input.

#### probe: What is SQL injection and how do you prevent it?
It's injecting malicious SQL through unsanitized input that gets concatenated into a query — bypassing auth, dumping or destroying data. The fix is **parameterized queries / prepared statements**: the SQL structure is fixed and user values are bound as parameters, so input can never change the query's meaning (`WHERE email = @email`, not `"WHERE email='" + input + "'"`). Reinforce with an ORM that parameterizes, **least-privilege** database accounts (the app user can't `DROP`), input validation, and avoiding dynamic SQL. Parameterization is the non-negotiable core answer.

### concept: Cross-Site Scripting (XSS)
**XSS** injects malicious **JavaScript** into a page that other users' browsers then execute — stealing cookies/tokens, defacing, or acting as the user. Types: **stored** (persisted, e.g. a malicious comment), **reflected** (echoed from the request), and **DOM-based** (client-side sink). **Prevention: contextual output encoding/escaping** (render user content as text, not HTML), a **Content-Security-Policy** (CSP) to restrict script sources, sanitizing any HTML you must allow, and marking auth cookies **HttpOnly** so script can't read them. Modern frameworks (React) auto-escape by default — the danger is `dangerouslySetInnerHTML`/`innerHTML`.

#### probe: What is XSS and how do you prevent it?
XSS is injecting attacker-controlled JavaScript that runs in another user's browser (stored, reflected, or DOM-based), letting it steal session tokens or act as the victim. Prevent it by **escaping/encoding output** for its context (HTML, attribute, JS, URL) so user input renders as inert text, adding a **Content-Security-Policy** to limit where scripts can load from, **sanitizing** any rich HTML you genuinely allow (DOMPurify), and setting **HttpOnly** on session cookies so injected script can't read them. In React, rely on its default escaping and avoid `dangerouslySetInnerHTML` with untrusted data.

### concept: Cross-Site Request Forgery (CSRF)
**CSRF** tricks a logged-in user's browser into making an unwanted state-changing request to a site where they're authenticated — exploiting that browsers **auto-send cookies**. E.g. a malicious page silently POSTs to `bank.com/transfer` while you're logged in. **Prevention:** **anti-CSRF tokens** (a per-session/per-request secret the server validates, which a cross-site attacker can't read), the **`SameSite` cookie attribute** (`Lax`/`Strict` stops cookies on cross-site requests), and checking Origin/Referer. Note: CSRF targets **cookie**-based auth — APIs using a Bearer token in a header are largely immune (the attacker can't set that header cross-site).

#### probe: What is CSRF and how do you prevent it?
CSRF abuses the browser's automatic cookie-sending to make a logged-in victim perform an unintended state-changing action on a site they're authenticated to (a hidden form/POST from an attacker page). Defenses: **anti-CSRF tokens** (an unpredictable token tied to the session that must accompany state-changing requests — a cross-origin attacker can't read it), the **`SameSite=Lax/Strict`** cookie attribute (cookies aren't sent on cross-site requests), and verifying the Origin/Referer header. It specifically affects cookie-based sessions; token-in-header (Bearer) APIs are largely immune since the attacker can't forge that header cross-site.

### concept: Other essentials — CORS, headers, validation, least privilege
A grab-bag interviewers probe: **CORS** is a browser security feature that blocks cross-origin requests unless the server opts in via `Access-Control-Allow-*` headers — it protects users, it is *not* server-side authorization. **Security headers**: CSP, `Strict-Transport-Security` (force HTTPS), `X-Content-Type-Options: nosniff`, `X-Frame-Options` (clickjacking). **Validate and sanitize all input** server-side (never trust the client). **Principle of least privilege** everywhere (DB users, service accounts, tokens scoped minimally). **Rate limiting** on auth and expensive endpoints. **Don't leak** stack traces or whether an email exists.

#### probe: Is CORS a security mechanism that protects your server?
No — that's the common misconception. **CORS is a browser-enforced policy** that relaxes the same-origin policy: it decides whether *browser* JavaScript from another origin may read your response. It does nothing to stop non-browser clients (curl, a server, Postman) from calling your API, so it is **not** authentication or authorization. You still need real server-side AuthN/AuthZ on every endpoint. CORS only controls cross-origin access *from browsers*; treat it as a browser convenience/safety feature, not as your access control.
