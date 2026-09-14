# OpenAngels Company Intelligence Standard (DAY 6)

## 1. Executive Summary & Strategic Architecture

OpenAngels Company Intelligence is designed around a fundamental question:
> **"Why should a founder or investor care about opening this specific company page?"**

Rather than creating a bloated, low-signal catalog of random early-stage startups scraped from the open web (which would dilute database quality and create duplicate maintenance overhead), OpenAngels implements **Option 1: Portfolio & Syndicate Intelligence Engine**.

### Core Tenet: The Founder Pitch & Syndicate Decoder
1. **Scoped to Backed Companies**: Profiles are compiled for companies present in the portfolios of our **5,465 curated angel and syndicate investors** (`portfolio` in `investors` table) and RSS venture announcements.
2. **Decision-Centric, Not a Spreadsheet**: The interface avoids massive tabular dumps. It highlights 4 primary decision KPIs (Valuation/Capital, Talent Velocity, Tech Moat, and Traction Radar), leadership pedigrees, and verified claims.
3. **Syndicate Linkage**: Each company dossier connects directly back to OpenAngels' 5,465 angel profiles, showing founders which co-investors participated in the deal and providing actionable pitch recommendations.

---

## 2. The 18-Point Intelligence Dossier

Each company intelligence profile contains 18 structured executive data points:

| # | Data Point | Description | Example (OpenAI) |
|---|---|---|---|
| 1 | **Company Overview** | Executive summary of core mission, product, and corporate structure | *"AI research and deployment company behind ChatGPT, GPT-4o..."* |
| 2 | **Founders & Pedigree** | Co-founders, roles, background, and previous affiliations | *Sam Altman (Ex-YC President), Greg Brockman (Ex-Stripe CTO)* |
| 3 | **Location & Country** | Primary headquarters and corporate jurisdiction | *San Francisco, CA, USA* |
| 4 | **Founding Date** | Incorporation / establishment year | *2015* |
| 5 | **Funding & Valuation** | Total capital raised, latest round type, amount, post-money valuation | *$17.9B raised, $6.6B round @ $157B Post-Money* |
| 6 | **Investors & Syndicate** | Cap table participants and syndicate co-investors | *Microsoft, Thrive Capital, Khosla Ventures, Founders Fund...* |
| 7 | **Products** | Active commercial products and API platforms | *ChatGPT Enterprise, GPT-4o API, o1 Reasoning Engine, Sora* |
| 8 | **Customers & Partners** | Marquee enterprise clients and pilot design partners | *Apple, Morgan Stanley, PwC, Moderna, 3M+ developers* |
| 9 | **Employees** | Current full-time employee headcount | *1,750 employees* |
| 10 | **Hiring Velocity** | 90-day team growth rate and open priority positions | *+28% headcount velocity, 42 open roles* |
| 11 | **Technology Moat** | Proprietary algorithms, IP, architecture, compute scale | *Proprietary RLHF/RLVR, compute scaling law optimizations* |
| 12 | **Growth Signals** | Revenue run-rate (ARR), active users, market penetration | *$3.7B+ ARR, 250M+ weekly active users, 92% Fortune 500* |
| 13 | **Recent Events** | Milestones, major funding events, model launches | *Oct 2024: $6.6B Financing; Sep 2024: OpenAI o1 Launch* |
| 14 | **Sources** | Categorized Tier 1–Tier 4 evidence origins | *Tier 1 (SEC Form D), Tier 2 (TechCrunch, Crunchbase)* |
| 15 | **Evidence Layer** | Direct audit trail linking statements to verified filings | *SEC Form D filing #0001994821 and Thrive Capital announcement* |
| 16 | **Conflicts & Variance** | Detection of conflicting press reports or disputed numbers | *e.g., Conflicting valuation reports flagged with delta percentage* |
| 17 | **Confidence Score** | Statistical certainty index for company claims | *96% - 99%* |
| 18 | **OpenAngels Score** | Algorithmic 0–100 executive score | *98.8 / 100 (Tier 1 Decacorn Velocity)* |

---

## 3. OpenAngels Company Score (0–100) Methodology

The **OpenAngels Company Score** is an objective, multi-factor index measuring venture trajectory, talent density, technical defensibility, and audit integrity:

$$\text{OpenAngels Score} = 0.25 \times S_{\text{Growth}} + 0.25 \times S_{\text{Team}} + 0.20 \times S_{\text{Moat}} + 0.15 \times S_{\text{CapTable}} + 0.15 \times S_{\text{Integrity}}$$

### Score Breakdown
1. **Growth Velocity (25%)**:
   - ARR scale (>$100M: 95+, $10M–$100M: 85–94, $1M–$10M: 75–84).
   - Headcount growth rate (+20% in 90 days indicates top-decile expansion).
   - Tier-1 enterprise customer adoption.
2. **Team & Founder Pedigree (25%)**:
   - Repeat founders (prior exits, YC alumni, ex-FAANG technical leads).
   - Technical leadership depth (PhD, elite research lab tenure).
3. **Technology Defensibility & Moat (20%)**:
   - Proprietary IP, custom training infrastructure, high switching costs, developer ecosystem gravity.
   - GitHub open-source cadence and repository engagement.
4. **Cap Table & Syndicate Quality (15%)**:
   - Lead investor prestige (Thrive, Sequoia, Founders Fund, Khosla, Benchmark, Bessemer).
   - Presence of top angels and strategic corporate partners (Microsoft, Nvidia).
5. **Evidence & Lineage Integrity (15%)**:
   - Based on Day 4 Claim + Evidence Engine:
     - Tier 1 SEC/government verification gives maximum integrity score (+100).
     - Active unresolved conflicts deduct 25 points.
     - Unverified claims are capped at 70 points.

### Score Badges
- **95.0 – 100.0**: `Tier 1 Decacorn Velocity`
- **90.0 – 94.9**: `Decacorn / Unicorn Flight`
- **80.0 – 89.9**: `High Velocity Growth`
- **70.0 – 79.9**: `Promising Syndicate Deal`
- **< 70.0**: `Early Stage Seed`

---

## 4. Claim + Evidence Standard Integration (Day 4)

Company intelligence builds directly upon the Day 4 Claim + Evidence Engine:

```
CLAIM ↓ VALUE ↓ SOURCE ↓ EVIDENCE ↓ DATE ↓ CONFIDENCE ↓ STATUS
```

Example Claim Object:
```json
{
  "statement": "OpenAI raised $6.6B in October 2024",
  "canonicalValue": "$6.6B",
  "source": "SEC Form D & Thrive Capital Press Release",
  "sourceTier": "TIER 1",
  "evidence": "SEC Form D filing and official lead investor confirmation at $157B valuation.",
  "date": "2024-10-02",
  "confidence": 0.99,
  "status": "VERIFIED"
}
```

If multiple sources disagree on a valuation or funding amount, the engine marks the status as `CONFLICT`, calculates the numerical variance, and warns the user in the UI.

---

## 5. System Components & File Architecture

1. **Python Intelligence Engine**:
   - File: `data_pipeline/company_intelligence_engine.py`
   - Role: Compiles 18-point dossiers from database records, runs `calculate_openangels_company_score()`, integrates with Day 4 `claim_evidence_engine.py`, and extracts portfolio startups.
2. **Frontend Data & Resolution Engine**:
   - File: `frontend/src/lib/companyData.js`
   - Role: Provides `getCompanyIntelligence(nameOrSlug)` for curated industry leaders (OpenAI, Stripe, Anthropic, Perplexity) and dynamic synthesis for any arbitrary portfolio company across all 5,465 angel investors.
3. **Interactive Modal Component**:
   - File: `frontend/src/components/CompanyProfileModal.jsx`
   - Role: High-density modal with Hero header, Score gauge, 4 Decision KPI cards, Founders showcase, Verified Claims table, Syndicate Backers, and Founder Pitch Hook.
4. **Clickable Portfolio Badges**:
   - File: `frontend/src/components/InvestorProfileModal.jsx`
   - Role: In the investor's dossier, under "Notable Portfolio & Backed Deals", each company badge is now an interactive button that launches the Company Intelligence Profile modal.
5. **Standalone Shareable Route (SSR & SEO)**:
   - File: `frontend/src/app/company/[slug]/page.jsx`
   - Role: Server-rendered company intelligence pages with Schema.org `Organization` structured data, OpenGraph tags, and direct search links to syndicate co-investors in the directory.

---

## 6. Backward Compatibility & Database Safety

- **No Schema Mutations**: The `investors`, `investor_evidence`, and `claims` tables remain untouched.
- **Batch Processing Unchanged**: `run_master.bat` and all existing update pipelines continue operating identically.
- **Pure Additive Architecture**: Zero breaking changes to existing investor profiles, search filters, or CRM workflows.
