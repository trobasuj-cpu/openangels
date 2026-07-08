import React from 'react';
import Link from 'next/link';
import { Mail, Sparkles } from 'lucide-react';
import { INDUSTRY_PAGES, INVESTOR_COUNT } from '../seo.js';

export default function Footer() {
  const footerIndustries = INDUSTRY_PAGES.slice(0, 6);

  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              OpenAngels
            </span>
          </Link>
          <p className="text-sm leading-relaxed">
            A curated database of {INVESTOR_COUNT} angel investors and VCs for founders raising pre-seed and seed rounds.
          </p>
          <a href="mailto:support@openangels.xyz" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-amber-500 transition-colors">
            <Mail className="w-4 h-4" />
            support@openangels.xyz
          </a>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Company and Legal</h2>
          <ul className="space-y-3 text-sm">
            <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contact</Link></li>
            <li><Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of service</Link></li>
            <li><Link href="/refund" className="hover:text-amber-500 transition-colors">Refund policy</Link></li>
            <li><Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy policy</Link></li>
            <li><Link href="/gdpr" className="hover:text-amber-500 transition-colors">GDPR</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Investor Lists</h2>
          <ul className="space-y-3 text-sm">
            {footerIndustries.map((page) => (
              <li key={page.slug}>
                <Link href={`/investors/${page.slug}`} className="hover:text-amber-500 transition-colors">
                  {page.label} investors
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Fundraising Tools</h2>
          <ul className="space-y-3 text-sm">
            <li><Link href="/investors/all" className="hover:text-amber-500 transition-colors">Investor database</Link></li>
            <li><Link href="/crm" className="hover:text-amber-500 transition-colors">Fundraising CRM</Link></li>
            <li><a href="mailto:support@openangels.xyz" className="hover:text-amber-500 transition-colors">Suggest an investor</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        <p>Copyright {new Date().getFullYear()} OpenAngels. All rights reserved.</p>
        <p>Responsible founder-to-investor outreach, without spam.</p>
      </div>
    </footer>
  );
}
