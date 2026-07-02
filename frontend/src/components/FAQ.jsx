'use client';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { INVESTOR_COUNT } from '../seo.js';

const FAQ = () => {
  const faqs = [
    {
      question: 'What is OpenAngels?',
      answer: `OpenAngels is a curated database of ${INVESTOR_COUNT} angel investors and venture capitalists. Founders use it to search investors by industry, stage, location, and check size, then manage outreach from one workspace.`,
    },
    {
      question: 'How much does OpenAngels cost?',
      answer: 'OpenAngels offers lifetime premium access through a one-time payment. The checkout page shows the current price and any active launch discounts before purchase.',
    },
    {
      question: 'What contact information is included?',
      answer: 'Investor profiles can include email, LinkedIn, website, location, investment stage, check size, industries, and short bio details when available.',
    },
    {
      question: 'Can I find investors by industry?',
      answer: 'Yes. You can filter the database by sectors such as SaaS, AI, fintech, marketplace, consumer, enterprise, developer tools, health, climate, security, and more.',
    },
    {
      question: 'Does OpenAngels help write investor emails?',
      answer: 'Yes. The AI pitch tool uses your startup description and the investor profile to draft a concise, personalized first message that you can edit before sending.',
    },
    {
      question: 'Is there a fundraising CRM?',
      answer: 'Yes. OpenAngels includes a CRM-style pipeline so you can save investors, track outreach stages, and keep fundraising work organized.',
    },
    {
      question: 'Can I export investor data?',
      answer: 'OpenAngels focuses on responsible outreach. Some matched shortlists can be exported from the AI matching flow, while the full database is designed to be used inside the product and CRM.',
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

  const [openIndex, setOpenIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="py-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center gap-2"
            >
              Startup Fundraising and Investor FAQ
              <ChevronDown className={cn('w-4 h-4 transition-transform', showAll && 'rotate-180')} />
            </button>
          </div>

          <div
            className={cn(
              'transition-all duration-500 ease-in-out overflow-hidden',
              showAll ? 'max-h-[3000px] opacity-100 mt-10' : 'max-h-0 opacity-0'
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                    className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200',
                        openIndex === index ? 'rotate-180' : ''
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <p className="p-4 pt-0 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
