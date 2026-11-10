/**
 * Proactive Search Engine Indexing Notifier (IndexNow + Search Engine Ping)
 * Submits top canonical hub URLs and top-tier angel investor profiles directly
 * to Bing, Yandex, Seznam, Naver, and search crawlers via IndexNow protocol.
 */

const INDEXNOW_KEY = '982f1b72dc64426ca219e9177f525547';
const HOST = 'openangels.xyz';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const CORE_URLS = [
  'https://openangels.xyz/',
  'https://openangels.xyz/directory',
  'https://openangels.xyz/investors/ai',
  'https://openangels.xyz/investors/saas',
  'https://openangels.xyz/investors/fintech',
  'https://openangels.xyz/investors/marketplace',
  'https://openangels.xyz/investors/consumer',
  'https://openangels.xyz/investors/enterprise',
  'https://openangels.xyz/investors/deep-tech',
  'https://openangels.xyz/investors/crypto',
  'https://openangels.xyz/investors/climate',
  'https://openangels.xyz/investors/biotech',
  'https://openangels.xyz/investors/developer-tools',
  'https://openangels.xyz/investors/health',
  'https://openangels.xyz/investors/b2b',
  'https://openangels.xyz/investors/security',
  'https://openangels.xyz/investors/gaming',
  'https://openangels.xyz/investors/ai/seed',
  'https://openangels.xyz/investors/saas/pre-seed',
  'https://openangels.xyz/investors/fintech/seed',
  'https://openangels.xyz/investors/silicon-valley',
  'https://openangels.xyz/investors/san-francisco',
  'https://openangels.xyz/investors/new-york',
  'https://openangels.xyz/investors/london',
  'https://openangels.xyz/investors/europe',
  // Top Authority Angels
  'https://openangels.xyz/investor/naval-ravikant',
  'https://openangels.xyz/investor/sam-altman',
  'https://openangels.xyz/investor/lenny-rachitsky',
  'https://openangels.xyz/investor/elad-gil',
  'https://openangels.xyz/investor/paul-graham',
  'https://openangels.xyz/investor/garry-tan',
  'https://openangels.xyz/investor/peter-thiel',
  'https://openangels.xyz/investor/reid-hoffman',
  'https://openangels.xyz/investor/balaji-srinivasan',
  'https://openangels.xyz/investor/jason-calacanis',
  'https://openangels.xyz/investor/greg-brockman',
  'https://openangels.xyz/investor/pieter-levels',
  'https://openangels.xyz/investor/marc-benioff',
  'https://openangels.xyz/investor/alexandr-wang',
  'https://openangels.xyz/investor/ron-conway',
  'https://openangels.xyz/investor/andrew-wilkinson',
  'https://openangels.xyz/investor/alexis-ohanian',
  'https://openangels.xyz/investor/daniel-gross',
  'https://openangels.xyz/investor/hiten-shah',
  'https://openangels.xyz/investor/daniel-ek',
];

async function pingIndexNow() {
  console.log(`[IndexNow] Preparing submission of ${CORE_URLS.length} high-priority URLs to IndexNow...`);
  
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: CORE_URLS,
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[IndexNow] api.indexnow.org response status: ${res.status} ${res.statusText}`);
    if (res.status === 200 || res.status === 202) {
      console.log('✅ [IndexNow] Batch submitted successfully! Search engines will prioritize these URLs.');
    } else {
      const text = await res.text();
      console.log(`[IndexNow] Response body: ${text}`);
    }
  } catch (err) {
    console.error('❌ [IndexNow] Error submitting batch:', err.message);
  }

  // Ping Google Sitemap Ping Endpoint
  try {
    const googlePing = `https://www.google.com/ping?sitemap=https://${HOST}/sitemap-main.xml`;
    const gRes = await fetch(googlePing);
    console.log(`[Google Ping] sitemap-main.xml status: ${gRes.status}`);
  } catch (e) {
    console.log('[Google Ping] Notice:', e.message);
  }
}

pingIndexNow();
