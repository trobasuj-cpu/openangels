import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Building2, Mail, Link as LinkIcon, Search, ArrowLeft, Plus, Trash2, StickyNote, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { supabase } from '../../lib/supabase.js';

const COLUMNS = {
  inbox: { name: '📥 Saved', color: 'border-blue-500/30', bg: 'bg-blue-500/5' },
  contacted: { name: '📤 Contacted', color: 'border-purple-500/30', bg: 'bg-purple-500/5' },
  meeting_set: { name: '📅 Meeting Set', color: 'border-yellow-500/30', bg: 'bg-yellow-500/5' },
  dd: { name: '🔍 Due Diligence', color: 'border-orange-500/30', bg: 'bg-orange-500/5' },
  won: { name: '✅ Committed', color: 'border-green-500/30', bg: 'bg-green-500/5' },
  lost: { name: '❌ Passed', color: 'border-red-500/30', bg: 'bg-red-500/5' }
};

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null); // crm_lead id
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
      // Optimistic update
      setLeads(prev => prev.map(l => 
        l.id === draggableId ? { ...l, status: destination.droppableId } : l
      ));
      
      // Update DB
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
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-8 font-sans">
        <h1 className="text-3xl font-bold text-white mb-4">Investor CRM</h1>
        <p className="text-slate-400 mb-8">Sign in to access your personal investor pipeline.</p>
        <Link 
          to="/"
          className="px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/" className="text-slate-500 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-white">Investor CRM</h1>
            </div>
            <p className="text-slate-400 ml-8">
              {leads.length} investor{leads.length !== 1 ? 's' : ''} in your pipeline
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search your pipeline..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm w-64 transition-all"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6">📋</div>
            <h2 className="text-2xl font-bold text-white mb-3">Your pipeline is empty</h2>
            <p className="text-slate-400 mb-8 max-w-md">
              Go to the investor database and click <strong>+ Add to CRM</strong> on any investor card to start building your outreach pipeline.
            </p>
            <Link 
              to="/"
              className="px-6 py-3 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
            >
              Browse Investors →
            </Link>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-5 overflow-x-auto pb-8 items-start">
              {columns.map(col => (
                <div key={col.id} className="flex-shrink-0 w-[300px] flex flex-col gap-3">
                  <div className={cn("flex items-center justify-between pb-2 border-b-2", col.color)}>
                    <h2 className="font-semibold text-slate-300 text-sm">{col.name}</h2>
                    <span className="text-xs bg-slate-800 text-slate-400 py-1 px-2.5 rounded-full font-medium">
                      {col.items.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className={cn(
                          "min-h-[400px] rounded-xl transition-colors p-2 -mx-2",
                          snapshot.isDraggingOver ? cn("bg-slate-900/50", col.bg) : ""
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
                                    "group bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3 shadow-sm hover:shadow-md transition-all",
                                    snapshot.isDragging ? "ring-2 ring-blue-500/50 rotate-1 opacity-90 scale-105" : "hover:border-slate-700"
                                  )}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-medium text-slate-200 text-sm truncate">{inv.name}</h3>
                                      <p className="text-xs text-slate-500 truncate mt-0.5">{inv.location || ''}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => { setEditingNotes(lead.id); setNotesText(lead.notes || ''); }}
                                        className="p-1 hover:bg-slate-800 rounded transition-colors"
                                        title="Notes"
                                      >
                                        <StickyNote className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400" />
                                      </button>
                                      <button 
                                        onClick={() => removeLead(lead.id)}
                                        className="p-1 hover:bg-red-950/50 rounded transition-colors"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                                      </button>
                                    </div>
                                  </div>

                                  {inv.bio && (
                                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                                      {inv.bio}
                                    </p>
                                  )}

                                  {lead.notes && (
                                    <div className="mb-3 px-2.5 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                      <p className="text-xs text-amber-300/80 line-clamp-2">{lead.notes}</p>
                                    </div>
                                  )}

                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {inv.email && (
                                      <button 
                                        onClick={() => copyEmail(inv.email)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors"
                                        title="Copy Email"
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                        Email
                                      </button>
                                    )}
                                    {inv.linkedin_url && (
                                      <a 
                                        href={inv.linkedin_url.startsWith('http') ? inv.linkedin_url : `https://${inv.linkedin_url}`}
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg text-xs transition-colors"
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
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      {/* Notes Modal */}
      {editingNotes && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditingNotes(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">📝 Notes</h3>
              <button onClick={() => setEditingNotes(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add your personal notes about this investor..."
              className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingNotes(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
