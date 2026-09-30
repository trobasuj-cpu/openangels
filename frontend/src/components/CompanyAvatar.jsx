"use client";
import React, { useState, useEffect } from 'react';

/**
 * CompanyAvatar - High-fidelity company logo loader with fallback chain:
 * 1. Custom avatarUrl (if provided)
 * 2. High-resolution Clearbit / Google favicon
 * 3. Gradient Brand Monogram with 2-letter uppercase initials
 */
export default function CompanyAvatar({ name, domain, avatarUrl, className = "w-12 h-12" }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Clean domain helper
  const cleanDomain = React.useMemo(() => {
    if (!domain || typeof domain !== 'string') return '';
    return domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();
  }, [domain]);

  // Candidates list in order of resolution quality
  const candidateUrls = React.useMemo(() => {
    const list = [];
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 5) {
      list.push(avatarUrl);
    }
    if (cleanDomain && cleanDomain.includes('.')) {
      list.push(`https://unavatar.io/${cleanDomain}?fallback=false`);
      list.push(`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`);
    }
    return list;
  }, [avatarUrl, cleanDomain]);

  useEffect(() => {
    setSourceIndex(0);
    setHasError(false);
  }, [avatarUrl, cleanDomain]);

  const handleImgError = () => {
    if (sourceIndex + 1 < candidateUrls.length) {
      setSourceIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return 'CO';
    const words = str.trim().split(/[\s\-_\.]+/).filter(Boolean);
    if (words.length === 0) return 'CO';
    if (words.length === 1) {
      return (words[0].slice(0, 2) || 'CO').toUpperCase();
    }
    const first = words[0]?.[0] || 'C';
    const second = words[1]?.[0] || words[0]?.[1] || 'O';
    return (first + second).toUpperCase();
  };

  const initials = getInitials(name);

  // Deterministic gradient tint for brand monogram
  const getGradient = (str) => {
    const safeStr = typeof str === 'string' && str.length > 0 ? str : 'A';
    const code = safeStr.charCodeAt(0);
    if (code % 4 === 0) return 'from-emerald-950 via-zinc-900 to-zinc-950 text-emerald-400 border-emerald-500/30';
    if (code % 4 === 1) return 'from-blue-950 via-zinc-900 to-zinc-950 text-blue-400 border-blue-500/30';
    if (code % 4 === 2) return 'from-purple-950 via-zinc-900 to-zinc-950 text-purple-400 border-purple-500/30';
    return 'from-amber-950 via-zinc-900 to-zinc-950 text-amber-400 border-amber-500/30';
  };

  const currentUrl = candidateUrls[sourceIndex];

  if (currentUrl && !hasError) {
    return (
      <div className={`${className} rounded-2xl bg-zinc-950 border border-zinc-800/80 p-2 flex items-center justify-center shrink-0 shadow-md group-hover:border-emerald-500/40 transition-colors overflow-hidden`}>
        <img
          loading="lazy"
          src={currentUrl}
          alt={name || 'Company'}
          onError={handleImgError}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Fallback to high-grade brand squircle monogram
  const gradientStyle = getGradient(name);

  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-br ${gradientStyle} border flex items-center justify-center shrink-0 shadow-md select-none group-hover:scale-105 transition-transform`}
      title={name}
    >
      <span className="font-black text-sm tracking-wider font-mono">
        {initials}
      </span>
    </div>
  );
}
