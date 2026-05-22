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
        <p className="text-sm text-slate-500">Last Updated: May 17, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">1. Nature of the Service (Beta / Early Access)</h2>
            <p>
              Aegis Health AI is currently in a public beta/early access phase. It is an informational and technological tool designed strictly for tracking and organizing health records and insights. We provide automated structuring of records and insights through AI. Features may change or experience interruptions during this beta phase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">2. Strict Medical Disclaimer</h2>
            <p className="font-semibold p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border-l-4 border-teal-500 text-teal-900 dark:text-teal-100">
              Aegis Health AI does NOT provide medical advice, diagnosis, or treatment. It is not a substitute for a doctor or professional clinical assessment. The AI output is for informational purposes only. Do not disregard professional medical advice or delay seeking it because of information you have read on this platform. If you are experiencing urgent medical symptoms, you must contact emergency services or visit a hospital immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">3. User Responsibilities</h2>
            <p>
              By utilizing our services, you accept full accountability for verifying the data against your original laboratory reports or clinically issued records. Health data should be reviewed carefully. You acknowledge that AI systems may occasionally misread formats, hallucinate data, or omit important clinical nuance. Aegis Health AI should always serve alongside, not in place of, a human doctor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">4. Service Modifications</h2>
            <p>
              Aegis Health AI reserves the right to iteratively alter or pause aspects of this service to ensure platform stability or introduce regulatory updates. 
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
