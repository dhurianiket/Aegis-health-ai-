import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve(process.cwd(), "dist");
const baseHtmlPath = path.join(distDir, "index.html");

if (!fs.existsSync(baseHtmlPath)) {
  console.error("[prerender-routes] dist/index.html not found. Run vite build first.");
  process.exit(1);
}

const baseHtml = fs.readFileSync(baseHtmlPath, "utf-8");

const ROUTES = [
  {
    files: ["dashboard.html", "demo.html"],
    canonical: "https://aegishealthai.co.in/dashboard",
    title: "Live Clinical Workspace & SBAR Handover (Interactive Demo) — Aegis Health AI",
    description:
      "Interactive clinical dashboard pre-loaded with longitudinal Indian pathology reports (Metropolis, Thyrocare, Apollo), ICMR-stratified biomarker velocity, SBAR physician summary, and Questions for Your Doctor.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 980px; margin: 0 auto; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; padding: 32px 28px; background: rgba(17, 24, 39, 0.92);">
          <header style="border-bottom: 1px solid rgba(75, 85, 99, 0.3); padding-bottom: 16px; margin-bottom: 20px;">
            <p style="color: #34d399; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px 0;">
              Interactive Clinical Demonstration Workspace • Zero Registration Required
            </p>
            <h1 style="font-size: 28px; font-weight: 800; margin: 0 0 8px 0; color: #ffffff;">
              Aegis Health AI — Live Clinical Dashboard, Longitudinal Biomarkers &amp; SBAR Summary
            </h1>
            <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">
              Pre-populated patient profile: <strong>Aarav Sharma (38M, Blood Group O+, BMI 25.1 kg/m²)</strong> across 3 longitudinal Indian pathology panels: Metropolis Healthcare Mumbai Central (05 Oct 2026), Thyrocare Technologies Navi Mumbai (12 Aug 2026), and Apollo Diagnostics Thane (18 Jun 2026).
            </p>
          </header>

          <section aria-label="Auto-Populated SBAR Clinical Handover Summary" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
            <h2 style="font-size: 17px; font-weight: 700; color: #818cf8; margin: 0 0 10px 0;">
              📋 Auto-Populated Physician SBAR Handover Summary (Aarav Sharma — Oct 2026)
            </h2>
            <p style="font-size: 13px; color: #e5e7eb; margin: 0 0 8px 0;"><strong>S — Situation:</strong> 38-year-old male presenting for 90-day metabolic and lipid follow-up. Overall multi-system health index is 86/100 with favorable downward trends in HbA1c and LDL cholesterol.</p>
            <p style="font-size: 13px; color: #e5e7eb; margin: 0 0 8px 0;"><strong>B — Background:</strong> History of borderline glycemic elevation (baseline HbA1c 6.4% in June 2026) and Vitamin D insufficiency (14 ng/mL). Currently managed on Metformin SR 500mg OD, Rosuvastatin 10mg HS, and Cholecalciferol 60,000 IU weekly.</p>
            <div style="font-size: 13px; color: #e5e7eb; margin: 0 0 8px 0;">
              <strong>A — Assessment (Longitudinal Velocity &amp; ICMR Stratification):</strong>
              <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #d1d5db;">
                <li>HbA1c reduced from 6.4% (Jun) → 6.1% (Aug) → 5.8% (Oct) over 16 weeks (OCR Confidence: 99.8%; ICMR High-Risk Screen ≥ 5.7%).</li>
                <li>LDL Cholesterol reduced by 24% from 148 mg/dL → 128 mg/dL → 112 mg/dL (ICMR/CSI South Asian metabolic target &lt; 100 mg/dL).</li>
                <li>25-OH Vitamin D increased from 14 ng/mL → 18 ng/mL → 24 ng/mL (Unit conversion harmonized: 59.9 nmol/L ÷ 2.496 = 24.0 ng/mL; Target ≥ 30 ng/mL).</li>
                <li>hs-CRP normalized from 4.1 mg/L → 3.2 mg/L → 1.9 mg/L; Renal eGFR 95 mL/min/1.73m² and Hemoglobin 14.4 g/dL optimal.</li>
              </ul>
            </div>
            <div style="font-size: 13px; color: #e5e7eb; margin: 0;">
              <strong>R — Recommendation &amp; Questions for Your Doctor:</strong>
              <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #34d399;">
                <li>Question 1: Given HbA1c improvement from 6.4% to 5.8% on Metformin SR 500mg OD, should we maintain current evening dosing for the next 12 weeks?</li>
                <li>Question 2: With 25-OH Vitamin D at 24 ng/mL after 8 weekly 60,000 IU doses, should we complete 4 more weekly doses before transitioning to monthly maintenance?</li>
                <li>Question 3: Under ICMR/CSI South Asian guidelines, should we titrate statin therapy to push LDL from 112 mg/dL below 100 mg/dL?</li>
              </ul>
            </div>
          </section>

          <section aria-label="Interactive Sample Report OCR Walkthrough" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 16px; font-size: 13px; color: #d1d5db;">
            <strong>⚡ Interactive Sample Report OCR Walkthrough (Available in Ingest Tab):</strong> Click <em>"Run Sample Walkthrough (Metropolis OCR Simulation)"</em> or <em>"Run Sample Walkthrough (Thyrocare + Rx Simulation)"</em> in the Ingest tab to inspect multi-stage OCR token extraction, per-marker OCR confidence scores (99.8% printed vs. 84.2% handwritten Rx warning), SI-to-conventional unit conversion, and 1-click PDF / HL7 FHIR R4 export.
          </section>
        </article>
      </main>`,
  },
  {
    files: ["how-it-works.html"],
    canonical: "https://aegishealthai.co.in/how-it-works.html",
    title: "How It Works: 4-Stage Multimodal Clinical AI Pipeline — Aegis Health AI",
    description:
      "Explore how Aegis Health AI transforms Indian pathology PDFs and prescriptions into LOINC-normalized longitudinal biomarker trends and physician-ready SBAR summaries using Google Gemini 3.8 Flash & Gemini 4 Argon.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>How Aegis Health AI Works — 4-Stage Clinical Intelligence Pipeline</h1>
          <p>Aegis Health AI converts fragmented Indian diagnostic reports (Thyrocare, Dr. Lal PathLabs, Metropolis, SRL, Apollo) and handwritten prescriptions into longitudinal health trajectories and SBAR handoff summaries.</p>
          <ol>
            <li><strong>Stage 01 — Multimodal Ingestion &amp; Client Pre-Flight:</strong> Accepts multi-page PDFs, camera photos, and handwritten OPD scripts with automatic image compression and PII scrubbing.</li>
            <li><strong>Stage 02 — Schema-Constrained Gemini 3.8 Flash &amp; Gemini 4 Argon OCR:</strong> Extracts analytes, reference ranges, and confidence scores with Gemini 3.8 Flash, automatically escalating complex multi-page reports and handwritten prescriptions to Gemini 4 Argon while converting SI/conventional units.</li>
            <li><strong>Stage 03 — Longitudinal Biomarker Velocity &amp; ICMR Stratification:</strong> Maps multi-year trajectories and applies ICMR-INDIAB / RSSDI / CSI South Asian cardiometabolic thresholds alongside Western norms.</li>
            <li><strong>Stage 04 — Physician SBAR Handover, Doctor Questions &amp; FHIR R4 Export:</strong> Synthesizes Situation, Background, Assessment, and Recommendation briefs with downloadable 1-page OPD PDFs and HL7 FHIR R4 bundles.</li>
          </ol>
        </article>
      </main>`,
  },
  {
    files: ["about.html"],
    canonical: "https://aegishealthai.co.in/about.html",
    title: "About Aegis Health AI — Founder Aniket Rajesh Dhuri & MSME UDYAM-MH-33-0782403",
    description:
      "Learn about Aegis Health AI, an independent Indian healthcare AI enterprise founded by Aniket Rajesh Dhuri in Dombivli West, Thane, Maharashtra (Govt. of India MSME Udyam: UDYAM-MH-33-0782403).",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>About Aegis Health AI — Mission, Founder &amp; Corporate Verification</h1>
          <p><strong>Aegis Health AI</strong> is an independent Indian healthcare technology micro-enterprise registered with the Ministry of MSME, Government of India (<strong>UDYAM-MH-33-0782403</strong>; NIC Codes: 62013, 62099, 86909).</p>
          <h2>Founder &amp; Lead Systems Architect</h2>
          <p><strong>Aniket Rajesh Dhuri</strong> — Founder &amp; Lead Architect (<a href="https://www.linkedin.com/in/aniket-dhuri-273094225" target="_blank" rel="noopener noreferrer">Verified LinkedIn Profile</a> | <a href="https://github.com/dhurianiket/Aegis-health-ai-" target="_blank" rel="noopener noreferrer">Official GitHub Repository</a>). Contact: <a href="mailto:aniket@aegishealthai.co.in">aniket@aegishealthai.co.in</a> | <a href="mailto:founder@aegishealthai.co.in">founder@aegishealthai.co.in</a> | <a href="mailto:support@aegishealthai.co.in">support@aegishealthai.co.in</a>.</p>
          <h2>2026–2027 Product &amp; AI Architecture Roadmap</h2>
          <ul>
            <li><strong>Phase 1 (Live Production MVP — Q3–Q4 2026):</strong> Dual-tier Gemini 3.8 Flash + Gemini 4 Argon multimodal OCR across Indian diagnostic labs (Thyrocare, Dr. Lal PathLabs, Metropolis, SRL), 50+ normalized biomarkers, 10-specialist synthesis, and 1-page SBAR physician handover briefs.</li>
            <li><strong>Phase 2 (Scale &amp; Interoperability — Q1–Q2 2027):</strong> Ayushman Bharat Digital Mission (ABDM) M1–M3 HIU certification, Vertex AI MedGemma regional language voice summaries (Hindi, Marathi, Tamil, Telugu), and automated NABL lab API ingestion.</li>
            <li><strong>Phase 3 (Clinical Enterprise — Q3–Q4 2027):</strong> Multi-clinic Hospital OPD Co-Pilot via Google Cloud Healthcare API (FHIR R4 store) and predictive South Asian cardiometabolic risk stratification.</li>
          </ul>
          <h2>Registered Office Location</h2>
          <p>Dombivli West, Thane, Maharashtra 421202, India.</p>
          <p><em>Jurisdiction Notice:</em> Independent Indian enterprise. Not affiliated with Aegis Health Ai Ltd (UK) or aegishealth.com.</p>
        </article>
      </main>`,
  },
  {
    files: ["security.html"],
    canonical: "https://aegishealthai.co.in/security.html",
    title: "Zero-Trust Healthcare Security & DPDP Act 2023 Compliance — Aegis Health AI",
    description:
      "Zero-trust security architecture of Aegis Health AI: DPDP Act 2023 alignment, per-user Cloud Firestore isolation, zero client-side API keys, PII scrubbing before Gemini inference, and AES-256 encryption.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>Security First — Zero-Trust Clinical Data Architecture &amp; DPDP Act 2023 Compliance</h1>
          <ul>
            <li><strong>Zero Client-Side API Keys:</strong> All Gemini 3.8 Flash &amp; Gemini 4 Argon calls route through authenticated Firebase Cloud Functions Gen 2 (<code>geminiProxy</code>) backed by Google Cloud Secret Manager.</li>
            <li><strong>Per-User Cloud Firestore Isolation:</strong> Strict <code>request.auth.uid == userId</code> security rules with AES-256 encryption at rest and TLS 1.3 in transit.</li>
            <li><strong>PII Scrubbing Before Inference:</strong> Patient names, phone numbers, and addresses are redacted prior to LLM context assembly.</li>
            <li><strong>DPDP Act 2023 Rights:</strong> Explicit revocable consent gate, full HL7 FHIR R4 / JSON data portability, and 1-click cascading cryptographic account purge (<code>onUserDeleted</code>).</li>
          </ul>
        </article>
      </main>`,
  },
  {
    files: ["engineering-playbook.html"],
    canonical: "https://aegishealthai.co.in/engineering-playbook.html",
    title: "Engineering Playbook & Indian Lab OCR F1 Benchmark (N=120) — Aegis Health AI",
    description:
      "Technical deep dive into Aegis Health AI's 4-layer Google Cloud, Gemini 3.8 Flash & Gemini 4 Argon architecture, schema-constrained OCR, ICMR stratification, and our N=120 Indian Diagnostic Lab Extraction F1 Benchmark.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>Aegis Health AI — Engineering Playbook &amp; Indian Lab Extraction F1 Benchmark (N = 120 Reports)</h1>
          <p>Architected by Aniket Rajesh Dhuri on Google Cloud (Vertex AI / Gemini 3.8 Flash &amp; Gemini 4 Argon, Firebase Cloud Functions Gen 2 on Cloud Run, Cloud Firestore, and Firebase Hosting).</p>
          <h2>Indian Diagnostic Lab Extraction Accuracy Benchmark (N = 120 De-Identified Reports)</h2>
          <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; font-size: 13px;">
            <thead>
              <tr>
                <th>Diagnostic Lab Format</th>
                <th>Sample (N)</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>Extraction F1</th>
                <th>Nuances Handled</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Thyrocare Technologies (Aarogyam PDFs)</td><td>30</td><td>99.6%</td><td>99.3%</td><td>99.4%</td><td>Dense multi-column tables, CLIA/Photometry tags, nmol/L to ng/mL Vitamin D conversion</td></tr>
              <tr><td>Dr. Lal PathLabs (NABL Multi-Page PDFs)</td><td>30</td><td>99.5%</td><td>99.1%</td><td>99.3%</td><td>Nested age/trimester brackets, footnote stripping, DLC % vs absolute count</td></tr>
              <tr><td>Metropolis Healthcare (Clinical Panels)</td><td>25</td><td>99.7%</td><td>99.4%</td><td>99.5%</td><td>Historical prior-value columns, asterisk flags, ICMR lipid risk tiers</td></tr>
              <tr><td>SRL Diagnostics / Agilus &amp; Apollo</td><td>20</td><td>99.3%</td><td>98.9%</td><td>99.1%</td><td>Scanned hospital letterheads, SGPT/ALT &amp; SGOT/AST synonym harmonization</td></tr>
              <tr><td>Smartphone Camera Photos + Handwritten Rx</td><td>15</td><td>96.2%</td><td>93.8%</td><td>95.0%</td><td>Perspective skew correction; tokens &lt;90% OCR confidence auto-flagged for user verification</td></tr>
            </tbody>
          </table>
        </article>
      </main>`,
  },
  {
    files: ["blog-hba1c.html"],
    canonical: "https://aegishealthai.co.in/blog-hba1c.html",
    title: "HbA1c & Glycemic Velocity Guide (ICMR & RSSDI Aligned) — Aegis Health AI",
    description:
      "Clinical guide to HbA1c, Estimated Average Glucose (eAG), South Asian insulin resistance thresholds (ICMR/RSSDI), and erythrocyte turnover confounders.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>Clinical Guide to HbA1c (Glycated Hemoglobin) &amp; Longitudinal Glycemic Velocity</h1>
          <p>Understand how Aegis Health AI converts HbA1c (%) into Estimated Average Glucose (eAG = 28.7 × HbA1c − 46.7 mg/dL), tracks 90-day glycemic trajectory, and cross-checks Hemoglobin &amp; MCV for iron-deficiency or hemoglobinopathy confounders in Indian patients.</p>
        </article>
      </main>`,
  },
  {
    files: ["blog-cbc.html"],
    canonical: "https://aegishealthai.co.in/blog-cbc.html",
    title: "Complete Blood Count (CBC) & Hematology Biomarker Guide — Aegis Health AI",
    description:
      "Clinical guide to Complete Blood Count (CBC) parameters: Hemoglobin, MCV, MCH, RDW-CV, Neutrophil-to-Lymphocyte Ratio (NLR), and Platelet trends.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>Decoding the Complete Blood Count (CBC): Red Cell Indices, WBC Differential &amp; Platelets</h1>
          <p>Explore how Aegis Health AI analyzes MCV, RDW-CV, Mentzer Index, and Neutrophil-to-Lymphocyte Ratio (NLR) across serial Indian hematology reports to distinguish nutritional iron/B12 deficiency from thalassemia trait and acute inflammation.</p>
        </article>
      </main>`,
  },
  {
    files: ["privacy-policy.html"],
    canonical: "https://aegishealthai.co.in/privacy-policy",
    title: "Privacy Policy & DPDP Act 2023 Data Governance — Aegis Health AI",
    description:
      "Privacy Policy for Aegis Health AI (MSME UDYAM-MH-33-0782403): India DPDP Act 2023 compliance, AES-256 Cloud Firestore isolation, PII scrubbing, and 1-click right to erasure.",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>Privacy Policy — Aegis Health AI (DPDP Act 2023 Aligned)</h1>
          <p>Operated by Aegis Health AI (Govt. of India MSME Udyam: UDYAM-MH-33-0782403, Dombivli West, Thane, Maharashtra 421202, India). Contact: support@aegishealthai.co.in | founder@aegishealthai.co.in.</p>
        </article>
      </main>`,
  },
  {
    files: ["terms-of-service.html"],
    canonical: "https://aegishealthai.co.in/terms-of-service",
    title: "Terms of Service & Clinical Disclaimer — Aegis Health AI",
    description:
      "Terms of Service and clinical decision-support disclaimer for Aegis Health AI (MSME UDYAM-MH-33-0782403, Thane, Maharashtra, India).",
    bodyHtml: `
      <main style="min-height: 100vh; font-family: sans-serif; background-color: #030712; color: #f3f4f6; padding: 32px 24px;">
        <article style="max-width: 920px; margin: 0 auto;">
          <h1>Terms of Service — Aegis Health AI</h1>
          <p>Operated by Aegis Health AI (Govt. of India MSME Udyam: UDYAM-MH-33-0782403, Dombivli West, Thane, Maharashtra 421202, India). Informational clinical intelligence platform; not a substitute for a licensed physician.</p>
        </article>
      </main>`,
  },
];

for (const route of ROUTES) {
  let routeHtml = baseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${route.title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/i,
      `<meta name="description" content="${route.description}" />`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/i,
      `<link rel="canonical" href="${route.canonical}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/i,
      `<meta property="og:title" content="${route.title}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/>/i,
      `<meta property="og:description" content="${route.description}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/i,
      `<meta property="og:url" content="${route.canonical}" />`
    )
    .replace(
      /<div id="root">[\s\S]*?<\/div>\s*<noscript>/i,
      `<div id="root">\n      <!--email_off-->${route.bodyHtml}\n      <!--/email_off-->\n    </div>\n    <noscript>`
    );

  for (const relFile of route.files) {
    const outPath = path.join(distDir, relFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, routeHtml, "utf-8");
  }
}

console.log(`✔ prerender-routes: generated ${ROUTES.length} route-specific HTML shells in dist/`);
