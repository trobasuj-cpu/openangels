"use client";
import React, { useState, useEffect, useMemo, useDeferredValue, useRef } from 'react';
// helmet removed
// helmet removed
import Link from 'next/link';
import { 
  Search, SlidersHorizontal, MapPin, Briefcase, DollarSign, Mail, Globe, Lock, Sparkles, 
  ChevronDown, ChevronRight, Check, Layers, Loader2, X, UserPlus, CheckCircle,
  Cloud, CreditCard, Building2, ShoppingBag, HeartPulse, Shield, Store, Cpu, Code2, Leaf, Dna 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase.js';
import BackgroundAnimation from './BackgroundAnimation';
import InvestorAvatar from './InvestorAvatar';
import LoginModal from './LoginModal';
import FAQ from './FAQ';
import Footer from './Footer';
import { absoluteUrl, INDUSTRY_PAGES, INVESTOR_COUNT, PRODUCT_NAME, SITE_URL, POPULAR_HUBS } from '@/seo.js';

const FilterSection = ({ title, icon: Icon, activeCount = 0, defaultExpanded = false, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0 pb-5 mb-5 last:pb-0 last:mb-0">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="flex items-center justify-between w-full text-left py-1 group outline-none"
      >
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
          <span>{title}</span>
          {activeCount > 0 && (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-500/30">
              {activeCount}
            </span>
          )}
        </h3>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200", expanded ? "rotate-180" : "")} />
      </button>
      {expanded && (
        <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const MarketingShowcase = ({ isPremium }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPremium || isDismissed || isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPremium, isDismissed, isPaused]);

  if (isPremium || isDismissed) return null;

  const slides = [
    {
      id: 'ai',
      badge: 'AI Pitching',
      icon: Sparkles,
      title: 'Craft hyper-personalized pitches in 2 seconds.',
      desc: "Generic templates get ignored. Our AI context-matches your startup with the investor's past deals to generate emails that actually get replies.",
      features: ['Matches investor thesis', 'Personalized from your context', 'Opens straight in Gmail'],
      content: (
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex flex-col shadow-inner">
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Your Context</span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 italic mb-2 leading-relaxed bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              "We are building an AI-powered code reviewer. We have 10k MRR, growing 20% MoM, and are raising a $500k pre-seed round."
            </p>
            <div className="mt-auto flex items-center justify-between text-[10px] text-zinc-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> San Francisco</span>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-1.5 py-0.5 rounded">SaaS</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 p-1.5 opacity-50"><Sparkles className="w-4 h-4 text-red-500" /></div>
            <span className="relative z-10 text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3" /> AI Draft
            </span>
            <div className="relative z-10 mt-1 space-y-2">
              <p className="text-xs font-medium text-white border-b border-zinc-800 pb-1.5">Subj: Highly-efficient AI Code Reviews — $10k MRR</p>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Hi Jason,<br/><br/>
                Saw your recent investments in developer tools. We're building an AI-powered code reviewer. We've hit $10k MRR and are raising a $500k pre-seed.
                <br/><br/>
                Open to a quick chat next week?
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'match',
      badge: 'Smart Matching',
      icon: Search,
      title: 'Discover active angels you didn\'t know existed.',
      desc: "Don't manually scroll through 4,700+ (and constantly growing) profiles. Give us your pitch, and we'll instantly surface the exact angels actively investing in your specific niche right now.",
      features: ['Discovers hidden angels', 'Ranks by relevance score', 'Exports matched shortlists'],
      content: (
        <div className="flex-1 w-full flex items-center justify-center p-2">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-1.5">
                   <Search className="w-3.5 h-3.5 text-blue-500" />
                   <span className="font-semibold text-xs text-zinc-900 dark:text-white">Smart Match</span>
                 </div>
                 <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-1.5 py-0.5 rounded-full relative overflow-hidden">
                   <span className="absolute inset-0 bg-blue-400/20 animate-pulse"></span>
                   <span className="relative z-10">AI Scanning...</span>
                 </span>
               </div>
               <div className="space-y-2 relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-zinc-900 z-10 pointer-events-none"></div>
                 <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                     <div className="space-y-1">
                       <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                       <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                     </div>
                   </div>
                   <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">98% Match</span>
                 </div>
                 <div className="p-2 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                     <div className="space-y-1">
                       <div className="w-16 h-2 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                       <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                     </div>
                   </div>
                   <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded opacity-80">92% Match</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'crm',
      badge: 'Personal CRM',
      icon: Layers,
      title: 'The only CRM built specifically for fundraising.',
      desc: "Ditch the messy Notion boards and spreadsheets. Track every conversation, follow-up, and commitment in one beautiful, integrated Kanban workspace.",
      features: ['Drag and drop interface', 'Add private notes', 'Automated inbox routing (soon)'],
      content: (
        <div className="flex-1 w-full bg-black rounded-2xl border border-white/10 p-3 overflow-hidden relative">
           <div className="flex gap-3 opacity-80">
             <div className="w-1/3 shrink-0">
               <div className="text-[9px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> SAVED</div>
               <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-md mb-1.5 shadow-sm"><div className="w-1/2 h-2 bg-zinc-700 rounded mb-1.5"></div><div className="w-full h-1.5 bg-zinc-800 rounded"></div></div>
             </div>
             <div className="w-1/3 shrink-0">
               <div className="text-[9px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> CONTACTED</div>
               <div className="bg-zinc-900 border border-white/10 p-2 rounded-md transform -rotate-1 scale-105 border-red-500/30 z-10 relative"><div className="w-2/3 h-2 bg-zinc-700 rounded mb-1.5"></div><div className="w-5/6 h-1.5 bg-zinc-800 rounded"></div></div>
             </div>
             <div className="w-1/3 shrink-0">
               <div className="text-[9px] font-bold text-zinc-500 mb-1.5 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> MEETING</div>
             </div>
           </div>
        </div>
      )
    }
  ];

  const current = slides[activeSlide];

  return (
    <div 
      className="mb-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <button 
        onClick={() => setIsDismissed(true)}
        className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white z-20 transition-transform hover:scale-110"
        title="Dismiss showcase"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="p-[1px] rounded-[24px] bg-gradient-to-r from-red-500/20 via-rose-500/20 to-red-500/20 relative overflow-hidden flex-1 group">
        <div className="bg-black/80 rounded-[23px] p-4 md:p-5 border border-white/5 h-full backdrop-blur-xl">
          <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1 relative">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSlide(i);
                  setIsPaused(true);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border relative overflow-hidden",
                  activeSlide === i 
                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                    : "bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {activeSlide === i && !isPaused && (
                   <div className="absolute bottom-0 left-0 h-[1.5px] bg-red-500/40 animate-[progress_4s_linear]" style={{ width: '100%' }}></div>
                )}
                <s.icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{s.badge}</span>
              </button>
            ))}
          </div>

          <div key={activeSlide} className="flex flex-col lg:flex-row gap-6 items-center animate-in fade-in duration-300">
            <div className="flex-1 space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                {current.title.split(' ').map((word, i, arr) => 
                  i === arr.length - 2 || i === arr.length - 3 ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">{word} </span> : word + ' '
                )}
              </h2>
              <p className="text-sm text-zinc-400 max-w-md">
                {current.desc}
              </p>
              <ul className="space-y-1.5 mt-2">
                {current.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-red-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            {current.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bccEmail, setBccEmail] = useState('');
  const [isSavingBcc, setIsSavingBcc] = useState(false);
  const [crmLeadIds, setCrmLeadIds] = useState(new Set()); // investor IDs already in CRM
  const [addingToCrm, setAddingToCrm] = useState(null); // investor ID currently being added
  const [showNewOnly, setShowNewOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('newest') === 'true') {
        setShowNewOnly(true);
      }
    }
  }, []);

  const isAiMatch = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ai_match') === 'true';
    }
    return false;
  }, []);

  const [aiMatchedIds, setAiMatchedIds] = useState(null);

  useEffect(() => {
    if (isAiMatch) {
      try {
        const stored = window.localStorage.getItem('ai_matched_investor_ids');
        if (stored) {
          setAiMatchedIds(new Set(JSON.parse(stored)));
        }
      } catch (e) {
        console.error('Failed to parse ai_matched_investor_ids', e);
      }
    }
  }, [isAiMatch]);

  // Initialize selectedIndustries from URL if present
  const initialIndustries = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ind = params.get('industries');
      if (ind) {
        return ind.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);
      }
    }
    return [];
  }, []);

  const [selectedIndustries, setSelectedIndustries] = useState(initialIndustries);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedCheckSizes, setSelectedCheckSizes] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [industrySearch, setIndustrySearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);
  const mainScrollRef = useRef(null);

  // Industry counts map for badges
  const industryCounts = useMemo(() => {
    const counts = {};
    (investors || []).forEach(inv => {
      const raw = inv.industry || inv.industries;
      const arr = Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
      arr.forEach(ind => {
        if (ind) {
          const lower = ind.trim().toLowerCase();
          counts[lower] = (counts[lower] || 0) + 1;
        }
      });
    });
    return counts;
  }, [investors]);

  // Formatter for category names
  const formatCategoryLabel = (slug) => {
    if (!slug) return '';
    const s = slug.toLowerCase();
    if (s === 'ai') return 'AI & Machine Learning';
    if (s === 'saas') return 'SaaS';
    if (s === 'b2b') return 'B2B';
    if (s === 'api') return 'API';
    if (s === 'ar-vr') return 'AR / VR';
    if (s === 'adtech') return 'AdTech';
    if (s === 'agritech' || s === 'agtech') return 'AgriTech';
    if (s === 'biotech') return 'BioTech';
    if (s === 'fintech') return 'FinTech';
    if (s === 'healthtech') return 'HealthTech';
    if (s === 'deep-tech') return 'DeepTech';
    if (s === 'dev-tools' || s === 'developer-tools') return 'Developer Tools';
    if (s === 'e-commerce') return 'E-Commerce';
    return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Scroll back to top when filters change
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedIndustries, selectedLocations, selectedCheckSizes, selectedStages]);

  async function fetchInvestors() {
    try {
      let allData = [];
      let fetchMore = true;
      let from = 0;
      let limit = 1000;
      
      while (fetchMore) {
        const { data, error } = await supabase
          .from('investors_secure')
          .select('*')
          .range(from, from + limit - 1);
          
        if (error) throw error;
        
        allData = [...allData, ...data];
        
        if (data.length < limit) {
          fetchMore = false;
        } else {
          from += limit;
        }
      }
      
      const validData = (allData || []).filter(inv => {
        const hasRealBio = inv.bio && !inv.bio.includes("Found via automated") && !inv.bio.includes("Extracted from public");
        const rawInd = inv.industry || inv.industries;
        const hasTags = Array.isArray(rawInd) ? rawInd.length > 0 : !!rawInd;
        const hasSocial = !!inv.email || !!inv.linkedin_url || !!inv.twitter_url || !!inv.website;
        
        return hasRealBio || hasTags || hasSocial;
      });

      const sortedData = validData.sort((a, b) => {
        if (a.email && !b.email) return -1;
        if (!a.email && b.email) return 1;
        return 0;
      });
      
      setInvestors(sortedData);
    } catch (err) {
      console.error('Error fetching investors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, startup_description, crm_bcc_email')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data);
      if (data.crm_bcc_email) setBccEmail(data.crm_bcc_email);
    }
  };

  const fetchCrmLeads = async (userId) => {
    const { data } = await supabase
      .from('crm_leads')
      .select('investor_id')
      .eq('user_id', userId);
    if (data) {
      setCrmLeadIds(new Set(data.map(d => d.investor_id)));
    }
  };

  const addToCrm = async (investorId) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (crmLeadIds.has(investorId)) return;
    setAddingToCrm(investorId);
    const { error } = await supabase
      .from('crm_leads')
      .insert({ user_id: user.id, investor_id: investorId, status: 'inbox' });
    if (!error) {
      setCrmLeadIds(prev => new Set([...prev, investorId]));
    }
    setAddingToCrm(null);
  };

  useEffect(() => {
    fetchInvestors();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCrmLeads(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCrmLeads(session.user.id);
      } else {
        setProfile(null);
        setCrmLeadIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const uniqueIndustries = useMemo(() => {
    const all = investors.flatMap(inv => {
      const raw = inv.industry || inv.industries;
      return Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
    });
    return [...new Set(all)].filter(Boolean).sort();
  }, [investors]);

  const uniqueLocations = useMemo(() => {
    const all = investors.map(inv => inv.location);
    return [...new Set(all)].filter(Boolean).sort();
  }, [investors]);

  const uniqueCheckSizes = ["Up to $100k", "$100k - $500k", "$500k - $1M", "$1M+"];

  const uniqueStages = useMemo(() => {
    const all = investors.flatMap(inv => {
      const raw = inv.stage || inv.stages;
      return Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
    });
    return [...new Set(all)].filter(Boolean).sort();
  }, [investors]);

  const toggleFilter = (setter, value) => {
    setter(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const deferredSearch = useDeferredValue(search);
  const deferredIndustries = useDeferredValue(selectedIndustries);
  const deferredLocations = useDeferredValue(selectedLocations);
  const deferredCheckSizes = useDeferredValue(selectedCheckSizes);
  const deferredStages = useDeferredValue(selectedStages);

  const filteredInvestors = useMemo(() => {
    let baseInvestors = investors;
    if (showNewOnly) {
      // Sort descending (newest first) and take top 100
      const newest100 = [...investors].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 100);
      const newestIds = new Set(newest100.map(i => i.id));
      baseInvestors = investors.filter(inv => newestIds.has(inv.id));
    }

    return baseInvestors.filter(inv => {
      const invIndustries = (() => {
        const raw = inv.industry || inv.industries;
        return Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
      })();
      const invStages = (() => {
        const raw = inv.stage || inv.stages;
        return Array.isArray(raw) ? raw : (typeof raw === 'string' ? [raw] : []);
      })();
      const min = inv.check_min || 0;
      const max = inv.check_max || Infinity;
      
      const invCheckSizeBuckets = [];
      if (max <= 100000 || min <= 100000) invCheckSizeBuckets.push("Up to $100k");
      if ((max >= 100000 && min <= 500000) || (!inv.check_max && min >= 100000 && min <= 500000)) invCheckSizeBuckets.push("$100k - $500k");
      if ((max >= 500000 && min <= 1000000) || (!inv.check_max && min >= 500000 && min <= 1000000)) invCheckSizeBuckets.push("$500k - $1M");
      if (max >= 1000000 || min >= 1000000) invCheckSizeBuckets.push("$1M+");

      const matchesSearch = deferredSearch === '' || 
        inv.name?.toLowerCase().includes(deferredSearch.toLowerCase()) || 
        inv.bio?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        invIndustries.some(i => i.toLowerCase().includes(deferredSearch.toLowerCase()));

      const matchesIndustry = deferredIndustries.length === 0 || 
        deferredIndustries.some(ind => invIndustries.some(i => i.toLowerCase() === ind.toLowerCase()));
        
      const matchesLocation = deferredLocations.length === 0 || 
        deferredLocations.includes(inv.location);

      const matchesCheckSize = deferredCheckSizes.length === 0 || 
        deferredCheckSizes.some(size => invCheckSizeBuckets.includes(size));

      const matchesStage = deferredStages.length === 0 || 
        deferredStages.some(stage => invStages.some(s => s.toLowerCase() === stage.toLowerCase()));

      let matchesAi = true;
      if (isAiMatch && aiMatchedIds) {
        matchesAi = aiMatchedIds.has(inv.id);
      }

      return matchesSearch && matchesIndustry && matchesLocation && matchesCheckSize && matchesStage && matchesAi;
    });
  }, [investors, deferredSearch, deferredIndustries, deferredLocations, deferredCheckSizes, deferredStages, isAiMatch, aiMatchedIds, showNewOnly]);

  useEffect(() => {
    setVisibleCount(24);
  }, [filteredInvestors]);

  const renderFilterOptions = (options, selected, setter, isIndustry = false) => {
    let filteredOptions = options;
    if (isIndustry && industrySearch.trim()) {
      const q = industrySearch.trim().toLowerCase();
      filteredOptions = options.filter(item => 
        item.toLowerCase().includes(q) || formatCategoryLabel(item).toLowerCase().includes(q)
      );
    }

    return (
      <div className="space-y-2">
        {isIndustry && (
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search 90+ categories..."
              value={industrySearch}
              onChange={(e) => setIndustrySearch(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50"
            />
          </div>
        )}

        {filteredOptions.length === 0 ? (
          <span className="text-xs text-zinc-500">No matching categories</span>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {filteredOptions.map((item) => {
              const isSelected = selected.includes(item);
              const label = isIndustry ? formatCategoryLabel(item) : item;
              const count = isIndustry ? (industryCounts[item.toLowerCase()] || 0) : null;

              return (
                <div 
                  key={item} 
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-1 rounded-lg cursor-pointer group transition-colors",
                    isSelected ? "bg-red-500/10 text-white font-medium" : "hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                  )}
                  onClick={() => toggleFilter(setter, item)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0",
                      isSelected ? "bg-red-500 border-red-500" : "border-zinc-700 group-hover:border-zinc-500"
                    )}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs truncate">{label}</span>
                  </div>
                  {count !== null && count > 0 && (
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const totalActiveFilters = selectedIndustries.length + selectedLocations.length + selectedCheckSizes.length + selectedStages.length;
  const resetAllFilters = () => {
    setSelectedIndustries([]);
    setSelectedLocations([]);
    setSelectedCheckSizes([]);
    setSelectedStages([]);
    setIndustrySearch('');
  };

  return (
    <>
      <BackgroundAnimation />
      <div className="flex h-screen overflow-hidden relative z-10">
        {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileFiltersOpen(false)} />
      )}
        <aside className={cn(
          "w-72 border-r border-white/5 bg-black flex-col",
          isMobileFiltersOpen ? "fixed inset-y-0 left-0 z-50 flex shadow-2xl" : "hidden md:flex"
        )}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <a href="/" className="flex items-center gap-2 text-white font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-sm font-bold">OA</span>
            </div>
            OpenAngels
          </a>
          <button onClick={() => setIsMobileFiltersOpen(false)} className="md:hidden p-2 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Filter Bar Header */}
        <div className="px-6 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0 bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filters</span>
            {totalActiveFilters > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {totalActiveFilters}
              </span>
            )}
          </div>
          {totalActiveFilters > 0 && (
            <button 
              onClick={resetAllFilters} 
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors underline"
            >
              Reset All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <FilterSection title="Industry" icon={Briefcase} activeCount={selectedIndustries.length} defaultExpanded={false}>
            {/* Quick Chips */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Popular Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { slug: 'ai', name: 'AI', Icon: Cpu, color: 'text-red-400' },
                  { slug: 'saas', name: 'SaaS', Icon: Cloud, color: 'text-rose-400' },
                  { slug: 'b2b', name: 'B2B', Icon: Building2, color: 'text-amber-400' },
                  { slug: 'developer-tools', name: 'DevTools', Icon: Code2, color: 'text-orange-400' },
                  { slug: 'fintech', name: 'Fintech', Icon: CreditCard, color: 'text-emerald-400' },
                  { slug: 'consumer', name: 'Consumer', Icon: ShoppingBag, color: 'text-purple-400' },
                ].map(chip => {
                  const active = selectedIndustries.includes(chip.slug);
                  const IconComponent = chip.Icon;
                  return (
                    <button
                      key={chip.slug}
                      onClick={() => toggleFilter(setSelectedIndustries, chip.slug)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs rounded-xl border transition-all font-semibold flex items-center gap-1.5 shadow-sm active:scale-95",
                        active 
                          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-red-500/20 shadow-md" 
                          : "bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80"
                      )}
                    >
                      <IconComponent className={cn("w-3.5 h-3.5 transition-colors", active ? "text-white" : chip.color)} />
                      <span>{chip.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {renderFilterOptions(uniqueIndustries, selectedIndustries, setSelectedIndustries, true)}
          </FilterSection>

          <FilterSection title="Stage" icon={Layers} activeCount={selectedStages.length} defaultExpanded={false}>
            {renderFilterOptions(uniqueStages, selectedStages, setSelectedStages)}
          </FilterSection>

          <FilterSection title="Location" icon={MapPin} activeCount={selectedLocations.length} defaultExpanded={false}>
            {renderFilterOptions(uniqueLocations, selectedLocations, setSelectedLocations)}
          </FilterSection>

          <FilterSection title="Check Size" icon={DollarSign} activeCount={selectedCheckSizes.length} defaultExpanded={false}>
            {renderFilterOptions(uniqueCheckSizes, selectedCheckSizes, setSelectedCheckSizes)}
          </FilterSection>
        </div>
        
        {!profile?.is_premium && (
          <div className="p-6 border-t border-white/5">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 relative overflow-hidden group">
              <h4 className="text-sm font-bold text-white mb-1 relative flex items-center gap-2">
                Premium (Lifetime Access)
              </h4>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed relative">Get unlimited access to investor contacts, CRM, and AI drafting.</p>
              <button 
                onClick={() => {
                  if (user) {
                    window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}`, '_blank');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="crm-btn-oil w-full text-white border border-white/10 text-sm font-medium py-2 rounded-lg transition-all active:scale-[0.98] relative"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="relative z-50 h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/60 backdrop-blur-xl shrink-0">
          <div className="absolute inset-0 bg-red-500/5 [mask-image:radial-gradient(circle_at_top,white,transparent_70%)] pointer-events-none"></div>
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, industry, or keyword..." 
                className="w-full bg-black/50 border border-white/5 focus:bg-black focus:border-red-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors"
              onClick={() => setIsMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 relative">
              {showNewOnly ? (
                <button 
                  onClick={() => setShowNewOnly(false)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all border cursor-pointer bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                >
                  Show All
                </button>
              ) : (
                <Link 
                  href="/?newest=true"
                  target="_blank"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-all border cursor-pointer bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                >
                  Recently Added 🔥
                </Link>
              )}
              
              {/* CRM Button in Header (Always Visible) */}
              {user ? (
                <Link
                  href="/crm"
                  className="crm-btn-oil flex items-center gap-2 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-all border border-white/10"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  My CRM
                  {crmLeadIds.size > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {crmLeadIds.size}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="crm-btn-oil flex items-center gap-2 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-all border border-white/10"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  My CRM
                </button>
              )}

              {user ? (
                <>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 font-medium overflow-hidden border border-zinc-700 transition-all focus:outline-none"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.email?.[0].toUpperCase()
                    )}
                  </button>
                  
                  {isProfileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsProfileMenuOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 w-56 bg-black border border-white/5 rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-medium text-white truncate">
                            {user.user_metadata?.full_name || 'My Account'}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="p-1">
                          <Link
                            href="/crm"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                          >
                            <span>📋 My CRM Pipeline</span>
                            {crmLeadIds.size > 0 && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                {crmLeadIds.size}
                              </span>
                            )}
                          </Link>
                          <button 
                            className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              if (!profile?.is_premium) {
                                window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}`, '_blank');
                              }
                            }}
                          >
                            <span>Subscription</span>
                            <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors">
                              {profile?.is_premium ? 'Premium' : 'Free'}
                            </span>
                          </button>
                        </div>
                        <div className="p-1 border-t border-zinc-200 dark:border-zinc-800">
                          <button 
                            onClick={async () => {
                              await supabase.auth.signOut();
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          >
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div ref={mainScrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 relative custom-scrollbar">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
            <MarketingShowcase isPremium={profile?.is_premium} />

            <div className="flex flex-col xl:flex-row gap-6 mb-8">
              <div className="flex-1">
                {/* Premium Marketing Header - Horizontal Wide Layout */}
                <div className="h-full p-5 md:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 shadow-xl overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Decorative glow effects */}
                  <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-red-500/5 blur-[100px] pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-rose-500/5 blur-[100px] pointer-events-none"></div>
                  
                  <div className="relative z-10 flex-1">
                    {isAiMatch ? (
                      <>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                          Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">AI Matched</span> Investors
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                          Based on your startup's context, we've filtered the directory to show the most relevant investors. Add them to your CRM to start pitching.
                        </p>
                      </>
                    ) : showNewOnly ? (
                      <>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                          Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">100 Investors</span>
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                          The most recently added active investors in our database. Fresh opportunities for your next fundraising round.
                        </p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                          Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500">Angel Investor</span>
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                          Access an extensive, curated directory of active early-stage investors. Filter by industry, check size, and stage to find the perfect match. No warm introductions needed.
                        </p>
                      </>
                    )}
                  </div>
                  
                  {isAiMatch ? (
                    <div className="relative z-10 flex flex-col items-center justify-center shrink-0 bg-red-500/10 px-8 py-4 rounded-2xl border border-red-500/30 animate-in fade-in zoom-in duration-500">
                      <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500 tracking-tighter mb-1 filter drop-shadow-sm">
                        {filteredInvestors.length}
                      </div>
                      <div className="text-xs md:text-sm font-bold text-red-500/90 uppercase tracking-[0.2em]">
                        Perfect Matches
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 shrink-0 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div className="flex -space-x-3">
                        <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100" alt="Investor" />
                        <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=100&h=100" alt="Investor" />
                        <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=100&h=100" alt="Investor" />
                        <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1560250097-0b93528c311a?fit=crop&w=100&h=100" alt="Investor" />
                      </div>
                      <div className="flex flex-col text-left sm:text-right">
                        <div className="text-sm font-medium text-zinc-300">
                          <span className="text-white font-bold text-xl">{loading ? INVESTOR_COUNT : investors.length.toLocaleString()}</span> active
                        </div>
                        {investors.length !== filteredInvestors.length && (
                          <div className="text-xs font-medium text-blue-400">
                            {filteredInvestors.length.toLocaleString()} matching
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!profile?.is_premium && (
                <div className="w-full xl:w-1/3 shrink-0">
                  {/* Product Hunt Welcome Banner */}
                  <div className="h-full rounded-xl bg-gradient-to-r from-[#DA552F] to-[#ea6e4b] p-5 shadow-lg flex flex-col justify-center text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10 mb-3">
                      <div className="w-10 h-10 rounded-full bg-white text-[#DA552F] flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                        P
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">Welcome, Product Hunt!</h3>
                      </div>
                    </div>
                    <p className="text-white/90 text-sm mb-4 relative z-10">Use code <strong>PHLAUNCH</strong> for 30% off lifetime premium access.</p>
                    <button 
                      onClick={() => {
                        if (user) {
                          window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}&discount_code=PHLAUNCH`, '_blank');
                        } else {
                          setIsLoginModalOpen(true);
                        }
                      }}
                      className="w-full py-2 bg-white text-[#DA552F] hover:bg-zinc-50 font-bold rounded-lg text-sm transition-colors shadow-sm relative z-10"
                    >
                      Claim Discount
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Loading investors...</p>
                </div>
              ) : error ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-red-500">
                  <p>Error loading investors: {error}</p>
                </div>
              ) : filteredInvestors.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
                  <p>No investors found matching your criteria.</p>
                </div>
              ) : (
                <>
                  {filteredInvestors.slice(0, visibleCount).map((investor, index) => {
                    const isUnlocked = profile?.is_premium || index < 6;
                  
                  let cleanBio = investor.bio || '';
                  if (cleanBio.includes('Source: http')) {
                    cleanBio = cleanBio.split('Source: http')[0].trim();
                  }
                  if (cleanBio === "Found via automated news parsing." || cleanBio === "Extracted from public investor list.") {
                    cleanBio = "Active early-stage angel investor.";
                  }

                  const rawInd = investor.industry || investor.industries;
                  const displayIndustries = Array.isArray(rawInd) ? rawInd : (typeof rawInd === 'string' ? [rawInd] : []);
                  const formatMoney = (val) => {
                    if (!val) return '';
                    if (val >= 1000000) return `$${val / 1000000}M`;
                    if (val >= 1000) return `$${val / 1000}k`;
                    return `$${val}`;
                  };
                  
                  const minStr = formatMoney(investor.check_min);
                  const maxStr = formatMoney(investor.check_max);
                  let displayCheckSize = '';
                  if (minStr && maxStr) displayCheckSize = `${minStr} - ${maxStr}`;
                  else if (minStr) displayCheckSize = `${minStr}+`;
                  else if (maxStr) displayCheckSize = `Up to ${maxStr}`;
                  
                  let displayAvatar = investor.avatar_url || investor.avatar;
                  if (!displayAvatar && investor.twitter_url) {
                    const handle = investor.twitter_url.split('/').pop().split('?')[0];
                    if (handle && handle.length > 2) {
                      displayAvatar = `https://unavatar.io/x/${handle}?ttl=30d`;
                    }
                  }

                  return (
                    <div key={investor.id} className="group flex flex-col bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-black/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        {/* Header: Avatar + Info + Socials */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <InvestorAvatar name={investor.name} avatarUrl={displayAvatar} className="w-11 h-11" />
                              <div className="min-w-0">
                                <Link href={`/investor/${investor.slug || investor.id}`} className="hover:underline">
                                  <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">{investor.name}</h3>
                                </Link>
                                {investor.firm ? (
                                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">
                                    {investor.title ? `${investor.title} at ` : ''}{investor.firm}
                                  </p>
                                ) : investor.location ? (
                                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{investor.location}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Top Right Social Links */}
                            <div className="flex items-center gap-2 shrink-0">
                              {investor.website && (
                                <a href={investor.website.startsWith('http') ? investor.website : `https://${investor.website}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Website">
                                  <Globe className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {investor.twitter_url && (
                                <a href={investor.twitter_url.startsWith('http') ? investor.twitter_url : `https://${investor.twitter_url}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors" title="X">
                                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                </a>
                              )}
                              {investor.linkedin_url && (
                                <a href={investor.linkedin_url.startsWith('http') ? investor.linkedin_url : `https://${investor.linkedin_url}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Location row if firm was shown above */}
                          {investor.firm && investor.location && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{investor.location}</span>
                            </div>
                          )}

                          {/* Bio */}
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4 line-clamp-2 leading-relaxed">
                            {cleanBio}
                          </p>
                        </div>
                        
                        {/* Badges: Stages, Check Size, Industry */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          {(() => {
                            const rawStages = investor.stages || investor.stage;
                            const stagesArr = Array.isArray(rawStages) ? rawStages : (typeof rawStages === 'string' ? [rawStages] : []);
                            return stagesArr.slice(0, 2).map(s => (
                              <span key={s} className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md border border-zinc-200 dark:border-zinc-700/60">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </span>
                            ));
                          })()}
                          {displayCheckSize && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20">
                              {displayCheckSize}
                            </span>
                          )}
                          {displayIndustries.slice(0, 2).map(tag => (
                            <Link key={tag} href={`/investors/${tag.toLowerCase().replace(/[\s/]+/g, '-')}`} onClick={(e) => e.stopPropagation()} className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 hover:text-amber-500 transition-colors">
                              {tag}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5 relative overflow-hidden">
                        {isUnlocked ? (
                          <>
                            {investor.email && (
                              <div className="flex items-center justify-between gap-2 px-1 text-xs">
                                <a href={`mailto:${investor.email}`} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 truncate transition-colors">
                                  <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                  <span className="truncate underline underline-offset-2">{investor.email}</span>
                                </a>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(investor.email)}
                                  className="text-[10px] text-zinc-500 hover:text-zinc-200 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 shrink-0 transition-colors"
                                  title="Copy Email"
                                >
                                  Copy
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Link 
                                href={`/investor/${investor.slug || investor.id}`}
                                className="crm-btn-oil flex items-center justify-center gap-1.5 flex-1 py-2 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                AI Draft Email
                              </Link>
                              <button 
                                onClick={() => addToCrm(investor.id)}
                                disabled={crmLeadIds.has(investor.id) || addingToCrm === investor.id}
                                className={cn(
                                  "flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl transition-all border shrink-0",
                                  crmLeadIds.has(investor.id)
                                    ? "bg-green-500/10 text-green-400 border-green-500/30 cursor-default"
                                    : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-amber-500/50 hover:text-amber-500"
                                )}
                                title={crmLeadIds.has(investor.id) ? "Saved in CRM" : "Add to CRM"}
                              >
                                {addingToCrm === investor.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : crmLeadIds.has(investor.id) ? (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>+ CRM</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="relative space-y-2.5">
                            <div className="flex items-center justify-between gap-2 px-1 text-xs blur-[4px] opacity-40 select-none pointer-events-none">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                <span>hidden@example.com</span>
                              </div>
                              <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800">Copy</span>
                            </div>
                            <div className="flex items-center gap-2 blur-[4px] opacity-40 select-none pointer-events-none">
                              <div className="crm-btn-oil flex-1 flex items-center justify-center gap-1.5 py-2 border border-white/10 text-white text-xs font-semibold rounded-xl">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                AI Draft Email
                              </div>
                              <div className="py-2 px-3 text-xs font-semibold rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                                + CRM
                              </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/60 dark:bg-zinc-900/60 backdrop-blur-[2px]">
                              <button 
                                onClick={() => {
                                  if (user) {
                                    window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}`, '_blank');
                                  } else {
                                    setIsLoginModalOpen(true);
                                  }
                                }}
                                className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-transform hover:scale-105 active:scale-[0.98] shadow-md group/btn"
                              >
                                <Lock className="w-3 h-3 group-hover/btn:rotate-12 transition-transform text-amber-500 dark:text-amber-600" />
                                Unlock Contact
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </>
              )}
            </div>
            
            {!loading && !error && visibleCount < filteredInvestors.length && (
              <div className="mt-12 text-center pb-12">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-6 py-2.5 bg-black border border-white/10 text-sm font-medium text-zinc-300 rounded-full hover:border-white/20 hover:text-white transition-colors"
                >
                  Load More Investors
                </button>
              </div>
            )}
            
            {/* Popular Investor Hubs — Compact Layout with Unique Icons */}
            <div className="mt-16 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-12 mb-8">
              <div className="flex flex-col items-center text-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5">Popular Investor Hubs</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-xl leading-relaxed">
                  Explore curated lists of angel investors and VCs by combining industry, stage, and location filters.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {POPULAR_HUBS.map((hub) => {
                  const primary = hub.filters[0]?.toLowerCase() || '';
                  let Icon = MapPin;
                  let iconColor = 'text-blue-400 bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white';
                  let borderColor = 'hover:border-blue-500/30';

                  if (primary === 'saas') {
                    Icon = Cloud;
                    iconColor = 'text-cyan-400 bg-cyan-500/10 group-hover:bg-cyan-500 group-hover:text-white';
                    borderColor = 'hover:border-cyan-500/30';
                  } else if (primary === 'ai') {
                    Icon = Sparkles;
                    iconColor = 'text-purple-400 bg-purple-500/10 group-hover:bg-purple-500 group-hover:text-white';
                    borderColor = 'hover:border-purple-500/30';
                  } else if (primary === 'fintech') {
                    Icon = CreditCard;
                    iconColor = 'text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white';
                    borderColor = 'hover:border-emerald-500/30';
                  } else if (primary === 'b2b') {
                    Icon = Briefcase;
                    iconColor = 'text-blue-400 bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white';
                    borderColor = 'hover:border-blue-500/30';
                  } else if (primary === 'consumer') {
                    Icon = ShoppingBag;
                    iconColor = 'text-rose-400 bg-rose-500/10 group-hover:bg-rose-500 group-hover:text-white';
                    borderColor = 'hover:border-rose-500/30';
                  } else if (primary === 'health') {
                    Icon = HeartPulse;
                    iconColor = 'text-red-400 bg-red-500/10 group-hover:bg-red-500 group-hover:text-white';
                    borderColor = 'hover:border-red-500/30';
                  } else if (primary === 'crypto') {
                    Icon = Shield;
                    iconColor = 'text-amber-400 bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-white';
                    borderColor = 'hover:border-amber-500/30';
                  } else if (primary === 'marketplace') {
                    Icon = Store;
                    iconColor = 'text-orange-400 bg-orange-500/10 group-hover:bg-orange-500 group-hover:text-white';
                    borderColor = 'hover:border-orange-500/30';
                  } else if (primary === 'enterprise') {
                    Icon = Building2;
                    iconColor = 'text-indigo-400 bg-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white';
                    borderColor = 'hover:border-indigo-500/30';
                  } else if (primary === 'deep-tech') {
                    Icon = Cpu;
                    iconColor = 'text-teal-400 bg-teal-500/10 group-hover:bg-teal-500 group-hover:text-white';
                    borderColor = 'hover:border-teal-500/30';
                  } else if (primary === 'developer-tools') {
                    Icon = Code2;
                    iconColor = 'text-sky-400 bg-sky-500/10 group-hover:bg-sky-500 group-hover:text-white';
                    borderColor = 'hover:border-sky-500/30';
                  } else if (primary === 'climate') {
                    Icon = Leaf;
                    iconColor = 'text-green-400 bg-green-500/10 group-hover:bg-green-500 group-hover:text-white';
                    borderColor = 'hover:border-green-500/30';
                  } else if (primary === 'biotech') {
                    Icon = Dna;
                    iconColor = 'text-pink-400 bg-pink-500/10 group-hover:bg-pink-500 group-hover:text-white';
                    borderColor = 'hover:border-pink-500/30';
                  }

                  return (
                    <Link
                      key={hub.filters.join('/')}
                      href={`/investors/${hub.filters.join('/')}`}
                      className={`group flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/60 ${borderColor} hover:bg-white dark:hover:bg-zinc-900/90 transition-all duration-200`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0 transition-all duration-200 shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col text-left truncate">
                          <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-white transition-colors truncate">{hub.label}</h3>
                          <span className="text-[10px] text-zinc-500">Curated list</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0 ml-2" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Browse Angel Investors by Industry */}
            <div className="mt-12 mb-12 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-12">
              <div className="flex flex-col items-center text-center mb-8">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Browse Angel Investors by Industry</h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs max-w-2xl leading-relaxed">
                  Discover the most active venture capitalists and angel investors across top industries. Filter by sector to find the perfect match for your startup's niche.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {INDUSTRY_PAGES.map((page) => (
                  <Link
                    key={page.slug}
                    href={`/investors/${page.slug}`}
                    className="group relative px-4 py-2 rounded-full bg-white/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-white/5 backdrop-blur-md overflow-hidden hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/10 group-hover:to-red-500/5 transition-all duration-500"></div>
                    <span className="relative z-10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{page.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95 shadow-lg group"
                >
                  View Complete Directory 
                  <svg className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
          <FAQ />
          <Footer />
        </div>
      </main>
    </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}
