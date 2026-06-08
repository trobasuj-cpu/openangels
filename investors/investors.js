// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';

// ─── STATIC FALLBACK DATA (shown before Supabase is connected) ───────────────
const STATIC_INVESTORS = [
  { id:1, name:"Naval Ravikant", bio:"Angel investor, entrepreneur, and philosopher. Co-founder of AngelList. Early investor in Twitter, Uber, Yammer, and 100+ companies.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:100000, check_max:1000000, stages:["pre-seed","seed"], industries:["saas","ai","crypto","marketplace","fintech"], portfolio:["Twitter","Uber","Yammer","Stack Overflow"], verified:true, twitter_url:"https://twitter.com/naval" },
  { id:2, name:"Paul Graham", bio:"Co-founder of Y Combinator. Backed Airbnb, Dropbox, Stripe, Reddit, and hundreds of the world's best startups.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:500000, check_max:5000000, stages:["pre-seed","seed"], industries:["saas","developer-tools","marketplace","ai","fintech"], portfolio:["Airbnb","Dropbox","Stripe","Reddit","Twitch"], verified:true, twitter_url:"https://twitter.com/paulg" },
  { id:3, name:"Peter Thiel", bio:"Co-founder of PayPal and Palantir. First outside investor in Facebook. Managing partner at Founders Fund.", location:"Miami, FL", country:"USA", type:"angel", check_min:1000000, check_max:50000000, stages:["seed","series-a","series-b"], industries:["saas","fintech","defense","ai","biotech"], portfolio:["Facebook","SpaceX","Palantir","LinkedIn"], verified:true },
  { id:4, name:"Sam Altman", bio:"CEO of OpenAI. Former president of Y Combinator. Active angel investor across AI, biotech, and energy.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:250000, check_max:5000000, stages:["pre-seed","seed","series-a"], industries:["ai","biotech","energy","saas","developer-tools"], portfolio:["Stripe","Reddit","Asana","Instacart"], verified:true, twitter_url:"https://twitter.com/sama" },
  { id:5, name:"Elad Gil", bio:"Serial entrepreneur and investor. Co-founder of Color Genomics. Backed Airbnb, Coinbase, Stripe, Square at early stages.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:250000, check_max:3000000, stages:["seed","series-a"], industries:["saas","ai","biotech","fintech","marketplace"], portfolio:["Airbnb","Coinbase","Stripe","Square","Pinterest"], verified:true, twitter_url:"https://twitter.com/eladgil" },
  { id:6, name:"Reid Hoffman", bio:"Co-founder of LinkedIn. Partner at Greylock. One of the most active angel investors in Silicon Valley.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:500000, check_max:10000000, stages:["seed","series-a","series-b"], industries:["saas","ai","marketplace","fintech","consumer"], portfolio:["Facebook","Airbnb","Zynga","PayPal"], verified:true, twitter_url:"https://twitter.com/reidhoffman" },
  { id:7, name:"Y Combinator", bio:"The world's top startup accelerator. $500K investment. Backed Airbnb, Stripe, Dropbox, Coinbase, Reddit.", location:"San Francisco, CA", country:"USA", type:"accelerator", check_min:500000, check_max:500000, stages:["pre-seed"], industries:["saas","ai","fintech","consumer","marketplace","biotech"], portfolio:["Airbnb","Stripe","Dropbox","Coinbase","Reddit","DoorDash"], verified:true, website:"https://ycombinator.com" },
  { id:8, name:"Garry Tan", bio:"CEO of Y Combinator. Previously co-founder of Initialized Capital. Early investor in Coinbase, Instacart, Reddit.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:500000, check_max:10000000, stages:["pre-seed","seed","series-a"], industries:["saas","fintech","consumer","ai","crypto"], portfolio:["Coinbase","Instacart","Reddit","Flexport"], verified:true, twitter_url:"https://twitter.com/garrytan" },
  { id:9, name:"Aileen Lee", bio:"Founder of Cowboy Ventures. Coined the term 'unicorn'. Former partner at Kleiner Perkins.", location:"Palo Alto, CA", country:"USA", type:"vc", check_min:500000, check_max:5000000, stages:["seed","series-a"], industries:["saas","consumer","fintech","ai","marketplace"], portfolio:["Dollar Shave Club","Life360","Rent the Runway"], verified:true, twitter_url:"https://twitter.com/aileenlee" },
  { id:10, name:"Chris Dixon", bio:"General Partner at a16z Crypto. Pioneer in crypto investing. Early backer of Coinbase, OpenSea, Dapper Labs.", location:"New York, NY", country:"USA", type:"vc", check_min:1000000, check_max:20000000, stages:["seed","series-a","series-b"], industries:["crypto","web3","ai","developer-tools"], portfolio:["Coinbase","OpenSea","Dapper Labs","Compound"], verified:true, twitter_url:"https://twitter.com/cdixon" },
  { id:11, name:"Chamath Palihapitiya", bio:"Founder of Social Capital. Former VP at Facebook. Active investor in tech, climate, and health.", location:"Palo Alto, CA", country:"USA", type:"vc", check_min:1000000, check_max:50000000, stages:["seed","series-a","series-b","growth"], industries:["saas","fintech","health","climate","ai"], portfolio:["Facebook","Slack","SoFi","Box"], verified:true, twitter_url:"https://twitter.com/chamath" },
  { id:12, name:"Sahil Lavingia", bio:"Founder and CEO of Gumroad. Angel investor in 100+ startups. Known for small checks and open investing.", location:"Remote", country:"USA", type:"angel", check_min:10000, check_max:100000, stages:["pre-seed","seed"], industries:["saas","creator-economy","marketplace","consumer"], portfolio:["Figma","Notion","Mercury"], verified:true, twitter_url:"https://twitter.com/shl" },
  { id:13, name:"Jason Calacanis", bio:"Angel investor and entrepreneur. Host of This Week in Startups. 300+ angel investments.", location:"Los Angeles, CA", country:"USA", type:"angel", check_min:25000, check_max:500000, stages:["pre-seed","seed"], industries:["saas","consumer","marketplace","ai","fintech"], portfolio:["Uber","Robinhood","Calm","Thumbtack"], verified:true, twitter_url:"https://twitter.com/jason" },
  { id:14, name:"Semil Shah", bio:"Founder of Haystack Fund. Early checks in DoorDash, Instacart, Hashicorp, Figma.", location:"Menlo Park, CA", country:"USA", type:"angel", check_min:25000, check_max:500000, stages:["pre-seed","seed"], industries:["saas","marketplace","consumer","ai","crypto"], portfolio:["DoorDash","Instacart","Hashicorp","Figma"], verified:true, twitter_url:"https://twitter.com/semil" },
  { id:15, name:"Fred Wilson", bio:"Co-founder of Union Square Ventures. Backed Twitter, Tumblr, Kickstarter, Coinbase, MongoDB.", location:"New York, NY", country:"USA", type:"vc", check_min:1000000, check_max:15000000, stages:["seed","series-a","series-b"], industries:["saas","crypto","marketplace","fintech","consumer"], portfolio:["Twitter","Tumblr","Kickstarter","Coinbase","MongoDB"], verified:true, twitter_url:"https://twitter.com/fredwilson" },
  { id:16, name:"Brad Feld", bio:"Co-founder of Techstars and Foundry Group. Author of 'Startup Communities'. Boulder ecosystem legend.", location:"Boulder, CO", country:"USA", type:"vc", check_min:500000, check_max:10000000, stages:["seed","series-a"], industries:["saas","consumer","developer-tools","ai"], portfolio:["Fitbit","Zynga","MakerBot","Sendgrid"], verified:true, twitter_url:"https://twitter.com/bfeld" },
  { id:17, name:"Christoph Janz", bio:"Co-founder of Point Nine Capital. The 'SaaS napkin' guy. Deep B2B SaaS expertise.", location:"Berlin", country:"Germany", type:"vc", check_min:500000, check_max:5000000, stages:["seed","series-a"], industries:["saas","fintech","marketplace"], portfolio:["Zendesk","Clio","Contentful","Typeform"], verified:true, twitter_url:"https://twitter.com/chrija" },
  { id:18, name:"Reshma Sohoni", bio:"Co-founder of Seedcamp. Europe's leading early-stage fund. Backed Revolut, UiPath, Wise.", location:"London", country:"UK", type:"vc", check_min:200000, check_max:2000000, stages:["pre-seed","seed"], industries:["saas","fintech","ai","marketplace","developer-tools"], portfolio:["Revolut","UiPath","Wise"], verified:true },
  { id:19, name:"Niklas Zennström", bio:"Co-founder of Skype. Founder of Atomico VC. Invests in European tech companies.", location:"London", country:"UK", type:"vc", check_min:2000000, check_max:30000000, stages:["series-a","series-b","growth"], industries:["saas","consumer","fintech","ai","climate"], portfolio:["Klarna","Supercell","Rovio","Lilium"], verified:true },
  { id:20, name:"Taavet Hinrikus", bio:"Co-founder of Wise (TransferWise). Active European angel investor, especially fintech and SaaS.", location:"London", country:"UK", type:"angel", check_min:100000, check_max:2000000, stages:["pre-seed","seed","series-a"], industries:["fintech","saas","marketplace","consumer"], portfolio:["Wise","Pipedrive","Skype"], verified:true, twitter_url:"https://twitter.com/taavet" },
  { id:21, name:"Arlan Hamilton", bio:"Founder of Backstage Capital. Investing in underrepresented founders. Raised $5M fund while homeless.", location:"Los Angeles, CA", country:"USA", type:"vc", check_min:25000, check_max:100000, stages:["pre-seed","seed"], industries:["saas","consumer","health","fintech","media"], portfolio:[], verified:true },
  { id:22, name:"Pieter Levels", bio:"Indie maker and angel investor. Creator of Nomad List and Remote OK. Invests in solo founders.", location:"Amsterdam", country:"Netherlands", type:"angel", check_min:5000, check_max:50000, stages:["pre-seed"], industries:["saas","consumer","creator-economy","marketplace"], portfolio:[], verified:true, twitter_url:"https://twitter.com/levelsio" },
  { id:23, name:"Tom Blomfield", bio:"Co-founder of Monzo and GoCardless. YC Group Partner. Angel in fintech and consumer.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:50000, check_max:500000, stages:["pre-seed","seed"], industries:["fintech","consumer","saas"], portfolio:["Monzo","GoCardless"], verified:true },
  { id:24, name:"Techstars", bio:"Global startup accelerator. $120K investment for 6% equity. 3,000+ companies backed worldwide.", location:"Boulder, CO", country:"USA", type:"accelerator", check_min:120000, check_max:120000, stages:["pre-seed"], industries:["saas","fintech","health","consumer","ai"], portfolio:["Sendgrid","Sphero","ClassPass","Digital Ocean"], verified:true, website:"https://techstars.com" },
  { id:25, name:"Vinod Khosla", bio:"Founder of Khosla Ventures. Co-founder of Sun Microsystems. Invests in deep tech, AI, and climate.", location:"Menlo Park, CA", country:"USA", type:"vc", check_min:1000000, check_max:50000000, stages:["seed","series-a","series-b","growth"], industries:["ai","climate","biotech","energy","deep-tech"], portfolio:["DoorDash","Square","Stripe","OpenAI"], verified:true },
  { id:26, name:"Nat Friedman", bio:"Former CEO of GitHub. Active angel in AI, developer tools, and open source.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:250000, check_max:3000000, stages:["seed","series-a"], industries:["ai","developer-tools","open-source","saas"], portfolio:["Mistral","Perplexity"], verified:true, twitter_url:"https://twitter.com/natfriedman" },
  { id:27, name:"Daniel Gross", bio:"Co-founder of Pioneer. Former AI lead at Apple (Siri). Partner at YC. Active angel in AI.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:100000, check_max:1000000, stages:["pre-seed","seed"], industries:["ai","developer-tools","saas"], portfolio:["Pioneer","Codeium"], verified:true },
  { id:28, name:"Ryan Hoover", bio:"Founder of Product Hunt (acquired by AngelList). Angel in consumer and social products.", location:"San Francisco, CA", country:"USA", type:"angel", check_min:10000, check_max:100000, stages:["pre-seed","seed"], industries:["consumer","saas","marketplace","creator-economy"], portfolio:["Product Hunt"], verified:true, twitter_url:"https://twitter.com/rrhoover" },
  { id:29, name:"500 Global", bio:"Venture capital firm and accelerator with $2.7B AUM. Backed Canva, Grab, Credit Karma.", location:"San Francisco, CA", country:"USA", type:"accelerator", check_min:150000, check_max:1000000, stages:["pre-seed","seed"], industries:["saas","fintech","marketplace","consumer","ai"], portfolio:["Canva","Grab","Talkdesk","Credit Karma"], verified:true },
  { id:30, name:"Hunter Walk", bio:"Partner at Homebrew VC. Early Google and YouTube exec. Invests in future of work and consumer.", location:"San Francisco, CA", country:"USA", type:"vc", check_min:500000, check_max:3000000, stages:["seed","series-a"], industries:["saas","consumer","future-of-work","marketplace"], portfolio:["Chime","Sunrun"], verified:true, twitter_url:"https://twitter.com/hunterwalk" },
];

// ─── STATE ────────────────────────────────────────────────────────────────────
let allInvestors = [];
let filtered = [];
let supabaseClient = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  showLoading(true);

  // Try Supabase first
  if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
    try {
      const { createClient } = window.supabase || {};
      if (createClient) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data, error } = await supabaseClient
          .from('investors')
          .select('*')
          .order('verified', { ascending: false })
          .limit(1100);
        if (!error && data?.length > 0) {
          allInvestors = data;
        }
      }
    } catch (e) {
      console.log('Supabase not available, using static data', e);
    }
  }

  // Fallback to static data
  if (allInvestors.length === 0) {
    allInvestors = STATIC_INVESTORS;
  }

  filtered = [...allInvestors];
  showLoading(false);
  renderCards(filtered);
  updateCount(filtered.length);
}

// ─── FILTERS ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const search   = document.getElementById('search-input').value.toLowerCase();
  const country  = document.getElementById('filter-country').value;
  const checkMin = parseInt(document.getElementById('filter-check').value) || 0;
  const sortBy   = document.getElementById('sort-select').value;

  const types = getChecked('filter-type');
  const stages = getChecked('filter-stage');
  const industries = getChecked('filter-industry');

  filtered = allInvestors.filter(inv => {
    // Search
    if (search) {
      const hay = `${inv.name} ${inv.bio || ''} ${inv.location || ''} ${(inv.portfolio || []).join(' ')}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    // Type
    if (types.length && !types.includes(inv.type)) return false;
    // Stage
    if (stages.length && !stages.some(s => (inv.stages || []).includes(s))) return false;
    // Industry
    if (industries.length && !industries.some(i => (inv.industries || []).includes(i))) return false;
    // Country
    if (country && inv.country !== country) return false;
    // Check size
    if (checkMin && (inv.check_max || 0) < checkMin) return false;
    return true;
  });

  // Sort
  if (sortBy === 'check_max') {
    filtered.sort((a, b) => (b.check_max || 0) - (a.check_max || 0));
  } else if (sortBy === 'verified') {
    filtered.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderCards(filtered);
  updateCount(filtered.length);
}

function getChecked(groupId) {
  return [...document.querySelectorAll(`#${groupId} input:checked`)].map(el => el.value);
}

function clearFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-country').value = '';
  document.getElementById('filter-check').value = '';
  document.getElementById('sort-select').value = 'name';
  document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(el => el.checked = false);
  applyFilters();
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
  'linear-gradient(135deg,#fd7043,#ff8a65)',
  'linear-gradient(135deg,#26c6da,#00acc1)',
];

function getGradient(name) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getInitials(name) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

function formatCheck(min, max) {
  const fmt = n => n >= 1000000 ? `$${n/1000000}M` : n >= 1000 ? `$${n/1000}K` : `$${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return 'Undisclosed';
}

function badgeClass(type) {
  return type === 'vc' ? 'badge-vc' : type === 'accelerator' ? 'badge-accel' : 'badge-angel';
}

function renderCards(list) {
  const grid = document.getElementById('investors-grid');
  const noResults = document.getElementById('no-results');

  if (!list.length) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  grid.innerHTML = list.map((inv, i) => `
    <div class="inv-card" onclick="openModal(${inv.id || i})" style="animation-delay:${Math.min(i*30,300)}ms">
      <div class="inv-card-top">
        <div class="inv-card-avatar" style="background:${getGradient(inv.name)}">${getInitials(inv.name)}</div>
        <div class="inv-card-meta">
          <div class="inv-card-name">${inv.name}</div>
          <div class="inv-card-loc">📍 ${inv.location || inv.country || '—'}</div>
        </div>
        <span class="inv-card-type-badge ${badgeClass(inv.type)}">${inv.type === 'vc' ? 'VC' : inv.type === 'accelerator' ? 'Accel' : 'Angel'}</span>
      </div>
      <p class="inv-card-bio">${inv.bio || '—'}</p>
      <div class="inv-card-tags">
        ${(inv.industries || []).slice(0,4).map(t => `<span class="tag">${t}</span>`).join('')}
        ${(inv.stages || []).slice(0,2).map(s => `<span class="tag" style="color:var(--accent2);border-color:rgba(6,182,212,0.2)">${s}</span>`).join('')}
      </div>
      <div class="inv-card-footer">
        <span class="inv-check-range">💰 ${formatCheck(inv.check_min, inv.check_max)}</span>
        ${inv.verified ? '<span class="inv-verified">✓ Verified</span>' : ''}
      </div>
    </div>
  `).join('');

  // Store for modal
  window._investorList = list;
}

function updateCount(n) {
  document.getElementById('result-count').textContent = n.toLocaleString();
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(idOrIndex) {
  const inv = (window._investorList || []).find(i => i.id === idOrIndex)
           || (window._investorList || [])[idOrIndex];
  if (!inv) return;

  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');

  content.innerHTML = `
    <div class="modal-avatar" style="background:${getGradient(inv.name)}">${getInitials(inv.name)}</div>
    <div class="modal-name">${inv.name}</div>
    <div class="modal-loc">📍 ${inv.location || ''} ${inv.country ? `· ${inv.country}` : ''}</div>
    ${inv.verified ? '<div style="color:var(--green);font-size:.8rem;margin-bottom:10px;">✓ Verified profile</div>' : ''}
    <p class="modal-bio">${inv.bio || ''}</p>

    ${inv.check_min || inv.check_max ? `
    <div class="modal-check">
      💰 <strong>Check size:</strong> ${formatCheck(inv.check_min, inv.check_max)}
    </div>` : ''}

    ${(inv.stages||[]).length ? `
    <div class="modal-section">
      <div class="modal-section-label">Investment Stages</div>
      <div class="modal-tags">${inv.stages.map(s=>`<span class="modal-tag">${s}</span>`).join('')}</div>
    </div>` : ''}

    ${(inv.industries||[]).length ? `
    <div class="modal-section">
      <div class="modal-section-label">Industries</div>
      <div class="modal-tags">${inv.industries.map(i=>`<span class="modal-tag">${i}</span>`).join('')}</div>
    </div>` : ''}

    ${(inv.portfolio||[]).length ? `
    <div class="modal-section">
      <div class="modal-section-label">Notable Portfolio</div>
      <div class="modal-tags">${inv.portfolio.slice(0,8).map(p=>`<span class="modal-tag">🏢 ${p}</span>`).join('')}</div>
    </div>` : ''}

    <div class="modal-links">
      ${inv.twitter_url ? `<a href="${inv.twitter_url}" target="_blank" class="modal-link">𝕏 Twitter</a>` : ''}
      ${inv.linkedin_url ? `<a href="${inv.linkedin_url}" target="_blank" class="modal-link">in LinkedIn</a>` : ''}
      ${inv.website ? `<a href="${inv.website}" target="_blank" class="modal-link">🌐 Website</a>` : ''}
    </div>
  `;

  modal.style.display = 'flex';
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
}

// ─── AI MATCH ─────────────────────────────────────────────────────────────────
function toggleAIMatch() {
  const panel = document.getElementById('ai-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function runAIMatch() {
  const input = document.getElementById('ai-input').value.trim();
  if (!input) return;

  const btn = document.getElementById('ai-btn');
  const resultEl = document.getElementById('ai-result');
  btn.querySelector('#ai-btn-text').textContent = 'Analyzing...';
  btn.disabled = true;

  // Smart local matching (no API needed)
  const keywords = input.toLowerCase();
  const industryMap = { ai:'ai', saas:'saas', fintech:'fintech', b2b:'saas', crypto:'crypto', marketplace:'marketplace', health:'biotech', edtech:'edtech', climate:'climate', developer:'developer-tools', tool:'developer-tools', consumer:'consumer' };
  const stageMap = { 'pre-seed':'pre-seed', seed:'seed', 'series a':'series-a', early:'pre-seed' };

  const matchedIndustries = Object.entries(industryMap).filter(([k]) => keywords.includes(k)).map(([,v]) => v);
  const matchedStages = Object.entries(stageMap).filter(([k]) => keywords.includes(k)).map(([,v]) => v);

  // Score investors
  const scored = allInvestors.map(inv => {
    let score = 0;
    if (matchedIndustries.some(i => (inv.industries||[]).includes(i))) score += 3;
    if (matchedStages.some(s => (inv.stages||[]).includes(s))) score += 2;
    if (inv.verified) score += 1;
    return { ...inv, _score: score };
  }).filter(i => i._score > 0).sort((a,b) => b._score - a._score).slice(0,5);

  setTimeout(() => {
    btn.querySelector('#ai-btn-text').textContent = 'Find matching investors';
    btn.disabled = false;

    if (!scored.length) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = '🤔 No specific matches found. Try describing your industry and funding stage.';
      return;
    }

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <strong>✨ Top matches for your startup:</strong><br/><br/>
      ${scored.map((inv,i) => `
        <strong>${i+1}. ${inv.name}</strong> (${inv.type === 'vc' ? 'VC' : 'Angel'}) — ${(inv.industries||[]).slice(0,3).join(', ')} · ${(inv.stages||[]).join(', ')}<br/>
      `).join('')}
      <br/>Scroll down to find these investors in the grid ↓
    `;

    // Highlight matched investors in grid
    document.getElementById('search-input').value = scored[0].name.split(' ')[0];
    applyFilters();
  }, 800);
}

// ─── ESC key closes modal ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('modal').style.display = 'none';
});

// ─── BOOT ─────────────────────────────────────────────────────────────────────
init();
