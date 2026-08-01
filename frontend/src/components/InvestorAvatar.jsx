"use client";
import React, { useState, useEffect } from 'react';

export default function InvestorAvatar({ name, avatarUrl, className = "w-11 h-11" }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const getInitials = (str) => {
    if (!str) return 'OA';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const hasValidUrl = typeof avatarUrl === 'string' && avatarUrl.trim().length > 5;

  if (hasValidUrl && !imgError) {
    return (
      <img
        loading="lazy"
        src={avatarUrl}
        alt={name || 'Investor'}
        onError={() => setImgError(true)}
        className={`${className} rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-900 shrink-0`}
      />
    );
  }

  // Red theme matching OpenAngels design system
  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-red-950/80 via-zinc-900 to-black border border-red-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-red-500/10 select-none`}
      title={name}
    >
      <span className="text-red-400 font-extrabold text-sm sm:text-base tracking-wider font-sans">
        {initials}
      </span>
    </div>
  );
}
