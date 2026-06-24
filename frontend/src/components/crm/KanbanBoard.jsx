import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Mail, Link as LinkIcon, Search, ArrowLeft, Trash2, StickyNote, X, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { supabase } from '../../lib/supabase.js';

const COLUMNS = {
  inbox: { name: 'Saved', color: 'border-blue-500/40', dot: 'bg-blue-500' },
  contacted: { name: 'Contacted', color: 'border-purple-500/40', dot: 'bg-purple-500' },
  meeting_set: { name: 'Meeting', color: 'border-amber-500/40', dot: 'bg-amber-500' },
  dd: { name: 'Due Diligence', color: 'border-orange-500/40', dot: 'bg-orange-500' },
  won: { name: 'Committed', color: 'border-emerald-500/40', dot: 'bg-emerald-500' },
  lost: { name: 'Passed', color: 'border-red-500/40', dot: 'bg-red-500' }
};

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col items-center justify-center p-8 font-sans">
        <h1 className="text-3xl font-bold text-white mb-4">Investor CRM</h1>
        <p className="text-zinc-400 mb-8">Sign in to access your personal investor pipeline.</p>
        <Link 
          to="/"
          className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-xl hover:bg-zinc-100 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const [mobileTab, setMobileTab] = useState('inbox');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-zinc-900 text-xs sm:text-sm font-bold">OA</span>
              </div>
              <span className="hidden sm:inline text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
                OpenAngels
              </span>
            </Link>
            <span className="hidden sm:inline text-zinc-600 text-lg font-light">/</span>
            <span className="text-xs sm:text-sm font-semibold text-zinc-300">Investor CRM</span>
            <span className="text-[10px] sm:text-xs bg-zinc-800 text-zinc-400 px-1.5 sm:px-2 py-0.5 rounded-full border border-zinc-700">
              {leads.length}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-zinc-700 text-xs sm:text-sm w-28 sm:w-56 transition-all text-zinc-200 placeholder:text-zinc-500"
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
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        {isMobile && (
        <div className="overflow-x-auto flex border-t border-zinc-800/50">
          {columns.map(col => (
            <button
              key={col.id}
              onClick={() => setMobileTab(col.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 shrink-0",
                mobileTab === col.id
                  ? "text-white border-current"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              )}
              style={mobileTab === col.id ? { color: col.dot.replace('bg-', '').includes('blue') ? '#3b82f6' : col.dot.includes('purple') ? '#a855f7' : col.dot.includes('amber') ? '#f59e0b' : col.dot.includes('orange') ? '#f97316' : col.dot.includes('emerald') ? '#10b981' : '#ef4444' } : {}}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full", col.dot)} />
              {col.name}
              {col.items.length > 0 && (
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              )}
            </button>
          ))}
        </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Your pipeline is empty</h2>
            <p className="text-zinc-400 mb-8 max-w-md text-sm sm:text-base">
              Go to the investor database and click <strong>+ Add to CRM</strong> on any investor card to start building your outreach pipeline.
            </p>
            <Link 
              to="/"
              className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-xl hover:bg-zinc-100 transition-colors"
            >
              Browse Investors →
            </Link>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            {/* Desktop: horizontal kanban */}
            {!isMobile && (
            <div className="grid grid-cols-6 gap-3 h-full">
              {columns.map(col => (
                <div key={col.id} className="flex flex-col min-w-0 h-full">
                  <div className={cn("flex items-center justify-between pb-2 mb-3 border-b-2", col.color)}>
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
                          "flex-1 rounded-xl transition-colors p-1.5 -mx-1.5 overflow-y-auto custom-scrollbar",
                          snapshot.isDraggingOver ? "bg-zinc-900/60 ring-1 ring-zinc-700/50" : ""
                        )}
                      >
                        {col.items.map((lead, index) => {
                          const inv = lead.investors;
                          if (!inv) return null;
                          return (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "group bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3 mb-2 hover:shadow-lg transition-all",
                                    snapshot.isDragging ? "ring-2 ring-amber-500/30 rotate-1 scale-105 shadow-xl" : "hover:border-zinc-700"
                                  )}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-zinc-100 text-sm truncate">{inv.name}</h3>
                                      {inv.location && (
                                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{inv.location}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => { setEditingNotes(lead.id); setNotesText(lead.notes || ''); }}
                                        className="p-1 hover:bg-zinc-800 rounded transition-colors"
                                        title="Notes"
                                      >
                                        <StickyNote className="w-3 h-3 text-zinc-500 hover:text-amber-400" />
                                      </button>
                                      <button 
                                        onClick={() => removeLead(lead.id)}
                                        className="p-1 hover:bg-red-950/50 rounded transition-colors"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3 h-3 text-zinc-500 hover:text-red-400" />
                                      </button>
                                    </div>
                                  </div>

                                  {inv.bio && (
                                    <p className="text-[11px] text-zinc-500 mb-2 line-clamp-2 leading-relaxed">
                                      {inv.bio}
                                    </p>
                                  )}

                                  {lead.notes && (
                                    <div className="mb-2 px-2 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                      <p className="text-[11px] text-amber-300/70 line-clamp-2">{lead.notes}</p>
                                    </div>
                                  )}

                                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {inv.email && (
                                      <button 
                                        onClick={() => copyEmail(inv.email)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-[11px] transition-colors text-zinc-400 hover:text-zinc-200"
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
                                        className="flex-1 flex items-center justify-center gap-1 py-1 bg-zinc-800/80 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg text-[11px] transition-colors text-zinc-400"
                                      >
                                        <LinkIcon className="w-3 h-3" />
                                        LinkedIn
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
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
            )}

            {isMobile && (
            <div>
              {columns.filter(col => col.id === mobileTab).map(col => (
                <Droppable key={col.id} droppableId={col.id}>
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {col.items.length === 0 ? (
                        <div className="text-center py-16 text-zinc-500 text-sm">
                          No investors in "{col.name}" stage
                        </div>
                      ) : col.items.map((lead, index) => {
                        const inv = lead.investors;
                        if (!inv) return null;
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4"
                                style={provided.draggableProps.style}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-zinc-100 text-base">{inv.name}</h3>
                                    {inv.location && (
                                      <p className="text-xs text-zinc-500 mt-0.5">{inv.location}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button 
                                      onClick={() => { setEditingNotes(lead.id); setNotesText(lead.notes || ''); }}
                                      className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                      <StickyNote className="w-4 h-4 text-zinc-500" />
                                    </button>
                                    <button 
                                      onClick={() => removeLead(lead.id)}
                                      className="p-1.5 hover:bg-red-950/50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-zinc-500" />
                                    </button>
                                  </div>
                                </div>

                                {inv.bio && (
                                  <p className="text-xs text-zinc-400 mb-3 line-clamp-3 leading-relaxed">
                                    {inv.bio}
                                  </p>
                                )}

                                {lead.notes && (
                                  <div className="mb-3 px-3 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                    <p className="text-xs text-amber-300/70 line-clamp-3">{lead.notes}</p>
                                  </div>
                                )}

                                {/* Mobile: move to stage selector */}
                                <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                                  {Object.entries(COLUMNS).map(([key, colDef]) => (
                                    <button
                                      key={key}
                                      onClick={async () => {
                                        if (key === lead.status) return;
                                        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: key } : l));
                                        await supabase.from('crm_leads').update({ status: key }).eq('id', lead.id).eq('user_id', user.id);
                                      }}
                                      className={cn(
                                        "px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors border",
                                        lead.status === key
                                          ? "bg-zinc-700 text-white border-zinc-600"
                                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                                      )}
                                    >
                                      {colDef.name}
                                    </button>
                                  ))}
                                </div>

                                <div className="flex gap-2">
                                  {inv.email && (
                                    <button 
                                      onClick={() => copyEmail(inv.email)}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors text-zinc-300"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                      Copy Email
                                    </button>
                                  )}
                                  {inv.linkedin_url && (
                                    <a 
                                      href={inv.linkedin_url.startsWith('http') ? inv.linkedin_url : `https://${inv.linkedin_url}`}
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg text-xs transition-colors text-zinc-300"
                                    >
                                      <LinkIcon className="w-3.5 h-3.5" />
                                      LinkedIn
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
            )}
          </DragDropContext>
        )}
      </div>

      {/* Notes Modal */}
      {editingNotes && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setEditingNotes(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-5 sm:p-6">
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
              className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
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
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
