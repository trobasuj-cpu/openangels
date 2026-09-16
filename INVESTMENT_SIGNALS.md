# OpenAngels Investment Signals Engine (DAY 8 Standard)

## 1. Architectural Mission & Philosophy

The **OpenAngels Investment Signals Engine** transforms raw, distributed market data into **audited, high-confidence investment intelligence**. 

Traditional angel tools display passive snapshots (company name, static valuation, generic description). OpenAngels Day 8 elevates this to an active decision engine by detecting and auditing empirical changes across **10 signal classes**.

### The Anti-Fluff Standard
OpenAngels explicitly bans ungrounded hype such as *"AI считает компанию перспективной"* or subjective sentiment scores without verifiable proof. Every signal rendered in OpenAngels must satisfy our 6-point verification standard and produce clear, quantified executive thesis statements:

> **"OpenAngels detected 5 independent growth signals during the last 90 days."**

---

## 2. Taxonomy of Investment Signals (10 Canonical Classes)

| Signal Class | Category | Primary Focus | Empirical Triggers |
| :--- | :--- | :--- | :--- |
| `HIRING_ACCELERATION` | Talent | Headcount velocity | 90-day employee net delta, key AI/Eng leadership recruitment |
| `FUNDING` | Capital | Capital infusion | Priced equity rounds, valuation markups, SEC Form D confirmations |
| `NEW_INVESTOR` | Capital | Syndicate strength | Tier-1 VC lead checks, super-angel participation, board seats |
| `PRODUCT_LAUNCH` | Product | Product breakthrough | Major version launches, agentic/enterprise API releases |
| `MARKET_EXPANSION` | Alliances | Global footprint | Geographic expansion (EU, APAC), regulated enterprise tiers |
| `FOUNDER_CHANGE` | Talent | Executive pedigree | C-suite additions, notable spin-out founders, deeptech pedigree |
| `CUSTOMER_SIGNAL` | Product | Commercial traction | Fortune 500 enterprise rollouts, paid customer ARR milestones |
| `TECH_ACTIVITY` | Product | Technical moat | Proprietary foundation model weights, benchmarks, patent filings |
| `PARTNERSHIP` | Alliances | Strategic alliances | Hyperscaler compute pacts (NVIDIA, Microsoft, AWS), OEM channels |
| `ACQUISITION` | Alliances | M&A & Consolidation | Strategic acquisitions, team acqui-hires, IP portfolio buyouts |

---

## 3. The 6-Point Audit Schema

Every individual signal object within OpenAngels is guaranteed to provide the following six canonical fields:

```json
{
  "type": "HIRING_ACCELERATION",
  "name": "Engineering & Research Team Headcount Doubling",
  "evidence": "Full-time technical staff increased from 1,200 to 2,500+ employees (+108% net delta in 90 days); 48 new AI safety and infrastructure vacancies posted.",
  "date": "2026-03-10",
  "source": "LinkedIn Talent Insights & SEC Filings (Tier 1)",
  "confidence": 96,
  "explanation": "Massive technical team expansion signals aggressive infrastructure scaling and rapid commercialization ahead of next-generation model rollouts."
}
```

### Schema Field Definitions:
1. **`name`**: Concise, unambiguous title describing the specific factual occurrence.
2. **`evidence`**: Quantified, empirical proof including raw deltas, percentages, and hard verifiable metrics.
3. **`date`**: ISO timestamp (YYYY-MM-DD) confirming the observation or publication date.
4. **`source`**: Primary source citation with source reliability tier (Tier 1: SEC/Regulatory, Tier 2: Official Press/Financial, Tier 3: Verified Syndicate).
5. **`confidence`**: Objective confidence index (0-100%) calculated from source verification score and corroborating data points.
6. **`explanation`**: Investor decision rationale explaining how this signal impacts unit economics, competitive moat, defensibility, or future valuation upside.

---

## 4. Aggregation Window & Signal Strength Scoring

The engine aggregates signals across a rolling **90-day observation window**.

- **Summary Formulation:**
  `OpenAngels detected {N} independent growth signals during the last {windowDays} days.`
- **Composite Signal Strength:**
  - **`VERY HIGH`**: >= 4 independent signals AND aggregate confidence >= 90%
  - **`HIGH`**: >= 3 independent signals OR aggregate confidence >= 80%
  - **`MODERATE`**: 1-2 independent signals OR aggregate confidence >= 70%
  - **`NEUTRAL / OBSERVING`**: 0 verified signals in active window

---

## 5. Integration Across OpenAngels Surfaces

The Day 8 Investment Signals Engine is integrated seamlessly across all OpenAngels touchpoints without regressions:

1. **Python Pipeline Core (`data_pipeline/investment_signals_engine.py`)**:
   - `InvestmentSignalsEngine`: Taxonomy mapping, 90-day window aggregation, dynamic generation for any arbitrary company based on headcount and cap-table data.
2. **Profile Intelligence Aggregator (`data_pipeline/company_intelligence_engine.py`)**:
   - Enriches company profiles with `investment_signals` section containing audited signals, strength badges, and summary statements.
3. **Frontend Intelligence Engine (`frontend/src/lib/companyData.js`)**:
   - Curated high-fidelity portfolios for major companies (OpenAI, Uber, Stripe, Perplexity, Facebook, LinkedIn, Twitter, Airbnb, Dropbox).
   - Dynamic signal generator fallback for long-tail portfolio companies.
4. **Standalone SSR Pages (`frontend/src/app/company/[slug]/page.jsx`)**:
   - Dedicated **Investment Signals & Growth Radar (DAY 8 Standard)** visual section with summary banner, strength pill, confidence gauge, and 2-column cards featuring Audited Evidence and Investor Decision Rationale.
5. **Interactive Modal Dossier (`frontend/src/components/CompanyProfileModal.jsx`)**:
   - Dynamic **Investment Signals** tab with category filter buttons (`All`, `Capital & Funding`, `Talent Velocity`, `Product & Moat`, `Alliances`).
   - Executive Overview preview teaser linking directly into the detailed signals view.

---

## 6. Zero Regressions Guarantee

All preexisting capabilities from Days 1 through 7 remain completely intact and active:
- Instant multi-faceted search and syndicate co-investor graph.
- SEC Form D lineage and Day 4 verified claim formula.
- Complete Day 7 Temporal Timeline & Change Detection Radar.
- Preserved SEO routing, crawlable semantic URLs, and Google Search Console indexing parity.
