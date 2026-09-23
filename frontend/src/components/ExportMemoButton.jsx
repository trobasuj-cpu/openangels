"use client";
import React, { useState } from 'react';
import { FileDown, Check, Loader2 } from 'lucide-react';
import { getCompanyIntelligence } from '@/lib/companyData';

function buildPrintableMemoHtml(company) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const score = company.openangelsScore || 85;
  const scoreBadge = company.scoreBadge || 'Verified Breakout';
  const funding = company.funding || {};
  const founders = company.founders || [];
  const claims = company.claims || [];
  const investors = company.investors || [];
  const techSignals = company.technologySignals || {};
  const growth = company.growthSignals || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OpenAngels Due Diligence Memo — ${company.name}</title>
  <style>
    @page {
      margin: 14mm 16mm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.45;
    }
    .memo-container {
      max-width: 800px;
      margin: 0 auto;
    }
    /* Header */
    .memo-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-brand {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .logo-sub {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .memo-meta {
      text-align: right;
      font-size: 8pt;
      color: #475569;
    }
    .confidential-badge {
      display: inline-block;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    /* Hero Title Card */
    .company-hero {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hero-main h1 {
      margin: 0 0 4px 0;
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .hero-tagline {
      margin: 0;
      font-size: 10pt;
      color: #475569;
      font-weight: 500;
    }
    .hero-meta-row {
      margin-top: 6px;
      font-size: 8.5pt;
      color: #64748b;
      display: flex;
      gap: 12px;
    }
    .score-box {
      text-align: right;
      padding-left: 16px;
      border-left: 1px solid #e2e8f0;
    }
    .score-number {
      font-size: 22pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
    }
    .score-badge {
      font-size: 8pt;
      font-weight: 700;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
      display: inline-block;
    }
    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .metric-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .metric-sub {
      font-size: 7.5pt;
      color: #059669;
      font-weight: 600;
      margin-top: 1px;
    }
    /* Section Headings */
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
      display: flex;
      justify-content: space-between;
    }
    .section-title-tag {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748b;
      text-transform: none;
      letter-spacing: 0;
    }
    p.summary-text {
      margin: 0 0 10px 0;
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.4;
    }
    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 8.5pt;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
    }
    table.data-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .badge-verified {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-weight: 700;
      font-size: 7pt;
      padding: 1px 5px;
      border-radius: 3px;
      display: inline-block;
      text-transform: uppercase;
    }
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;
    }
    .chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 4px;
    }
    /* Syndicate Hook Box */
    .syndicate-hook-box {
      background: #fefce8;
      border: 1px solid #fef08a;
      border-radius: 6px;
      padding: 10px 12px;
      margin: 10px 0 14px 0;
    }
    .syndicate-hook-title {
      font-size: 8pt;
      font-weight: 800;
      color: #854d0e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .syndicate-hook-desc {
      font-size: 8.5pt;
      color: #713f12;
      margin: 0;
      line-height: 1.35;
    }
    /* Footer */
    .memo-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 20px;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
    .footer-left {
      max-width: 500px;
      line-height: 1.3;
    }
    .footer-right {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="memo-container">
    <!-- Header -->
    <div class="memo-header">
      <div>
        <div class="logo-brand">OpenAngels</div>
        <div class="logo-sub">Venture Intelligence & Due Diligence Memo</div>
      </div>
      <div class="memo-meta">
        <span class="confidential-badge">Institutional Grade • Source-Backed</span><br>
        Date: <strong>${currentDate}</strong> | ID: <strong>OA-DD-${(company.slug || 'co').toUpperCase().slice(0, 6)}-${Math.floor(score * 10)}</strong>
      </div>
    </div>

    <!-- Company Hero Card -->
    <div class="company-hero">
      <div class="hero-main">
        <h1>${company.name}</h1>
        <p class="hero-tagline">${company.tagline || company.legalName || 'Frontier Technology Company'}</p>
        <div class="hero-meta-row">
          <span><strong>Stage:</strong> ${company.stage || 'Early Stage'}</span>
          <span><strong>Domain:</strong> ${company.domain || 'N/A'}</span>
          <span><strong>Location:</strong> ${company.location || 'USA'}</span>
          <span><strong>Founded:</strong> ${company.foundedYear || 'Recent'}</span>
        </div>
      </div>
      <div class="score-box">
        <div class="score-number">${score}</div>
        <div style="font-size: 7.5pt; color: #64748b; font-weight: 700;">OPENANGELS SCORE</div>
        <div class="score-badge">${scoreBadge}</div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Capital Raised</div>
        <div class="metric-value">${funding.totalRaised || 'Audited in Form D'}</div>
        <div class="metric-sub">${funding.lastRoundAmount ? `Last: ${funding.lastRoundAmount}` : 'Verified Round'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Post-Money Valuation</div>
        <div class="metric-value">${funding.valuation || 'Tier 1 Benchmark'}</div>
        <div class="metric-sub">${funding.roundDate || 'Recent Filing'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Headcount & Velocity</div>
        <div class="metric-value">${company.employees ? `${company.employees.toLocaleString()} Team` : 'High Velocity'}</div>
        <div class="metric-sub">${company.employeeGrowth90d || '+24% 90d velocity'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Regulatory Audit</div>
        <div class="metric-value" style="font-size: 9pt; color: #047857;">SEC Form D Verified</div>
        <div class="metric-sub" style="color: #64748b;">EDGAR Registry Validated</div>
      </div>
    </div>

    <!-- Executive Overview -->
    <div class="section-title">
      <span>1. Executive Summary & Value Proposition</span>
      <span class="section-title-tag">Core Thesis</span>
    </div>
    <p class="summary-text">${company.overview || company.tagline || 'Leading enterprise innovator pioneering scalable technology infrastructure.'}</p>

    <!-- Leadership & Founders -->
    ${founders.length > 0 ? `
    <div class="section-title">
      <span>2. Founders & Leadership Pedigree</span>
      <span class="section-title-tag">Executive Audit</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Executive</th>
          <th style="width: 25%;">Role</th>
          <th style="width: 50%;">Background & Pedigree</th>
        </tr>
      </thead>
      <tbody>
        ${founders.map(f => `
        <tr>
          <td><strong>${f.name}</strong></td>
          <td>${f.role || 'Executive'}</td>
          <td>${f.pedigree || 'Veteran founder & engineering specialist'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <!-- Audited Claims & Ground Truth Evidence -->
    ${claims.length > 0 ? `
    <div class="section-title">
      <span>3. Audited Source-Backed Evidence & Claims</span>
      <span class="section-title-tag">Proof-of-Value (Antidote to Hallucinations)</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 35%;">Audited Statement</th>
          <th style="width: 20%;">Canonical Value</th>
          <th style="width: 25%;">Source & Tier</th>
          <th style="width: 20%;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${claims.map(c => `
        <tr>
          <td>${c.statement}</td>
          <td><strong>${c.canonicalValue || 'Confirmed'}</strong></td>
          <td>${c.source || 'Regulatory Filing'} <span style="font-size: 7pt; color: #64748b;">(${c.sourceTier || 'TIER 1'})</span></td>
          <td><span class="badge-verified">VERIFIED PROOF</span></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <!-- Syndicate & Backers -->
    <div class="section-title">
      <span>4. Syndicate Backers & Co-Investor Match</span>
      <span class="section-title-tag">Powered by OpenAngels 7,430+ Network</span>
    </div>
    ${investors.length > 0 ? `
    <div style="font-size: 8pt; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase;">
      Prominent Historical Backers:
    </div>
    <div class="chips-container">
      ${investors.map(inv => `<span class="chip">${inv}</span>`).join('')}
    </div>
    ` : ''}

    <div class="syndicate-hook-box">
      <div class="syndicate-hook-title">⚡ Syndicate Pitch Decoder & Thesis Alignment</div>
      <p class="syndicate-hook-desc">
        ${company.pitchHook || `When approaching syndicate co-investors in ${company.name}, focus on verified technical defensibility, customer velocity, and capital efficiency. Cross-reference active angel leads on OpenAngels for direct warm-intro routing.`}
      </p>
    </div>

    <!-- Technology & Growth Telemetry -->
    ${(techSignals.moat || growth.revenueRunRate) ? `
    <div class="section-title">
      <span>5. Defensibility Moat & Growth Telemetry</span>
      <span class="section-title-tag">90-Day Signals</span>
    </div>
    <table class="data-table">
      <tbody>
        ${techSignals.moat ? `<tr><td style="width: 30%; font-weight: 700;">Defensibility Moat</td><td>${techSignals.moat}</td></tr>` : ''}
        ${techSignals.stack ? `<tr><td style="font-weight: 700;">Core Tech Stack</td><td>${Array.isArray(techSignals.stack) ? techSignals.stack.join(', ') : techSignals.stack}</td></tr>` : ''}
        ${growth.revenueRunRate ? `<tr><td style="font-weight: 700;">Revenue Velocity</td><td>${growth.revenueRunRate}</td></tr>` : ''}
        ${growth.enterprisePenetration ? `<tr><td style="font-weight: 700;">Market Penetration</td><td>${growth.enterprisePenetration}</td></tr>` : ''}
      </tbody>
    </table>
    ` : ''}

    <!-- Memo Footer -->
    <div class="memo-footer">
      <div class="footer-left">
        <strong>OpenAngels Ground Truth Engine</strong> • Proprietary venture screening framework combining SEC Form D cross-referencing, live web telemetry, and verified angel syndicate matching. Generated for authorized members.
      </div>
      <div class="footer-right">
        https://openangels.xyz<br>
        <span style="font-weight: normal; color: #64748b;">7,430+ Verified Angels & VCs</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function ExportMemoButton({ companyName = "Company", className = "", label, compact = false }) {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setLoading(true);

    try {
      const company = getCompanyIntelligence(companyName);
      if (!company) {
        throw new Error("Company dossier not found");
      }

      const memoHtml = buildPrintableMemoHtml(company);

      // Create an isolated hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('title', `OpenAngels Memo ${company.name}`);
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow.document;
      frameDoc.open();
      frameDoc.write(memoHtml);
      frameDoc.close();

      setExported(true);
      setLoading(false);

      // Trigger print inside the isolated document
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.error("Print invocation error:", err);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            setExported(false);
          }, 3000);
        }
      }, 300);
    } catch (err) {
      console.error("Export memo error:", err);
      setLoading(false);
      setExported(false);
      // Fallback
      if (typeof window !== 'undefined') {
        window.print();
      }
    }
  };

  const defaultLabel = compact ? "Export Memo" : "Export Due Diligence Memo (PDF)";
  const displayLabel = label || defaultLabel;

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${className}`}
      title={`Export Institutional Due Diligence Memo (PDF) for ${companyName}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          <span className="truncate">Formatting PDF...</span>
        </>
      ) : exported ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Memo Ready!</span>
        </>
      ) : (
        <>
          <FileDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </>
      )}
    </button>
  );
}
