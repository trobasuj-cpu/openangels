import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ExternalLink, Mail, MapPin, Briefcase, DollarSign, Sparkles } from 'lucide-react';
import Footer from '../components/Footer';

export default function IndustryInvestors() {
  const { industry } = useParams();
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize industry for display (e.g. "saas" -> "SaaS", "ai" -> "AI")
  const formattedIndustry = useMemo(() => {
    if (!industry) return '';
    const upper = ['ai', 'saas', 'api', 'b2b'];
    if (upper.includes(industry.toLowerCase())) return industry.toUpperCase();
    return industry.charAt(0).toUpperCase() + industry.slice(1).replace(/-/g, ' ');
  }, [industry]);

  useEffect(() => {
    const fetchInvestors = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('investors_secure')
          .select('*')
          // We filter in JS because industries are sometimes arrays, sometimes strings, sometimes JSON in Supabase
        if (data) {
          setInvestors(data);
        }
      } catch (err) {
        console.error("Error fetching investors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestors();
  }, []);

  const matchedInvestors = useMemo(() => {
    if (!industry) return [];
    const searchInd = industry.toLowerCase();
    
    return investors.filter(inv => {
      const invIndustries = (() => {
        const raw = inv.industry || inv.industries;
        return Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
      })();
      return invIndustries.some(i => i.toLowerCase().includes(searchInd));
    }).sort((a, b) => {
      // Sort to have complete profiles first
      const aScore = (a.bio ? 1 : 0) + (a.email ? 1 : 0);
      const bScore = (b.bio ? 1 : 0) + (b.email ? 1 : 0);
      return bScore - aScore;
    });
  }, [investors, industry]);

  const displayInvestors = matchedInvestors.slice(0, 50); // Show top 50 on the SEO page

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30">
      <Helmet>
        <title>Top {formattedIndustry} Angel Investors (2026) | OpenAngels</title>
        <meta name="description" content={`Are you building a ${formattedIndustry} startup? Connect with the most active angel investors in the ${formattedIndustry} space. Access our database of 4,700+ investors and generate personalized pitches with AI.`} />
        <meta property="og:title" content={`Top ${formattedIndustry} Angel Investors`} />
        <meta property="og:description" content={`Connect with ${matchedInvestors.length}+ ${formattedIndustry} angel investors. Get their emails and pitch them using our AI tools.`} />
      </Helmet>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Database
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Top {formattedIndustry} Angel Investors <span className="text-zinc-500 dark:text-zinc-500 font-medium">({new Date().getFullYear()})</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            Are you raising capital for your {formattedIndustry} startup? We have compiled a verified list of the most active angel investors and venture capitalists focused on the {formattedIndustry} sector. 
            Below is a preview of top investors.
          </p>
        </div>

        <div className="mb-12 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">
              Found {matchedInvestors.length} {formattedIndustry} Investors
            </h3>
            <p className="text-amber-700 dark:text-amber-500/80">
              Unlock the full database to get all verified email addresses, LinkedIn profiles, and our AI Pitch Generator.
            </p>
          </div>
          <Link to="/" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl whitespace-nowrap shadow-lg shadow-amber-500/25 transition-all">
            Unlock Full Access
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 mb-16">
            {displayInvestors.map(inv => (
              <div key={inv.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row gap-6 hover:border-amber-500/50 transition-colors group">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold">{inv.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {inv.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {inv.location}
                      </div>
                    )}
                    {(inv.check_min || inv.check_max) && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        {inv.check_min ? `$${(inv.check_min/1000)}k` : '$0'} - {inv.check_max ? `$${(inv.check_max/1000)}k` : 'Max'}
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {inv.bio || "Active angel investor in the space."}
                  </p>
                </div>
                <div className="flex items-center md:items-end justify-start md:justify-end">
                  <Link to="/" className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-zinc-900 dark:text-amber-500 font-medium rounded-xl text-sm transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Reveal Email
                  </Link>
                </div>
              </div>
            ))}
            
            {matchedInvestors.length > displayInvestors.length && (
              <div className="pt-8 text-center mb-16">
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl transition-colors shadow-lg">
                  <Sparkles className="w-5 h-5" />
                  View all {matchedInvestors.length} Investors
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">How to find and pitch {formattedIndustry} Angel Investors</h2>
          <div className="space-y-6 text-zinc-600 dark:text-zinc-400">
            <p>
              Securing funding for a {formattedIndustry} startup requires targeting the right investors who understand your specific market dynamics, business model, and growth potential. 
              Generalist investors often pass on niche deals because they lack the necessary domain expertise. By focusing on angels and VCs who have previously invested in {formattedIndustry}, you significantly increase your chances of getting a response.
            </p>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-8 mb-4">What do {formattedIndustry} investors look for?</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Traction & Metrics:</strong> Unlike consumer apps, {formattedIndustry} startups are often judged on specific unit economics. Make sure your pitch deck highlights these numbers clearly.</li>
              <li><strong>Founder-Market Fit:</strong> Investors want to know why <em>you</em> are the right team to build this product. Highlight your industry experience.</li>
              <li><strong>Clear Go-To-Market Strategy:</strong> Having a product is only half the battle. Your ability to acquire customers in the {formattedIndustry} space is what ultimately secures the check.</li>
            </ul>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-8 mb-4">Using OpenAngels to accelerate your fundraise</h3>
            <p>
              Manually searching for {formattedIndustry} venture capitalists on LinkedIn or Crunchbase is incredibly time-consuming. 
              OpenAngels provides a curated, constantly updated database of {formattedIndustry} investors. More importantly, our built-in AI Pitch Generator analyzes both your startup context and the investor's past portfolio to draft highly personalized cold emails that actually convert.
            </p>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
