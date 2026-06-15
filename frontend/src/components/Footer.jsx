import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Brand & Newsletter */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
              OpenAngels
            </span>
          </Link>
          <p className="text-sm">
            A database of 3,500+ investors to raise your capital faster. Find the perfect angel investors and draft AI pitches instantly.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-white font-bold text-sm">
              X
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-white font-bold text-sm">
              in
            </a>
          </div>
          <div className="flex w-full max-w-sm items-center space-x-2 pt-2">
            <input 
              type="email" 
              placeholder="Sign up for our newsletter" 
              className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white"
            />
            <button className="h-10 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>

        {/* Company and Legal */}
        <div>
          <h3 className="text-white font-semibold mb-4">Company and Legal</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/terms" className="hover:text-amber-500 transition-colors">Terms of service</Link></li>
            <li><Link to="/refund" className="hover:text-amber-500 transition-colors">Refund policy</Link></li>
            <li><Link to="/privacy" className="hover:text-amber-500 transition-colors">Privacy policy</Link></li>
            <li><Link to="/gdpr" className="hover:text-amber-500 transition-colors">GDPR</Link></li>
            <li><Link to="/contact" className="hover:text-amber-500 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-white font-semibold mb-4">Products</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-amber-500 transition-colors">Investor Database</Link></li>
            <li><Link to="/investors/ai" className="hover:text-amber-500 transition-colors">AI Investors List</Link></li>
            <li><Link to="/investors/saas" className="hover:text-amber-500 transition-colors">SaaS Investors List</Link></li>
            <li><Link to="/investors/fintech" className="hover:text-amber-500 transition-colors">Fintech Investors List</Link></li>
            <li><Link to="/investors/consumer" className="hover:text-amber-500 transition-colors">Consumer Investors List</Link></li>
            <li><Link to="/investors/b2b" className="hover:text-amber-500 transition-colors">B2B Investors List</Link></li>
          </ul>
        </div>

        {/* Free Fundraising Tools */}
        <div>
          <h3 className="text-white font-semibold mb-4">Free Fundraising Tools</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-amber-500 transition-colors">Investor Outreach AI Email Generator</Link></li>
            <li><Link to="/" className="hover:text-amber-500 transition-colors">VC Search Tool</Link></li>
            <li><Link to="/" className="hover:text-amber-500 transition-colors">Investor Matcher</Link></li>
            <li className="pt-4 pb-2"><h3 className="text-white font-semibold">For Investors</h3></li>
            <li><a href="mailto:support@openangels.xyz" className="hover:text-amber-500 transition-colors">Join investor database</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} OpenAngels. All rights reserved.</p>
        <p>Built for founders, by founders.</p>
      </div>
    </footer>
  );
}
