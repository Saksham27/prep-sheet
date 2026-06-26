# Tech Deep-Dives — DevOps (Docker / Kubernetes / CI-CD)

> AI-added — verify. Appended to the Tech Deep-Dives track — the deploy/operate side a
> backend engineer is expected to know (and which your AKS experience anchors). Terse + a
> probe each.

@topic id=tech-devops | track=tech | title=DevOps (Docker / K8s / CI-CD)

### concept: Containers vs VMs (and what Docker gives you)
A **virtual machine** virtualizes hardware and runs a **full guest OS** — strong isolation, but heavy (GBs, slow to boot). A **container** virtualizes the **OS** — it shares the host kernel and packages just your app + its dependencies, isolated via Linux **namespaces** (what a process can see) and **cgroups** (what it can use). So containers are **lightweight** (MBs, start in ms) and dense. **Docker** builds an immutable **image** (layered, from a `Dockerfile`) that runs identically anywhere — solving "works on my machine" and making deploys reproducible. Containers share the kernel, so isolation is weaker than a VM's.

#### probe: Container vs VM — what's the difference?
A VM runs a full guest OS on virtualized hardware (heavy, strong isolation, slow boot); a container shares the host **kernel** and isolates just the app and its dependencies using namespaces + cgroups (lightweight, fast, dense). The tradeoff is isolation strength vs efficiency: VMs isolate better but cost more; containers pack many apps efficiently with slightly weaker isolation (shared kernel). Docker images make a containerized app reproducible across environments — the same artifact runs on a laptop, CI, and prod, eliminating environment drift.

### concept: Kubernetes — what it gives you
**Kubernetes** orchestrates containers across a cluster. You declare the **desired state** (YAML) and it continuously reconciles reality to match. Key objects: a **Pod** (one or more co-located containers, the smallest unit), a **Deployment** (manages a replica set of pods — rollouts, scaling, self-healing by restarting failed pods), a **Service** (a stable virtual IP/DNS load-balancing across pods, since pods are ephemeral), **Ingress** (HTTP routing in), **ConfigMap/Secret** (config/secrets), and **HPA** (autoscale pods on metrics). The control plane (API server + **etcd**, which uses Raft) stores state; nodes run a kubelet. It gives you self-healing, rolling deploys, scaling, and service discovery declaratively.

#### probe: What does Kubernetes actually give you?
Declarative orchestration: you specify the desired state (N replicas, this image, these resources) and K8s **reconciles** continuously — restarting crashed pods (**self-healing**), spreading them across nodes, doing **rolling updates** and rollbacks, **autoscaling** on load, and providing **service discovery + load balancing** via Services so clients reach healthy pods despite churn. Pods are ephemeral and get new IPs, so a Service gives a stable address. In short: it automates running, scaling, healing, and connecting containers across a cluster, driven by declarative config rather than manual ops.

### concept: CI vs CD
**Continuous Integration (CI):** developers merge to a shared branch frequently, and each push triggers an automated pipeline that **builds, runs tests/linters**, and produces an artifact — catching integration problems early. **Continuous Delivery (CD):** every passing build is **automatically prepared for release** and deployed to staging, so production deploy is a one-click/approval away. **Continuous Deployment** goes further — every passing change ships to **production automatically**, no human gate. The whole point: small, frequent, automated, low-risk releases instead of big scary ones, with the pipeline as the quality gate.

#### probe: What's the difference between continuous delivery and continuous deployment?
Both build on CI (automated build + test on every change). **Continuous Delivery** keeps every passing build **deployable and deployed to staging**, with production release gated by a manual approval — you *can* ship at any time with one click. **Continuous Deployment** removes that human gate: every change that passes the pipeline goes **straight to production automatically**. So delivery = always ready to release (human decides when), deployment = release happens automatically. The shared goal is small, frequent, automated releases that de-risk shipping.

### concept: Deployment strategies — rolling, blue-green, canary
How you release without downtime. **Rolling:** replace instances in batches (K8s default) — no extra capacity needed, but old and new run simultaneously during the rollout. **Blue-green:** stand up the new version ("green") alongside the old ("blue"), then switch all traffic at once — instant cutover and rollback (flip back), but needs **double** the infrastructure. **Canary:** route a **small %** of traffic to the new version, watch metrics/errors, then gradually ramp to 100% — best risk control, catches problems with minimal blast radius, but more complex (traffic splitting + good observability). **Feature flags** decouple deploy from release entirely.

#### probe: Blue-green vs canary deployment?
**Blue-green** runs two full environments — current (blue) and new (green) — and switches *all* traffic at once when green is verified; cutover and rollback are instant, but you pay for double capacity during the switch. **Canary** shifts a *small fraction* of traffic to the new version, monitors error/latency metrics, and gradually increases to 100% (or rolls back) — minimizing blast radius and catching regressions on real traffic, at the cost of more complex traffic management and strong observability. Blue-green optimizes for clean instant cutover; canary optimizes for risk control via gradual exposure.

### concept: Health checks, observability, and 12-factor
**Health checks** let the orchestrator manage pods: a **liveness** probe ("is it alive?" — restart if not) and a **readiness** probe ("can it serve traffic yet?" — keep it out of the LB until yes) prevent routing to dead/warming instances. **Observability** = the three pillars: **logs** (events), **metrics** (time-series — RED/USE), **traces** (a request across services) — feed dashboards and alerts on **SLOs**. The **12-factor** app principles (config in env, stateless processes, disposability, dev/prod parity) make services cloud-native and horizontally scalable. **Infrastructure as Code** (Terraform/Helm) makes environments reproducible and version-controlled.

#### probe: Liveness vs readiness probe — why have both?
A **liveness** probe answers "is this process healthy?" — if it fails, the orchestrator **restarts** the pod (recovers from deadlocks/hangs). A **readiness** probe answers "is it ready to serve traffic?" — if it fails, the pod is **removed from the Service's load-balancer pool** but *not* restarted (e.g. still warming up, or a dependency is down). You need both because "alive" and "ready" differ: a starting or temporarily-overloaded pod is alive but shouldn't receive traffic yet, and restarting it would be wrong. Together they prevent routing requests to dead or not-yet-ready instances.
