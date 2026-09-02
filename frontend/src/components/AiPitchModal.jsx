"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, Mail, Loader2, Save, ExternalLink, ShieldCheck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AiPitchModal({ investor, onClose }) {
  const [startupDescription, setStartupDescription] = useState(
    "We created an open-source developer tool that automatically analyzes and reduces AWS infrastructure costs by up to 30%. We have 50 active B2B beta testers and our GitHub repo just crossed 2k stars. Raising a $1M seed round to monetize the enterprise version."
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ remaining: 10, limit: 10, isPremium: false, resetInSeconds: 3600 });
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Load saved user context if available
    const saved = typeof window !== 'undefined' ? localStorage.getItem('oa_startup_context') : null;
    if (saved) {
      setStartupDescription(saved);
    }

    // 2. Fetch real-time server quota
    async function initQuota() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        if (session?.user) {
          setUser(session.user);
          supabase
            .from('profiles')
            .select('startup_description, is_premium')
            .eq('id', session.user.id)
            .single()
            .then(({ data: prof }) => {
              if (prof?.startup_description) {
                setStartupDescription(prof.startup_description);
              }
            });
        }

        const res = await fetch('/api/generate-email', { headers });
        if (res.ok) {
          const qData = await res.json();
          setQuotaInfo({
            remaining: qData.remaining,
            limit: qData.limit,
            resetInSeconds: qData.resetInSeconds,
            isPremium: qData.isPremium
          });
        }
      } catch (e) {
        console.error('Failed to init quota:', e);
      }
    }

    initQuota();
  }, [investor?.id]);

  const handleSaveContext = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('oa_startup_context', startupDescription);
    }
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ startup_description: startupDescription })
        .eq('id', user.id);
    }
    setIsEditingDescription(false);
  };

  const handleGenerate = async () => {
    if (isEditingDescription) {
      await handleSaveContext();
    }

    setIsGenerating(true);
    setGeneratedSubject('');
    setGeneratedBody('');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          investorName: investor?.name || 'Investor',
          investorIndustry: investor?.industries || investor?.industry || [],
          investorBio: investor?.bio || '',
          startupDescription
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setQuotaInfo({
            remaining: 0,
            limit: data.limit || 10,
            resetInSeconds: data.resetInSeconds || 3600,
            isPremium: data.isPremium || false
          });
        }
        throw new Error(data.error || 'Failed to generate email');
      }

      setQuotaInfo({
        remaining: data.remaining,
        limit: data.limit,
        resetInSeconds: data.resetInSeconds,
        isPremium: data.isPremium
      });

      setGeneratedSubject(data.subject || `Pitch: Seed Round Opportunity`);
      setGeneratedBody(data.body || data.email || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copySubject = () => {
    navigator.clipboard.writeText(generatedSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const copyBody = () => {
    navigator.clipboard.writeText(generatedBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Pitch Email</h3>
              <p className="text-xs text-zinc-400">Tailored email for {investor?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Rate Limit Quota Badge */}
        {quotaInfo && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {quotaInfo.isPremium ? (
                  <strong className="text-amber-400">👑 Pro Plan: </strong>
                ) : (
                  <strong className="text-zinc-200">Free Plan: </strong>
                )}
                {quotaInfo.remaining} of {quotaInfo.limit} hourly pitches remaining
              </span>
            </div>
            <span className="text-zinc-500 text-[11px] shrink-0">
              Resets in {Math.ceil(quotaInfo.resetInSeconds / 60)}m
            </span>
          </div>
        )}

        {/* Rate Limit / Generation Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/40 text-red-300 rounded-2xl text-xs border border-red-900/50 space-y-2">
            <p className="font-semibold text-red-400 leading-relaxed">{error}</p>
            {quotaInfo && !quotaInfo.isPremium && (
              <a
                href="/#pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-md"
              >
                ⚡ Upgrade to Lifetime Pro (100 AI pitches/hr)
              </a>
            )}
          </div>
        )}

        {/* Startup Context Box */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Startup Context</span>
            <button 
              onClick={() => {
                if (isEditingDescription) handleSaveContext();
                else setIsEditingDescription(true);
              }}
              className="text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
            >
              {isEditingDescription ? "Save Context" : "Edit Context"}
            </button>
          </div>

          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                value={startupDescription}
                onChange={(e) => setStartupDescription(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="Describe what your startup does, traction/metrics, and raise size..."
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveContext}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save Context
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed italic">
              "{startupDescription}"
            </div>
          )}
        </div>

        {/* Generate Button */}
        {!generatedBody && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !startupDescription.trim()}
            className="w-full crm-btn-oil py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg border border-white/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            {isGenerating ? "Crafting Pitch Email..." : "Generate AI Email Draft"}
          </button>
        )}

        {/* Generated Email Results */}
        {generatedBody && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-300">
            {/* Subject */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Subject Line</span>
                <span className="text-xs font-semibold text-white truncate block">{generatedSubject}</span>
              </div>
              <button onClick={copySubject} className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/80 hover:bg-zinc-700 shrink-0 transition-colors cursor-pointer" title="Copy Subject">
                {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Body */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Email Body</span>
                <button onClick={copyBody} className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer">
                  {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedBody ? "Copied!" : "Copy Full Body"}
                </button>
              </div>
              <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {generatedBody}
              </pre>
            </div>

            {/* Action Buttons: Gmail / Default Mail / Regenerate */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setGeneratedSubject('');
                  setGeneratedBody('');
                }}
                className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold border border-zinc-800 transition-colors shrink-0"
              >
                Start Over
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(generatedSubject);
                  const body = encodeURIComponent(generatedBody);
                  const authuser = encodeURIComponent(user?.email || '');
                  window.open(`https://mail.google.com/mail/?authuser=${authuser}&view=cm&to=${investor?.email || ''}&su=${subject}&body=${body}`, '_blank');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#EA4335] hover:bg-[#D33C30] text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Open in Gmail
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(generatedSubject);
                  const body = encodeURIComponent(generatedBody);
                  window.location.href = `mailto:${investor?.email || ''}?subject=${subject}&body=${body}`;
                }}
                className="px-3.5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold shadow-md transition-colors"
                title="Open Default Mail App"
              >
                Default App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
