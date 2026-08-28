# OpenAngels Master Architecture & Operational Guidelines
> **Permanent Guide for AI Agents & Developers**  
> *Last Updated: August 2026 | Stages 1–10 Fully Operational*

---

## 1. Core Operating Principles & Safety Guardrails

### 🔒 Principle 1: Zero Regression Rule (Do Not Break Existing Code)
* **Never break, overwrite, or delete working features.**
* Every new modification must be backward-compatible with:
  * **Frontend**: Next.js 16 App Router, responsive Investor Cards, instant 50ms search/filters, CRM pipeline, Gumroad Lifetime checkout, AI Pitch Generator, and SEO dynamic sitemaps.
  * **Database**: Live Supabase `investors` table (4,267+ verified profiles), `profiles`, `crm_leads`, `investor_queue`.
  * **Pipeline**: `run_master.bat` (Modes 1, 2, and 3).

### 🔍 Principle 2: Strict Codebase Audit & Transparency
* **Always verify the codebase first** before writing code.
* If a requested task/instruction is **already implemented** in the project, **state it clearly and honestly** with exact file paths and line numbers instead of creating duplicate code or redundant scripts.

### 💡 Principle 3: Proactive Innovation & Analysis
* You are explicitly authorized and encouraged to:
  * Propose performance optimizations and architectural enhancements.
  * Detect and resolve edge cases (e.g. malformed inputs, API latency, UI flickers).
  * Enhance data enrichment and outreach intelligence.

---

## 2. Complete System Architecture (Stages 1–10 Implemented)

```text
                                  OPENANGELS PLATFORM v1.0
                                
  ┌───────────────────────────────┐               ┌─────────────────────────────────┐
  │      Next.js 16 Frontend      │               │   Master Data Pipeline & OSINT  │
  │    (App Router + Tailwind)    │               │  (run_master.bat / 14-Stage DAG)│
  └──────────────┬────────────────┘               └────────────────┬────────────────┘
                 │                                                 │
                 ▼                                                 ▼
  ┌───────────────────────────────┐               ┌─────────────────────────────────┐
  │   Server APIs (/api/...)      │               │  OpenAngels Data Engine v1.0    │
  │ - /api/investors (50ms cache) │◄──────────────┤  - Quality Gates (0 ghosts)     │
  │ - /api/investor/contact       │  JSON Rest    │  - Record Linkage (Jaro-Winkler)│
  │ - /api/enrich & webhooks      │  Consensus    │  - Entity Resolution (Startups) │
  └──────────────┬────────────────┘               │  - Venture Knowledge Graph      │
                 │                                │  - Investment Signal Archetypes │
                 ▼                                └────────────────┬────────────────┘
  ┌────────────────────────────────────────────────────────────────┴────────────────┐
  │                      Supabase PostgreSQL Cloud Storage                          │
  │          - investors (4,267+ verified)   - profiles (Lifetime Premium)          │
  │          - crm_leads                     - investor_queue                       │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 14-Stage Data Quality & Intelligence Engine

The core engine is unified in `data_pipeline/openangels_data_engine.py`:

| Phase # | Phase Name | Implementation & Purpose |
|---|---|---|
| **1–3** | **Sources, Ingestion & Raw Buffer** | Stream & batch ingest from TechCrunch, Sifted, EU-Startups, Signal NFX, Twitter/X, and Angel registries into `investor_queue`. |
| **4** | **Parser** | Structured parsing of investor biographies, firm affiliations, check sizes, stages, and portfolio entities. |
| **5** | **Normalization** | Canonicalization of geographic locations (`San Francisco, CA`), domain corrections (`@gmail.com`), and social handles. |
| **6** | **Validation (Quality Gates)** | **Strict 0-ghost policy**: Every record MUST possess at least 1 verified contact method (Email, LinkedIn, or Twitter/X). System handles like `x.com/x` are rejected. |
| **7** | **Deduplication** | Probabilistic Record Linkage via Jaro-Winkler distance and Levenshtein similarity to prevent duplicate entries. |
| **8** | **Entity Resolution** | Cluster and canonicalize startup portfolio names (`OpenAI Inc.` ➔ `OpenAI`, `Fitbit, Inc.` ➔ `Fitbit`). |
| **9–12**| **Claims, Evidence & Consensus** | Source lineage tracking, conflict detection across data providers, and statistical confidence scoring. |
| **13** | **Venture Knowledge Graph** | `knowledge_graph.json` containing 4,866 nodes and 2,749 co-investment edges connecting founders, startups, and syndicate partners. |
| **14** | **Investment Signal Archetypes** | Archetype classification: `👑 Lead Investor`, `🤝 Syndicate Backer`, `🌱 Pre-Seed Pioneer`, `🚀 High-Velocity Angel`. |

---

## 4. Key File Map

### Frontend (`frontend/`)
* **`src/components/Dashboard.jsx`**: Main directory dashboard, instant search, dynamic sidebar filters, and "Recently Added" fast 50ms view.
* **`src/components/InvestorProfileModal.jsx`**: Detailed dossier modal with Investment Signals, verified contact unlock, and collapsible Venture Knowledge Graph with real co-investor links.
* **`src/app/api/investors/route.js`**: High-performance REST API with `order=created_at.desc` and service role authentication.
* **`src/app/api/investor/contact/route.js`**: Dynamic syndicate co-investor discovery based on shared portfolio companies in Supabase.
* **`src/app/crm/page.jsx` & `src/components/crm/KanbanBoard.jsx`**: Full founder CRM pipeline (Inbox, Contacted, Meeting, Due Diligence, Committed).

### Data Pipeline (`data_pipeline/`)
* **`master_pipeline.py`**: Unified CLI runner (`run_master.bat`):
  * `[1]` Daily Deals & News Monitor.
  * `[2]` High-Volume Verified Angel Registries (32,800+ indexed profiles).
  * `[3]` Full 14-Stage Data Quality & Engine Audit (HUD Benchmark).
* **`openangels_data_engine.py`**: Core 14-stage data quality pipeline and signal generator.
* **`data_quality_engine.py`**: Normalization routines, sanitizers, and quality gate score (0–100%).
* **`record_linkage_engine.py`**: Probabilistic deduplication.
* **`entity_resolution_engine.py`**: Brand and startup canonicalization.
* **`knowledge_graph_engine.py`**: Triplet ingestion and co-investor relationship discovery.
* **`data_provenance_engine.py`**: Data lineage, conflict resolution, and evidence logging.

---

## 5. Instructions for Future Sessions & Daily Roadmap
When given new tasks or a 10-day instruction plan:
1. **Analyze First**: Cross-reference against this document and the existing codebase.
2. **Report Status**: If a requirement is already fulfilled, confirm it immediately with line references.
3. **Execute Safely**: Implement remaining requirements ensuring all quality gates and build tests (`npm run build`) pass with code 0.
4. **Commit & Push**: Commit with clear descriptive messages and update the walkthrough log.
