"use client";
import React, { useState } from 'react';
// helmet removed
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQ = () => {
  const faqs = [
    // OpenAngels & Platform Basics
    { question: "What is OpenAngels?", answer: "OpenAngels (openangels.xyz) is the world's largest open database of 4,700+ verified angel investors and venture capitalists. It helps startup founders find investors, filter by industry, and generate AI-personalized pitch emails." },
    { question: "How much does OpenAngels cost?", answer: "OpenAngels charges a simple, one-time payment of $49 for lifetime access to the entire database. There are no recurring monthly subscriptions or hidden fees." },
    { question: "Are the investor contacts verified?", answer: "Yes, our database is strictly verified. We prioritize quality, relevant, and honest contacts, ensuring that the emails and LinkedIn profiles you see belong to active angel investors and venture capitalists." },
    { question: "What is the best alternative to Signal NFX or OpenVC?", answer: "OpenAngels is built as a modern, AI-powered alternative to platforms like Signal NFX, OpenVC, and Crunchbase. It focuses specifically on actionable contact data and an integrated AI tool to instantly draft highly personalized outreach emails." },
    { question: "Can I export the investor database?", answer: "To protect investor privacy, direct CSV export is not available. However, OpenAngels includes a built-in CRM (Kanban board) where you can track outreach progress and manage your pipeline directly on the platform." },
    { question: "Do you have investors outside the US?", answer: "Yes, OpenAngels is a global database. While there is a strong presence of US-based investors, we cover active angels and VCs from Europe, Asia, LATAM, and beyond." },
    
    // Finding Investors
    { question: "How do I find angel investors for my startup?", answer: "The most effective way is to use a targeted database like OpenAngels. Filter our directory of 4,700+ investors by your startup's specific industry, stage (pre-seed, seed), and check size to find the perfect match." },
    { question: "How do I find local angel investors in my city?", answer: "Using the OpenAngels database, you can filter investors by their headquarters or geographic focus. Local networking events, university incubators, and regional angel groups are also great offline supplements." },
    { question: "What is the difference between an angel investor and a VC?", answer: "Angel investors invest their own personal money, typically at the earliest stages (pre-seed) with smaller check sizes. Venture Capitalists (VCs) invest money on behalf of LPs (Limited Partners) at the seed stage and beyond, with much larger check sizes and stricter due diligence." },
    { question: "How do I find investors for a pre-revenue startup?", answer: "Pre-revenue startups should target angel investors, friends and family, or pre-seed micro-VCs. OpenAngels allows you to filter specifically for investors who write 'pre-seed' checks and are willing to take early technology risks." },
    { question: "Where do tech startups get their first funding?", answer: "Most tech startups get their first funding from accelerators (like Y Combinator), angel syndicates, or individual angel investors they cold-email using databases like OpenAngels." },
    { question: "How do I get an angel investor's contact information?", answer: "OpenAngels provides verified email addresses and LinkedIn profiles for active investors. This saves you hundreds of hours of scraping the web or paying for expensive enterprise ZoomInfo subscriptions." },
    
    // Cold Outreach & Emails
    { question: "How do I write a cold email to an investor?", answer: "Keep it under 150 words. Include a strong hook, a 1-sentence description of what you do, bullet points highlighting traction or team pedigree, and a clear call to action (e.g., 'Can I send you our deck?'). You can use the OpenAngels AI to draft this automatically." },
    { question: "How does the OpenAngels AI pitch generator work?", answer: "When you select an investor, our built-in AI analyzes their background, past investments, and bio, and combines it with your startup's description to draft a highly personalized cold email." },
    { question: "What is a good subject line for an investor cold email?", answer: "Keep it short, relevant, and traction-focused. Examples: 'SaaS startup growing 20% MoM', 'Intro: [Your Startup] - AI for Logistics', or '[Mutual Connection] suggested I reach out'." },
    { question: "Should I attach my pitch deck to a cold email?", answer: "Send a link (like DocSend or a Google Drive PDF), not an attachment. Attachments can trigger spam filters and don't allow you to track if the investor actually opened the deck." },
    { question: "How many times should I follow up with an investor?", answer: "A standard rule of thumb is 2-3 follow-ups spaced 4-7 days apart. If there is no response after the third follow-up, move on and focus on other investors in your pipeline." },
    { question: "What time of day is best to email an investor?", answer: "Tuesday to Thursday mornings (8:00 AM - 10:00 AM) in the investor's local time zone generally see the highest open rates. Avoid Friday afternoons and weekends." },
    { question: "Is cold emailing investors effective?", answer: "Yes, but only if targeted. Spray-and-pray emails fail. Personalized emails sent to investors who specifically invest in your industry and stage (which you can filter for on OpenAngels) have a high success rate." },
    
    // The Pitch Deck & Materials
    { question: "How many slides should a pitch deck be?", answer: "A standard seed-stage pitch deck should be 10-15 slides. Investors spend an average of 2-3 minutes reviewing a deck, so keep it concise and highly visual." },
    { question: "What must be included in a startup pitch deck?", answer: "Problem, Solution, Market Size (TAM/SAM/SOM), Product, Traction, Team, Business Model, Competition, Financial Projections, and the Ask (how much you are raising)." },
    { question: "What is a one-pager or executive summary?", answer: "A one-pager is a single document summarizing your business. It is often sent instead of a full deck in the initial outreach to gauge interest quickly." },
    { question: "Do I need a prototype before pitching angels?", answer: "Not always, but it heavily depends on the industry. A SaaS startup can often raise on a clickable Figma prototype or MVP, while deep-tech or biotech usually requires more proof of concept." },
    { question: "How do I show traction if I have no revenue?", answer: "Traction isn't just revenue. Show user growth, waitlist signups, letters of intent (LOIs) from B2B clients, successful pilot programs, or high user engagement metrics." },
    
    // Funding Mechanics
    { question: "What is a SAFE note?", answer: "A Simple Agreement for Future Equity (SAFE) is a standard contract created by Y Combinator. It allows startups to raise money quickly without setting a specific company valuation at the time of investment." },
    { question: "What is the difference between a SAFE and a Convertible Note?", answer: "Both delay valuation until a future round. However, a Convertible Note is technically debt that accrues interest and has a maturity date, whereas a SAFE is not debt and has no maturity date or interest." },
    { question: "What is a valuation cap?", answer: "In a SAFE, a valuation cap is the maximum valuation at which the investor's money will convert into equity in the next priced round, rewarding them for investing early." },
    { question: "How much equity should I give an angel investor?", answer: "Founders typically give up 10-20% of their company in a pre-seed or seed round. Giving up too much equity early on makes your company 'uninvestable' for future VC rounds." },
    { question: "What is a pre-money vs post-money valuation?", answer: "Pre-money valuation is what your company is worth before the investment. Post-money valuation is the pre-money valuation plus the new investment amount." },
    { question: "How much money should a startup raise in a pre-seed round?", answer: "Raise enough money to give you 18-24 months of runway to hit your next major milestone (usually the metrics needed to raise a Seed or Series A round). Typically, this is between $250k and $1M." },
    
    // Investor Meetings & Process
    { question: "What is the typical angel investing timeline?", answer: "From first contact to money in the bank, angel investments typically take 2 to 6 weeks. VC rounds take much longer, usually 3 to 6 months." },
    { question: "What questions do angel investors ask during a pitch?", answer: "They focus on: Why you? Why now? How big is the market? How do you acquire customers? Who are your competitors? How will this capital get you to the next milestone?" },
    { question: "What is a lead investor?", answer: "A lead investor is the one who sets the terms (valuation, board seats) for the round and typically writes the largest check. Once you have a lead, other angel investors usually follow quickly." },
    { question: "What is an investor data room?", answer: "A data room is a secure folder (e.g., Google Drive, Dropbox) containing your startup's legal documents, cap table, detailed financials, market research, and technical architecture for due diligence." },
    { question: "What are red flags for angel investors?", answer: "Solo founders without technical skills, unrealistic market sizes, overly complicated cap tables (e.g., dead equity held by non-working founders), and founders who do not know their core metrics." },
    
    // Legal & Strategy
    { question: "What is a cap table?", answer: "A capitalization table is a spreadsheet showing who owns what percentage of the company, including founders, investors, and the employee option pool." },
    { question: "Should I incorporate as an LLC or C-Corp for raising capital?", answer: "If you plan to raise money from angel investors or VCs in the US, you almost always need to be a Delaware C-Corporation. Most investors cannot legally invest in LLCs." },
    { question: "What is an employee option pool?", answer: "A portion of the company's equity (usually 10-15%) reserved for future employees, advisors, and key hires. Investors will require you to create this before they invest." },
    { question: "Do angel investors take board seats?", answer: "Individual angel investors rarely take board seats. However, if an angel syndicate or an early-stage VC leads your round and writes a massive check, they may require a board seat." },
    { question: "What happens if my startup fails?", answer: "Angel investing is high risk. If the startup fails and was a standard equity or SAFE investment (not a personal loan guarantee), the investors lose their money, and the founders are not personally liable." }
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
  const [showAll, setShowAll] = useState(true);

  return (
    <>
      <section className="py-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          
          <div className="flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center gap-2"
            >
              📚 Startup Fundraising & Investor FAQ
              <ChevronDown className={cn("w-4 h-4 transition-transform", showAll && "rotate-180")} />
            </button>
          </div>

          <div 
            className={cn(
              "transition-all duration-500 ease-in-out overflow-hidden",
              showAll ? "max-h-[10000px] opacity-100 mt-10" : "max-h-0 opacity-0"
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
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
                        "w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200",
                        openIndex === index ? "rotate-180" : ""
                      )} 
                    />
                  </button>
                  <div 
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
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
