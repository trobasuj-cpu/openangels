"use client";
import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, Mail, Loader2 } from 'lucide-react';

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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedSubject('');
    setGeneratedBody('');

    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_pitch',
          investorName: investor.name,
          investorBio: investor.bio,
          investorFirm: investor.firm,
          startupDescription
        })
      });

      const data = await res.json();
      if (data.subject && data.body) {
        setGeneratedSubject(data.subject);
        setGeneratedBody(data.body);
      } else {
        // Fallback generator
        setGeneratedSubject(`Quick question regarding ${investor.firm || 'your thesis'} & our seed round`);
        setGeneratedBody(
          `Hi ${investor.name.split(' ')[0]},\n\n` +
          `I saw your work at ${investor.firm || 'early-stage investing'} and thought our company would align well with your thesis.\n\n` +
          `${startupDescription}\n\n` +
          `Would you be open to a brief 10-min chat next week to share feedback?\n\nBest regards,`
        );
      }
    } catch (e) {
      setGeneratedSubject(`Quick question regarding your thesis & our seed round`);
      setGeneratedBody(
        `Hi ${investor.name.split(' ')[0]},\n\n` +
        `I saw your work at ${investor.firm || 'early-stage investing'} and thought our company would align well with your focus.\n\n` +
        `${startupDescription}\n\n` +
        `Would you be open to a brief 10-min chat next week?\n\nBest regards,`
      );
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
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
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
              <p className="text-xs text-zinc-400">Tailored email for {investor.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Startup Context Box */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Startup Context</span>
            <button 
              onClick={() => setIsEditingDescription(!isEditingDescription)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold underline"
            >
              {isEditingDescription ? "Save Context" : "Edit Context"}
            </button>
          </div>

          {isEditingDescription ? (
            <textarea
              value={startupDescription}
              onChange={(e) => setStartupDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
            />
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
            disabled={isGenerating}
            className="w-full crm-btn-oil py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg border border-white/10 active:scale-[0.99] transition-all"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
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
              <button onClick={copySubject} className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/80 hover:bg-zinc-700 shrink-0">
                {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Body */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800/80">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Email Body</span>
                <button onClick={copyBody} className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1">
                  {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedBody ? "Copied!" : "Copy Full Body"}
                </button>
              </div>
              <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {generatedBody}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
