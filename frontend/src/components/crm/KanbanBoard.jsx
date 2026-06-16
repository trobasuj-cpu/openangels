import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Building2, Mail, Link as LinkIcon, Search } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { supabase } from '../../lib/supabase.js';

const COLUMNS = {
  inbox: { name: 'Inbox', color: 'border-blue-500/30' },
  contacted: { name: 'Contacted', color: 'border-purple-500/30' },
  meeting_set: { name: 'Meeting Set', color: 'border-yellow-500/30' },
  dd: { name: 'Due Diligence', color: 'border-orange-500/30' },
  won: { name: 'Closed Won', color: 'border-green-500/30' },
  lost: { name: 'Closed Lost', color: 'border-red-500/30' }
};

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase
        .from('investors')
        .select('id, name, bio, linkedin_url, email, linkedin_source, type')
        .eq('type', 'lead');
      
      if (!error && data) {
        // Map data to expected format
        const mapped = data.map(d => ({
          id: d.id,
          full_name: d.name,
          title: d.bio ? d.bio.split('@')[0].trim() : '',
          company: d.bio && d.bio.includes('@') ? d.bio.split('@')[1].trim() : (d.company || 'Unknown'),
          linkedin_url: d.linkedin_url,
          email: d.email,
          status: d.linkedin_source || 'inbox'
        }));
        setLeads(mapped);
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(l => 
    l.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    l.company?.toLowerCase().includes(search.toLowerCase())
  );

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
        .from('investors')
        .update({ linkedin_source: destination.droppableId })
        .eq('id', draggableId);
    }
  };

  const copyEmail = (email) => {
    if (email) navigator.clipboard.writeText(email);
    // Could add toast notification here
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Investor CRM</h1>
            <p className="text-slate-400">Manage your outreach pipeline with 1,000+ YC founders.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm w-64 transition-all"
            />
          </div>
        </header>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-8 items-start">
            {columns.map(col => (
              <div key={col.id} className="flex-shrink-0 w-[320px] flex flex-col gap-4">
                <div className={cn("flex items-center justify-between pb-2 border-b-2", col.color)}>
                  <h2 className="font-semibold text-slate-300">{col.name}</h2>
                  <span className="text-xs bg-slate-800 text-slate-400 py-1 px-2 rounded-full">
                    {col.items.length}
                  </span>
                </div>
                
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={cn(
                        "min-h-[500px] rounded-xl transition-colors p-2 -mx-2",
                        snapshot.isDraggingOver ? "bg-slate-900/50" : ""
                      )}
                    >
                      {col.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "group bg-slate-900 border border-slate-800 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all",
                                snapshot.isDragging ? "ring-2 ring-blue-500/50 rotate-2 opacity-90 scale-105" : "hover:border-slate-700"
                              )}
                              style={provided.draggableProps.style}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-medium text-slate-200">{item.full_name}</h3>
                                  <p className="text-xs text-slate-400">{item.title}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-300 border border-slate-700">
                                  {item.full_name.split(' ').map(n => n[0]).join('')}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                                <Building2 className="w-3.5 h-3.5" />
                                {item.company}
                              </div>

                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => copyEmail(item.email)}
                                  className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors"
                                  title="Copy Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Email
                                </button>
                                {item.linkedin_url && (
                                  <a 
                                    href={item.linkedin_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 rounded text-xs transition-colors"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    LinkedIn
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
