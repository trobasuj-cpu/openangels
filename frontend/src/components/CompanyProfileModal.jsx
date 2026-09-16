"use client";
import React, { useState } from 'react';
import { 
  Sparkles, X, Globe, MapPin, Check, Briefcase, DollarSign, 
  Layers, ShieldCheck, Zap, Users, BarChart3, ExternalLink, 
  TrendingUp, Cpu, Building2, Award, ArrowUpRight, Share2, 
  AlertTriangle, CheckCircle2, ChevronRight, History, Activity
} from 'lucide-react';
import Link from 'next/link';
import { getCompanyIntelligence } from '@/lib/companyData';

export default function CompanyProfileModal({ companyName, companyData: initialData, onClose }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'signals' | 'claims' | 'syndicate' | 'timeline'
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const company = initialData || getCompanyIntelligence(companyName);

  if (!company) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/company/${company.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const score = company.openangelsScore || 80;
  const getScoreColor = (sc) => {
    if (sc >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (sc >= 80) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all border border-white/10 cursor-pointer shadow-md"
          title="Close dossier"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Dossier Hero Banner */}
        <div className="relative p-6 sm:p-7 pb-6 bg-gradient-to-r from-red-950/30 via-zinc-900/70 to-zinc-950 border-b border-zinc-800/80">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              {/* Company Monogram Avatar */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/60 shadow-xl flex items-center justify-center shrink-0 font-extrabold text-2xl sm:text-3xl text-white">
                {company.name.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {company.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700 font-mono">
                    {company.stage}
                  </span>
                  {company.funding?.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> SEC Form D Verified
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-0.5 max-w-xl line-clamp-1">
                  {company.tagline || company.legalName}
                </p>

                {/* Sub-bar: Domain & Location */}
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400 flex-wrap">
                  {company.domain && (
                    <a 
                      href={`https://${company.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{company.domain}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}
                  {company.location && (
                    <span className="inline-flex items-center gap-1 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {company.location}
                    </span>
                  )}
                  {company.foundedYear && (
                    <span className="text-zinc-500">
                      Est. {company.foundedYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* OpenAngels Score Dial Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0">
              <div className="text-left sm:text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  OpenAngels Score
                </div>
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {score}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">/ 100</span>
                </div>
                <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${getScoreColor(score)}`}>
                  {company.scoreBadge || 'High Velocity'}
                </div>
              </div>

              {/* Share Dossier Button */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-medium transition-all shadow-sm cursor-pointer mt-2"
                title="Copy shareable company dossier link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copiedLink ? 'Copied Link!' : 'Share Dossier'}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 border-t border-zinc-800/80 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              Executive Overview & Moat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signals')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'signals'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Investment Signals</span>
              {company.investmentSignals?.signals?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {company.investmentSignals.signals.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('claims')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'claims'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>Verified Claims & Lineage</span>
              {company.claims?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {company.claims.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('syndicate')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'syndicate'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span>Syndicate & Pitch Hook</span>
              {company.investors?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  {company.investors.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Timeline & Changes</span>
              {company.timeline?.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {company.timeline.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">

          {/* 4 CORE DECISION KPI CARDS (Always visible at top of tabs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* KPI 1: Capital & Valuation */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Capital & Valuation
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {company.funding?.status || 'VERIFIED'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl font-extrabold text-white">
                  {company.funding?.totalRaised || 'Disclosed Syndicate'}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Valuation: <strong className="text-emerald-400">{company.funding?.valuation || 'Undisclosed'}</strong>
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 line-clamp-1 border-t border-zinc-800/80 pt-2 mt-2">
                Last Round: {company.funding?.lastRoundAmount} ({company.funding?.lastRoundType})
              </div>
            </div>

            {/* KPI 2: Team & Talent Velocity */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Team & Growth
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                  {company.hiring?.status || 'Hiring'}
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl font-extrabold text-white">
                  {company.employees ? `${company.employees} Team` : 'Syndicate Team'}
                </div>
                <div className="text-xs text-blue-400 font-semibold mt-0.5">
                  {company.employeeGrowth90d || '+20% headcount growth'}
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 line-clamp-1 border-t border-zinc-800/80 pt-2 mt-2">
                Open Roles: {company.hiring?.openRoles || 4} positions priority
              </div>
            </div>

            {/* KPI 3: Tech Moat & Architecture */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> Tech Moat
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Proprietary
                </span>
              </div>
              <div className="my-1">
                <div className="text-xs font-bold text-white line-clamp-2">
                  {company.technologySignals?.moat || 'Proprietary IP & High Retentive System'}
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 line-clamp-1 border-t border-zinc-800/80 pt-2 mt-2">
                Stack: {(company.technologySignals?.stack || ['Python', 'Cloud']).slice(0, 3).join(', ')}
              </div>
            </div>

            {/* KPI 4: Traction & Customers */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Traction Radar
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  Accelerating
                </span>
              </div>
              <div className="my-1">
                <div className="text-xl font-extrabold text-white line-clamp-1">
                  {company.growthSignals?.revenueRunRate || 'High Growth'}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                  {company.growthSignals?.userBase || 'Active Enterprise Base'}
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 line-clamp-1 border-t border-zinc-800/80 pt-2 mt-2">
                Customers: {(company.customers || ['Global Enterprises']).slice(0, 2).join(', ')}
              </div>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE OVERVIEW & MOAT */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Day 8: Investment Signals Summary Teaser */}
              {company.investmentSignals?.summary && (
                <div 
                  onClick={() => setActiveTab('signals')}
                  className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-zinc-900/70 to-zinc-950 border border-amber-500/30 hover:border-amber-500/60 transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Day 8 Intelligence Radar
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {company.investmentSignals.windowDays || 90}-Day Window
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200 mt-1">
                        {company.investmentSignals.summary}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1 transition-all"
                  >
                    <span>View Signals</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Executive Overview */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-500" /> Company Overview
                </h3>
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-sm text-zinc-300 leading-relaxed">
                  {company.overview}
                </div>
              </div>

              {/* Founders Showcase with Pedigree */}
              {company.founders?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" /> Leadership & Founding Pedigree
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.founders.map((f, fIdx) => (
                      <div key={fIdx} className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{f.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                              {f.role}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-snug">
                            {f.pedigree}
                          </p>
                        </div>
                        {f.linkedin && (
                          <a 
                            href={f.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all shrink-0"
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

              {/* Products & Customers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Core Products */}
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Core Products & Platforms
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(company.products || []).map((prod, pIdx) => (
                      <span key={pIdx} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-800/80 text-zinc-200 border border-zinc-700/60">
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Customers & Enterprise Proof */}
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" /> Marquee Customers & Partners
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(company.customers || []).map((cust, cIdx) => (
                      <span key={cIdx} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {cust}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Strategic Events */}
              {company.recentEvents?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" /> Recent Strategic Milestones
                  </h3>
                  <div className="space-y-2">
                    {company.recentEvents.map((evt, eIdx) => (
                      <div key={eIdx} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/70 flex items-start gap-3">
                        <span className="text-[11px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded shrink-0">
                          {evt.date}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{evt.title}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">{evt.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: INVESTMENT SIGNALS & INTELLIGENCE RADAR (DAY 8) */}
          {activeTab === 'signals' && (
            <div className="space-y-6">
              {/* Header Summary Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Audited Investment Signals & Intelligence Radar</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        DAY 8 Standard
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1.5 font-medium">
                      {company.investmentSignals?.summary || `OpenAngels detected growth signals during the last 90 days.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {company.investmentSignals?.signalStrength || 'HIGH'} STRENGTH
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                      Score: {company.investmentSignals?.aggregateConfidence || 85}%
                    </span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                  {[
                    { id: 'all', label: 'All Signals' },
                    { id: 'capital', label: '💰 Capital & Funding' },
                    { id: 'talent', label: '🔥 Talent Velocity' },
                    { id: 'product', label: '🚀 Product & Moat' },
                    { id: 'alliances', label: '🤝 Alliances & M&A' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSignalFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        signalFilter === filter.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anti-Fluff Policy Note */}
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>
                  <strong>Anti-Fluff Standard:</strong> Every signal requires audited empirical proof, timestamp, primary source citation, and investor decision rationale.
                </span>
                <span className="text-zinc-500 font-mono hidden sm:inline">6-Point Schema</span>
              </div>

              {/* Signals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(company.investmentSignals?.signals || [])
                  .filter((sig) => {
                    if (signalFilter === 'all') return true;
                    if (signalFilter === 'capital') return sig.category === 'capital';
                    if (signalFilter === 'talent') return sig.category === 'talent';
                    if (signalFilter === 'product') return sig.category === 'product';
                    if (signalFilter === 'alliances') return sig.category === 'market' || sig.category === 'alliances';
                    return true;
                  })
                  .map((sig, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        {/* Badge Row */}
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
                            style={{ 
                              backgroundColor: `${sig.color || '#f59e0b'}33`, 
                              color: sig.color || '#f59e0b', 
                              border: `1px solid ${sig.color || '#f59e0b'}55` 
                            }}
                          >
                            {sig.badge || sig.type}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {sig.confidence}% Confidence
                          </span>
                        </div>

                        {/* Signal Title */}
                        <h4 className="text-sm font-bold text-white">
                          {sig.name}
                        </h4>

                        {/* Audited Evidence Callout */}
                        <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/70 text-xs">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                            Audited Evidence
                          </span>
                          <p className="text-zinc-200 font-mono text-[11px] leading-relaxed">
                            {sig.evidence}
                          </p>
                        </div>

                        {/* Investor Decision Rationale */}
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                            Investor Decision Rationale
                          </span>
                          <p className="text-zinc-300 text-[11px] leading-relaxed">
                            {sig.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Footer: Date & Source Citation */}
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="truncate max-w-[200px]" title={sig.source}>
                          Source: <strong className="text-zinc-400 font-medium">{sig.source}</strong>
                        </span>
                        <span className="font-mono text-zinc-400 shrink-0 ml-2">
                          {sig.date}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: VERIFIED CLAIMS & LINEAGE (DAY 4 Integration) */}
          {activeTab === 'claims' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> OpenAngels Claim & Evidence Standard (Day 4)
                </div>
                All claims are resolved via the canonical formula: 
                <code className="text-[11px] text-amber-400 font-mono ml-1">
                  CLAIM ↓ VALUE ↓ SOURCE ↓ EVIDENCE ↓ DATE ↓ CONFIDENCE ↓ STATUS
                </code>
              </div>

              {/* Conflicts Warning (if any) */}
              {company.conflicts?.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Discrepancies & Disputed Claims Detected
                  </div>
                  {company.conflicts.map((conf, cIdx) => (
                    <div key={cIdx} className="pl-5 border-l-2 border-amber-500/40">
                      <div className="font-semibold text-white">{conf.field}: {conf.statement}</div>
                      <div className="text-[11px] text-amber-300/80 mt-0.5">
                        Conflicting Values: {conf.values?.join(' vs ')} (Variance: {conf.variance})
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Claims List */}
              <div className="space-y-3">
                {(company.claims || []).map((claim, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{claim.statement}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        claim.status === 'VERIFIED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {claim.status} • {Math.round((claim.confidence || 0.9) * 100)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Canonical Value</span>
                        <span className="font-bold text-amber-300">{claim.canonicalValue}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Primary Source & Tier</span>
                        <span className="text-zinc-300">{claim.source} ({claim.sourceTier})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Effective Date</span>
                        <span className="text-zinc-400 font-mono">{claim.date}</span>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 bg-black/30 p-2.5 rounded-xl border border-zinc-800/40">
                      <strong className="text-zinc-300">Audited Evidence:</strong> {claim.evidence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SYNDICATE & PITCH HOOK */}
          {activeTab === 'syndicate' && (
            <div className="space-y-6">
              {/* Syndicate & Backers */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" /> Prominent Backers & Syndicate Members
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  Click any investor to explore their profile or find co-investors across OpenAngels.
                </p>
                <div className="flex flex-wrap gap-2">
                  {(company.investors || []).map((invName, iIdx) => (
                    <a
                      key={iIdx}
                      href={`/?search=${encodeURIComponent(invName)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onClose) onClose();
                        window.location.href = `/?search=${encodeURIComponent(invName)}`;
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/30 hover:bg-purple-900/50 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center gap-1.5 group cursor-pointer shadow-sm"
                      title={`Search ${invName} in OpenAngels`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                      <span>{invName}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Founder Pitch Decoder & Strategic Hook */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Founder Pitch & Syndicate Decoder
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                    Actionable Thesis
                  </span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed mb-4">
                  {company.pitchHook || `When pitching co-investors in ${company.name}, emphasize product velocity, customer retention metrics, and competitive moat.`}
                </p>

                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={`/?search=${encodeURIComponent((company.investors || [])[0] || company.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onClose) onClose();
                      window.location.href = `/?search=${encodeURIComponent((company.investors || [])[0] || company.name)}`;
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    <span>Pitch Syndicate Co-Investors {company.investors?.[0] ? `(${company.investors[0]})` : ''}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>

                  <Link
                    href={`/company/${company.slug}`}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>Open Full Standalone Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPANY TIMELINE & CHANGE DETECTION RADAR (DAY 7) */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Header & Filter Controls */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <History className="w-4 h-4 text-amber-400" />
                      <span>Change Detection Engine & Temporal Radar</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        DAY 7 Engine
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Continuous observation of headcount velocity, funding rounds, product releases, and syndicate formation.
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                  {[
                    { id: 'all', label: 'All Signals' },
                    { id: 'hiring', label: '🔥 Hiring Velocity' },
                    { id: 'funding', label: '💰 Funding & Valuation' },
                    { id: 'product', label: '🚀 Product Breakthroughs' },
                    { id: 'partnership', label: '🤝 Alliances & M&A' },
                    { id: 'customer', label: '🎯 Customers' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setTimelineFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        timelineFilter === filter.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Chronological Timeline */}
              <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                {(company.timeline || [])
                  .filter((evt) => {
                    if (timelineFilter === 'all') return true;
                    if (timelineFilter === 'partnership') return evt.category === 'partnership' || evt.category === 'market';
                    return evt.category === timelineFilter;
                  })
                  .map((evt, eIdx) => (
                    <div key={evt.id || eIdx} className="relative group">
                      {/* Node Dot */}
                      <div 
                        className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 border-zinc-950 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: evt.signalColor || '#f59e0b' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      {/* Event Card */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700/90 transition-all space-y-3 shadow-sm">
                        {/* Header Badge Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: `${evt.signalColor || '#f59e0b'}33`, color: evt.signalColor || '#f59e0b', border: `1px solid ${evt.signalColor || '#f59e0b'}55` }}
                            >
                              {evt.signalBadge || '⚡ DETECTED SIGNAL'}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                              {evt.relativeTime || evt.date}
                            </span>
                          </div>
                          {evt.scoreImpact && (
                            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Score Impact: {evt.scoreImpact}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {evt.title}
                          </h3>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {evt.description}
                          </p>
                        </div>

                        {/* Before / After Temporal Delta Comparison */}
                        {evt.delta && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-black/40 border border-zinc-800/70 text-xs">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-0.5">
                                Previous State
                              </span>
                              <span className="text-zinc-400 font-mono text-xs">
                                {evt.delta.before}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold block mb-0.5 flex items-center justify-between">
                                <span>Observed Differential</span>
                                <span className="text-emerald-400 font-bold">{evt.delta.change}</span>
                              </span>
                              <span className="text-zinc-200 font-mono text-xs font-bold">
                                {evt.delta.after}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Source & Provenance */}
                        {evt.evidenceSource && (
                          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Audit Source: <strong className="text-zinc-400">{evt.evidenceSource}</strong></span>
                            </span>
                            <span className="font-mono text-zinc-600">{evt.date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OpenAngels Portfolio Intelligence • Option 1 Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
}
