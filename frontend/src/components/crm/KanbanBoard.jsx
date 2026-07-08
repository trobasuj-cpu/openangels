"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Mail, Link as LinkIcon, Search, ArrowLeft, Trash2, StickyNote, X, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { supabase } from '../../lib/supabase.js';

const COLUMNS = {
  inbox: { name: 'Saved', color: 'border-blue-500/40', dot: 'bg-blue-500' },
  contacted: { name: 'Contacted', color: 'border-purple-500/40', dot: 'bg-purple-500' },
  meeting_set: { name: 'Meeting', color: 'border-red-500/40', dot: 'bg-red-500' },
  dd: { name: 'Due Diligence', color: 'border-rose-500/40', dot: 'bg-rose-500' },
  won: { name: 'Committed', color: 'border-emerald-500/40', dot: 'bg-emerald-500' },
  lost: { name: 'Passed', color: 'border-red-500/40', dot: 'bg-red-500' }
};

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crm_leads')
      .select(`
        id,
        status,
        notes,
        created_at,
        investor_id,
        investors (
          id, name, bio, location, email, linkedin_url, website, twitter_url, avatar_url,
          industries, stages, check_min, check_max
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchLeads();
  }, [user, fetchLeads]);

  const filteredLeads = leads.filter(l => {
    const inv = l.investors;
    if (!inv) return false;
    const q = search.toLowerCase();
    return !search || 
      inv.name?.toLowerCase().includes(q) || 
      inv.bio?.toLowerCase().includes(q);
  });

  const columns = Object.keys(COLUMNS).map(statusKey => ({
    id: statusKey,
    ...COLUMNS[statusKey],
    items: filteredLeads.filter(l => l.status === statusKey)
  }));

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      setLeads(prev => prev.map(l => 
        l.id === draggableId ? { ...l, status: destination.droppableId } : l
      ));
      
      await supabase
        .from('crm_leads')
        .update({ status: destination.droppableId })
        .eq('id', draggableId)
        .eq('user_id', user.id);
    }
  };

  const removeLead = async (leadId) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    await supabase
      .from('crm_leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', user.id);
  };

  const saveNotes = async () => {
    if (!editingNotes) return;
    setSavingNotes(true);
    await supabase
      .from('crm_leads')
      .update({ notes: notesText })
      .eq('id', editingNotes)
      .eq('user_id', user.id);
    setLeads(prev => prev.map(l => l.id === editingNotes ? { ...l, notes: notesText } : l));
    setSavingNotes(false);
    setEditingNotes(null);
  };

  const copyEmail = (email) => {
    if (email) navigator.clipboard.writeText(email);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 flex flex-col items-center justify-center p-8 font-sans">
        <h1 className="text-3xl font-bold text-white mb-4">Investor CRM</h1>
        <p className="text-zinc-400 mb-8">Sign in to access your personal investor pipeline.</p>
        <Link 
          href="/"
          className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-zinc-200 flex flex-col font-sans">
      <header className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-0 sm:h-16 bg-black/80 backdrop-blur-xl shrink-0 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
              <span className="text-black text-sm font-bold">OA</span>
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400 truncate">
              OpenAngels
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-zinc-600 text-lg font-light">/</span>
            <span className="text-sm font-semibold text-zinc-300 whitespace-nowrap">Investor CRM</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700 whitespace-nowrap">
              {leads.length} <span className="hidden sm:inline">investor{leads.length !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-black border border-white/10 rounded-lg focus:outline-none focus:border-red-500/50 text-sm w-full sm:w-56 transition-all text-zinc-200 placeholder:text-zinc-500"
            />
          </div>
          {leads.length > 0 && (
            <button
              onClick={async () => {
                if (!window.confirm(`Remove all ${leads.length} investors from your CRM?`)) return;
                const { error } = await supabase
                  .from('crm_leads')
                  .delete()
                  .eq('user_id', user.id);
                if (!error) setLeads([]);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </header>

      {/* Content — scrollable area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-2xl font-bold text-white mb-3">Your pipeline is empty</h2>
            <p className="text-zinc-400 mb-8 max-w-md">
              Go to the investor database and click <strong>+ Add to CRM</strong> on any investor card to start building your outreach pipeline.
            </p>
            <Link 
              href="/"
              className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Browse Investors →
            </Link>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 px-5 pt-5 pb-20 sm:pb-5">
              {columns.map(col => (
                <div key={col.id} className="flex flex-col min-w-0">
                  <div className={cn("flex items-center justify-between pb-2 mb-3 border-b-2 sticky top-0 bg-black z-10 pt-1", col.color)}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", col.dot)} />
                      <h2 className="font-semibold text-zinc-400 text-xs uppercase tracking-wider">{col.name}</h2>
                    </div>
                    <span className="text-[10px] bg-zinc-800/80 text-zinc-500 py-0.5 px-2 rounded-full font-medium">
                      {col.items.length}
                    </span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className={cn(
                          "rounded-xl transition-colors p-1.5 sm:-mx-1.5 custom-scrollbar min-h-[60px] h-full flex-1",
                          snapshot.isDraggingOver ? "bg-white/5 ring-1 ring-white/10" : ""
                        )}
                      >
                        {col.items.map((lead, index) => {
                          const inv = lead.investors;
                          if (!inv) return null;
                          return (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => {
                                const isExpanded = expandedCards.has(lead.id);
                                return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={(e) => {
                                    if (window.innerWidth < 640 && !e.defaultPrevented) {
                                      toggleCard(lead.id);
                                    }
                                  }}
                                  className={cn(
                                    "group bg-black border border-white/5 rounded-xl mb-2 transition-all cursor-pointer sm:cursor-grab",
                                    snapshot.isDragging ? "ring-1 ring-red-500/30 rotate-1 scale-105 cursor-grabbing border-white/20" : "hover:border-white/20",
                                    isExpanded ? "p-3" : "p-2 sm:p-3"
                                  )}
                                  style={provided.draggableProps.style}
                                >
                                  <div className={cn("flex justify-between items-start", (isExpanded || window.innerWidth >= 640) ? "mb-1.5" : "")}>
                                    <div className="flex-1 min-w-0 pr-2">
                                      <h3 className="font-semibold text-zinc-100 text-sm truncate leading-tight">{inv.name}</h3>
                                      {(isExpanded || window.innerWidth >= 640) && inv.location && (
                                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{inv.location}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 ml-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={(e) => { e.preventDefault(); setEditingNotes(lead.id); setNotesText(lead.notes || ''); }}
                                        className="p-1 hover:bg-zinc-800 rounded transition-colors"
                                        title="Notes"
                                      >
                                        <StickyNote className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.preventDefault(); removeLead(lead.id); }}
                                        className="p-1 hover:bg-red-950/50 rounded transition-colors"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                                      </button>
                                    </div>
                                  </div>

                                  {(isExpanded || window.innerWidth >= 640) && (
                                    <>
                                      {inv.bio && (
                                        <p className="text-[11px] text-zinc-500 mb-2 line-clamp-2 leading-relaxed">
                                          {inv.bio}
                                        </p>
                                      )}

                                      {lead.notes && (
                                        <div className="mb-2 px-2 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                                          <p className="text-[11px] text-red-300/70 line-clamp-2">{lead.notes}</p>
                                        </div>
                                      )}

                                      <div className="flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        {inv.email && (
                                          <button 
                                            onClick={(e) => { e.preventDefault(); copyEmail(inv.email); }}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[11px] transition-colors text-zinc-400 hover:text-white"
                                            title="Copy Email"
                                          >
                                            <Mail className="w-3 h-3" />
                                            Email
                                          </button>
                                        )}
                                        {inv.linkedin_url && (
                                          <a 
                                            href={inv.linkedin_url.startsWith('http') ? inv.linkedin_url : `https://${inv.linkedin_url}`}
                                            target="_blank" 
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 border border-white/5 rounded-lg text-[11px] transition-colors text-zinc-400"
                                          >
                                            <LinkIcon className="w-3 h-3" />
                                            LinkedIn
                                          </a>
                                        )}
                                      </div>
                                      <div className="mt-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Link
                                          href={`/investor/${inv.slug}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/40 rounded-lg text-[11px] font-medium transition-colors"
                                        >
                                          <Sparkles className="w-3 h-3" />
                                          AI Draft Email
                                        </Link>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Notes Modal */}
      {editingNotes && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setEditingNotes(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/10 rounded-2xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">📝 Notes</h3>
              <button onClick={() => setEditingNotes(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add your personal notes about this investor..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingNotes(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
