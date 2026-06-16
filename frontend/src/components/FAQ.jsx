import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQ = () => {
  const faqs = [
    {
      question: "What is OpenAngels?",
      answer: "OpenAngels (openangels.xyz) is the world's largest open database of 4,700+ verified angel investors and venture capitalists. It helps startup founders find investors, filter by industry, and generate AI-personalized pitch emails."
    },
    {
      question: "How do I find angel investors for my startup?",
      answer: "The most effective way to find angel investors is to use a targeted database like OpenAngels. You can filter our directory of 4,700+ investors by your startup's specific industry (e.g., SaaS, AI, HealthTech), stage, and check size to find the perfect match."
    },
    {
      question: "How do I get an angel investor's contact information?",
      answer: "OpenAngels provides verified email addresses and LinkedIn profiles for active angel investors. Unlike subscription platforms, OpenAngels offers lifetime access to these contacts to help you confidently send your cold emails and pitches."
    },
    {
      question: "What is the best alternative to Signal NFX or OpenVC?",
      answer: "OpenAngels is built as a modern, AI-powered alternative to platforms like Signal NFX, OpenVC, and Crunchbase. It focuses specifically on actionable contact data, offering direct emails and an integrated AI tool to instantly draft highly personalized outreach emails based on the investor's past portfolio."
    },
    {
      question: "How much does OpenAngels cost?",
      answer: "OpenAngels charges a simple, one-time payment of $49 for lifetime access to the entire database of 4,700+ investors. There are no recurring monthly subscriptions or hidden fees."
    },
    {
      question: "Are the investor contacts verified?",
      answer: "Yes, our database is strictly verified. We prioritize quality, relevant, and honest contacts, ensuring that the emails and LinkedIn profiles you see belong to active angel investors and venture capitalists."
    },
    {
      question: "How does the AI pitch email generator work?",
      answer: "When you select an investor, our built-in AI tool analyzes the investor's background, past investments, and bio, and combines it with your startup's description to draft a highly personalized, compelling cold email ready to be sent."
    },
    {
      question: "Can I export the investor database?",
      answer: "While direct CSV export is not available to protect the privacy of the investors, OpenAngels includes a built-in CRM (Kanban board) where you can track your outreach progress, move leads through stages, and manage your fundraising pipeline directly on the platform."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <section className="py-24 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Everything you need to know about the OpenAngels database and fundraising.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 pr-8">
                    {faq.question}
                  </h3>
                  <ChevronDown 
                    className={cn(
                      "w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform duration-200",
                      openIndex === index ? "rotate-180" : ""
                    )} 
                  />
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="p-6 pt-0 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
