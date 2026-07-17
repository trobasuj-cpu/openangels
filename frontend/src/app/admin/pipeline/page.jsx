"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Loader2, Sparkles, AlertCircle, SkipForward } from 'lucide-react';

export default function PipelineAdmin() {
  const [queueItem, setQueueItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState('');
  const [investors, setInvestors] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [editedJson, setEditedJson] = useState(null);
  const [stats, setStats] = useState({ approved: 0, rejected: 0, skipped: 0 });

  const fetchNextItem = async () => {
    setLoading(true);
    setError('');
    setQueueItem(null);
    setEditedJson(null);
    setInvestors([]);
    setCurrentIdx(0);

    try {
      const { data, error: fetchError } = await supabase
        .from('investor_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setQueueItem(null);
        } else {
          throw fetchError;
        }
      } else {
        setQueueItem(data);
        if (data.extracted_json && data.extracted_json.investors) {
          const inv = data.extracted_json.investors;
          if (inv.length === 0) {
            // No investors found in this article — auto-skip
            await supabase.from('investor_queue').update({ status: 'rejected' }).eq('id', data.id);
            setStats(s => ({ ...s, skipped: s.skipped + 1 }));
            fetchNextItem();
            return;
          }
          setInvestors(inv);
          setEditedJson(inv[0]);
        } else {
          await runEnrichment(data);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch next item.');
    } finally {
      setLoading(false);
    }
  };

  const runEnrichment = async (item) => {
    setEnriching(true);
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: item.raw_text })
      });

      if (!res.ok) throw new Error('Enrichment API failed');

      const extracted = await res.json();

      // Save to queue
      await supabase
        .from('investor_queue')
        .update({ extracted_json: extracted })
        .eq('id', item.id);

      const inv = extracted.investors || [];
      if (inv.length === 0 || extracted.no_investors) {
        // No individual investors — auto-skip this article
        await supabase.from('investor_queue').update({ status: 'rejected' }).eq('id', item.id);
        setStats(s => ({ ...s, skipped: s.skipped + 1 }));
        setEnriching(false);
        fetchNextItem();
        return;
      }

      setInvestors(inv);
      setCurrentIdx(0);
      setEditedJson(inv[0]);
      setQueueItem({ ...item, extracted_json: extracted });
    } catch (err) {
      console.error(err);
      setError('Failed to enrich text via AI.');
    } finally {
      setEnriching(false);
    }
  };

  useEffect(() => {
    fetchNextItem();
  }, []);

  const handleApprove = async () => {
    if (!editedJson) return;
    setLoading(true);

    try {
      // Duplicate check
      const { data: dupCheck } = await supabase
        .from('investors_secure')
        .select('id')
        .ilike('name', editedJson.name)
        .limit(1);

      if (dupCheck && dupCheck.length > 0) {
        alert(`"${editedJson.name}" is already in the database! Skipping.`);
        moveToNextInvestor();
        return;
      }

      const slug = editedJson.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const { error: insertError } = await supabase
        .from('investors_secure')
        .insert({
          name: editedJson.name,
          bio: editedJson.bio,
          industries: editedJson.industries,
          slug: slug
        });

      if (insertError) throw insertError;
      setStats(s => ({ ...s, approved: s.approved + 1 }));
      moveToNextInvestor();
    } catch (err) {
      console.error(err);
      setError(`Failed to approve: ${err.message}`);
      setLoading(false);
    }
  };

  const handleReject = () => {
    setStats(s => ({ ...s, rejected: s.rejected + 1 }));
    moveToNextInvestor();
  };

  const moveToNextInvestor = async () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < investors.length) {
      setCurrentIdx(nextIdx);
      setEditedJson(investors[nextIdx]);
      setLoading(false);
    } else {
      // All investors from this article processed — mark queue item done
      if (queueItem) {
        await supabase.from('investor_queue').update({ status: 'approved' }).eq('id', queueItem.id);
      }
      fetchNextItem();
    }
  };

  if (loading && !queueItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-indigo-400" />
              AI Data Pipeline
            </h1>
            <p className="text-gray-400 mt-2">Review and approve investors for the database.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm px-3 py-1 bg-green-900/30 text-green-400 rounded-full border border-green-800/50">
              ✓ {stats.approved}
            </div>
            <div className="text-sm px-3 py-1 bg-red-900/30 text-red-400 rounded-full border border-red-800/50">
              ✗ {stats.rejected}
            </div>
            <div className="text-sm px-3 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
              ⟳ {stats.skipped} skipped
            </div>
          </div>
        </header>

        {error && (
          <div className="p-4 mb-6 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
            <button onClick={() => { setError(''); fetchNextItem(); }} className="ml-auto text-sm underline">Retry</button>
          </div>
        )}

        {!queueItem && !loading && (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Queue is empty!</h2>
            <p className="text-gray-400 mt-2">You're all caught up. Run <code className="bg-gray-800 px-2 py-0.5 rounded">run_sourcing.bat</code> to get more.</p>
            <button onClick={fetchNextItem} className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Refresh Queue
            </button>
          </div>
        )}

        {queueItem && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Raw Text Column */}
            <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Raw Source Text</h3>
              {investors.length > 1 && (
                <div className="mb-3 text-sm text-indigo-400 bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-900/50">
                  Found {investors.length} investors in this article • Showing {currentIdx + 1} of {investors.length}
                </div>
              )}
              <div className="flex-1 bg-gray-950 rounded-xl p-4 overflow-y-auto text-sm text-gray-400 font-mono" style={{ maxHeight: '500px' }}>
                {queueItem.raw_text}
              </div>
              {queueItem.source_url && (
                <a href={queueItem.source_url} target="_blank" rel="noreferrer" className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm truncate">
                  Source: {queueItem.source_url}
                </a>
              )}
            </div>

            {/* AI Result Column */}
            <div className="flex flex-col">
              <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-xl relative overflow-hidden flex-1">
                {enriching && (
                  <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                    <p className="text-indigo-300 font-medium">Gemini is extracting investors...</p>
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Extracted Profile
                </h3>

                {editedJson ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Name</label>
                      <input 
                        type="text" 
                        value={editedJson.name || ''} 
                        onChange={(e) => setEditedJson({...editedJson, name: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                      <textarea 
                        value={editedJson.bio || ''} 
                        onChange={(e) => setEditedJson({...editedJson, bio: e.target.value})}
                        rows={4}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Industries (Comma separated)</label>
                      <input 
                        type="text" 
                        value={(editedJson.industries || []).join(', ')} 
                        onChange={(e) => setEditedJson({...editedJson, industries: e.target.value.split(',').map(s => s.trim())})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Waiting for AI...</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  disabled={enriching || loading}
                  onClick={handleReject}
                  className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-red-950/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 transition-all disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Reject
                </button>
                <button
                  disabled={enriching || loading}
                  onClick={handleApprove}
                  className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                >
                  <Check className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
