'use client';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useInvestorCount } from './InvestorCountProvider';

const FAQ = () => {
  const { seoLabel } = useInvestorCount();
  const faqs = [
    {
      question: 'What is OpenAngels?',
      answer: `OpenAngels is a curated database of ${seoLabel} angel investors and venture capitalists. Founders use it to search investors by industry, stage, location, and check size, then manage outreach from one workspace.`,
    },
    {
      question: 'How much does OpenAngels cost?',
      answer: 'OpenAngels offers lifetime premium access through a one-time $49 payment with no recurring monthly subscriptions. The checkout modal shows any active launch discounts before purchase.',
    },
    {
      question: 'What contact information is included?',
      answer: 'Investor profiles include verified direct pitch emails (for Premium members), LinkedIn, X/Twitter, website, location, investment stage, check size, industries, and portfolio history when available.',
    },
    {
      question: 'Can I find investors by industry?',
      answer: 'Yes. You can filter the database by 90+ sectors including SaaS, AI, fintech, marketplace, consumer, enterprise, developer tools, health, climate, biotech, security, and more.',
    },
    {
      question: 'Does OpenAngels help write investor emails?',
      answer: 'Yes. The AI pitch tool uses your startup description and the investor profile to draft a concise, personalized first message tailored to their portfolio thesis.',
    },
    {
      question: 'Is there a fundraising CRM?',
      answer: 'Yes. OpenAngels includes a built-in Kanban fundraising CRM so you can save investors, track outreach stages, and keep fundraising work organized.',
    },
    {
      question: 'Can I export investor shortlists?',
      answer: 'Yes. OpenAngels focuses on responsible, targeted founder outreach — you can export matched investor shortlists from the AI matching workflow and manage your pipeline inside the built-in CRM.',
    },
    {
      question: 'Is OpenAngels a broker or investment advisor?',
      answer: 'No. OpenAngels is an informational software product for founder outreach. It does not guarantee funding, investor replies, or investment outcomes.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // Visible by default so FAQPage structured data complies with Google visible-content guidelines
  const [showAll, setShowAll] = useState(true);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="py-10 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" aria-labelledby="home-faq-heading">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 id="home-faq-heading" className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Startup Fundraising &amp; Investor FAQ
            </h2>
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              aria-expanded={showAll}
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showAll ? 'Hide FAQ' : 'Show FAQ'}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', showAll && 'rotate-180')} />
            </button>
          </div>

          {showAll && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  open
                  className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/70 overflow-hidden"
                >
                  <summary className="w-full flex items-center justify-between p-4 text-left cursor-pointer list-none">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  </summary>
                  <p className="p-4 pt-0 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default FAQ;
