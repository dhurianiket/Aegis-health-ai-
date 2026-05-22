import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-500">Last Updated: May 17, 2026</p>
        
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">1. Introduction (Public Beta)</h2>
            <p>Welcome to Aegis Health AI. We respect your privacy and are deeply committed to protecting your personal data. Please note that this product is currently in a public beta/early access phase. Your health data should be reviewed carefully, and AI output is strictly informational.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">2. DPDP Act 2023 Alignment</h2>
            <p>
              We act in compliance with India's Digital Personal Data Protection (DPDP) Act 2023. You retain full ownership of your data at all times. We empower you to request access, correction, or complete deletion of your data whenever you choose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">3. Information Collection &amp; Use</h2>
            <p>
              We collect information you explicitly provide, such as medical details and reports. These are stored securely utilizing AES-256 database encryption. We explicitly pledge a Zero Third-Party Data Selling policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">4. Your Data Rights</h2>
            <p>
              As a Data Principal, you have the right to withdraw your consent to data processing at any time. Submit deletion requests directly through your account dashboard or by contacting our support channel.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
