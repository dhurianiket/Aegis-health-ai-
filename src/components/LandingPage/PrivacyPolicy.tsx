import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted">Last Updated: May 17, 2026</p>
        </div>

        <p className="text-base leading-relaxed">
          Your privacy and the security of your health information are fundamental to how Aegis Health AI is built. This policy explains, in plain language, exactly what data we handle, how we use it, and the principles we follow to keep it safe. We built this tool to help Indian families understand their health. That mission starts with trust.
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">1. Who We Are</h2>
          <p className="text-sm leading-relaxed text-muted">
            Aegis Health AI is an early-stage health insights platform founded by <a href="https://aniket.aegishealthai.co.in/" target="_blank" rel="noreferrer" className="text-gray-900 border-b border-gray-300 hover:border-gray-900 transition-colors">Aniket Dhuri</a>, based in Dombivli, Maharashtra, India. We are currently in a public beta phase, offering the service free for user feedback. If you have any questions about this policy, you can reach us directly at <span className="text-blue-500 font-semibold">support@aegishealthai.co.in</span>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">2. What Information We Collect</h2>
          <p className="text-sm leading-relaxed text-muted">We collect only what is necessary to provide you with a report analysis and health summary:</p>
          <ul className="list-disc pl-5 text-sm text-muted space-y-2">
            <li><strong>Medical Reports You Upload:</strong> Files (PDFs, images of lab reports, or prescriptions) are transmitted securely and processed to extract text and health markers. We strongly advise you to redact your name and any personally identifiable details from the report before uploading, though this is not required.</li>
            <li><strong>Questions You Ask the AI Assistant:</strong> Text prompts and follow-up questions typed into the AI companion are processed to generate educational context.</li>
            <li><strong>Basic Usage Data:</strong> Minimal, privacy-focused analytics (via Firebase Analytics) measure overall platform health. This data is entirely anonymous.</li>
          </ul>
          <p className="text-xs font-semibold text-amber-500 bg-amber-500/10 p-3 rounded-xl inline-block mt-2">
            ⚠️ Privacy Safeguard: We do not collect your phone number, Aadhaar, address, or any other government ID.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 text-sm text-muted space-y-2">
            <li><strong>Report Processing:</strong> Processed securely via Google's Gemini AI enterprise APIs to map clean biomarker trends on your dashboard.</li>
            <li><strong>Conversation Responses:</strong> Prompts feed the "Virtual Polyclinic" interactive chat engine.</li>
            <li><strong>Aggregated Patterns:</strong> De-identified global metrics help optimize document extraction models. We never browse individual user profiles without explicit permission.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Our Core Privacy Promises</h2>
          <ul className="list-disc pl-5 text-sm text-muted space-y-2">
            <li><strong>Zero Data Sale:</strong> We will never sell, rent, or trade your personal health data to insurance firms, pharma companies, or data brokers. Period.</li>
            <li><strong>Security First:</strong> End-to-end data transmission is fully encrypted over HTTPS. Files rest within production-tier Google Firebase security lifecycles.</li>
            <li><strong>Limited Access:</strong> Infrastructure configuration access is tightly isolated to the core technical platform maintenance crew.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">5. Storage, Control, & India DPDP Compliance</h2>
          <p className="text-sm leading-relaxed text-muted">
            In complete compliance with India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>, you retain complete authority over your footprint. You maintain the absolute right to access, correct, or permanently delete your record profiles at any point. Account deletion actions completely purge historical files from database pools within 14 business days of an email trigger to <span className="text-blue-500">support@aegishealthai.co.in</span>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">6. AI Processing Governance</h2>
          <p className="text-sm leading-relaxed text-muted">
            All semantic processing passes through enterprise cloud nodes via Google Gemini. Google's explicit enterprise API terms guarantee that user-submitted health documents are <strong>never</strong> processed, reviewed, or utilized to train external foundational models.
          </p>
        </section>
      </div>
    </div>
  );
}
