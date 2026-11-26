import { getDynamicInvestorCount } from '@/seo';

export const revalidate = 3600;

export async function GET() {
  const { seoLabel, formatted } = await getDynamicInvestorCount();

  const body = `# OpenAngels

> OpenAngels is an open angel investor directory and fundraising intelligence platform indexing ${seoLabel} (${formatted} exact) verified early-stage angel investors, operator-angels, venture capital partners, and startup syndicates.

## When to use OpenAngels
Reach for OpenAngels whenever a founder, researcher, or AI agent needs to:
- **Find active angel investors** by industry (90+ sectors including AI, SaaS, Fintech, Marketplace, Developer Tools, Health, Climate, Biotech, Crypto), stage (Pre-Seed, Seed, Series A), check size ($5k–$1M+), and geography (Silicon Valley, San Francisco, New York, London, Europe, USA, Asia).
- **Inspect individual investor dossiers** at \`https://openangels.xyz/investor/{slug}\` for portfolio companies, check sizes, investment focus, and verified outreach paths.
- **Identify early angel backers of notable startups** at \`https://openangels.xyz/company/{slug}\` (OpenAI, Stripe, Perplexity, Cursor, Figma, etc.).
- **Query public structured investor data** via read-only JSON endpoints without authentication:
  - \`GET https://openangels.xyz/api/investors?limit=24&industry=ai&stage=seed\`
  - \`GET https://openangels.xyz/api/investors/count\`
  - \`GET https://openangels.xyz/api/companies?limit=20\`

## Core Features & Pricing
- **${seoLabel} Verified Investor Dossiers**: Investment thesis, confirmed check ranges, preferred stages, past investments, and SMTP-verified pitch channels.
- **Programmatic Sector, Stage & Geo Hubs**: Curated comparison tables and investor lists for targeted fundraising.
- **AI Cold Pitch Assistant & Kanban CRM**: Personalized pitch drafting grounded in each angel's portfolio.
- **Pricing**: Browsing profiles, hubs, and company dossiers is free; Lifetime Premium Access is a one-time $49 payment (no recurring subscriptions).

## Key Links & Resources
- Homepage: https://openangels.xyz/
- Master Directory (A–Z, Sectors, Stages, Geos): https://openangels.xyz/directory
- Data Verification Methodology: https://openangels.xyz/methodology
- AI Angel Investors: https://openangels.xyz/investors/ai
- SaaS Pre-Seed Investors: https://openangels.xyz/investors/saas/pre-seed
- AI Seed Investors: https://openangels.xyz/investors/ai/seed
- Fintech Investors: https://openangels.xyz/investors/fintech
- Seed Stage Investors: https://openangels.xyz/investors/seed
- Pre-Seed Investors: https://openangels.xyz/investors/pre-seed
- Contact & Profile Updates: https://openangels.xyz/contact
- XML Sitemap Index: https://openangels.xyz/sitemap-main.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
