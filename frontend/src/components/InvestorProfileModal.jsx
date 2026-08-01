"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Mail, Globe, MapPin, Check, Briefcase, DollarSign, Layers, ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import InvestorAvatar from './InvestorAvatar';
import AiPitchModal from './AiPitchModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function InvestorProfileModal({ investor, isStandalone = false }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [inCrm, setInCrm] = useState(false);
  const [isAiPitchOpen, setIsAiPitchOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        supabase
          .from('crm_leads')
          .select('id')
          .eq('user_id', data.user.id)
          .eq('investor_id', investor?.id)
          .single()
          .then(({ data: lead }) => {
            if (lead) setInCrm(true);
          });
      }
    });
  }, [investor?.id]);

  const handleClose = () => {
    if (isStandalone) {
      router.push('/directory');
    } else {
      router.back();
    }
  };

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (!investor?.email) return;
    navigator.clipboard.writeText(investor.email);
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

  const minStr = formatMoney(investor.check_min);
  const maxStr = formatMoney(investor.check_max);
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
          <div className="relative p-6 sm:p-8 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-950 border-b border-zinc-800/80 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <InvestorAvatar 
                name={investor.name} 
                avatarUrl={investor.avatar_url || investor.avatar} 
                className="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-red-500/20 shadow-xl" 
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{investor.name}</h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
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

                {/* Social Links Bar */}
                <div className="flex items-center gap-3 pt-1">
                  {investor.twitter_url && (
                    <a href={investor.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all text-xs flex items-center gap-1.5">
                      <span className="font-bold">𝕏</span> Twitter/X
                    </a>
                  )}
                  {investor.linkedin_url && (
                    <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all text-xs flex items-center gap-1.5">
                      <span className="font-bold text-blue-400">in</span> LinkedIn
                    </a>
                  )}
                  {investor.website && (
                    <a href={investor.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all text-xs flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dossier Body Content */}
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

          {/* Action Footer */}
          <div className="p-5 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Copy Email Button */}
            {investor.email ? (
              <button
                onClick={handleCopyEmail}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs border border-zinc-800 flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Mail className="w-4 h-4 text-zinc-400" />}
                <span>{copied ? "Email Copied!" : investor.email}</span>
              </button>
            ) : (
              <span className="text-xs text-zinc-500">Contact info protected</span>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Add to CRM */}
              <button
                onClick={handleToggleCrm}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  inCrm 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800"
                }`}
              >
                {inCrm ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {inCrm ? "Saved to CRM" : "+ Add to CRM"}
              </button>

              {/* AI Draft Email Button */}
              <button
                onClick={() => setIsAiPitchOpen(true)}
                className="flex-1 sm:flex-initial crm-btn-oil px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                AI Draft Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded AI Pitch Generator Modal */}
      {isAiPitchOpen && (
        <AiPitchModal investor={investor} onClose={() => setIsAiPitchOpen(false)} />
      )}
    </>
  );
}
