"use client";
import React, { useState } from 'react';

export default function InvestorAvatar({ name, avatarUrl, className = "w-11 h-11" }) {
  const [imgError, setImgError] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'OA';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  if (avatarUrl && !imgError) {
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

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-amber-500/30 dark:border-amber-500/25 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10 select-none`}
      title={name}
    >
      <span className="text-amber-400 font-bold text-xs sm:text-sm tracking-wider font-mono">
        {initials}
      </span>
    </div>
  );
}
