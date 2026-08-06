# 06 — Assumed Backend Architecture (Outreach)

**Tier:** P only (per README tier table). **Prepared:** 2026-08-06, workstream F.
**Method:** inference from public job postings (Lever public API), the public GitHub org,
Outreach-authored blog posts, a vendor case study, published metrics, and live HTTP
response headers. No authenticated surface was touched.

**Standing caveat (applies to every row sourced from a job posting):** job posts express
*hiring intent* and the stack a team wants candidates to know — not necessarily what runs
in production today, in what proportion, or forever. Posting text can lag or lead
reality. Rows are tagged **OBSERVED** (the source literally states it) vs **INFERENCE**
(our conclusion from observed signals). Even OBSERVED rows describe what Outreach *says*,
not what we have independently verified running.

---

## 1. Languages & application stack

| Signal | Status | Evidence |
|---|---|---|
| Go is the primary backend language for "next gen" applications | OBSERVED | Own posting text, Core Experience team [S-ARC-002]; Go required in AI staff role [S-ARC-012]; GitHub org is overwhelmingly Go [S-ARC-007] |
| Ruby on Rails apps still exist (legacy tier) | OBSERVED | Posting states some Rails apps remain [S-ARC-002]; "Ruby a plus" in AI role [S-ARC-012] |
| Python used for data/AI work; Java/C++ appear in science roles | OBSERVED | [S-ARC-004] [S-ARC-012] |
| The platform began as a Rails monolith now being decomposed into Go services | INFERENCE | From the observed Go-primary + residual-Rails + "breaking down existing systems using an SOA approach" combination [S-ARC-002]; decomposition direction is stated, monolith origin is our inference |
| Service scaffolding is templated and standardized (golden-path tooling) | OBSERVED | Public repos: stencil ("templating engine for service development"), stencil-golang/base, devbase ("scripts/makefiles for creating microservices"), gobox shared library, lintroller custom linters [S-ARC-007] |
| Microservices architecture (self-described "internet-scale microservice platform") | OBSERVED (self-description) | [S-ARC-012] (snippet); corroborated by the tooling above [S-ARC-007] |
| GraphQL is the data-loading layer being adopted between clients and services | OBSERVED | Posting: transitioning data loading to GraphQL [S-ARC-002]; goql Go GraphQL client in the open [S-ARC-007] |
| Public REST API (api.outreach.io, JSON) fronts the platform separately from the GraphQL client layer | OBSERVED / INFERENCE | 401 JSON from api.outreach.io observed [S-ARC-008]; the REST-vs-internal-GraphQL split is inference (cross-ref doc 05) |

## 2. Data stores

| Signal | Status | Evidence |
|---|---|---|
| MySQL **and** PostgreSQL both in production for OLTP | OBSERVED | Posting names both [S-ARC-002] |
| NoSQL in use, AWS DynamoDB named explicitly | OBSERVED | [S-ARC-002] [S-ARC-012] |
| Lakehouse/warehouse analytics tier: Spark/Delta Lake, Databricks or Snowflake, dbt, Airflow | OBSERVED (hiring intent) | AI staff role's "modern data stack" list [S-ARC-012]; Databricks relationship corroborated by 2020 case study [S-ARC-010] and 2025 Snowflake/Databricks product integrations [S-ARC-011] |
| Graph database layer being built for per-tenant knowledge graphs; Neo4j / Amazon Neptune / SPARQL / Cypher are the named candidates | OBSERVED (greenfield intent, 2026) | Director charter says "build from the ground up", owns choice of graph DB [S-ARC-005] |
| Vector store / embeddings infrastructure for RAG | OBSERVED (hiring intent) | [S-ARC-012] [S-ARC-005] |
| Dual-OLTP (MySQL+Postgres) likely reflects era-layering: older Rails-era store plus newer services choosing per-service stores | INFERENCE | From observed dual-store + SOA decomposition [S-ARC-002]; no public statement of which came first |

## 3. Queueing, async & scheduling

| Signal | Status | Evidence |
|---|---|---|
| Kafka and RabbitMQ are the main async-processing fabric | OBSERVED | Posting: async processing "mostly" Kafka and RabbitMQ [S-ARC-002]; both repeated in AI role [S-ARC-012] |
| Two-broker pattern suggests Kafka for event streams/analytics and RabbitMQ for work queues/job dispatch | INFERENCE | Common split; consistent with an event-sourced engagement feed + task execution, but not publicly stated |
| Airflow for batch/data-pipeline orchestration | OBSERVED (hiring intent) | [S-ARC-012] |
| No public evidence of a durable-workflow engine (Temporal or similar) behind sequence scheduling; scheduling mechanics undisclosed | OBSERVED (absence) → Unknown | Searched 2026-08-06; no case study or posting names one. Do **not** assume our build-choice (Temporal) mirrors theirs |
| KEDA (event-driven autoscaling) in the infra toolkit implies queue-depth-driven worker scaling | OBSERVED tool / INFERENCE use | KEDA named in SRE posting [S-ARC-003]; the queue-depth use is inference |

## 4. Cloud, infra & delivery

| Signal | Status | Evidence |
|---|---|---|
| AWS is the incumbent cloud: CloudFront serves www + api; x-amz headers; DynamoDB; Amazon Linux/Bottlerocket; EKS | OBSERVED | Headers [S-ARC-008]; postings [S-ARC-002] [S-ARC-003] |
| Azure footprint exists or is being built: SRE role titled "(COR, AZURE)", AKS named alongside EKS | OBSERVED | [S-ARC-003] |
| Multi-cloud posture (AWS primary, Azure secondary/expanding), plausibly for geo/data-residency or enterprise placement | INFERENCE | From EKS+AKS + "scale our application platform to multiple geographies" [S-ARC-003]; motive is our guess |
| Kubernetes is the runtime substrate; service mesh Istio; autoscaling Karpenter + KEDA; cost tooling ScaleOps; config Ansible; IaC Terraform/OpenTofu | OBSERVED (toolkit) | SRE posting [S-ARC-003]; k8s dev tooling in the open (localizer, jsonnet-libs) [S-ARC-007] |
| CI on CircleCI (at least historically); GitHub for VCS | OBSERVED | [S-ARC-007] [S-ARC-003] |
| Central platform org ("Foundations", incl. COR squad) provides infra as an internal product to feature squads | OBSERVED | Foundations described as engineering-enablement org [S-ARC-003] [S-ARC-001] |
| outreach.io → outreach.ai edge redirect done in CloudFront functions | OBSERVED | 301 FunctionGeneratedResponse [S-ARC-008] |

## 5. CRM sync & integration platform

| Signal | Status | Evidence |
|---|---|---|
| A dedicated "Sync" team owns a bi-directional data-integration platform (Outreach ⇄ Salesforce, Microsoft Dynamics, other API endpoints) | OBSERVED | [S-ARC-004] |
| That platform is classified internally as a tier-1 (availability-critical) service | OBSERVED | Posting says tier 1 [S-ARC-004] |
| Sync is generalized ("API-enabled applications and endpoints"), not per-CRM point code | OBSERVED (description) / INFERENCE (internals) | [S-ARC-004] |
| AI/LLM pipelines are being attached to the sync platform (agents acting on CRM data) | OBSERVED (hiring intent, 2026) | Role blends sync + agentic pipelines [S-ARC-004] |

## 6. ML / AI stack

| Signal | Status | Evidence |
|---|---|---|
| Email/reply intent-and-sentiment classification built with transfer learning; peer-reviewed 2019 (HPML) | OBSERVED | Outreach blog + named paper/authors [S-ARC-009] |
| Training/deployment historically on Amazon SageMaker + MLflow (Databricks), Ground Truth labeling, S3 datasets; managed-service preference from a small ML-prod team | OBSERVED (2020, dated) | Case study [S-ARC-010] (snippet) |
| Customer data not sent to third-party annotation vendors (in-house labeling) | OBSERVED (self-claim, 2019-era) | [S-ARC-009] |
| Current AI org spans: Voice ("Dialog Understanding and Generation", real-time transcript intelligence), Knowledge Graphs & AI (per-tenant KG, entity resolution, reasoning), Sync AI, forecasting analytics | OBSERVED (team existence) | [S-ARC-001] [S-ARC-005] [S-ARC-006] |
| LLM stack: RAG, vector DBs, embeddings, prompt/context engineering, evals, MLOps (feature stores, model serving) | OBSERVED (hiring intent) | [S-ARC-012] |
| MCP (Model Context Protocol) familiarity requested — consistent with published MCP server/client interop | OBSERVED | [S-ARC-005]; cross-ref doc 02/ai-agents |
| Which foundation-model vendor(s) power production agents | Unknown | No public engineering statement found 2026-08-06 |

## 7. Multi-tenancy assumptions

| Signal | Status | Evidence |
|---|---|---|
| Tenant isolation is a first-class design topic ("tenant isolation strategies at scale" for the KG platform) | OBSERVED (design intent) | [S-ARC-005] |
| Knowledge graphs are explicitly **per-tenant** (per-customer graph instances or partitions) | OBSERVED (design intent) | [S-ARC-005] |
| Core OLTP tenancy model (shared schema + org_id vs schema/DB-per-tenant) | Unknown — nothing public found | — |
| Geographic expansion of the application platform (multi-region/geo residency) is an active infra workstream | OBSERVED | COR mission text [S-ARC-003] |
| Enterprise-grade governance (roles, profiles, content collections) implies tenant + sub-tenant (team) scoping throughout the data model | INFERENCE | From product surface (cross-ref docs 02/admin-governance, 04); not an infrastructure statement |

## 8. Scale indicators (all Outreach-published marketing numbers, 2025–26 — treat as upper-bound self-claims)

| Metric | Value | Status |
|---|---|---|
| Weekly active users | 390,000 | OBSERVED (self-published) [S-ARC-011] |
| Deals moved through platform, 2025 | 43.9M | OBSERVED (self-published) [S-ARC-011] |
| Pipeline created, 2025 | $765B | OBSERVED (self-published) [S-ARC-011] |
| Prospects contacted, 2025 | 29M | OBSERVED (self-published) [S-ARC-011] |
| Sequences launched, 2025 | 930K | OBSERVED (self-published) [S-ARC-011] |
| Calls analyzed / meetings enriched, 2025 | 2.5M / 1.1M | OBSERVED (self-published) [S-ARC-011] |
| Enterprise customers (job-post phrasing) | "4,000+ enterprise customers", "millions of sales interactions" | OBSERVED (recruiting copy) [S-ARC-005]; note tension with "6,000+ customers" marketing claims — likely different definitions (enterprise subset vs all) — INFERENCE |
| Engineering geography | Seattle + Prague + Hyderabad hubs | OBSERVED [S-ARC-001] |
| Implied touch volume | 29M prospects/yr through multi-step sequences ⇒ high-tens-of-millions of scheduled touches/yr, i.e. a mid-six-figure daily send/task pipeline | INFERENCE (arithmetic on self-published numbers) |

## 9. Composite sketch (INFERENCE — our synthesis, for the build team's orientation only)

A ~2014 Rails application progressively strangled into a Go microservice platform on
Kubernetes (AWS/EKS primary, Azure/AKS growing), fronted by CloudFront; MySQL+Postgres+
DynamoDB behind services; Kafka as the event backbone with RabbitMQ for job traffic;
GraphQL consolidating client data-loading; a tier-1 generalized CRM-sync platform; a
Databricks/Snowflake-era lakehouse feeding analytics and ML; and a 2025–26 AI layer
(agents, voice intelligence, per-tenant knowledge graph, RAG) being built as new
greenfield systems beside the core. Confidence: moderate on components (mostly stated),
low on proportions, wiring, and scheduling internals (never stated).

## Unknowns

- Sequence-execution engine internals: scheduler design, exactly-once strategy,
  cancellation mechanics, any workflow engine — no public source found.
- OLTP tenancy layout (shared-schema vs isolated), sharding/partitioning strategy.
- Which OLTP store dominates (MySQL vs Postgres) and the split of Rails-vs-Go surface
  area in production today.
- Foundation-model vendors and model-gateway architecture for the agent layer.
- Deliverability infrastructure (IP pools, warmup automation, reputation ops) — nothing
  public at the infrastructure level (product surface covered in doc 02/14).
- Observability stack specifics (metrics/tracing vendors) beyond the COR squad's remit.
- Whether the Azure presence is full product replication, specific workloads (e.g.
  Dynamics-adjacent or Copilot-related), or geo/residency-driven.
- Real production traffic/throughput figures; all scale numbers above are marketing
  aggregates.

*"Prepared under docs/legal/clean-room-protocol.md; all sources logged."*
