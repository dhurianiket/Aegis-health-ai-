import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-2">Terms of Service</h1>
          <p className="text-sm text-muted">Last Updated: May 17, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-amber-500">1. For Educational & Preparatory Use Only (Critical Disclaimer)</h2>
          <p className="text-sm leading-relaxed text-muted font-medium bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
            Aegis Health AI is an educational companion and structured tracking tool. The summaries, interactive explanations, and structural telemetry provided by this platform <strong>do not constitute medical diagnoses, prescriptions, or a substitute for clinical medical advice</strong>. 
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Users must always consult a certified medical professional for health tracking interpretation and prior to executing any modifications to existing clinical prescriptions. Never delay seeking professional diagnostics because of structural metrics displayed inside this platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">2. Data Provisioning & Verification</h2>
          <p className="text-sm leading-relaxed text-muted">
            You maintain full legal rights to files dropped into the platform. While our underlying models are highly optimized, you remain responsible for cross-referencing values (such as medication dosages and flag boundaries) with the physical printed source report before discussing metrics with a provider.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">3. Early Beta Context</h2>
          <p className="text-sm leading-relaxed text-muted">
            This site runs under an early public feature-beta system framework. System architectures are provisioned on an "as-is" and "as-available" basis to allow open crowdsourced feedback. We provide no operational guarantees regarding continuous service availability or zero-fault data ingestion cycles during this testing milestone.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">4. Acceptance of Terms</h2>
          <p className="text-sm leading-relaxed text-muted">
            By passing records into the processing queue, you acknowledge full awareness of these conditions and consent to data storage safety rules defined within the companion Privacy Policy.
          </p>
          <p className="text-sm text-muted mt-4">Contact Gateway: <span className="text-blue-500">support@aegishealthai.co.in</span></p>
        </section>
      </div>
    </div>
  );
}
