import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Database, MailCheck, RefreshCw, Scale } from 'lucide-react';
import Footer from '@/components/Footer';
import { absoluteUrl, DEFAULT_OG_IMAGE, getDynamicInvestorCount, LEGAL_UPDATED_LABEL } from '@/seo';

export const revalidate = 3600;

export async function generateMetadata() {
  const { seoLabel } = await getDynamicInvestorCount();
  const title = `Data Verification Methodology (${seoLabel} Profiles) | OpenAngels`;
  const description = `How OpenAngels aggregates, deduplicates, SMTP-verifies, and updates ${seoLabel} angel investor dossiers, check sizes, and portfolio records.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl('/methodology') },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/methodology'),
      siteName: 'OpenAngels',
      images: [DEFAULT_OG_IMAGE],
      type: 'article',
    },
  };
}

export default async function MethodologyPage() {
  const { seoLabel, formatted } = await getDynamicInvestorCount();

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'OpenAngels Data Verification Methodology',
    url: absoluteUrl('/methodology'),
    isPartOf: { '@id': absoluteUrl('/#website') },
    description: `How OpenAngels verifies and maintains ${seoLabel} early-stage angel investor and VC profiles.`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Verification Methodology', item: absoluteUrl('/methodology') },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-10">
        <div>
          <Link href="/" prefetch={false} className="inline-flex items-center gap-2 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Integrity &amp; Provenance Standard • Updated {LEGAL_UPDATED_LABEL}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            How OpenAngels Verifies {seoLabel} Angel Investor Profiles
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Founders waste hundreds of hours pitching inactive spreadsheets and bouncing emails. OpenAngels maintains {formatted} investor profiles through a multi-stage automated ingestion, deduplication, and SMTP validation pipeline.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <section className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <Database className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">1. Multi-Source Public Registry Ingestion</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We cross-reference public SEC Form D filings, venture syndicate disclosures, accelerator alumni directories, startup press announcements, and publicly listed founder-angel social profiles.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <MailCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">2. MX &amp; SMTP Deliverability Checks</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every direct pitch email passes domain MX validation, disposable/role-account filtering, and SMTP handshake checks before being marked verified. Direct mailboxes are protected behind authentication to prevent scraper abuse.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <RefreshCw className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white">3. Continuous Deduplication &amp; Normalization</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Profiles are deduplicated across canonical slugs, normalized across 90+ sector taxonomies and funding stages (Pre-Seed, Seed, Series A), and scored by completeness (bio, portfolio deals, check size, social proof).
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2.5">
            <Scale className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">4. Investor Privacy &amp; Instant Opt-Out</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              OpenAngels operates strictly as an informational directory for responsible founder outreach. Any investor can request profile edits, thesis updates, or full removal under GDPR via our{' '}
              <Link href="/contact" prefetch={false} className="text-amber-400 hover:underline">Contact page</Link>.
            </p>
          </section>
        </div>

        <section className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Explore the Verified Dataset</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Browse {seoLabel} angel investors by sector, funding stage, geography, or alphabetical A–Z index.
            </p>
          </div>
          <Link
            href="/directory"
            prefetch={false}
            className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-colors shrink-0"
          >
            Open Directory →
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
