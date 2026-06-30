import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">Terms of Service</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <p>
            Welcome to OpenAngels. By accessing or using our website, database, and tools, you agree to be bound by these Terms of Service.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By creating an account and purchasing access to OpenAngels, you confirm that you have read, understood, and agreed to these terms. If you do not agree, please do not use our services.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. Description of Service</h2>
          <p>
            OpenAngels provides a curated database of angel investors and venture capitalists, along with an AI-powered email drafting tool to assist founders in fundraising. We do not guarantee investment, funding, or responses from any investors listed in our database.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">3. License and Acceptable Use</h2>
          <p>
            Upon purchase, you are granted a non-exclusive, non-transferable lifetime license to access the OpenAngels database for your own startup's fundraising efforts. 
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>You may not resell, redistribute, or publicly share the database.</li>
            <li>You may not use automated scraping tools to extract data from our platform.</li>
            <li>You agree to use the contact information provided responsibly and not to spam investors.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">4. Disclaimer of Liability</h2>
          <p>
            OpenAngels acts strictly as an informational resource. We are not a broker-dealer, investment advisor, or financial portal. We take no responsibility for any agreements, negotiations, or financial transactions that occur between founders and investors. All data is provided "as is" and we do not warrant its absolute accuracy, though we strive to keep it updated.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">5. Account Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You must immediately notify us of any unauthorized use of your account.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
