import Script from "next/script";
import "./globals.css";
import { getDynamicInvestorCount, DEFAULT_OG_IMAGE } from "@/seo";
import { InvestorCountProvider } from "@/components/InvestorCountProvider";

export async function generateMetadata() {
  const { seoLabel } = await getDynamicInvestorCount();
  return {
    metadataBase: new URL('https://openangels.xyz'),
    title: `OpenAngels: Find Angel Investors & VCs (${seoLabel} Database)`,
    description: `The largest open database of ${seoLabel} verified angel investors and VCs. Filter by industry, stage, and check size. Draft personalized AI pitch emails. One lifetime payment — no subscriptions.`,
    keywords: "find angel investors, angel investor database, list of angel investors, startup investors, VC database, seed funding, pre-seed investors, how to find investors for startup, AI cold email generator, pitch investors, angel investor directory, venture capital list, openvc alternative, signal nfx alternative, investor contact database",
    openGraph: {
      title: `OpenAngels — Find ${seoLabel} Angel Investors for Your Startup`,
      description: `The largest open database of ${seoLabel} verified angel investors and VCs. Filter by 90+ industries, draft AI pitch emails, and fundraise faster.`,
      url: "https://openangels.xyz/",
      siteName: "OpenAngels",
      images: [DEFAULT_OG_IMAGE],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `OpenAngels — ${seoLabel} Angel Investors & VCs`,
      description: `The largest open investor database of ${seoLabel} verified contacts. Filter by 90+ industries, get verified contacts, and draft AI pitches instantly.`,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export const viewport = {
  themeColor: "#09090b",
};

export default async function RootLayout({ children, modal }) {
  const { total, seoLabel } = await getDynamicInvestorCount();

  const siteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://openangels.xyz/#website",
        "url": "https://openangels.xyz",
        "name": "OpenAngels",
        "description": `The largest open database of ${seoLabel} verified angel investors and VCs.`,
        "publisher": {
          "@id": "https://openangels.xyz/#organization",
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://openangels.xyz/?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://openangels.xyz/#organization",
        "name": "OpenAngels",
        "url": "https://openangels.xyz",
        "logo": {
          "@type": "ImageObject",
          "url": "https://openangels.xyz/icon.svg",
          "width": 512,
          "height": 512,
        },
        "sameAs": [
          "https://www.producthunt.com/products/openangels",
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "tackssignals@gmail.com",
          "url": "https://openangels.xyz/contact",
          "availableLanguage": ["English"],
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "San Francisco",
          "addressRegion": "CA",
          "addressCountry": "US",
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteSchema),
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        <Script src="https://gumroad.com/js/gumroad.js" strategy="lazyOnload" />
        <InvestorCountProvider initialTotal={total}>
          {children}
          {modal}
        </InvestorCountProvider>
      </body>
    </html>
  );
}
