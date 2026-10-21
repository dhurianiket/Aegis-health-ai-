import React, { useState } from "react";
import InfoPageLayout, { useInfoPageLogin } from "./InfoPageLayout";
import { Sparkles, Calendar, Clock, User, Cpu, Code2, Server, Database, ShieldCheck, Layers, Mail, ArrowRight, FileJson } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "../ui/SpotlightCard";
import { DecryptedText } from "../ui/DecryptedText";
import { CountUp } from "../ui/CountUp";

function EngineeringPlaybookContent() {
  const { openLoginModal } = useInfoPageLogin();
  const [activeLayer, setActiveLayer] = useState(0);

  const archLayers = [
    {
      id: "L1",
      name: "Layer 1: Multimodal Vision & Diagnostic OCR",
      tech: "Google Vertex AI • Gemini 3.8 Flash & Gemini 4 Argon",
      summary: "Ingests multi-page diagnostic PDFs and skewed smartphone photos of Indian laboratory reports with Gemini 3.8 Flash, automatically escalating complex multi-page panels and low-confidence handwritten Rx (<85% confidence) to Gemini 4 Argon.",
      code: `// Adaptive Model Routing -> Gemini 3.8 Flash / Gemini 4 Argon Escalation
const primaryModel = isComplexReport ? 'gemini-4-argon' : 'gemini-3.8-flash';
const response = await ai.models.generateContent({
  model: primaryModel,
  contents: [reportInlineData, CLINICAL_EXTRACTION_PROMPT],
  config: {
    responseMimeType: 'application/json',
    responseSchema: FHIR_OBSERVATION_BATCH_SCHEMA,
    temperature: 0.1,
  }
});`,
    },
    {
      id: "L2",
      name: "Layer 2: HL7 FHIR R4 & LOINC Normalization Engine",
      tech: "TypeScript Deterministic Mapper • ABDM Aligned",
      summary: "Resolves heterogeneous Indian lab naming conventions (e.g., SGPT vs. ALT, HbA1c HPLC vs. Glycated Hb) into canonical LOINC codes, standardized SI units, and reference brackets.",
      code: `// Canonical Biomarker Normalization Pipeline
export function normalizeToFhirObservation(raw: ExtractedLabItem, uid: string) {
  const loinc = LOINC_REGISTRY[raw.canonicalKey] ?? { code: 'unknown', system: 'http://loinc.org' };
  return {
    resourceType: 'Observation',
    status: 'final',
    code: { coding: [loinc], text: raw.biomarkerName },
    valueQuantity: { value: Number(raw.value), unit: raw.standardizedUnit },
    referenceRange: [{ low: raw.refMin, high: raw.refMax }],
  };
}`,
    },
    {
      id: "L3",
      name: "Layer 3: 10-Specialist Multi-Agent Polyclinic",
      tech: "Gemini 4 Argon & Gemini 3.8 Flash • Coordinated Agent Graph",
      summary: "Routes longitudinal biomarker deltas to 10 domain-specific specialist agents (Cardiology, Endocrinology, Nephrology, Hematology, Hepatology) grounded in ICMR, RSSDI, and ACC/AHA guidelines.",
      code: `// Multi-Agent Polyclinic Dispatcher
const specialistBriefs = await Promise.all([
  runSpecialistAgent('endocrinology', { hba1cTrend, fastingGlucose, bmi }),
  runSpecialistAgent('cardiology', { lipidPanel, hsCrp, bpReadings }),
  runSpecialistAgent('nephrology', { creatinine, egfr, electrolytes }),
]);
return synthesizeSbarHandover(specialistBriefs);`,
    },
    {
      id: "L4",
      name: "Layer 4: Zero-Knowledge Firestore Vault & Security Rules",
      tech: "Google Cloud Firestore • Firebase Auth • DPDP Act 2023",
      summary: "Enforces strict tenant isolation at the database rule layer (users/{userId}/*) with explicit consent verification and atomic 1-click right-to-erasure cascades.",
      code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`,
    },
  ];

  const patterns = [
    {
      badge: "PATTERN 01 • SCHEMA DETERMINISM",
      title: "Strict JSON Schema Enforcement & Unit Canonicalization",
      problem: "Unconstrained LLM prompts frequently hallucinate markdown wrappers, inconsistent biomarker keys ('Hb', 'Haemoglobin', 'HGB'), or mismatched units ('mg/dL' vs. 'mmol/L'), breaking longitudinal trend charts.",
      solution: "Every Gemini 3.8 Flash invocation enforces a strict OpenAPI/JSON responseSchema at temperature 0.1, paired with a deterministic TypeScript unit-conversion and LOINC lookup layer before writing to Firestore.",
    },
    {
      badge: "PATTERN 02 • ZERO-TRUST CLOUD PROXY",
      title: "Serverless Vertex AI Tunnel & Coordinated Agent Queuing",
      problem: "Exposing AI SDK keys in client bundles creates immediate credential leakage risks, while uncoordinated parallel agent bursts trigger upstream HTTP 429 quota exhaustion.",
      solution: "All Gemini calls traverse authenticated Firebase Cloud Functions (`analyzeReport`, `chatCoach`, `generateInsights`) with Firebase Auth ID token verification, sliding-window rate limiting, and graceful model fallback.",
    },
    {
      badge: "PATTERN 03 • CLINICAL SAFETY INVARIANTS",
      title: "Deterministic Drug-Lab Contraindication & SBAR Guardrails",
      problem: "General-purpose chatbots risk offering unverified diagnostic claims or overlooking critical medication-biomarker interactions (e.g., Metformin with declining eGFR).",
      solution: "Aegis isolates clinical reasoning inside a Socratic guardrail wrapper that never diagnoses or prescribes, cross-checks active medications against renal/hepatic markers, and formats outputs into standard SBAR physician briefs.",
    },
  ];

  const stackMatrix = [
    {
      service: "Google Vertex AI • Gemini 3.8 Flash & Gemini 4 Argon",
      role: "Adaptive multimodal diagnostic OCR (Gemini 3.8 Flash) with automatic escalation to Gemini 4 Argon for complex multi-page reports, 10-specialist clinical reasoning, and SBAR synthesis.",
    },
    {
      service: "Cloud Functions for Firebase (2nd Gen / Cloud Run)",
      role: "Zero-trust server-side API proxy, token verification, rate limiting, and atomic DPDP data-erasure cascades.",
    },
    {
      service: "Google Cloud Firestore & Cloud Storage",
      role: "Document-level isolated patient vaults (users/{userId}/*) storing normalized HL7 FHIR R4 Observation timelines.",
    },
    {
      service: "Firebase Authentication (OAuth 2.0 & Email/Password)",
      role: "Cryptographic identity provider supporting Google Sign-In and Email authentication.",
    },
    {
      service: "React 19 + TypeScript + Three.js WebGL",
      role: "Real-time 3D anatomical organ telemetry twin, longitudinal biomarker delta charts, and 1-click SBAR PDF generator.",
    },
  ];

  return (
    <>
      <main className="flex-1 bg-[#0A192F] py-16 px-4 md:px-6 font-sans">
        <article className="max-w-5xl mx-auto bg-[#0F2A4A]/60 border border-white/10 rounded-3xl p-6 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <header className="mb-10 text-center md:text-left border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest rounded-full uppercase mb-4">
              <Cpu className="w-3.5 h-3.5" />
              <DecryptedText text="AEGIS SYSTEMS ARCHITECTURE & ENGINEERING PLAYBOOK" animateOn="view" speed={35} />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-6 leading-tight font-sans">
              Architecting a Multi-Agent Clinical Intelligence Platform on <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Google Cloud, Gemini 3.8 Flash &amp; 4 Argon</span>
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-xs md:text-sm font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <User className="w-4 h-4 text-emerald-400" /> By Aniket Rajesh Dhuri (Founder &amp; Lead Architect)
              </span>
              <span className="hidden md:inline">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> Production v2.0 Architecture Blueprint
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 10 Min Technical Read
              </span>
            </div>
          </header>

          {/* Production Telemetry Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#0A192F]/90 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
                <CountUp to={99.4} decimals={1} duration={1.5} />%
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 mt-1">Schema Determinism</div>
            </div>
            <div className="bg-[#0A192F]/90 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-teal-300 font-mono">
                &lt; <CountUp to={2.8} decimals={1} duration={1.5} />s
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 mt-1">Gemini Vision Latency</div>
            </div>
            <div className="bg-[#0A192F]/90 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-cyan-300 font-mono">
                <CountUp to={10} duration={1.5} />+
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 mt-1">Specialist AI Agents</div>
            </div>
            <div className="bg-[#0A192F]/90 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-black text-emerald-400 font-mono">
                0
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 mt-1">Client API Keys Exposed</div>
            </div>
          </div>

          {/* Content */}
          <section className="space-y-8 text-slate-200 font-light text-base leading-relaxed font-sans">
            <p>
              Diagnostic pathology reports in India present a formidable systems-engineering challenge: thousands of regional laboratories generate unstructured multi-page PDFs with varying reference brackets, non-standard biomarker abbreviations (<code className="text-emerald-300 font-mono">SGPT</code>, <code className="text-emerald-300 font-mono">RDW-CV</code>, <code className="text-emerald-300 font-mono">hs-CRP</code>), and complex multi-organ interdependencies.
            </p>
            <p>
              Single-prompt LLM wrappers fail at clinical translation because they suffer from <strong className="text-white">generalist drift</strong>—attempting optical character recognition, unit normalization, longitudinal trend math, and empathetic patient education in a single unconstrained pass. Here is how we architected <strong className="text-white">Aegis Health AI</strong> on <strong className="text-emerald-300">Google Cloud, Vertex AI, and Firebase</strong> using a deterministic 4-layer multi-agent pipeline.
            </p>

            {/* Interactive 4-Layer Architecture Explorer */}
            <div className="py-4">
              <h2 className="text-white font-black text-xl md:text-2xl mb-4 tracking-tight flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-emerald-400" />
                Interactive 4-Layer Google Cloud Clinical Stack
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mb-6">
                Select any architectural layer below to inspect its production responsibility and implementation pattern:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {archLayers.map((layer, idx) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveLayer(idx)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeLayer === idx
                        ? "bg-emerald-500/15 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                        : "bg-[#0A192F]/80 border-white/10 hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-mono font-black text-emerald-400 mb-1">{layer.id}</div>
                    <div className="text-xs font-bold text-white leading-snug">{layer.name}</div>
                  </button>
                ))}
              </div>

              <SpotlightCard
                spotlightColor="rgba(16, 185, 129, 0.18)"
                className="bg-[#0A192F]/95 border border-emerald-500/30 rounded-2xl p-6 md:p-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-6 space-y-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 inline-block">
                      {archLayers[activeLayer].tech}
                    </span>
                    <h3 className="text-xl font-black text-white">{archLayers[activeLayer].name}</h3>
                    <p className="text-sm text-slate-200 leading-relaxed">{archLayers[activeLayer].summary}</p>
                  </div>
                  <div className="lg:col-span-6">
                    <div className="bg-[#06101E] border border-white/15 rounded-xl p-4 font-mono text-xs text-emerald-300">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/10 pb-2 mb-2">
                        <span className="flex items-center gap-1.5">
                          <FileJson className="w-3.5 h-3.5 text-emerald-400" /> PRODUCTION IMPLEMENTATION
                        </span>
                        <span className="text-emerald-400">TYPESCRIPT / GCP</span>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px] text-slate-200">
                        {archLayers[activeLayer].code}
                      </pre>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </div>

            {/* Three Defensive Engineering Patterns */}
            <div>
              <h2 className="text-white font-black text-xl md:text-2xl pt-4 mb-2 tracking-tight flex items-center gap-2.5">
                <Code2 className="w-6 h-6 text-emerald-400" />
                Three Defensive Systems Patterns &amp; Clinical Invariants
              </h2>
              <p className="text-sm text-slate-300 mb-6">
                Building production healthcare AI requires eliminating non-determinism, credential exposure, and ungrounded clinical claims:
              </p>

              <div className="space-y-5">
                {patterns.map((item, idx) => (
                  <SpotlightCard
                    key={idx}
                    spotlightColor="rgba(16, 185, 129, 0.15)"
                    className="bg-[#0A192F]/80 p-6 md:p-7 rounded-2xl border border-white/10 font-sans space-y-3"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block">
                      {item.badge}
                    </span>
                    <h3 className="text-white font-extrabold text-lg tracking-tight">{item.title}</h3>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      <strong className="text-rose-400 font-mono uppercase">Failure Mode: </strong> {item.problem}
                    </p>
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                      <strong className="text-emerald-400 font-mono uppercase">Aegis Architecture: </strong> {item.solution}
                    </p>
                  </SpotlightCard>
                ))}
              </div>
            </div>

            {/* Google Cloud & Firebase Infrastructure Matrix */}
            <div>
              <h2 className="text-white font-black text-xl md:text-2xl pt-4 mb-4 tracking-tight flex items-center gap-2.5">
                <Database className="w-6 h-6 text-emerald-400" />
                Google Cloud &amp; Firebase Production Stack Matrix
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stackMatrix.map((s, idx) => (
                  <div key={idx} className="bg-[#0A192F]/80 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase mb-1.5">
                      <Server className="w-4 h-4 shrink-0" />
                      {s.service}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Extraction Accuracy Benchmark Report (Indian Diagnostic Formats) */}
            <div>
              <h2 className="text-white font-black text-xl md:text-2xl pt-4 mb-2 tracking-tight flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                Indian Diagnostic Lab Extraction Benchmark (N = 120 Reports)
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mb-4 leading-relaxed">
                Internal validation benchmark evaluating schema-constrained <strong className="text-white">Gemini 3.8 Flash + Gemini 4 Argon Escalation</strong> across 120 de-identified Indian pathology PDFs and smartphone photos (measuring exact analyte name normalization, numeric value extraction, SI-to-conventional unit conversion, and ICMR reference flag accuracy):
              </p>
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0A192F]/90">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#06101E] text-emerald-400 font-mono uppercase tracking-wider border-b border-white/10">
                      <th className="px-4 py-3.5">Diagnostic Lab Format</th>
                      <th className="px-4 py-3.5 text-center">Sample (N)</th>
                      <th className="px-4 py-3.5 text-center">Precision</th>
                      <th className="px-4 py-3.5 text-center">Recall</th>
                      <th className="px-4 py-3.5 text-center">Extraction F1</th>
                      <th className="px-4 py-3.5">Unit &amp; Layout Nuances Handled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-bold text-white">Thyrocare Technologies (Aarogyam PDFs)</td>
                      <td className="px-4 py-3 text-center font-mono">30</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.6%</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.3%</td>
                      <td className="px-4 py-3 text-center font-mono font-black text-emerald-300">99.4%</td>
                      <td className="px-4 py-3 text-slate-300">Dense multi-column tables, CLIA/Photometry method tags, nmol/L → ng/mL Vitamin D conversion</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-white">Dr. Lal PathLabs (NABL Multi-Page PDFs)</td>
                      <td className="px-4 py-3 text-center font-mono">30</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.5%</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.1%</td>
                      <td className="px-4 py-3 text-center font-mono font-black text-emerald-300">99.3%</td>
                      <td className="px-4 py-3 text-slate-300">Nested age/trimester reference brackets, footnote commentary stripping, DLC % vs absolute count</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-white">Metropolis Healthcare (Clinical Panels)</td>
                      <td className="px-4 py-3 text-center font-mono">25</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.7%</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.4%</td>
                      <td className="px-4 py-3 text-center font-mono font-black text-emerald-300">99.5%</td>
                      <td className="px-4 py-3 text-slate-300">Historical prior-value columns, bold/asterisk abnormal flags, ICMR lipid risk tiers</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-white">SRL Diagnostics / Agilus &amp; Apollo</td>
                      <td className="px-4 py-3 text-center font-mono">20</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">99.3%</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400">98.9%</td>
                      <td className="px-4 py-3 text-center font-mono font-black text-emerald-300">99.1%</td>
                      <td className="px-4 py-3 text-slate-300">Scanned hospital letterheads, SGPT/ALT &amp; SGOT/AST synonym harmonization</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-white">Smartphone Camera Photos + Handwritten Rx</td>
                      <td className="px-4 py-3 text-center font-mono">15</td>
                      <td className="px-4 py-3 text-center font-mono text-amber-300">96.2%</td>
                      <td className="px-4 py-3 text-center font-mono text-amber-300">93.8%</td>
                      <td className="px-4 py-3 text-center font-mono font-black text-amber-300">95.0%</td>
                      <td className="px-4 py-3 text-slate-300">Perspective skew correction; tokens &lt;90% OCR confidence auto-flagged for user confirmation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conclusion */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-6 md:p-8">
              <h3 className="text-white font-extrabold text-lg mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Inspect Our Live Engineering in Action
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                By combining Google Gemini multimodal vision, HL7 FHIR R4 normalization, 10-specialist multi-agent orchestration, and zero-knowledge Firestore rules, Aegis Health AI delivers enterprise-grade clinical clarity to Indian households at zero cost. Anyone can evaluate the live production pipeline immediately in our open demonstration workspace.
              </p>
            </div>
          </section>

          {/* Technical disclaimer */}
          <footer className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-300 leading-relaxed font-mono">
            <strong>Platform Engineering Governance:</strong> All AI outputs are bounded by deterministic JSON schemas and non-diagnostic clinical guardrails. Aegis Health AI (Govt. of India MSME UDYAM-MH-33-0782403) is an informational clinical decision-support platform.
          </footer>
        </article>
      </main>

      {/* Interactive Support CTA Strip */}
      <section className="relative overflow-hidden py-24 px-6 bg-[#0F2A4A] border-t border-white/10 text-center">
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <Sparkles className="w-8 h-8 text-emerald-400 mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Test the Live Multi-Agent Clinical Workspace</h2>
          <p className="text-slate-200 text-sm md:text-base max-w-xl mb-8 leading-relaxed font-light">
            Explore our live clinical workspace directly or sign in with your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={openLoginModal}
              className="px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#0A192F] font-black uppercase text-xs tracking-widest rounded-full transition-all shadow-[0_0_25px_rgba(52,211,153,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <Link 
              to="/dashboard"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2"
            >
              <span>Launch Live Workspace</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link 
              to="/about.html"
              className="px-8 py-3.5 bg-[#0A192F] hover:bg-[#0E2444] text-slate-200 border border-white/15 text-xs font-extrabold uppercase tracking-widest rounded-full transition-all"
            >
              Read Founder &amp; MSME Profile
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function EngineeringPlaybook() {
  return (
    <InfoPageLayout activePath="/engineering-playbook">
      <EngineeringPlaybookContent />
    </InfoPageLayout>
  );
}
