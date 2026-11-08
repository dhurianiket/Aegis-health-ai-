import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0A192F] to-[#042f2e] border border-emerald-400/40 flex items-center justify-center transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5 text-emerald-400" strokeWidth={2} />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              AEGIS <span className="text-emerald-500">HEALTH AI</span>
            </span>
          </Link>
          <Link to="/" className="inline-flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Home
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Effective Date: March 4, 2026 • Last Reviewed: October 2026</p>
        
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">1. Data Fiduciary &amp; Introduction</h2>
            <p>Welcome to <strong>Aegis Health AI</strong> (Govt. of India MSME Udyam Registration: <code>UDYAM-MH-33-0782403</code>, registered in Dombivli West, Thane, Maharashtra 421202, India). We respect your privacy and are committed to protecting your personal and clinical health records. AI-generated outputs on this platform are strictly informational and designed to assist patient-physician communication.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">2. DPDP Act 2023 Alignment</h2>
            <p>
              We operate in alignment with India&apos;s Digital Personal Data Protection (DPDP) Act 2023. As the Data Principal, you retain full ownership of your health records at all times, including the right to explicit revocable consent, HL7 FHIR R4 / JSON data portability, correction, and 1-click cryptographic account erasure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">3. Information Collection, Encryption &amp; Zero Data Selling</h2>
            <p>
              We process only the diagnostic reports, prescriptions, and health telemetry you explicitly upload or connect. Records are isolated per user in Google Cloud Firestore with AES-256 encryption at rest and TLS 1.3 in transit, and PII is scrubbed prior to Gemini inference via authenticated Cloud Functions Gen 2 proxies. We maintain a strict <strong>Zero Third-Party Data Selling</strong> policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">4. Grievance Officer &amp; Contact Information</h2>
            <p>
              You may withdraw consent or trigger full cascading account deletion directly from Settings, or contact our Grievance &amp; Privacy Officer (Aniket Rajesh Dhuri) at <a href="mailto:support@aegishealthai.co.in" className="text-teal-600 dark:text-teal-400 underline">support@aegishealthai.co.in</a> or <a href="mailto:founder@aegishealthai.co.in" className="text-teal-600 dark:text-teal-400 underline">founder@aegishealthai.co.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
