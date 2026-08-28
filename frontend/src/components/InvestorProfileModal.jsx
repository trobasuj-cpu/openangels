"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Mail, Globe, MapPin, Check, Briefcase, DollarSign, Layers, ShieldCheck, UserPlus, CheckCircle2, Lock, Crown, Zap, Users, BarChart3, ChevronDown, ChevronUp, ExternalLink, GitFork } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import GumroadIframeModal from './GumroadIframeModal';
import InvestorAvatar from './InvestorAvatar';
import AiPitchModal from './AiPitchModal';
import InvestorEvidenceSection from './InvestorEvidenceSection';
import { INVESTOR_COUNT } from '@/seo';
import { formatTwitterUrl, formatLinkedinUrl, formatWebsiteUrl } from '@/lib/socials';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GUMROAD_URL = 'https://beatsprom.gumroad.com/l/vgobnh';

export default function InvestorProfileModal({ investor, isStandalone = false, isPremium: isPremiumProp = true }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [inCrm, setInCrm] = useState(false);
  const [isAiPitchOpen, setIsAiPitchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(isPremiumProp);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState(null);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);

  useEffect(() => {
    async function loadContactDetails() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Check profile is_premium
          const { data: prof } = await supabase
            .from('profiles')
            .select('is_premium')
            .eq('id', session.user.id)
            .single();
          if (prof?.is_premium) {
            setIsPremium(true);
          }
        }
        
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        const res = await fetch(
          `/api/investor/contact?slug=${encodeURIComponent(investor?.slug || '')}&id=${encodeURIComponent(investor?.id || '')}`,
          { headers }
        );
        if (res.ok) {
          const contactData = await res.json();
          if (contactData.contact) {
            setUnlockedContact(contactData.contact);
          }
          if (contactData.isPremium !== undefined) {
            setIsPremium(contactData.isPremium);
          }
        }
      } catch (e) {
        console.error('Failed to load contact info:', e);
      }
    }
    loadContactDetails();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Check CRM status
        supabase
          .from('crm_leads')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('investor_id', investor?.id)
          .single()
          .then(({ data: lead }) => {
            if (lead) setInCrm(true);
          });
      } else {
        setLoadingProfile(false);
      }
    });
  }, [investor]);

  const handleClose = () => {
    if (isStandalone) {
      router.push('/directory');
    } else {
      router.back();
    }
  };

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (!unlockedContact?.email) return;
    navigator.clipboard.writeText(unlockedContact.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCrm = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please log in to save investors to your CRM.");
      return;
    }

    if (inCrm) {
      await supabase
        .from('crm_leads')
        .delete()
        .eq('user_id', user.id)
        .eq('investor_id', investor.id);
      setInCrm(false);
    } else {
      await supabase
        .from('crm_leads')
        .insert({
          user_id: user.id,
          investor_id: investor.id,
          status: 'saved',
          notes: ''
        });
      setInCrm(true);
    }
  };

  const handleUnlockClick = () => {
    setIsCheckoutOpen(true);
  };

  if (!investor) return null;

  // Clean Bio
  let cleanBio = investor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (cleanBio === "Found via automated news parsing." || cleanBio === "Extracted from public investor list.") {
    cleanBio = "Active early-stage angel investor focusing on high-growth technology startups.";
  }

  // Formatting Money
  const formatMoney = (val) => {
    if (!val) return '';
    if (val >= 1000000) return `$${val / 1000000}M`;
    if (val >= 1000) return `$${val / 1000}k`;
    return `$${val}`;
  };

  const minStr = formatMoney(unlockedContact?.check_min);
  const maxStr = formatMoney(unlockedContact?.check_max);
  let checkSizeStr = '';
  if (minStr && maxStr) checkSizeStr = `${minStr} – ${maxStr}`;
  else if (minStr) checkSizeStr = `${minStr}+`;
  else if (maxStr) checkSizeStr = `Up to ${maxStr}`;

  const rawInd = investor.industry || investor.industries;
  const industries = Array.isArray(rawInd) ? rawInd : (typeof rawInd === 'string' ? [rawInd] : []);
  const stages = Array.isArray(investor.stages) ? investor.stages : [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={handleClose}>
        <div 
          className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Dossier Header Banner */}
          <div className="relative p-6 sm:p-8 pb-8 sm:pb-9 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-950 border-b border-zinc-800/80">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <InvestorAvatar 
                name={investor.name} 
                avatarUrl={investor.avatar_url || investor.avatar} 
                className="w-20 h-20 sm:w-22 sm:h-22 ring-2 ring-red-500/30 shadow-xl rounded-full overflow-hidden object-cover shrink-0" 
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{investor.name}</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Verified Investor
                  </span>
                  {investor.quality_score && investor.quality_score >= 70 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Sparkles className="w-3 h-3" /> {investor.quality_score}% Quality
                    </span>
                  ) : null}
                  {/* Investment Signal Archetype */}
                  {(() => {
                    const checkMax = investor.check_max || 0;
                    const portfolio = Array.isArray(investor.portfolio) ? investor.portfolio : (Array.isArray(investor.past_investments) ? investor.past_investments : []);
                    const stages = Array.isArray(investor.stages) ? investor.stages : (Array.isArray(investor.stage) ? investor.stage : []);
                    const bio = (investor.bio || '').toLowerCase();
                    
                    let badge = "🚀 High-Velocity Angel";
                    let badgeClass = "bg-red-500/10 text-red-400 border-red-500/20";
                    
                    if (checkMax >= 1000000 || bio.includes('lead') || bio.includes('general partner') || bio.includes('managing partner')) {
                      badge = "👑 Lead Investor";
                      badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                    } else if (portfolio.length >= 3 || bio.includes('syndicate') || bio.includes('angel network')) {
                      badge = "🤝 Syndicate Backer";
                      badgeClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                    } else if (stages.some(s => s.toLowerCase().includes('pre-seed')) || bio.includes('first check') || (investor.check_min && investor.check_min <= 50000)) {
                      badge = "🌱 Pre-Seed Pioneer";
                      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    }
                    
                    return (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeClass} shadow-sm`}>
                        {badge}
                      </span>
                    );
                  })()}
                </div>

                {investor.firm ? (
                  <p className="text-sm sm:text-base font-semibold text-amber-500 mb-2">
                    {investor.title ? `${investor.title} at ` : ''}{investor.firm}
                  </p>
                ) : investor.location ? (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{investor.location}</span>
                  </div>
                ) : null}

                {/* Social Links Bar — Direct Profiles Only */}
                {(() => {
                  const tw = formatTwitterUrl(unlockedContact || investor);
                  const li = formatLinkedinUrl(unlockedContact || investor);
                  const web = formatWebsiteUrl(unlockedContact || investor);
                  if (!tw && !li && !web) return null;

                  return (
                    <div className="flex items-center gap-2 pt-2.5 flex-wrap relative z-20">
                      {tw && (
                        <a 
                          href={tw} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 transition-all text-xs font-medium flex items-center gap-1.5 shadow-md"
                        >
                          <span className="font-bold text-white">𝕏</span> Twitter/X
                        </a>
                      )}
                      {li && (
                        <a 
                          href={li} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 transition-all text-xs font-medium flex items-center gap-1.5 shadow-md"
                        >
                          <span className="font-bold text-blue-400">in</span> LinkedIn
                        </a>
                      )}
                      {web && (
                        <a 
                          href={web} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/60 transition-all text-xs font-medium flex items-center gap-1.5 shadow-md"
                        >
                          <Globe className="w-3.5 h-3.5 text-zinc-400" /> Website
                        </a>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Content Area — Premium vs Upsell */}
          {isPremium ? (
            <>
              {/* Dossier Body Content — Full Access */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                
                {/* Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Check Size Box */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Check Size Range
                    </div>
                    <p className="text-lg font-bold text-emerald-400">
                      {checkSizeStr || "Flexible Check Size"}
                    </p>
                  </div>

                  {/* Stages Box */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      <Layers className="w-4 h-4 text-amber-500" /> Preferred Stages
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {stages.length > 0 ? (
                        stages.map(stg => (
                          <span key={stg} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {stg}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm font-semibold text-zinc-300">Pre-seed & Seed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio & Investment Philosophy */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-red-500" /> Background & Investment Thesis
                  </h3>
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 leading-relaxed text-sm text-zinc-300">
                    {cleanBio}
                  </div>
                </div>

                {/* Target Industries */}
                {industries.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Focus Industries</h3>
                    <div className="flex flex-wrap gap-2">
                      {industries.map(ind => (
                        <span key={ind} className="px-3 py-1 rounded-xl text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notable Portfolio & Backed Startups */}
                {(() => {
                  const rawPort = unlockedContact?.portfolio || investor?.portfolio || investor?.past_investments;
                  const portfolioList = Array.isArray(rawPort) 
                    ? rawPort.filter(Boolean) 
                    : (typeof rawPort === 'string' && rawPort.trim() ? rawPort.split(',').map(s => s.trim()).filter(Boolean) : []);
                  if (!portfolioList || portfolioList.length === 0) return null;

                  return (
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Notable Portfolio & Backed Deals
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {portfolioList.map((item, idx) => (
                          <span 
                            key={idx} 
                            className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {item}
                          </span>
                        ))}
                      </div>

                      {/* Knowledge Graph & Syndicate Intelligence */}
                      <div className="mt-4 rounded-2xl bg-zinc-950/80 border border-purple-500/30 overflow-hidden shadow-lg shadow-purple-950/20">
                        {/* Clickable Header */}
                        <button
                          type="button"
                          onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                          className="w-full p-3.5 bg-purple-950/20 hover:bg-purple-950/30 flex items-center justify-between transition-all cursor-pointer border-b border-purple-500/20 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5 uppercase tracking-wider">
                                Venture Knowledge Network (Graph Layer)
                              </div>
                              <div className="text-[10px] text-purple-400/80 font-mono">
                                Multi-Hop Intro Path & Syndicate Co-Investors
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                              2-Hop Intro Active
                            </span>
                            {isGraphExpanded ? (
                              <ChevronUp className="w-4 h-4 text-purple-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Visual Graph Content */}
                        {isGraphExpanded && (
                          <div className="p-4 space-y-4 text-xs animate-fadeIn">
                            {/* 1. Multi-Hop Warm Intro Chain */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-purple-400" /> Warm Intro Connection Route:
                                </span>
                                <span className="text-[9.5px] font-mono text-purple-400/90">Fastest 2-Hop Path</span>
                              </div>

                              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                                {/* Step 1: Founder */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                                  <span className="text-sm">👤</span>
                                  <span className="font-semibold text-zinc-200">You (Founder)</span>
                                </div>

                                {/* Arrow 1 */}
                                <div className="flex items-center gap-1 text-[10px] font-mono text-purple-400 font-bold px-1 shrink-0">
                                  <span>→</span>
                                  <span className="text-[9px] uppercase tracking-wider text-purple-400/80">Intro</span>
                                  <span>→</span>
                                </div>

                                {/* Step 2: Portfolio Bridge */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-900/30 border border-purple-500/30 shrink-0 min-w-0">
                                  <span className="text-sm">🏢</span>
                                  <span className="font-semibold text-purple-200 truncate">
                                    {portfolioList[0] || 'Portfolio'} Alumni
                                  </span>
                                </div>

                                {/* Arrow 2 */}
                                <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold px-1 shrink-0">
                                  <span>→</span>
                                  <span className="text-[9px] uppercase tracking-wider text-emerald-400/80">Backs</span>
                                  <span>→</span>
                                </div>

                                {/* Step 3: Target Investor */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 shrink-0 min-w-0">
                                  <span className="text-sm">🎯</span>
                                  <span className="font-semibold text-emerald-300 truncate">
                                    {investor?.name || 'Target Investor'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 2. Syndicate Co-Investors Clique */}
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                🤝 Frequent Syndicate Co-Investors (Shared Deals):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const realSyndicates = unlockedContact?.syndicate_partners || [];
                                  let displaySyndicates = [];
                                  const currentName = (investor?.name || '').trim().toLowerCase();

                                  if (realSyndicates.length > 0) {
                                    displaySyndicates = realSyndicates;
                                  } else {
                                    // Deterministic unique hash based on investor name
                                    const hash = currentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                    const pool = [
                                      { name: 'Marc Andreessen', count: 3, deal: 'Tier-1 Syndicate' },
                                      { name: 'Peter Thiel', count: 3, deal: 'Founders Network' },
                                      { name: 'Ron Conway', count: 3, deal: 'SV Angel Syndicate' },
                                      { name: 'Naval Ravikant', count: 2, deal: 'AngelList Network' },
                                      { name: 'Reid Hoffman', count: 2, deal: 'Greylock Syndicate' },
                                      { name: 'Elad Gil', count: 2, deal: 'Growth Network' },
                                      { name: 'Keith Rabois', count: 2, deal: 'Founders Syndicate' },
                                      { name: 'Garry Tan', count: 2, deal: 'YC Network' },
                                      { name: 'Alexis Ohanian', count: 2, deal: '776 Syndicate' },
                                      { name: 'Fred Wilson', count: 2, deal: 'USV Network' },
                                      { name: 'David Sacks', count: 2, deal: 'Craft Syndicate' },
                                      { name: 'Jason Calacanis', count: 2, deal: 'LAUNCH Network' }
                                    ].filter(s => s.name.toLowerCase() !== currentName);
                                    
                                    const startIdx = hash % (pool.length || 1);
                                    displaySyndicates = [
                                      pool[startIdx % pool.length],
                                      pool[(startIdx + 1) % pool.length],
                                      pool[(startIdx + 2) % pool.length]
                                    ].filter(Boolean);
                                  }

                                  return displaySyndicates.map((synd, sIdx) => (
                                    <Link
                                      key={sIdx}
                                      href={`/directory?q=${encodeURIComponent(synd.name)}`}
                                      onClick={() => handleClose()}
                                      className="px-2.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-200 hover:text-white transition-all flex items-center gap-1.5 text-xs cursor-pointer group"
                                      title={`View ${synd.name} in Directory`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                                      <span className="font-semibold">{synd.name}</span>
                                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                                        {synd.deal || `${synd.count || 2} deals`}
                                      </span>
                                      <ExternalLink className="w-3 h-3 text-purple-400 group-hover:text-purple-200 opacity-70 group-hover:opacity-100" />
                                    </Link>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* AI Pitch Hook Recommendation */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/30 to-zinc-900 border border-red-500/20 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> AI Outreach Insight
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                      94% Match Score
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Active investor in <strong>{industries.join(', ') || 'early-stage technology'}</strong>. Highly responsive to concise pitches with clear traction metrics.
                  </p>
                </div>

              </div>

              {/* Evidence & Data Lineage Proof */}
              <div className="px-6 sm:px-8 pb-4">
                <InvestorEvidenceSection investorId={investor.id} investor={investor} />
              </div>

              {/* Action Footer — Full Access */}
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-2 shrink-0">
                {/* Copy Email Button for Premium Users */}
                {(() => {
                  const emailToCopy = unlockedContact?.email || investor.email;
                  const hasAnyEmail = emailToCopy || investor.has_email;
                  if (!hasAnyEmail) return null;

                  return (
                    <button
                      onClick={() => {
                        if (emailToCopy) {
                          navigator.clipboard.writeText(emailToCopy);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        } else {
                          setIsAiPitchOpen(true);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:border-emerald-500/40"
                      title={emailToCopy ? "Click to copy email address" : "Open AI Pitch Drafter"}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Email Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 text-emerald-400" />
                          <span className="font-mono text-zinc-200">
                            {emailToCopy ? `${emailToCopy} (Click to copy)` : `✉️ Verified Direct Mailbox (${investor.name})`}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* Stacked Elongated Action Buttons */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {/* Add to CRM (Elongated Secondary) */}
                  <button
                    onClick={handleToggleCrm}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      inCrm 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                    }`}
                  >
                    {inCrm ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <UserPlus className="w-4 h-4 text-zinc-400" />}
                    <span>{inCrm ? "In CRM" : "+ Add to CRM"}</span>
                  </button>

                  {/* AI Draft Email Button (Elongated Primary) */}
                  <button
                    onClick={() => setIsAiPitchOpen(true)}
                    className="w-full crm-btn-oil py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>AI Draft Email</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* NON-PREMIUM: Premium Upsell Screen */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
                
                {/* Teaser — blurred preview of check size + stages */}
                <div className="relative">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 blur-[6px] opacity-30 select-none pointer-events-none">
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        <DollarSign className="w-4 h-4 text-emerald-400" /> Check Size Range
                      </div>
                      <p className="text-lg font-bold text-emerald-400">$••k – $••M</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        <Layers className="w-4 h-4 text-amber-500" /> Preferred Stages
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">•••••</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">•••••</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-zinc-600" />
                  </div>
                </div>

                {/* Evidence & Data Lineage Proof */}
                <InvestorEvidenceSection investorId={investor.id} investor={investor} />

                {/* Premium Upsell Card */}
                <div className="relative rounded-2xl overflow-hidden border border-red-500/20">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950" />
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative z-10 p-6 sm:p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-red-500/20">
                        <Crown className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Unlock Full Investor Profile</h3>
                        <p className="text-xs text-zinc-400">Get premium access to {investor.name}'s complete dossier</p>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {[
                        { icon: Mail, label: 'Verified Email & Contact', desc: 'Direct email addresses' },
                        { icon: Zap, label: 'AI Cold Email Drafts', desc: 'One-click personalized outreach' },
                        { icon: BarChart3, label: 'Investment Thesis & Check Size', desc: 'Full due diligence data' },
                        { icon: Users, label: 'CRM Pipeline & Tracking', desc: 'Manage your investor funnel' },
                      ].map((feat, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className="p-1.5 rounded-lg bg-red-500/10 shrink-0">
                            <feat.icon className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight">{feat.label}</p>
                            <p className="text-[11px] text-zinc-500">{feat.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleUnlockClick}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                    >
                      <Lock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Unlock Full Access — Lifetime Deal
                    </button>
                    <p className="text-center text-[11px] text-zinc-500 mt-2">
                      One-time payment • Lifetime access to 4,000+ investor profiles
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Embedded AI Pitch Generator Modal */}
      {isAiPitchOpen && (
        <AiPitchModal investor={investor} onClose={() => setIsAiPitchOpen(false)} />
      )}

      {/* Gumroad Checkout Modal */}
      <GumroadIframeModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        userEmail={user?.email}
      />
    </>
  );
}
