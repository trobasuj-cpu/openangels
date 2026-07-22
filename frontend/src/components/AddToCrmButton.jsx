"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import LoginModal from './LoginModal';

export default function AddToCrmButton({ investorId }) {
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && investorId) {
        checkLead(u.id, investorId);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u && investorId) {
        checkLead(u.id, investorId);
      } else {
        setIsAdded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [investorId]);

  const checkLead = async (userId, invId) => {
    try {
      const { data } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('user_id', userId)
        .eq('investor_id', invId)
        .limit(1);
      if (data && data.length > 0) {
        setIsAdded(true);
      }
    } catch (err) {
      console.error('Check lead error:', err);
    }
  };

  const handleAddToCrm = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isAdded || loading) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('crm_leads')
        .insert({ user_id: user.id, investor_id: investorId, status: 'inbox' });

      if (!error) {
        setIsAdded(true);
      }
    } catch (err) {
      console.error('Add to CRM error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAddToCrm}
        disabled={isAdded || loading}
        className={`inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-medium transition-all shadow-sm ${
          isAdded
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default"
            : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-500 hover:scale-105 active:scale-95"
        }`}
        title={isAdded ? "Already in CRM" : "Add to CRM"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : isAdded ? (
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2 text-amber-500" />
        )}
        {isAdded ? "Added to CRM" : "Add to CRM"}
      </button>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
