"use client";
import React from 'react';
import { X, Lock, ShieldCheck } from 'lucide-react';
import { getGumroadUrl } from '@/lib/gumroad';

export default function GumroadIframeModal({ isOpen, onClose, userEmail = '', discountCode = '' }) {
  if (!isOpen) return null;

  const checkoutUrl = getGumroadUrl(userEmail, discountCode);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[750px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-white tracking-tight">OpenAngels Lifetime Access Checkout</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 w-full bg-white relative">
          <iframe
            src={checkoutUrl}
            className="w-full h-full border-0"
            title="OpenAngels Checkout"
          />
        </div>
      </div>
    </div>
  );
}
