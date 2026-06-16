import React from 'react';
import { Helmet } from 'react-helmet-async';

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

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <section className="py-24 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Everything you need to know about the OpenAngels database and fundraising.
          </p>
        </div>
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800/50">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {faq.question}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
};

export default FAQ;
