import "./globals.css";

export const metadata = {
  title: "OpenAngels — Find Angel Investors for Your Startup | 4,700+ VC & Angel Database",
  description: "The largest open database of 4,700+ verified angel investors and VCs. Filter by industry, stage, and check size. Draft personalized AI pitch emails. One lifetime payment — no subscriptions.",
  keywords: "find angel investors, angel investor database, list of angel investors, startup investors, VC database, seed funding, pre-seed investors, how to find investors for startup, AI cold email generator, pitch investors, angel investor directory, venture capital list, openvc alternative, signal nfx alternative, investor contact database",
  openGraph: {
    title: "OpenAngels — Find 4,700+ Angel Investors for Your Startup",
    description: "The largest open database of verified angel investors and VCs. Filter by 90+ industries, draft AI pitch emails, and fundraise faster.",
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
    title: "OpenAngels — 4,700+ Angel Investors & VCs",
    description: "The largest open investor database. Filter by 90+ industries, get verified contacts, and draft AI pitches instantly.",
    images: ["https://openangels.xyz/og-image.png"],
  },
};

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children, modal }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "OpenAngels",
              "url": "https://openangels.xyz",
              "description":
                "The largest open database of 4,700+ verified angel investors and VCs. Filter by 90+ industries, stage, and check size. Draft personalized AI pitch emails and fundraise faster.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "49.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
              },
            }),
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        {children}
        {modal}
      </body>
    </html>
  );
}
