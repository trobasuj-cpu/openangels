# OpenAngels Change Detection & Company Timeline Standard (DAY 7)

## 1. Executive Summary & Strategic Value

> **"Static intelligence shows where a company is today. Change detection reveals where it will be tomorrow."**

A company with 27 employees looks unremarkable in isolation. But a company that had **15 employees 30 days ago and 27 employees today** (+80% velocity) is an aggressive, blitzscaling breakout signal. 

OpenAngels DAY 7 introduces the **Change Detection Engine** and **Company Timeline Radar**, tracking temporal differentials across:
- **Headcount Velocity** (hiring acceleration, job requisition spikes)
- **Capital & Valuation Trajectory** (funding rounds, valuation step-ups, cap table expansion)
- **Product & Technology Velocity** (breakthrough releases, architecture pivots)
- **Market & Ecosystem Alliances** (strategic distribution partnerships, M&A)
- **Customer & Revenue Proof** (milestone logos, profitability inflection points)

---

## 2. Temporal Signal Taxonomy (13 Signal Classes)

The Change Detection Engine categorizes observed temporal differentials into 13 standardized venture signals:

| Signal Type | Visual Badge | Severity | Primary Trigger Condition |
|---|---|---|---|
| `HIRING_ACCELERATION` | 🔥 HIRING ACCELERATION | HIGH | Headcount growth $\ge +20\%$ in $\le 90$ days |
| `VALUATION_STEP_UP` | 💎 VALUATION STEP-UP | HIGH | Valuation increase $\ge +30\%$ between rounds |
| `NEW_FUNDING_ROUND` | 💰 NEW FUNDING ROUND | HIGH | Capital injection closed and filed on SEC Form D |
| `SYNDICATE_EXPANSION` | 🌐 SYNDICATE EXPANSION | MEDIUM | New prominent angel or Tier 1 VC joins cap table |
| `PRODUCT_BREAKTHROUGH` | 🚀 PRODUCT BREAKTHROUGH | HIGH | Major frontier model, core SDK, or platform release |
| `STRATEGIC_ALLIANCE` | 🤝 STRATEGIC ALLIANCE | HIGH | OS-level OEM deal or commercial distribution pact |
| `CUSTOMER_LOGO_WIN` | 🎯 CUSTOMER BREAKTHROUGH | MEDIUM | Flagship enterprise logo or revenue milestone |
| `ACQUISITION_MA` | 🏆 ACQUISITION M&A | CRITICAL | Outright company acquisition or major asset absorption |
| `FOUNDER_ADDITION` | 👤 FOUNDER ADDITION | HIGH | New co-founder or executive officer joining leadership |
| `JOB_OPENINGS_SPIKE` | 📈 OPENINGS SURGE | MEDIUM | Active open requisitions jump by $\ge +50\%$ |
| `NEW_MARKET_EXPANSION` | 🌍 MARKET EXPANSION | MEDIUM | Launching into new jurisdiction or vertical category |
| `WEBSITE_REFRESH` | 🌐 POSITIONING PIVOT | LOW | Core value proposition or domain rebranding |
| `TEAM_RESTRUCTURING` | 🔄 TEAM PIVOT | MEDIUM | Reorganization of engineering or go-to-market teams |

---

## 3. Mathematical Velocity Formulas

### 3.1 Headcount Velocity ($
u_{\text{headcount}}$)

Given two observations at times $t_1$ and $t_2$ (with $\Delta t = t_2 - t_1$ in days):

$$\nu_{\text{headcount}} = \left( \frac{H(t_2) - H(t_1)}{H(t_1)} \right) \times \left( \frac{90}{\Delta t} \right)$$

- **Hypergrowth Blitzscale**: $\Delta H \ge +100\%$ annualized with $H(t_2) \ge 50$.
- **Hiring Acceleration**: $\Delta H \ge +20\%$ in $\le 90$ days.
- **Organic Steady Growth**: $0\% < \Delta H < +20\%$.

### 3.2 Valuation Step-Up Factor ($S_{\text{val}}$)

$$S_{\text{val}} = \frac{V_{\text{post}}(R_n)}{V_{\text{post}}(R_{n-1})}$$

Where $V_{\text{post}}$ is post-money valuation. A step-up factor $S_{\text{val}} \ge 1.5$ triggered within 24 months represents top-quartile venture momentum.

---

## 4. Structured Temporal Delta Schema

Every event on the timeline preserves both states and the audited differential:

```json
{
  "id": "oai-evt-5",
  "date": "2024-10-02",
  "relative_time": "Oct 2024",
  "category": "funding",
  "title": "Closed $6.6B Financing at $157B Post-Money Valuation",
  "description": "Thrive Capital led historic venture round alongside Microsoft, Nvidia, SoftBank, and Fidelity.",
  "delta": {
    "before": "$11.3B Total Raised ($86B Valuation)",
    "after": "$17.9B Total Raised ($157B Valuation)",
    "change": "+$6.6B capital (+82.5% valuation leap)"
  },
  "signal_type": "VALUATION_STEP_UP",
  "signal_badge": "💎 VALUATION STEP-UP",
  "signal_color": "#10B981",
  "signal_severity": "HIGH",
  "evidence_source": "SEC Form D & Thrive Capital Announcement",
  "score_impact": "+3.8"
}
```

---

## 5. Multi-Surface Architecture

1. **Python Engine (`data_pipeline/change_detection_engine.py`)**:
   - Computes temporal velocity differentials between any two discrete observations.
   - Provides curated historical timelines for top ventures (OpenAI, Facebook, LinkedIn, Twitter, Uber, Airbnb).
   - Generates deterministic dynamic timelines for uncurated companies from cap table and headcount telemetry.

2. **Intelligence Integration (`data_pipeline/company_intelligence_engine.py`)**:
   - Injects `timeline` array and `velocity_signals` directly into executive company dossiers.

3. **Frontend Resolver (`frontend/src/lib/companyData.js`)**:
   - Enriches all 9 curated dossiers with comprehensive event histories and deltas.
   - Implements `generateDynamicTimeline` fallback for unknown companies searched in the UI.

4. **Standalone SSR Page (`frontend/src/app/company/[slug]/page.jsx`)**:
   - Dedicated "Company Timeline & Change Detection Radar" section.
   - Vertical timeline spine with colored node dots, signal badges, Before/After delta cards, and audited source citations.
   - Pre-rendered at build/SSR time for 100% Googlebot crawlability and indexing.

5. **Interactive Modal (`frontend/src/components/CompanyProfileModal.jsx`)**:
   - Tab 4: "Timeline & Changes (DAY 7)" with real-time event counter badge.
   - Interactive signal category filtering (All, Hiring, Funding, Products, Alliances, Customers).
   - Seamless cross-navigation to angel syndicate profiles via native URLs.
