'use client';
import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { INDUSTRY_PAGES } from '../seo.js';
import { useInvestorCount } from './InvestorCountProvider';

export default function Footer() {
  const { seoLabel } = useInvestorCount();
  const footerIndustries = INDUSTRY_PAGES.slice(0, 8);

  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <Link href="/" prefetch={false} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 transition-colors">
              <span className="text-xs font-bold tracking-tight">OA</span>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              OpenAngels
            </span>
          </Link>
          <p className="text-sm leading-relaxed">
            A curated database of {seoLabel} angel investors and VCs for founders raising pre-seed and seed rounds.
          </p>
          <a href="mailto:tackssignals@gmail.com" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
            <Mail className="w-4 h-4" />
            tackssignals@gmail.com
          </a>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Company &amp; Trust</h2>
          <ul className="space-y-3 text-sm">
            <li><Link href="/methodology" prefetch={false} className="hover:text-white transition-colors">Verification methodology</Link></li>
            <li><Link href="/contact" prefetch={false} className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/terms" prefetch={false} className="hover:text-white transition-colors">Terms of service</Link></li>
            <li><Link href="/refund" prefetch={false} className="hover:text-white transition-colors">Refund policy</Link></li>
            <li><Link href="/privacy" prefetch={false} className="hover:text-white transition-colors">Privacy policy</Link></li>
            <li><Link href="/gdpr" prefetch={false} className="hover:text-white transition-colors">GDPR</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Investor Lists by Sector</h2>
          <ul className="space-y-2.5 text-sm">
            {footerIndustries.map((page) => (
              <li key={page.slug}>
                <Link href={`/investors/${page.slug}`} prefetch={false} className="hover:text-white transition-colors">
                  {page.label} investors
                </Link>
              </li>
            ))}
            <li>
              <Link href="/directory" prefetch={false} className="text-amber-400 hover:text-amber-300 transition-colors font-medium text-xs">
                View all sector &amp; geo lists →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-white font-semibold mb-4">Key Hubs &amp; Directory</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/directory" prefetch={false} className="hover:text-white transition-colors">A–Z Investor Directory</Link></li>
            <li><Link href="/investors/silicon-valley" prefetch={false} className="hover:text-white transition-colors">Silicon Valley angels</Link></li>
            <li><Link href="/investors/san-francisco" prefetch={false} className="hover:text-white transition-colors">San Francisco angels</Link></li>
            <li><Link href="/investors/new-york" prefetch={false} className="hover:text-white transition-colors">New York angels</Link></li>
            <li><Link href="/investors/ai/seed" prefetch={false} className="hover:text-white transition-colors">AI Seed investors</Link></li>
            <li><Link href="/investors/saas/pre-seed" prefetch={false} className="hover:text-white transition-colors">SaaS Pre-Seed investors</Link></li>
            <li><Link href="/crm" prefetch={false} rel="nofollow" className="hover:text-white transition-colors">Fundraising CRM</Link></li>
          </ul>
        </div>
      </div>

      {/* Featured Indexed Angel Profiles & Startup Dossiers Internal Link Graph */}
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-zinc-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="shrink-0 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Featured Angel Investors:
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
            <Link href="/investor/sam-altman" prefetch={false} className="hover:text-white transition-colors">Sam Altman</Link>
            <Link href="/investor/naval-ravikant" prefetch={false} className="hover:text-white transition-colors">Naval Ravikant</Link>
            <Link href="/investor/lenny-rachitsky" prefetch={false} className="hover:text-white transition-colors">Lenny Rachitsky</Link>
            <Link href="/investor/pieter-levels" prefetch={false} className="hover:text-white transition-colors">Pieter Levels</Link>
            <Link href="/investor/elad-gil" prefetch={false} className="hover:text-white transition-colors">Elad Gil</Link>
            <Link href="/investor/greg-brockman" prefetch={false} className="hover:text-white transition-colors">Greg Brockman</Link>
            <Link href="/investor/paul-graham" prefetch={false} className="hover:text-white transition-colors">Paul Graham</Link>
            <Link href="/investor/peter-thiel" prefetch={false} className="hover:text-white transition-colors">Peter Thiel</Link>
            <Link href="/investor/garry-tan" prefetch={false} className="hover:text-white transition-colors">Garry Tan</Link>
            <Link href="/investor/packy-mccormick" prefetch={false} className="hover:text-white transition-colors">Packy McCormick</Link>
            <Link href="/investor/reid-hoffman" prefetch={false} className="hover:text-white transition-colors">Reid Hoffman</Link>
            <Link href="/investor/balaji-srinivasan" prefetch={false} className="hover:text-white transition-colors">Balaji Srinivasan</Link>
            <Link href="/investor/dylan-field" prefetch={false} className="hover:text-white transition-colors">Dylan Field</Link>
            <Link href="/investor/jason-calacanis" prefetch={false} className="hover:text-white transition-colors">Jason Calacanis</Link>
            <Link href="/investor/howard-hartenbaum" prefetch={false} className="hover:text-white transition-colors">Howard Hartenbaum</Link>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4 pt-3 border-t border-zinc-900/60">
          <div className="shrink-0 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Verified Company Dossiers:
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
            <Link href="/company/openai" prefetch={false} className="hover:text-white transition-colors">OpenAI</Link>
            <Link href="/company/stripe" prefetch={false} className="hover:text-white transition-colors">Stripe</Link>
            <Link href="/company/perplexity" prefetch={false} className="hover:text-white transition-colors">Perplexity</Link>
            <Link href="/company/cursor" prefetch={false} className="hover:text-white transition-colors">Cursor</Link>
            <Link href="/company/twitter" prefetch={false} className="hover:text-white transition-colors">Twitter (X)</Link>
            <Link href="/company/linkedin" prefetch={false} className="hover:text-white transition-colors">LinkedIn</Link>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4 pt-3 border-t border-zinc-900/60">
          <div className="shrink-0 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
            Browse Directory A–Z:
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-xs font-mono text-zinc-400">
            {'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => (
              <Link key={l} href={`/directory/${l}`} prefetch={false} className="hover:text-white transition-colors uppercase py-1 px-1">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-400">
        <p>Copyright 2026 OpenAngels. All rights reserved.</p>
        <p>Responsible founder-to-investor outreach, without spam.</p>
      </div>
    </footer>
  );
}
