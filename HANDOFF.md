# OpenAngels Project Context & Handoff

## What is OpenAngels?
OpenAngels (openangels.xyz) is a premium database of Angel Investors tailored for startup founders. It goes beyond a simple directory by integrating AI (Google Gemini) to generate hyper-personalized cold email pitches for founders to send directly to investors.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Lucide-React.
- **Backend / Database**: Supabase (PostgreSQL), Supabase Auth.
- **Serverless**: Supabase Edge Functions (Deno) for AI logic.
- **Hosting**: Vercel.

## Key Features Implemented So Far
1. **Interactive Database**: Filterable UI with collapsible sections for Industry, Stage, Location, and Check Size. Check sizes are dynamically bucketed (e.g., "$100k - $500k").
2. **AI Email Drafter**: A killer feature. Founders click "AI Draft Email" on an investor's card. A modal pops up asking for their startup description. The frontend calls a Supabase Edge Function (`generate-email`) which uses the **Google Gemini 2.5 Flash API** to generate a pitch containing a Subject Line and Body, using the investor's name, industry, and the user's startup context.
3. **Smart Email Integration**: 
   - Generates a customized "Open in Gmail" link.
   - Automatically forces the Gmail link to use the email address the user is logged into the app with (using `/u/{user.email}/`).
4. **CRM BCC Integration**: Users can save a CRM BCC email address in their profile menu. This address is automatically appended to the Gmail/Mailto links so their outreach is logged in Hubspot/Pipedrive/etc.
5. **Lifetime Paywall**: Free users see limited data and cannot use AI features. A prominent "Premium (Lifetime Access)" upgrade prompt links to a Gumroad checkout.
6. **SEO Optimized**: Standard SEO meta tags are in place.

## Database Schema Highlights
- **`investors` table**: Contains `id`, `name`, `bio`, `location`, `industries` (array), `stages` (array), `check_min`, `check_max`, `email`, `twitter_url`, `linkedin_url`, etc.
- **`profiles` table**: Linked to Supabase Auth users. Contains `is_premium` (boolean), `startup_description` (saved context for AI), and `crm_bcc_email`.

## The Current Goal: Database Expansion & Enrichment
The focus of this new chat session is **Massive Data Expansion**. 
To beat competitors like AngelMatch.io, the database needs to grow from ~1,000 to 10,000+ high-quality investors.

**Immediate Tasks for the New Session:**
1. **Data Acquisition Strategy**: Figure out the best way to scrape, buy, or import new investor data (from Crunchbase, LinkedIn, Apollo, or existing CSVs).
2. **Data Parsing & Normalization**: Write scripts (Node.js/Python) to clean the raw data, map disparate industry names into standard tags, and convert check sizes into the `check_min`/`check_max` integers.
3. **Adding `past_investments`**: Create a new column (array or text) to store companies the investor has previously backed. This is critical for making the AI pitch generation even more personalized.
4. **Bulk Import to Supabase**: Safely push thousands of new records into the `investors` table.

## Note to the New Agent
The codebase is clean and currently live on Vercel. Please focus your efforts entirely on data engineering, scraping tools, and database population scripts. The frontend is ready to handle the new data as long as the schema structure is respected.
