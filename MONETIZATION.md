# OpenAngels — Monetization Architecture & Pricing Strategy

> **Core Philosophy:**  
> Zero fake pricing tiers. Zero unbuilt enterprise promises.  
> We monetize features that exist, work in production, and solve painful economic bottlenecks.

---

## The Dual-Tier Revenue Model

```
+------------------------------------+------------------------------------+
|         TIER 1: FOUNDER PASS       |       TIER 2: INVESTOR PRO         |
|         $49 (One-Time Lifetime)     |       $19 - $29 / Month            |
+------------------------------------+------------------------------------+
| Target: Pre-Seed & Seed Founders   | Target: Scouts, Solo GPs, Analysts |
| Goal: Close angel round fast       | Goal: Screen deals & write IC memos|
| Status: ACTIVE IN PRODUCTION       | Status: ACTIVE IN PRODUCTION       |
+------------------------------------+------------------------------------+
| • Unlimited 4,050+ Angel Contacts  | • Full 90-Day Growth Signals Radar |
| • Direct Personal Verified Emails  | • SEC Form D Claim Proof Lineage   |
| • AI Tailored Pitch Email Drafter  | • One-Click Due Diligence PDF Memos|
| • Integrated 5-Stage CRM Pipeline  | • Valuation Step-Up & Team Velocity|
| • Lifetime Updates & New Additions | • Unlimited Institutional Exports  |
+------------------------------------+------------------------------------+
```

---

## 1. Tier 1: Founder Lifetime Pass ($49 One-Time)

### The Economic Thesis
- **Why One-Time?** Pre-revenue founders suffer from "SaaS exhaustion." They will not commit to a $99/month recurring subscription when they are bootstrapping with personal savings. A $49 one-time fee gives them lifetime peace of mind and drives high conversion.
- **Payment Gateway:** Gumroad checkout embedded natively via `GumroadIframeModal.jsx`.
- **Launch Incentives:** Product Hunt discount promo code (`PHLAUNCH`) providing 30% off ($34.30).
- **Core Value Delivered:**
  1. Instant unlock of all 4,050+ angel contacts (SMTP/DNS validated emails, LinkedIn, Twitter/X).
  2. Unlimited AI pitch draft generations configured with real investment thesis hooks.
  3. Persistent CRM pipeline with stage progression (Contacted, Replied, Meeting Booked, Committed).

---

## 2. Tier 2: Investor / Scout Pro ($19 – $29/mo or $199/yr)

### The Economic Thesis
- **Why Recurring?** Investors, scouts, and VC associates use tools continuously to monitor portfolio candidates and track competitor syndicates. A $19–$29/mo subscription is easily expensed as business diligence software.
- **Core Value Delivered:**
  1. **Temporal Growth Radar:** Access to all 90-day growth signals (headcount velocity, valuation step-ups, new syndicate backers, product launches).
  2. **SEC Form D Lineage:** Regulatory verification trails with 0.95+ confidence proof and exact filing cross-references.
  3. **One-Click Institutional Due Diligence Memo Export:** High-fidelity print-ready executive memos formatted for partner meetings and Investment Committees.

---

## 3. Unit Economics & Unit Margins

| Metric | Founder Lifetime ($49) | Investor Pro ($24/mo) |
| :--- | :--- | :--- |
| **Gross Revenue** | $49.00 | $288.00 / year |
| **Payment Processing (Gumroad / Stripe)** | ~$4.90 (10%) | ~$1.20 / mo (3.5% + $0.30) |
| **AI Generation Cost (Pitch & Memo)** | ~$0.15 (cached Gemini Flash) | ~$0.30 / mo |
| **Data Enrichment / Verification Cost** | ~$0.40 | ~$0.80 / mo |
| **Net Gross Margin** | **~88%** | **~92%** |

---

## 4. Expansion Vector: Institutional API & Syndicate Feed (Future Roadmap)

- **Syndicate SPV Diligence Package:** Bulk export of multi-company cap tables and regulatory conflict scans.
- **Enterprise Webhook API:** Direct streaming of new Form D filings and headcount anomalies directly into Slack / Notion / Affinity CRM.
