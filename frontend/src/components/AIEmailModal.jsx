import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Mail, Loader2, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AIEmailModal({ isOpen, onClose, investor, profile, user }) {
  const [startupDescription, setStartupDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setGeneratedEmail('');
      setError(null);
      if (profile?.startup_description) {
        setStartupDescription(profile.startup_description);
        setIsEditingDescription(false);
      } else {
        setStartupDescription('');
        setIsEditingDescription(true);
      }
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSaveDescription = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const { error: saveError } = await supabase
        .from('profiles')
        .update({ startup_description: startupDescription })
        .eq('id', user.id);
        
      if (saveError) throw saveError;
      
      setIsEditingDescription(false);
      // We also update the local profile object so the parent knows, 
      // but modifying props directly is bad practice. We'll just rely on the local state here.
      if (profile) profile.startup_description = startupDescription;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (isEditingDescription) {
      await handleSaveDescription();
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const rawInd = investor.industry || investor.industries;
      const industries = Array.isArray(rawInd) ? rawInd : (typeof rawInd === 'string' ? [rawInd] : []);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          investorName: investor.name,
          investorIndustry: industries,
          startupDescription: startupDescription
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to generate email');
      
      setGeneratedEmail(data.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">AI Draft Email</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Pitching {investor?.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          {!generatedEmail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Your Startup Description
                </label>
                {!isEditingDescription && (
                  <button 
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-amber-600 dark:text-amber-500 hover:underline font-medium"
                  >
                    Edit Context
                  </button>
                )}
              </div>
              
              {isEditingDescription ? (
                <div className="space-y-3">
                  <textarea
                    value={startupDescription}
                    onChange={(e) => setStartupDescription(e.target.value)}
                    placeholder="E.g. We are building an AI assistant for lawyers. We have $10k MRR and are raising a $500k pre-seed round."
                    className="w-full h-32 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none transition-shadow"
                  />
                  <div className="flex justify-end gap-2">
                    {profile?.startup_description && (
                      <button 
                        onClick={() => {
                          setStartupDescription(profile.startup_description);
                          setIsEditingDescription(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      onClick={handleSaveDescription}
                      disabled={!startupDescription.trim() || isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Context
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 italic border border-zinc-200 dark:border-zinc-800">
                  "{startupDescription}"
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Generated Draft
              </label>
              <textarea
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                className="w-full h-64 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none transition-shadow"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-between">
          {!generatedEmail ? (
            <button
              onClick={handleGenerate}
              disabled={!startupDescription.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Writing magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Pitch
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => setGeneratedEmail('')}
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Start Over
              </button>
              <div className="flex-1 flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(generatedEmail)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(`Investment opportunity: ${user.user_metadata?.full_name || 'Startup'}`);
                    const body = encodeURIComponent(generatedEmail);
                    window.location.href = `mailto:${investor.email || ''}?subject=${subject}&body=${body}`;
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  Open in Mail
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
