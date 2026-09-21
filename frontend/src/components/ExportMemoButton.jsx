"use client";
import React, { useState } from 'react';
import { FileDown, Printer, Check } from 'lucide-react';

export default function ExportMemoButton({ companyName = "Company", className = "", label, compact = false }) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const defaultLabel = compact ? "Export Memo" : "Export Due Diligence Memo (PDF)";
  const displayLabel = label || defaultLabel;

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer ${className}`}
      title={`Export Institutional Due Diligence Memo for ${companyName}`}
    >
      {exported ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Generating PDF...</span>
        </>
      ) : (
        <>
          <FileDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </>
      )}
    </button>
  );
}
