import Script from "next/script";
import "./globals.css";
import { getDynamicInvestorCount } from "@/seo";

export async function generateMetadata() {
  const { seoLabel } = await getDynamicInvestorCount();
  return {
    metadataBase: new URL('https://openangels.xyz'),
    alternates: {
      canonical: 'https://openangels.xyz',
    },
    title: `OpenAngels — Find Angel Investors for Your Startup | ${seoLabel} VC & Angel Database`,
    description: `The largest open database of ${seoLabel} verified angel investors and VCs. Filter by industry, stage, and check size. Draft personalized AI pitch emails. One lifetime payment — no subscriptions.`,
    keywords: "find angel investors, angel investor database, list of angel investors, startup investors, VC database, seed funding, pre-seed investors, how to find investors for startup, AI cold email generator, pitch investors, angel investor directory, venture capital list, openvc alternative, signal nfx alternative, investor contact database",
    openGraph: {
      title: `OpenAngels — Find ${seoLabel} Angel Investors for Your Startup`,
      description: `The largest open database of ${seoLabel} verified angel investors and VCs. Filter by 90+ industries, draft AI pitch emails, and fundraise faster.`,
      url: "https://openangels.xyz/",
      siteName: "OpenAngels",
      images: [
        {
          url: "https://openangels.xyz/og-image.png",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `OpenAngels — ${seoLabel} Angel Investors & VCs`,
      description: `The largest open investor database of ${seoLabel} verified contacts. Filter by 90+ industries, get verified contacts, and draft AI pitches instantly.`,
      images: ["https://openangels.xyz/og-image.png"],
    },
  };
}

export const viewport = {
  themeColor: "#09090b",
};

export default async function RootLayout({ children, modal }) {
  const { seoLabel } = await getDynamicInvestorCount();

  const siteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://openangels.xyz/#website",
        "url": "https://openangels.xyz",
        "name": "OpenAngels",
        "description": `The largest open database of ${seoLabel} verified angel investors and VCs.`,
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://openangels.xyz/directory?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://openangels.xyz/#organization",
        "name": "OpenAngels",
        "url": "https://openangels.xyz",
        "logo": "https://openangels.xyz/og-image.png",
      },
      {
        "@type": "WebApplication",
        "@id": "https://openangels.xyz/#webapp",
        "name": "OpenAngels",
        "url": "https://openangels.xyz",
        "description": `The largest open database of ${seoLabel} verified angel investors and VCs. Filter by 90+ industries, stage, and check size. Draft personalized AI pitch emails and fundraise faster.`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "49.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
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
        <Script src="https://gumroad.com/js/gumroad.js" strategy="afterInteractive" />
        {children}
        {modal}
      </body>
    </html>
  );
}
