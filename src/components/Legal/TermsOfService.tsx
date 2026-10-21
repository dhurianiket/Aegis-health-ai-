import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 sm:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Effective Date: March 4, 2026 • Last Reviewed: October 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">1. Service Operator &amp; Scope</h2>
            <p>
              <strong>Aegis Health AI</strong> (Govt. of India MSME Udyam: <code>UDYAM-MH-33-0782403</code>, Dombivli West, Thane, Maharashtra 421202, India) operates a clinical intelligence and longitudinal health record organization platform powered by Google Cloud and Vertex AI Gemini models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">2. Strict Medical Disclaimer</h2>
            <p className="font-semibold p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border-l-4 border-teal-500 text-teal-900 dark:text-teal-100">
              Aegis Health AI does NOT provide medical diagnosis, prescriptions, or emergency treatment, and is not a substitute for a licensed physician. All biomarker trajectories and SBAR summaries are informational decision-support tools designed to be reviewed with a qualified healthcare professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">3. User Responsibilities</h2>
            <p>
              By utilizing our services, you agree to verify extracted values against your original laboratory reports. OCR confidence badges and unit conversion notices are provided to assist verification alongside your consulting physician.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">4. Governing Law &amp; Contact</h2>
            <p>
              These Terms are governed by the laws of India, with jurisdiction in Thane/Mumbai, Maharashtra. For support or legal inquiries, contact <a href="mailto:support@aegishealthai.co.in" className="text-teal-600 dark:text-teal-400 underline">support@aegishealthai.co.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
