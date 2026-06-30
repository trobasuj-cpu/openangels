import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function Refund() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">Refund Policy</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <p>
            Thank you for purchasing access to OpenAngels. We want to ensure that our customers are aware of our strict refund policy regarding digital goods and database access.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">No Refunds After Data Export</h2>
          <p>
            Because OpenAngels provides immediate access to a proprietary, downloadable database of 3,500+ investors, <strong>we cannot offer refunds once the data has been accessed or exported.</strong>
          </p>
          
          <p>
            Unlike traditional software subscriptions, our core product is the data itself. Once a user downloads a CSV file or copies data from our platform, it is impossible to "return" the product. Therefore, all sales are considered final upon accessing the database.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Exceptions</h2>
          <p>
            We may grant refunds only in exceptional circumstances, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>A duplicate payment was charged by mistake.</li>
            <li>You were unable to access your account due to a technical error on our end, and you have not exported any data.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact</h2>
          <p>
            If you experience a technical issue, please contact us at <a href="mailto:support@openangels.xyz" className="text-amber-600 hover:underline">support@openangels.xyz</a>. We will work diligently to resolve the problem.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
