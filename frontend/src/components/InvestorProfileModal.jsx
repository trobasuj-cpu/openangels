"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Mail, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

import { useRouter } from 'next/navigation';

export default function InvestorProfileModal({ investor, isStandalone = false, initialUser = null, initialProfile = null, initialCrmLeadIds = null }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [crmLeadIds, setCrmLeadIds] = useState(initialCrmLeadIds || new Set());
  const [isOpen, setIsOpen] = useState(true);
  const [startupDescription, setStartupDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  
  const handleClose = () => {
    if (isStandalone) {
      router.push('/investors');
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
          supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: profileData }) => {
            if (profileData) setProfile(profileData);
          });
          supabase.from('crm_leads').select('investor_id').eq('user_id', data.user.id).then(({ data: crmData }) => {
            if (crmData) setCrmLeadIds(new Set(crmData.map(l => l.investor_id)));
          });
        }
      });
    }
  }, [initialUser]);

  const [allInvestors, setAllInvestors] = useState([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(true);

  useEffect(() => {
    const fetchAllInvestors = async () => {
      try {
        let allData = [];
        let fetchMore = true;
        let from = 0;
        let limit = 1000;
        
        while (fetchMore) {
          const { data, error } = await supabase
            .from('investors_secure')
            .select('*')
            .range(from, from + limit - 1);
            
          if (error) throw error;
          
          allData = [...allData, ...data];
          if (data.length < limit) fetchMore = false;
          else from += limit;
        }
        setAllInvestors(allData);
      } catch (err) {
        console.error('Failed to fetch all investors:', err);
      } finally {
        setIsLoadingInvestors(false);
      }
    };
    fetchAllInvestors();
  }, []);
  const [matchedInvestors, setMatchedInvestors] = useState([]);
  const [totalMatchCount, setTotalMatchCount] = useState(0);
  const [allMatchedIds, setAllMatchedIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToCrm, setIsAddingToCrm] = useState(false);
  const [addedToCrmCount, setAddedToCrmCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setGeneratedSubject('');
      setGeneratedBody('');
      setMatchedInvestors([]);
      setError(null);
    }
  }, [isOpen, investor?.id]);

  useEffect(() => {
    if (isOpen) {
      if (profile?.startup_description) {
        setStartupDescription(profile.startup_description);
        setIsEditingDescription(false);
      } else if (profile !== undefined) {
        // Only show empty state if profile has loaded (or if there is no profile)
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-email`, {
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
      
      
      setGeneratedSubject(data.subject || 'Investment Opportunity');
      setGeneratedBody(data.body || data.email || 'Error: Could not parse response.');

      // Match other investors based on startup description keywords
      let currentInvestors = allInvestors;
      if (currentInvestors.length === 0) {
        const { data } = await supabase.from('investors_secure').select('*');
        if (data) currentInvestors = data;
      }

      if (startupDescription && currentInvestors.length > 0) {
        const descLower = startupDescription.toLowerCase();
        // Common tech/startup keywords to look for
        const possibleTags = ['ai', 'saas', 'fintech', 'healthtech', 'edtech', 'consumer', 'enterprise', 'hardware', 'crypto', 'web3', 'biotech', 'marketplace', 'b2b', 'b2c', 'ecommerce', 'gaming', 'api', 'devtool', 'security', 'data', 'climate', 'media', 'infrastructure', 'deep-tech', 'creator-economy', 'impact', 'ar-vr', 'autonomous', 'robotics', 'iot', 'machine-learning', 'cloud', 'mobile', 'social', 'food', 'real-estate', 'insurance', 'legal', 'hr', 'logistics', 'travel'];
        
        const extractedTags = possibleTags.filter(tag => descLower.includes(tag));
        const searchTags = extractedTags.length > 0 ? extractedTags : industries;

        // Extract meaningful words from description for bio matching
        const stopWords = new Set(['the', 'and', 'our', 'are', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'been', 'will', 'can', 'not', 'but', 'also', 'into', 'about', 'over', 'more', 'than', 'just', 'very', 'what', 'when', 'where', 'which', 'their', 'there', 'being', 'were', 'would', 'could', 'should', 'does', 'doing', 'during', 'each', 'other']);
        const descWords = descLower.split(/[\s,.\-:;!?()]+/).filter(w => w.length > 4 && !stopWords.has(w));

        const scoredMatches = currentInvestors.map(inv => {
          if (inv.id === investor.id) return { inv, score: 0 };
          
          let score = 0;
          
          // Industry match: +3 per matching industry tag
          if (inv.industry) {
            const invInds = Array.isArray(inv.industry) ? inv.industry : inv.industry.split(',').map(i => i.trim());
            const matchCount = invInds.filter(ind => searchTags.includes(ind.toLowerCase())).length;
            score += matchCount * 3;
          }
          
          // Bio keyword match: +1 per keyword found in bio
          if (inv.bio && descWords.length > 0) {
            const bioLower = inv.bio.toLowerCase();
            const bioMatches = descWords.filter(w => bioLower.includes(w)).length;
            score += bioMatches;
          }
          
          return { inv, score };
        }).filter(m => m.score >= 3); // Only truly relevant matches

        // Sort by highest score first, cap at top 25
        scoredMatches.sort((a, b) => b.score - a.score);
        const topMatches = scoredMatches.slice(0, 25);
        setMatchedInvestors(topMatches.map(m => m.inv));
        setTotalMatchCount(scoredMatches.length);
        setAllMatchedIds(scoredMatches.map(m => m.inv.id));
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!matchedInvestors || matchedInvestors.length === 0) return;
    
    const escapeCSV = (str) => {
      if (!str) return '""';
      return '"' + String(str).replace(/"/g, '""').replace(/\n/g, ' ') + '"';
    };

    const headers = ['Name', 'Email', 'Location', 'Industries', 'Bio', 'Check Min', 'Check Max'];
    const csvContent = [
      'sep=,',
      headers.join(','),
      ...matchedInvestors.map(inv => {
        const inds = Array.isArray(inv.industry) ? inv.industry.join(', ') : (inv.industry || '');
        return [
          escapeCSV(inv.name),
          escapeCSV(inv.email),
          escapeCSV(inv.location),
          escapeCSV(inds),
          escapeCSV(inv.bio),
          escapeCSV(inv.check_min),
          escapeCSV(inv.check_max)
        ].join(',');
      })
    ].join('\n');

    // Add BOM for proper UTF-8 handling in Excel
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `matched-investors-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const content = (
    <div className="bg-black w-full max-w-2xl rounded-2xl border border-white/10 flex flex-col max-h-[90vh]">
      {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-black text-sm font-bold">OA</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Draft Email</h2>
              <p className="text-sm text-zinc-400">Pitching {investor?.name}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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

          {!generatedBody ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  Your Startup Description
                </label>
                {!isEditingDescription && (
                  <button 
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-red-500 hover:underline font-medium"
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
                    className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 resize-none transition-colors"
                  />
                  <div className="flex justify-end gap-2">
                    {profile?.startup_description && (
                      <button 
                        onClick={() => {
                          setStartupDescription(profile.startup_description);
                          setIsEditingDescription(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      onClick={handleSaveDescription}
                      disabled={!startupDescription.trim() || isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Context
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-xl text-sm text-zinc-400 italic border border-white/5">
                  "{startupDescription}"
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {matchedInvestors.length > 0 && (
                <div className="mb-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-red-500/20 blur-2xl pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-red-500 text-sm font-bold">OA</span>
                          <h3 className="font-semibold text-red-500">
                            Top {matchedInvestors.length} AI Matched Investors
                          </h3>
                        </div>
                        <p className="text-sm text-zinc-400 max-w-sm">
                          We scanned our database and selected the top {matchedInvestors.length} most relevant investors for your startup.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-red-500/20 shrink-0">
                        <div className="hidden sm:flex -space-x-3">
                          <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full border-2 border-zinc-900" alt="Investor" />
                          <img src="https://i.pravatar.cc/100?img=47" className="w-8 h-8 rounded-full border-2 border-zinc-900" alt="Investor" />
                          <img src="https://i.pravatar.cc/100?img=12" className="w-8 h-8 rounded-full border-2 border-zinc-900" alt="Investor" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white">{allInvestors.length || 4744}</span>
                            <span className="text-xs text-zinc-400">active</span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-sm font-bold text-red-500">{totalMatchCount}</span>
                            <span className="text-xs text-red-500/80">matching</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {crmLeadIds && matchedInvestors.every(inv => crmLeadIds.has(inv.id)) ? (
                        <button 
                          onClick={() => router.push('/crm')}
                          className="px-3 py-2 shrink-0 bg-black hover:bg-zinc-900 text-white text-xs font-medium rounded-lg transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                          Go to CRM →
                        </button>
                      ) : (
                        <button 
                          onClick={async () => {
                            if (!user || !setCrmLeadIds || !crmLeadIds) return;
                            setIsAddingToCrm(true);
                            const toAdd = matchedInvestors.filter(inv => !crmLeadIds.has(inv.id));
                            setAddedToCrmCount(0);
                            let added = 0;
                            const newIds = new Set([...crmLeadIds]);
                            for (const inv of toAdd) {
                              const { error } = await supabase
                                .from('crm_leads')
                                .insert({ user_id: user.id, investor_id: inv.id, status: 'inbox' });
                              if (!error) {
                                newIds.add(inv.id);
                                added++;
                                setAddedToCrmCount(added);
                              }
                            }
                            setCrmLeadIds(newIds);
                            setIsAddingToCrm(false);
                          }}
                          disabled={isAddingToCrm}
                          className="px-3 py-2 shrink-0 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAddingToCrm 
                            ? `Adding... (${addedToCrmCount}/${addedToCrmCount + matchedInvestors.filter(inv => !crmLeadIds?.has(inv.id)).length})`
                            : `Add to CRM (${matchedInvestors.filter(inv => !crmLeadIds?.has(inv.id)).length})`
                          }
                        </button>
                      )}
                      <button 
                        onClick={handleDownloadCSV}
                        className="px-3 py-2 shrink-0 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Export CSV
                      </button>
                      <button 
                        onClick={() => {
                          const possibleTags = ['ai', 'saas', 'fintech', 'healthtech', 'edtech', 'consumer', 'enterprise', 'hardware', 'crypto', 'web3', 'biotech', 'marketplace', 'b2b', 'b2c', 'ecommerce', 'gaming', 'api', 'devtool', 'security', 'data'];
                          const descLower = startupDescription.toLowerCase();
                          const extractedTags = possibleTags.filter(tag => descLower.includes(tag));
                          const query = extractedTags.length > 0 ? extractedTags.join(',') : investor.industry || 'saas';
                          window.open(`/?industries=${query}`, '_blank');
                        }}
                        className="px-3 py-2 shrink-0 bg-black text-white border border-white/10 text-xs font-medium rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Open List
                      </button>
                      {totalMatchCount > 25 && (
                        <button 
                          onClick={() => {
                            window.localStorage.setItem('ai_matched_investor_ids', JSON.stringify(allMatchedIds));
                            window.open(`/?ai_match=true`, '_blank');
                          }}
                          className="px-3 py-2 shrink-0 bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
                        >
                          View All ({totalMatchCount})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={generatedSubject}
                  onChange={(e) => setGeneratedSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Email Body
                </label>
                <textarea
                  value={generatedBody}
                  onChange={(e) => setGeneratedBody(e.target.value)}
                  className="w-full h-64 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/50 resize-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-between bg-black rounded-b-2xl">
          {!generatedBody ? (
            <button
              onClick={handleGenerate}
              disabled={!startupDescription.trim() || isGenerating || isLoadingInvestors}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium rounded-xl hover:from-red-600 hover:to-rose-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating || isLoadingInvestors ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLoadingInvestors ? 'Loading AI...' : 'Writing magic...'}
                </>
              ) : (
                <>
                  <span className="text-sm font-bold">OA</span>
                  Generate Pitch
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex items-center gap-3">
              <button
                onClick={() => {
                  setGeneratedSubject('');
                  setGeneratedBody('');
                }}
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors shrink-0"
              >
                Start Over
              </button>
              <div className="flex-1 flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                <button
                  onClick={() => navigator.clipboard.writeText(generatedSubject + '\n\n' + generatedBody)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 text-white border border-white/10 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(generatedSubject);
                    const body = encodeURIComponent(generatedBody);
                    const authuser = encodeURIComponent(user?.email || '');
                    window.open(`https://mail.google.com/mail/?authuser=${authuser}&view=cm&to=${investor.email || ''}&su=${subject}&body=${body}`, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EA4335] text-white text-sm font-medium rounded-xl hover:bg-[#D33C30] transition-colors shrink-0"
                >
                  <Mail className="w-4 h-4" />
                  Open in Gmail
                </button>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(generatedSubject);
                    const body = encodeURIComponent(generatedBody);
                    const bcc = profile?.crm_bcc_email ? `&bcc=${encodeURIComponent(profile.crm_bcc_email)}` : '';
                    window.location.href = `mailto:${investor.email || ''}?subject=${subject}&body=${body}${bcc}`;
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-zinc-200 transition-colors shrink-0"
                  title="Open Default App (e.g. Superhuman, Apple Mail)"
                >
                  <Mail className="w-4 h-4" />
                  Default App
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (isStandalone) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
}
