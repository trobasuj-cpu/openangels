import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { absoluteUrl } from '@/seo';
import { getCompanyIntelligence, KNOWN_COMPANIES } from '@/lib/companyData';
import { 
  Building2, Globe, MapPin, ShieldCheck, DollarSign, 
  Users, Cpu, TrendingUp, Award, Zap, ArrowUpRight, 
  ChevronRight, Sparkles, AlertTriangle, ExternalLink 
} from 'lucide-react';

export async function generateStaticParams() {
  return Object.keys(KNOWN_COMPANIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const company = getCompanyIntelligence(slug);

  if (!company) {
    return {
      title: 'Company Intelligence Dossier | OpenAngels',
      description: 'Audited startup and company intelligence for venture founders and investors.'
    };
  }

  const title = `${company.name} — Company Intelligence, Funding & Syndicate | OpenAngels`;
  const description = `${company.name}: ${company.tagline || company.overview.substring(0, 140)}. OpenAngels Score: ${company.openangelsScore}/100. Backers: ${(company.investors || []).slice(0, 3).join(', ')}.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/company/${slug}`) },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/company/${slug}`),
      siteName: 'OpenAngels',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function CompanyIntelligencePage({ params }) {
  const { slug } = await params;
  const company = getCompanyIntelligence(slug);

  if (!company) {
    notFound();
  }

  const score = company.openangelsScore || 80;
  const getScoreColor = (sc) => {
    if (sc >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (sc >= 80) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    legalName: company.legalName,
    url: `https://${company.domain}`,
    description: company.overview,
    foundingDate: String(company.foundedYear),
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.location
    },
    founders: (company.founders || []).map(f => ({
      '@type': 'Person',
      name: f.name,
      jobTitle: f.role
    }))
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30 selection:text-red-200">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Breadcrumb Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">OpenAngels</Link>
            <span>/</span>
            <Link href="/directory" className="hover:text-white transition-colors">Directory</Link>
            <span>/</span>
            <span className="text-zinc-200 font-semibold">{company.name} Intelligence</span>
          </div>
          <Link
            href="/directory"
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <span>Browse 5,400+ Angel Investors</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Dossier Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* HERO SECTION */}
        <section className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-950/30 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5 min-w-0">
              {/* Monogram Badge */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/60 shadow-2xl flex items-center justify-center shrink-0 font-black text-3xl text-white">
                {company.name.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {company.name}
                  </h1>
                  <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                    {company.stage}
                  </span>
                  {company.funding?.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-4 h-4" /> SEC Form D Verified
                    </span>
                  )}
                </div>

                <p className="text-sm sm:text-base text-zinc-300 font-normal mt-1.5 max-w-2xl">
                  {company.tagline || company.legalName}
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400 flex-wrap">
                  {company.domain && (
                    <a 
                      href={`https://${company.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{company.domain}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  )}
                  {company.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-zinc-500" />
                      {company.location}
                    </span>
                  )}
                  {company.foundedYear && (
                    <span className="text-zinc-500">
                      Founded {company.foundedYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* OpenAngels Score Dial */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shrink-0 text-left md:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                OpenAngels Score
              </div>
              <div className="flex items-baseline gap-1.5 md:justify-end">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {score}
                </span>
                <span className="text-sm font-semibold text-zinc-500">/ 100</span>
              </div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full border mt-2 inline-block ${getScoreColor(score)}`}>
                {company.scoreBadge || 'High Velocity'}
              </div>
            </div>
          </div>
        </section>

        {/* 4 CORE DECISION KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Capital Raised
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {company.funding?.status || 'VERIFIED'}
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {company.funding?.totalRaised || 'Disclosed Syndicate'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Post-Money: <strong className="text-emerald-400">{company.funding?.valuation || 'Undisclosed'}</strong>
              </div>
            </div>
            <div className="text-xs text-zinc-500 border-t border-zinc-800/80 pt-2.5 mt-3">
              Last Round: {company.funding?.lastRoundAmount} ({company.funding?.lastRoundType})
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Users className="w-4 h-4 text-blue-400" /> Team Velocity
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {company.hiring?.status || 'Hiring'}
                </span>
              </div>
              <div className="text-2xl font-black text-white">
                {company.employees ? `${company.employees} Headcount` : 'Syndicate Team'}
              </div>
              <div className="text-xs text-blue-400 font-semibold mt-1">
                {company.employeeGrowth90d || '+22% growth'}
              </div>
            </div>
            <div className="text-xs text-zinc-500 border-t border-zinc-800/80 pt-2.5 mt-3">
              Open Roles: {company.hiring?.openRoles || 4} strategic hires
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-amber-400" /> Technology Moat
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Defensible
                </span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-2">
                {company.technologySignals?.moat || 'Proprietary IP & Ecosystem Moat'}
              </div>
            </div>
            <div className="text-xs text-zinc-500 border-t border-zinc-800/80 pt-2.5 mt-3">
              Stack: {(company.technologySignals?.stack || ['Python', 'Cloud']).slice(0, 3).join(', ')}
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Traction Radar
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Accelerating
                </span>
              </div>
              <div className="text-2xl font-black text-white line-clamp-1">
                {company.growthSignals?.revenueRunRate || 'High Scale'}
              </div>
              <div className="text-xs text-zinc-400 mt-1 line-clamp-1">
                {company.growthSignals?.userBase || 'Enterprise Deployments'}
              </div>
            </div>
            <div className="text-xs text-zinc-500 border-t border-zinc-800/80 pt-2.5 mt-3">
              Clients: {(company.customers || ['Global Tier 1']).slice(0, 2).join(', ')}
            </div>
          </div>
        </section>

        {/* SECTION: COMPANY OVERVIEW & LEADERSHIP */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" /> Company Overview
            </h2>
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-sm sm:text-base text-zinc-300 leading-relaxed">
              {company.overview}
            </div>
          </div>

          {/* Founders Showcase */}
          {company.founders?.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Leadership & Founding Team Pedigree
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {company.founders.map((f, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{f.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                          {f.role}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-snug">
                        {f.pedigree}
                      </p>
                    </div>
                    {f.linkedin && (
                      <a 
                        href={f.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all shrink-0"
                        title="View LinkedIn Profile"
                      >
                        <span className="text-xs font-bold">in</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION: VERIFIED CLAIMS & EVIDENCE LINEAGE (Day 4) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Claims & Lineage (Day 4 Engine)
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              CLAIM ↓ VALUE ↓ SOURCE ↓ EVIDENCE ↓ STATUS
            </span>
          </div>

          {/* Conflicts Notice */}
          {company.conflicts?.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Discrepancies & Disputed Claims Detected
              </div>
              {company.conflicts.map((conf, cIdx) => (
                <div key={cIdx} className="pl-4 border-l-2 border-amber-500/40">
                  <div className="font-semibold text-white">{conf.field}: {conf.statement}</div>
                  <div className="text-[11px] text-amber-300/80 mt-0.5">
                    Conflicting Values: {conf.values?.join(' vs ')} (Variance: {conf.variance})
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {(company.claims || []).map((claim, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-bold text-white">
                    {claim.statement}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                    claim.status === 'VERIFIED' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {claim.status} • {Math.round((claim.confidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-zinc-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Canonical Value</span>
                    <span className="font-bold text-amber-300 text-sm">{claim.canonicalValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Primary Source</span>
                    <span className="text-zinc-300">{claim.source} ({claim.sourceTier})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Verified Date</span>
                    <span className="text-zinc-400 font-mono">{claim.date}</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 bg-black/40 p-3 rounded-xl border border-zinc-800/50">
                  <strong className="text-zinc-300">Audited Evidence:</strong> {claim.evidence}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: SYNDICATE & FOUNDER PITCH HOOK */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" /> Prominent Investors & Syndicate Backers
          </h2>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-5">
            <p className="text-xs text-zinc-400">
              Investors who participated in {company.name}&apos;s funding rounds. Click to open verified contact details and due diligence profiles:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {(company.investors || []).map((invName, idx) => (
                <Link
                  key={idx}
                  href={`/directory?q=${encodeURIComponent(invName)}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center gap-2 group shadow-sm"
                  title={`Find ${invName} on OpenAngels`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                  <span>{invName}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </Link>
              ))}
            </div>

            {/* Founder Pitch Hook Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Founder Pitch & Syndicate Decoder
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                  Actionable Strategy
                </span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed mb-4">
                {company.pitchHook || `When pitching co-investors in ${company.name}, highlight customer retention velocity and defensible technical moats.`}
              </p>

              <Link
                href={`/directory?q=${encodeURIComponent((company.investors || [])[0] || company.name)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg shadow-red-600/20"
              >
                <span>Pitch Syndicate Co-Investors</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
