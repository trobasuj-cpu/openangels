import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">Privacy Policy</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
          <p>
            Your privacy is critically important to us. This Privacy Policy explains how OpenAngels collects, uses, and protects your personal information.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p>We only collect the information necessary to provide our services:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Account Information:</strong> Your email address and authentication details provided via Supabase/Google Auth.</li>
            <li><strong>Usage Data:</strong> Basic analytics on how you interact with our application to improve user experience.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use your information exclusively to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Authenticate your access to the database.</li>
            <li>Process payments via Stripe.</li>
            <li>Provide customer support.</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We only share data with trusted service providers (like Stripe for payments and Supabase for database hosting) who assist us in operating our website and conducting our business.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information. Our database is secured via Supabase Row Level Security (RLS) and authentication protocols.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@openangels.xyz" className="text-amber-600 hover:underline">support@openangels.xyz</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
