"use client";
import React from 'react';

/**
 * Quiet Ambient Background (Unslop craft)
 * Replaces heavy, repainting purple-blue mouse-follower with a calm, static, high-contrast dark surface.
 */
export default function BackgroundAnimation() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-zinc-950">
      {/* Subtle, calm static top ambient vignette */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 80%)'
        }}
      />
    </div>
  );
}
