import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import { absoluteUrl, LEGAL_UPDATED_LABEL } from '@/seo';

export const metadata = {
  title: 'GDPR Compliance | OpenAngels',
  description: 'Learn about your GDPR data protection rights on OpenAngels, including data access, rectification, portability, and profile erasure requests.',
  alternates: { canonical: absoluteUrl('/gdpr') },
};

export default function GDPR() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link href="/" prefetch={false} className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">GDPR Compliance</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Last updated: {LEGAL_UPDATED_LABEL}</p>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <p>
            OpenAngels is committed to complying with the General Data Protection Regulation (GDPR) to ensure the protection and privacy of our European users&apos; data.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights Under GDPR</h2>
          <p>If you are a resident of the European Economic Area (EEA), you have the following data protection rights:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>The right to access:</strong> You can request copies of your personal data.</li>
            <li><strong>The right to rectification:</strong> You can request that we correct any information you believe is inaccurate.</li>
            <li><strong>The right to erasure (&ldquo;Right to be forgotten&rdquo;):</strong> You can request that we erase your personal data under certain conditions.</li>
            <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data.</li>
            <li><strong>The right to data portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Exercising Your Rights</h2>
          <p>
            If you wish to exercise any of these rights, please contact us at <a href="mailto:tackssignals@gmail.com" className="text-amber-600 hover:underline">tackssignals@gmail.com</a>. We respond promptly and within one month at the latest.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
