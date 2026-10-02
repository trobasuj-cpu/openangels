"use client";
import React from 'react';
import { 
  TrendingUp, DollarSign, Globe, Rocket, Users, 
  Sparkles, Check, X, ArrowRight, ShieldCheck, Flame
} from 'lucide-react';
import { RADAR_SIGNAL_DEFINITIONS } from '../lib/radarSignals';

const ICON_MAP = {
  hiring: Flame,
  funding: DollarSign,
  expansion: Globe,
  product: Rocket,
  leadership: Users
};

export default function EmergingSignalsRadar({
  activeSignal = 'all',
  onSelectSignal,
  signalStats = {},
  isCompact = false,
  totalCount = 0
}) {
  // Homepage Compact Teaser Bar (For Founders view) - Sleek Ambient Telemetry Ribbon
  if (isCompact) {
    return (
      <div className="w-full relative group">
        {/* Subtle background ambient glow on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 via-zinc-800/20 to-emerald-500/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-zinc-950/75 hover:bg-zinc-950/90 border border-zinc-800/80 hover:border-zinc-700/80 shadow-lg backdrop-blur-xl transition-all">
          
          {/* Left Anchor: Pulse beacon & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-zinc-200 tracking-tight whitespace-nowrap">
              Startup Radar
            </span>
            <span className="hidden md:inline-flex text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              90d signals
            </span>
            <span className="hidden lg:block h-3.5 w-px bg-zinc-800/80" />
          </div>

          {/* Center Ticker: 5 Micro-Pills in Single Row */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1 justify-start sm:justify-center">
            {RADAR_SIGNAL_DEFINITIONS.map(sig => {
              const count = signalStats[sig.id] ?? 0;
              const isSelected = activeSignal === sig.id;
              return (
                <button
                  key={sig.id}
                  type="button"
                  onClick={() => onSelectSignal && onSelectSignal(sig.id)}
                  title={`${sig.name}: ${count} companies verified in last 90 days`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 group/pill active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent hover:border-white/10'
                  }`}
                >
                  <span className="text-[11px]">{sig.emoji}</span>
                  <span className="text-[11px] group-hover/pill:text-zinc-200">{sig.shortName}</span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                    isSelected 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Anchor: Single-line Quick Action Link */}
          <div className="shrink-0 flex items-center pl-2 sm:pl-3 border-l border-zinc-800/80">
            <button
              type="button"
              onClick={() => onSelectSignal && onSelectSignal('all')}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer whitespace-nowrap group/link"
            >
              <span>Explore</span>
              <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Full Interactive Radar telemetry dashboard (For Investors & Scouts view)
  const activeDef = RADAR_SIGNAL_DEFINITIONS.find(s => s.id === activeSignal);

  return (
    <div className="space-y-4">
      {/* Widget Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Emerging Signals Radar</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-medium">90-Day Observation Window</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300">
            Select an emerging temporal signal below to isolate high-velocity startups verified by SEC filings, talent flows, and product telemetry.
          </p>
        </div>

        {/* Global Reset Button if filter is active */}
        {activeSignal !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectSignal('all')}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset to All ({totalCount || signalStats.all || 0})</span>
          </button>
        )}
      </div>

      {/* 5 Interactive Signal Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {RADAR_SIGNAL_DEFINITIONS.map(sig => {
          const Icon = ICON_MAP[sig.id] || Sparkles;
          const count = signalStats[sig.id] ?? 0;
          const isSelected = activeSignal === sig.id;

          return (
            <button
              key={sig.id}
              type="button"
              onClick={() => onSelectSignal(isSelected ? 'all' : sig.id)}
              className={`p-4 rounded-2xl text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between group cursor-pointer border ${
                isSelected
                  ? `${sig.activeBg} ring-2 ring-emerald-500/40 scale-[1.02]`
                  : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/90 hover:border-zinc-700 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Active selection glow pill */}
              {isSelected && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-mono font-black text-emerald-400">
                  <Check className="w-2.5 h-2.5" />
                  <span>ACTIVE</span>
                </div>
              )}

              <div>
                {/* Icon & Emoji Row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner ${
                    isSelected ? 'bg-zinc-950 border border-zinc-700' : 'bg-zinc-950/70 border border-zinc-800 group-hover:border-zinc-700'
                  }`}>
                    <span>{sig.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block truncate">
                      Signal {sig.shortName}
                    </span>
                  </div>
                </div>

                {/* Signal Title */}
                <div className={`text-xs sm:text-sm font-extrabold leading-snug line-clamp-1 transition-colors ${
                  isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                }`}>
                  {sig.name}
                </div>
              </div>

              {/* Company Count & Live Indicator */}
              <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-baseline justify-between">
                <div>
                  <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                    isSelected ? sig.activeText : 'text-white group-hover:text-emerald-300'
                  }`}>
                    {count}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-400 ml-1.5">
                    companies
                  </span>
                </div>

                <span className={`w-2 h-2 rounded-full ${isSelected ? `${sig.dotClass} animate-pulse` : 'bg-zinc-700 group-hover:bg-zinc-500'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Signal Filter Notice & Quick Clear Bar */}
      {activeDef && (
        <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-xs text-zinc-200">
              <span className="font-mono text-zinc-400 uppercase mr-1">Active Radar Filter:</span>
              <span className="font-bold text-white mr-1.5">{activeDef.emoji} {activeDef.name}</span>
              <span className="font-mono text-emerald-400 font-bold">({signalStats[activeDef.id] || 0} companies)</span>
              <span className="hidden md:inline text-zinc-400 text-xs ml-2">— {activeDef.shortDesc}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectSignal('all')}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear signal filter</span>
          </button>
        </div>
      )}
    </div>
  );
}
