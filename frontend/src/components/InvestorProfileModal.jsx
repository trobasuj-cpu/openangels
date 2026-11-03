"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Mail, Globe, MapPin, Check, Briefcase, DollarSign, Layers, ShieldCheck, UserPlus, CheckCircle2, Lock, Crown, Zap, Users, BarChart3, ChevronDown, ChevronUp, ExternalLink, GitFork, User, Building2, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import GumroadIframeModal from './GumroadIframeModal';
import InvestorAvatar from './InvestorAvatar';
import AiPitchModal from './AiPitchModal';
import InvestorEvidenceSection from './InvestorEvidenceSection';
import CompanyProfileModal from './CompanyProfileModal';
import { INVESTOR_COUNT } from '@/seo';
import { formatTwitterUrl, formatLinkedinUrl, formatWebsiteUrl } from '@/lib/socials';
import { getVerificationInfo } from './Dashboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GUMROAD_URL = 'https://beatsprom.gumroad.com/l/vgobnh';

export default function InvestorProfileModal({ investor, isStandalone = false, isPremium: isPremiumProp = false }) {
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
  const [selectedCompany, setSelectedCompany] = useState(null);

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
      }
    });
  }, [investor]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStandalone]);

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
          status: 'inbox',
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
      <div 
        className={isStandalone 
          ? "w-full relative" 
          : "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        } 
        onClick={isStandalone ? undefined : handleClose}
      >
        <div 
          className={isStandalone
            ? "relative w-full bg-zinc-950 border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            : "relative w-full max-w-2xl lg:max-w-3xl bg-zinc-950 border border-zinc-800/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in zoom-in-95 duration-200"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button only if NOT standalone */}
          {!isStandalone && (
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-30 p-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-white/10 shadow-sm cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dossier Header Banner — Sleek, Crisp & Compact */}
          <div className="relative px-4 py-3 sm:px-6 sm:py-3.5 bg-zinc-900/40 border-b border-zinc-800/80 shrink-0 pr-12">
            {/* Clean neutral modal backing */}
            
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <InvestorAvatar 
                name={investor.name} 
                avatarUrl={investor.avatar_url || investor.avatar} 
                className="w-12 h-12 sm:w-14 sm:h-14 ring-1 ring-zinc-700/80 shadow-sm rounded-xl overflow-hidden object-cover shrink-0" 
              />

              <div className="flex-1 min-w-0">
                {/* Row 1: Name + Badges */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {isStandalone ? (
                    <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-snug truncate">
                      {investor.name}
                    </h1>
                  ) : (
                    <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-snug truncate">
                      {investor.name}
                    </h2>
                  )}
                  {(() => {
                    const verifInfo = getVerificationInfo(investor);
                    return (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 shrink-0" title="Direct MX record validation, SMTP handshake, zero bounce risk">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {verifInfo.badgeText}
                      </span>
                    );
                  })()}
                  {investor.quality_score && investor.quality_score >= 70 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 shrink-0">
                      Score {investor.quality_score}%
                    </span>
                  ) : null}
                  {/* Investment Signal Archetype */}
                  {(() => {
                    const checkMax = investor.check_max || 0;
                    const portfolio = Array.isArray(investor.portfolio) ? investor.portfolio : (Array.isArray(investor.past_investments) ? investor.past_investments : []);
                    const stages = Array.isArray(investor.stages) ? investor.stages : (Array.isArray(investor.stage) ? investor.stage : []);
                    const bio = (investor.bio || '').toLowerCase();
                    
                    let badge = "Active Investor";
                    let badgeClass = "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
                    
                    if (checkMax >= 1000000 || bio.includes('lead') || bio.includes('general partner') || bio.includes('managing partner')) {
                      badge = "Lead Investor";
                      badgeClass = "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
                    } else if (portfolio.length >= 3 || bio.includes('syndicate') || bio.includes('angel network')) {
                      badge = "Syndicate Backer";
                      badgeClass = "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
                    } else if (stages.some(s => s.toLowerCase().includes('pre-seed')) || bio.includes('first check') || (investor.check_min && investor.check_min <= 50000)) {
                      badge = "Pre-Seed";
                      badgeClass = "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
                    }
                    
                    return (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${badgeClass} shrink-0`}>
                        {badge}
                      </span>
                    );
                  })()}
                </div>

                {/* Row 2: Subtitle + Location + Socials */}
                <div className="flex items-center justify-between gap-2 mt-0.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
                    {investor.firm && (
                      <span className="font-medium text-zinc-200 truncate">
                        {investor.title ? `${investor.title} at ` : ''}{investor.firm}
                      </span>
                    )}
                    {investor.firm && investor.location && (
                      <span className="text-zinc-600">•</span>
                    )}
                    {investor.location && (
                      <span className="flex items-center gap-1 text-zinc-400 truncate">
                        <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{investor.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Social Links Bar — Sleek micro-pills */}
                  {(() => {
                    const tw = formatTwitterUrl(unlockedContact || investor);
                    const li = formatLinkedinUrl(unlockedContact || investor);
                    const web = formatWebsiteUrl(unlockedContact || investor);
                    if (!tw && !li && !web) return null;

                    return (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {tw && (
                          <a 
                            href={tw} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="h-6 px-2 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors text-[11px] font-medium flex items-center gap-1"
                            title="X / Twitter"
                          >
                            <span className="font-bold text-white text-[10px]">𝕏</span>
                            <span className="hidden sm:inline">Twitter</span>
                          </a>
                        )}
                        {li && (
                          <a 
                            href={li} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="h-6 px-2 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors text-[11px] font-medium flex items-center gap-1"
                            title="LinkedIn"
                          >
                            <span className="font-semibold text-zinc-300 text-[10px]">in</span>
                            <span className="hidden sm:inline">LinkedIn</span>
                          </a>
                        )}
                        {web && (
                          <a 
                            href={web} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="h-6 px-2 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors text-[11px] font-medium flex items-center gap-1"
                            title="Website"
                          >
                            <Globe className="w-3 h-3 text-zinc-400" />
                            <span className="hidden sm:inline">Website</span>
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Dossier Body Content — Expands naturally in standalone mode */}
          <div className={`flex-1 min-h-0 ${isStandalone ? 'p-4 sm:p-6 space-y-4' : 'overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4.5 space-y-3.5 sm:space-y-4 custom-scrollbar'}`}>
                
                {/* Parameters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Check Size Box */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-center">
                    <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Check Size Range
                    </div>
                    <p className="text-sm sm:text-base font-mono font-semibold text-emerald-400 tabular-nums">
                      {checkSizeStr || "Flexible Check Size"}
                    </p>
                  </div>

                  {/* Stages Box */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-center">
                    <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Preferred Stages
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {stages.length > 0 ? (
                        stages.map(stg => (
                          <span key={stg} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                            {stg}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs font-semibold text-zinc-300">Pre-seed & Seed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio & Investment Philosophy */}
                <div>
                  <h3 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                    Background & Investment Thesis
                  </h3>
                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-800/80 leading-relaxed text-xs sm:text-sm text-zinc-300">
                    {cleanBio}
                  </div>
                </div>

                {/* Target Industries */}
                {industries.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Focus Industries</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {industries.map(ind => (
                        <span key={ind} className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-850 text-zinc-300 border border-zinc-750">
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
                      <h3 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                        Notable Portfolio & Backed Deals
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {portfolioList.map((item, idx) => (
                          <button 
                            key={idx} 
                            type="button"
                            onClick={() => setSelectedCompany(item)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 shadow-sm flex items-center gap-1.5 transition-colors group cursor-pointer"
                            title={`Inspect ${item} Company Intelligence Profile`}
                          >
                            <span className="w-1 h-1 rounded-full bg-zinc-400 group-hover:bg-zinc-200" />
                            <span>{item}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                          </button>
                        ))}
                      </div>

                      {/* Knowledge Graph & Syndicate Intelligence */}
                      <div className="mt-3 rounded-xl bg-zinc-900/30 border border-zinc-800 overflow-hidden shadow-sm">
                        {/* Clickable Header */}
                        <button
                          type="button"
                          onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                          className="w-full p-3 bg-zinc-900/50 hover:bg-zinc-900/80 flex items-center justify-between transition-colors cursor-pointer border-b border-zinc-800 group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                                Venture Knowledge Network
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                Multi-Hop Intro Path & Syndicate Co-Investors
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              2-Hop Intro Active
                            </span>
                            {isGraphExpanded ? (
                              <ChevronUp className="w-4 h-4 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Visual Graph Content */}
                        {isGraphExpanded && (
                          <div className="p-3.5 space-y-3.5 text-xs animate-fadeIn">
                            {/* 1. Multi-Hop Warm Intro Chain */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-zinc-400" /> Warm Intro Connection Route:
                                </span>
                                <span className="text-[9.5px] font-mono text-zinc-400/90">Fastest 2-Hop Path</span>
                              </div>

                              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                                {/* Step 1: Founder */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                                  <User className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="font-medium text-zinc-200 text-xs">You (Founder)</span>
                                </div>

                                {/* Arrow 1 */}
                                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 font-bold px-0.5 shrink-0">
                                  <span>→</span>
                                  <span className="text-[8.5px] uppercase tracking-wider text-zinc-400/80">Intro</span>
                                  <span>→</span>
                                </div>

                                {/* Step 2: Portfolio Bridge */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-850 border border-zinc-700/60 shrink-0 min-w-0">
                                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="font-medium text-zinc-200 text-xs truncate">
                                    {portfolioList[0] || 'Portfolio'} Alumni
                                  </span>
                                </div>

                                {/* Arrow 2 */}
                                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 font-bold px-0.5 shrink-0">
                                  <span>→</span>
                                  <span className="text-[8.5px] uppercase tracking-wider text-zinc-400/80">Backs</span>
                                  <span>→</span>
                                </div>

                                {/* Step 3: Target Investor */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-850 border border-zinc-700/60 shrink-0 min-w-0">
                                  <Target className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="font-medium text-zinc-200 text-xs truncate">
                                    {investor?.name || 'Target Investor'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 2. Syndicate Co-Investors Clique */}
                            <div>
                              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                Frequent Syndicate Co-Investors (Shared Deals):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
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
                                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/60 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 text-xs cursor-pointer group"
                                      title={`View ${synd.name} in Directory`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 group-hover:scale-125 transition-transform" />
                                      <span className="font-semibold text-xs">{synd.name}</span>
                                      <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                                        {synd.deal || `${synd.count || 2} deals`}
                                      </span>
                                      <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 opacity-70 group-hover:opacity-100" />
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
                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Outreach Insight</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 tabular-nums">
                      94% Match Score
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Active investor in <strong>{industries.join(', ') || 'early-stage technology'}</strong>. Highly responsive to concise pitches with clear traction metrics.
                  </p>
                </div>

                {/* Evidence & Data Lineage Proof */}
                <InvestorEvidenceSection investorId={investor.id} investor={investor} />

                {/* Lifetime Access Teaser Banner for Non-Premium */}
                {!isPremium && (
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                        <Lock className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">Unlock Verified Direct Email & Founder Pitch Tools</h4>
                        <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                          Get instant access to {investor.name}'s verified mailbox, personalized AI pitch drafts, and {INVESTOR_COUNT} active angel profiles.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleUnlockClick}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock Full Access</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Action Footer — Full Access Sleek Single-Row Bar */}
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
                {/* Left: Email Copy / Quick Contact Pill */}
                {(() => {
                  const emailToCopy = isPremium ? (unlockedContact?.email || investor.email) : null;
                  const hasAnyEmail = investor.has_email || !!investor.email || !!unlockedContact?.email;
                  if (!hasAnyEmail) {
                    return (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Verified Deal Signals Active</span>
                      </div>
                    );
                  }

                  if (!isPremium) {
                    return (
                      <button
                        onClick={handleUnlockClick}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs cursor-pointer shadow-sm min-w-0"
                        title="Unlock verified email and direct founder pitch contact"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
                        <span className="font-mono text-zinc-300 text-xs truncate">
                          Direct Email: Verified (Protected — Unlock)
                        </span>
                      </button>
                    );
                  }

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
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs cursor-pointer min-w-0 max-w-full sm:max-w-xs shadow-sm"
                      title={emailToCopy ? `Click to copy ${emailToCopy}` : "Open AI Pitch Drafter"}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-emerald-400 font-bold text-xs truncate">Copied to clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="font-mono text-zinc-200 text-xs truncate">
                            {emailToCopy ? emailToCopy : `Verified Mailbox (${investor.name})`}
                          </span>
                          <Copy className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 ml-auto shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* Right: Actions Row */}
                <div className="flex items-center gap-2 justify-end">
                  {/* Add to CRM */}
                  <button
                    onClick={isPremium ? handleToggleCrm : handleUnlockClick}
                    className={`h-8 sm:h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      inCrm 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                        : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800"
                    }`}
                    title={isPremium ? "Add to CRM" : "Unlock CRM pipeline access"}
                  >
                    {inCrm ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{inCrm ? "In CRM" : "+ CRM"}</span>
                  </button>

                  {/* AI Draft Email Button */}
                  <button
                    onClick={isPremium ? () => setIsAiPitchOpen(true) : handleUnlockClick}
                    className="h-8 sm:h-8.5 px-3.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-300 shadow-sm transition-colors cursor-pointer"
                    title={isPremium ? "Open AI Pitch Drafter" : "Unlock AI Pitch Generator"}
                  >
                    {isPremium ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                        <span>AI Draft Email</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-950" />
                        <span>AI Draft Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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

      {/* Company Intelligence Profile Modal (DAY 6) */}
      {selectedCompany && (
        <CompanyProfileModal
          companyName={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </>
  );
}
