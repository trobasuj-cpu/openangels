import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import Footer from '@/components/Footer';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/30 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-8">Contact Us</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-2xl">
          Whether you have a question about the database, need help with your account, or want to suggest a new feature, our team is ready to answer all your questions.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Email Support</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">We usually respond within 24 hours.</p>
            <a href="mailto:support@openangels.xyz" className="text-amber-600 dark:text-amber-500 font-medium hover:underline">
              support@openangels.xyz
            </a>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Global Access</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">OpenAngels serves founders worldwide.</p>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              100% Remote Company
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
