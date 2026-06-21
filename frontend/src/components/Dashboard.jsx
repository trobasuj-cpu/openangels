import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, MapPin, Briefcase, DollarSign, Mail, Globe, Lock, Sparkles, ChevronDown, Check, Layers, Loader2, X, UserPlus, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase.js';
import BackgroundAnimation from './BackgroundAnimation';
import LoginModal from './LoginModal';
import AIEmailModal from './AIEmailModal';
import FAQ from './FAQ';
import Footer from './Footer';

const FilterSection = ({ title, icon: Icon, defaultExpanded = true, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0 pb-6 mb-6 last:pb-0 last:mb-0">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="flex items-center justify-between w-full text-left mb-2 group outline-none"
      >
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          {title}
        </h3>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform duration-200", expanded ? "rotate-180" : "")} />
      </button>
      {expanded && (
        <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const MarketingShowcase = ({ isPremium }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isPremium || isDismissed) return null;

  const slides = [
    {
      id: 'ai',
      badge: 'AI Pitching',
      icon: Sparkles,
      title: 'Personalized pitches in 2 seconds.',
      desc: "Stop writing generic cold emails. Our AI analyzes the investor's background and crafts a highly personalized, compelling pitch based on your startup.",
      features: ['Matches investor thesis', 'Short, punchy, and readable', 'Opens straight in Gmail'],
      content: (
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col shadow-inner">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Your Context</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 italic mb-4 leading-relaxed bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              "We are building an AI-powered code reviewer. We have 10k MRR, growing 20% MoM, and are raising a $500k pre-seed round."
            </p>
            <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Target: San Francisco</span>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded">SaaS</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black p-4 rounded-xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 p-2 opacity-50"><Sparkles className="w-5 h-5 text-amber-500" /></div>
            <span className="relative z-10 text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> AI Draft
            </span>
            <div className="relative z-10 mt-2 space-y-3">
              <p className="text-sm font-medium text-white border-b border-zinc-800 pb-2">Subj: Highly-efficient AI Code Reviews — $10k MRR</p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Hi Jason,<br/><br/>
                Saw your recent investments in developer tools and thought this would be right up your alley.
                <br/><br/>
                We're building an AI-powered code reviewer. We've hit $10k MRR (growing 20% MoM) and are currently raising a $500k pre-seed.
                <br/><br/>
                Would love to share our deck. Open to a quick chat next week?
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
      title: 'Find the exact right investor.',
      desc: "When you generate a pitch, our AI automatically searches all 4,700+ investors to find others with the exact same investment thesis and background.",
      features: ['Discovers hidden angels', 'Ranks by relevance score', 'Download CSV for bulk outreach'],
      content: (
        <div className="flex-1 w-full flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Search className="w-4 h-4 text-blue-500" />
                   <span className="font-semibold text-sm text-zinc-900 dark:text-white">Smart Match</span>
                 </div>
                 <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full">12 found</span>
               </div>
               <div className="space-y-3">
                 <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                     <div className="space-y-1">
                       <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                       <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                     </div>
                   </div>
                   <span className="text-xs font-medium text-green-500">98% Match</span>
                 </div>
                 <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
                     <div className="space-y-1">
                       <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
                       <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
                     </div>
                   </div>
                   <span className="text-xs font-medium text-green-500 opacity-80">92% Match</span>
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
      title: 'Track your fundraising pipeline.',
      desc: "Stop using messy spreadsheets. Move investors through your pipeline from 'Saved' to 'Committed' with a beautiful Kanban board designed for fundraising.",
      features: ['Drag and drop interface', 'Add private notes', 'Automated inbox routing (soon)'],
      content: (
        <div className="flex-1 w-full bg-zinc-950 rounded-xl border border-zinc-800 p-4 overflow-hidden relative shadow-2xl">
           <div className="flex gap-4 opacity-80">
             <div className="w-1/3 shrink-0">
               <div className="text-[10px] font-bold text-zinc-500 mb-2 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> SAVED</div>
               <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg mb-2 shadow-sm"><div className="w-1/2 h-3 bg-zinc-700 rounded mb-2"></div><div className="w-full h-2 bg-zinc-800 rounded"></div></div>
             </div>
             <div className="w-1/3 shrink-0">
               <div className="text-[10px] font-bold text-zinc-500 mb-2 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> CONTACTED</div>
               <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-sm transform -rotate-1 scale-105 border-amber-500/30 z-10 relative"><div className="w-2/3 h-3 bg-zinc-700 rounded mb-2"></div><div className="w-5/6 h-2 bg-zinc-800 rounded"></div></div>
             </div>
             <div className="w-1/3 shrink-0">
               <div className="text-[10px] font-bold text-zinc-500 mb-2 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> MEETING</div>
             </div>
           </div>
        </div>
      )
    }
  ];

  const current = slides[activeSlide];

  return (
    <div className="mb-12 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setIsDismissed(true)}
        className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-lg z-20 transition-transform hover:scale-110"
        title="Dismiss showcase"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="p-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 md:p-8 border border-amber-500/10">
          <div className="flex gap-2 mb-8 overflow-x-auto custom-scrollbar pb-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(i)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 border",
                  activeSlide === i 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500" 
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                )}
              >
                <s.icon className="w-4 h-4" />
                {s.badge}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center min-h-[320px]">
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                {current.title.split(' ').map((word, i, arr) => 
                  i === arr.length - 2 || i === arr.length - 3 ? <span key={i} className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{word} </span> : word + ' '
                )}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-md">
                {current.desc}
              </p>
              <ul className="space-y-2 mt-4">
                {current.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {f}
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
  const [selectedInvestorForAI, setSelectedInvestorForAI] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bccEmail, setBccEmail] = useState('');
  const [isSavingBcc, setIsSavingBcc] = useState(false);
  const [crmLeadIds, setCrmLeadIds] = useState(new Set()); // investor IDs already in CRM
  const [addingToCrm, setAddingToCrm] = useState(null); // investor ID currently being added

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
  const [visibleCount, setVisibleCount] = useState(24);

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
      
      const sortedData = (allData || []).sort((a, b) => {
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

  const handleSaveBcc = async () => {
    if (!user) return;
    setIsSavingBcc(true);
    const { error } = await supabase
      .from('profiles')
      .update({ crm_bcc_email: bccEmail })
      .eq('id', user.id);
    if (!error) {
      setProfile(prev => ({ ...prev, crm_bcc_email: bccEmail }));
    }
    setIsSavingBcc(false);
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
    return investors.filter(inv => {
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

      return matchesSearch && matchesIndustry && matchesLocation && matchesCheckSize && matchesStage;
    });
  }, [investors, deferredSearch, deferredIndustries, deferredLocations, deferredCheckSizes, deferredStages]);

  useEffect(() => {
    setVisibleCount(24);
  }, [filteredInvestors]);

  const renderFilterOptions = (options, selected, setter) => (
    <div className="space-y-2.5">
      {options.length === 0 && <span className="text-xs text-zinc-500">No options</span>}
      {options.map((item) => (
        <div key={item} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleFilter(setter, item)}>
          <div className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
            selected.includes(item) 
              ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white" 
              : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400 dark:group-hover:border-zinc-600"
          )}>
            {selected.includes(item) && <Check className="w-3 h-3 text-white dark:text-zinc-900" />}
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">{item}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <BackgroundAnimation />
      <div className="flex h-screen overflow-hidden relative z-10">
        {isMobileFiltersOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileFiltersOpen(false)} />
      )}
        <aside className={cn(
          "w-72 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl flex-col",
          isMobileFiltersOpen ? "fixed inset-y-0 left-0 z-50 flex shadow-2xl" : "hidden md:flex"
        )}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-lg tracking-tight">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 text-sm font-bold">OA</span>
            </div>
            OpenAngels
          </div>
          <button onClick={() => setIsMobileFiltersOpen(false)} className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <FilterSection title="Industry" icon={Briefcase}>
            {renderFilterOptions(uniqueIndustries, selectedIndustries, setSelectedIndustries)}
          </FilterSection>

          <FilterSection title="Stage" icon={Layers}>
            {renderFilterOptions(uniqueStages, selectedStages, setSelectedStages)}
          </FilterSection>

          <FilterSection title="Location" icon={MapPin} defaultExpanded={false}>
            {renderFilterOptions(uniqueLocations, selectedLocations, setSelectedLocations)}
          </FilterSection>

          <FilterSection title="Check Size" icon={DollarSign} defaultExpanded={false}>
            {renderFilterOptions(uniqueCheckSizes, selectedCheckSizes, setSelectedCheckSizes)}
          </FilterSection>
        </div>
        
        {!profile?.is_premium && (
          <div className="p-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-800/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 relative flex items-center gap-2">
                Premium (Lifetime Access)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed relative">Get unlimited access to investor contacts, CRM, and AI drafting.</p>
              <button 
                onClick={() => {
                  if (user) {
                    window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}`, '_blank');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium py-2 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-sm active:scale-[0.98] relative"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="relative z-50 h-16 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between px-8 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, industry, or keyword..." 
                className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 focus:bg-white dark:focus:bg-zinc-950 focus:border-zinc-300 dark:focus:border-zinc-700 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/20 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              onClick={() => setIsMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 relative">
              {user ? (
                <>
                  {/* CRM Button in Header */}
                  <Link
                    to="/crm"
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    My CRM
                    {crmLeadIds.size > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {crmLeadIds.size}
                      </span>
                    )}
                  </Link>

                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium overflow-hidden border border-zinc-300 dark:border-zinc-700 hover:ring-2 ring-zinc-400 dark:ring-zinc-600 transition-all focus:outline-none"
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
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {user.user_metadata?.full_name || 'My Account'}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="p-1">
                          <Link
                            to="/crm"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-between group"
                          >
                            <span>📋 My CRM Pipeline</span>
                            {crmLeadIds.size > 0 && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                {crmLeadIds.size}
                              </span>
                            )}
                          </Link>
                          <button 
                            className="w-full text-left px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-between group"
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
                        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                            CRM BCC Email
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={bccEmail}
                              onChange={(e) => setBccEmail(e.target.value)}
                              placeholder="bcc@hubspot.com"
                              className="flex-1 min-w-0 px-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <button
                              onClick={handleSaveBcc}
                              disabled={isSavingBcc || bccEmail === (profile?.crm_bcc_email || '')}
                              className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                            >
                              {isSavingBcc ? '...' : 'Save'}
                            </button>
                          </div>
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

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="w-full">
                {/* Product Hunt Welcome Banner */}
                {!profile?.is_premium && (
                  <div className="mb-6 w-full rounded-xl bg-gradient-to-r from-[#DA552F] to-[#ea6e4b] p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between text-white relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-white text-[#DA552F] flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                        P
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">Welcome, Product Hunt community! 👋</h3>
                        <p className="text-white/90 text-sm mt-0.5">Use code <strong>PHLAUNCH</strong> for 30% off lifetime premium access.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        if (user) {
                          window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}&discount_code=PHLAUNCH`, '_blank');
                        } else {
                          setIsLoginModalOpen(true);
                        }
                      }}
                      className="mt-4 sm:mt-0 px-5 py-2 bg-white text-[#DA552F] hover:bg-zinc-50 font-bold rounded-lg text-sm transition-colors shadow-sm relative z-10 whitespace-nowrap"
                    >
                      Claim Discount
                    </button>
                  </div>
                )}

                {/* Premium Marketing Header - Horizontal Wide Layout */}
                <div className="mb-8 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 shadow-xl overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Decorative glow effects */}
                  <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-500/5 blur-[100px] pointer-events-none"></div>
                  
                  <div className="relative z-10 flex-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                      Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Angel Investor</span>
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
                      Access an extensive, curated directory of active early-stage investors. Filter by industry, check size, and stage to find the perfect match. No warm introductions needed.
                    </p>
                  </div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 shrink-0 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex -space-x-3">
                      <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100" alt="Investor" />
                      <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=100&h=100" alt="Investor" />
                      <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=100&h=100" alt="Investor" />
                      <img className="w-10 h-10 rounded-full border-2 border-zinc-900 object-cover bg-zinc-800" src="https://images.unsplash.com/photo-1560250097-0b93528c311a?fit=crop&w=100&h=100" alt="Investor" />
                    </div>
                    <div className="flex flex-col text-left sm:text-right">
                      <div className="text-sm font-medium text-zinc-300">
                        <span className="text-white font-bold text-xl">{investors.length.toLocaleString()}</span> active
                      </div>
                      {investors.length !== filteredInvestors.length && (
                        <div className="text-xs font-medium text-blue-400">
                          {filteredInvestors.length.toLocaleString()} matching
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <MarketingShowcase isPremium={profile?.is_premium} />

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
                    const username = investor.twitter_url.split('/').pop().split('?')[0];
                    if (username) displayAvatar = `https://unavatar.io/twitter/${username}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || 'User')}&background=random`;
                  }
                  if (!displayAvatar && investor.email) {
                    displayAvatar = `https://unavatar.io/${investor.email}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || 'User')}&background=random`;
                  }
                  if (!displayAvatar) {
                    displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || 'User')}&background=random`;
                  }

                  return (
                    <div key={investor.id} className="group flex flex-col bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <img 
                              loading="lazy"
                              src={displayAvatar} 
                              alt={investor.name} 
                              className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-100 dark:bg-zinc-900" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || 'User')}&background=random`;
                              }}
                            />
                            <div>
                              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{investor.name}</h3>
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {investor.location || 'Unknown Location'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-5 line-clamp-3 leading-relaxed">
                          {investor.bio}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {displayIndustries.map(tag => (
                            <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-md border border-zinc-200 dark:border-zinc-800">
                              {tag}
                            </span>
                          ))}
                          {displayCheckSize && (
                            <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-900/30">
                              {displayCheckSize}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                        {isUnlocked ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {investor.email && (
                                  <a href={`mailto:${investor.email}`} className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 transition-colors group/link">
                                    <Mail className="w-4 h-4 group-hover/link:text-zinc-900 dark:group-hover/link:text-white transition-colors" />
                                    <span className="underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2">{investor.email}</span>
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {investor.website && (
                                  <a href={investor.website.startsWith('http') ? investor.website : `https://${investor.website}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Website">
                                    <Globe className="w-4 h-4" />
                                  </a>
                                )}
                                {investor.twitter_url && (
                                  <a href={investor.twitter_url.startsWith('http') ? investor.twitter_url : `https://${investor.twitter_url}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[#1DA1F2] transition-colors" title="Twitter">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                  </a>
                                )}
                                {investor.linkedin_url && (
                                  <a href={investor.linkedin_url.startsWith('http') ? investor.linkedin_url : `https://${investor.linkedin_url}`} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[#0A66C2] transition-colors" title="LinkedIn">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedInvestorForAI(investor)}
                              className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                            >
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              AI Draft Email
                            </button>
                            <button 
                              onClick={() => addToCrm(investor.id)}
                              disabled={crmLeadIds.has(investor.id) || addingToCrm === investor.id}
                              className={cn(
                                "flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-colors shadow-sm",
                                crmLeadIds.has(investor.id)
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 cursor-default"
                                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                              )}
                              title={crmLeadIds.has(investor.id) ? "Already in CRM" : "Add to CRM"}
                            >
                              {addingToCrm === investor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : crmLeadIds.has(investor.id) ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <UserPlus className="w-4 h-4" />
                              )}
                            </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative space-y-3 h-[88px]">
                            <div className="flex items-center justify-between blur-[4px] opacity-40 select-none pointer-events-none">
                              <div className="flex items-center gap-3">
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span>hidden@example.com</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-zinc-400" />
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-400" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-400" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full blur-[4px] opacity-40 select-none pointer-events-none">
                              <div className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm font-medium py-2 rounded-xl">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                AI Draft Email
                              </div>
                              <div className="w-[52px] flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl">
                                <UserPlus className="w-4 h-4" />
                              </div>
                            </div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[3px]">
                              <button 
                                onClick={() => {
                                  if (user) {
                                    window.open(`https://beatsprom.gumroad.com/l/vgobnh?email=${encodeURIComponent(user.email)}`, '_blank');
                                  } else {
                                    setIsLoginModalOpen(true);
                                  }
                                }}
                                className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-transform hover:scale-105 active:scale-[0.98] shadow-md group/btn"
                              >
                                <Lock className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
                                Unlock Premium
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
                  className="px-6 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-300 rounded-full hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm active:scale-[0.98]"
                >
                  Load More Investors
                </button>
              </div>
            )}
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
      <AIEmailModal
        isOpen={!!selectedInvestorForAI}
        onClose={() => setSelectedInvestorForAI(null)}
        investor={selectedInvestorForAI}
        profile={profile}
        user={user}
        allInvestors={investors}
      />
    </>
  );
}
