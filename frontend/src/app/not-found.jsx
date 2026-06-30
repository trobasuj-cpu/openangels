import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-9xl font-extrabold text-zinc-200 dark:text-zinc-800 tracking-tighter mb-4">404</h1>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Page not found</h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
          Sorry, we couldn't find any investors matching those criteria, or the page you're looking for doesn't exist.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-full hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all investors
        </Link>
      </main>
      <Footer />
    </div>
  );
}
