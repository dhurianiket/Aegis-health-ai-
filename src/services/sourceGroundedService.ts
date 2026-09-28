export interface MedicalSource {
  name: string;
  url: string;
}

const SOURCES: Record<string, MedicalSource> = {
  hba1c: {
    name: "NIH NIDDK",
    url: "https://www.niddk.nih.gov/health-information/diagnostic-tests/hc-a1c-test"
  },
  glucose: {
    name: "American Diabetes Association",
    url: "https://diabetes.org/about-diabetes/diagnosis"
  },
  cholesterol: {
    name: "American Heart Association",
    url: "https://www.heart.org/en/health-topics/cholesterol/about-cholesterol"
  },
  creatinine: {
    name: "National Kidney Foundation",
    url: "https://www.kidney.org/ata-tests/creatinine-blood-test"
  },
  egfr: {
    name: "National Kidney Foundation",
    url: "https://www.kidney.org/ata-tests/creatinine-blood-test"
  },
  uric_acid: {
    name: "MedlinePlus",
    url: "https://medlineplus.gov/lab-tests/uric-acid-test/"
  },
  albumin: {
    name: "MedlinePlus",
    url: "https://medlineplus.gov/ency/article/003478.htm"
  },
  bilirubin: {
    name: "MedlinePlus",
    url: "https://medlineplus.gov/ency/article/003479.htm"
  },
  hemoglobin: {
    name: "NIH NHLBI",
    url: "https://www.nhlbi.nih.gov/health/blood-tests"
  },
  cbc: {
    name: "NIH NHLBI",
    url: "https://www.nhlbi.nih.gov/health/blood-tests"
  },
  thyroid: {
    name: "American Thyroid Association",
    url: "https://www.thyroid.org/thyroid-function-tests/"
  },
  tsh: {
    name: "American Thyroid Association",
    url: "https://www.thyroid.org/thyroid-function-tests/"
  },
  alt: {
    name: "American Liver Foundation",
    url: "https://liverfoundation.org/resource-center/liver-function-tests/"
  },
  ast: {
    name: "American Liver Foundation",
    url: "https://liverfoundation.org/resource-center/liver-function-tests/"
  },
  calcium: {
    name: "NIH ODS",
    url: "https://ods.od.nih.gov/factsheets/Calcium-Consumer/"
  },
  phosphorus: {
    name: "MedlinePlus",
    url: "https://medlineplus.gov/ency/article/003477.htm"
  }
};

/**
 * Retrieves the trusted medical source for a given biomarker name using robust matching.
 * Returns null if no trusted source is available.
 */
export function getSourceForMarker(marker: string | null | undefined): MedicalSource | null {
  if (!marker) return null;
  const name = marker.toLowerCase().trim();
  
  if (name.includes("hba1c") || name.includes("a1c") || name.includes("glycohemoglobin")) {
    return SOURCES.hba1c;
  }
  if (name.includes("glucose") || name.includes("glu") || name.includes("sugar") || name.includes("fasting blood")) {
    return SOURCES.glucose;
  }
  if (
    name.includes("chol") || 
    name.includes("ldl") || 
    name.includes("hdl") || 
    name.includes("lipid") || 
    name.includes("triglyceride") || 
    name.includes("tg") || 
    name.includes("vldl")
  ) {
    return SOURCES.cholesterol;
  }
  if (name.includes("creatinine") || name.includes("creat")) {
    return SOURCES.creatinine;
  }
  if (name.includes("egfr") || name.includes("gfr")) {
    return SOURCES.egfr;
  }
  if (name.includes("uric acid") || name.includes("urate")) {
    return SOURCES.uric_acid;
  }
  if (name.includes("albumin") || name.includes("alb")) {
    return SOURCES.albumin;
  }
  if (name.includes("bilirubin") || name.includes("bili")) {
    return SOURCES.bilirubin;
  }
  if (
    name.includes("hemoglobin") || 
    name.includes("haemoglobin") || 
    name.includes("hb") || 
    name.includes("hgb") || 
    name.includes("hematocrit") || 
    name.includes("hct") || 
    name.includes("platelet") || 
    name.includes("plt") || 
    name.includes("wbc") || 
    name.includes("rbc") || 
    name.includes("white blood") || 
    name.includes("red blood") || 
    name.includes("mcv") || 
    name.includes("mch") || 
    name.includes("mchc")
  ) {
    return SOURCES.hemoglobin;
  }
  if (name.includes("tsh") || name.includes("thyroid") || name.includes("thyroxine") || name.includes("t3") || name.includes("t4")) {
    return SOURCES.thyroid;
  }
  if (name.includes("alt") || name.includes("sgpt") || name.includes("alanine aminotransferase")) {
    return SOURCES.alt;
  }
  if (name.includes("ast") || name.includes("sgot") || name.includes("aspartate aminotransferase")) {
    return SOURCES.ast;
  }
  if (name.includes("calcium") || name.includes("ca")) {
    return SOURCES.calcium;
  }
  if (name.includes("phosphorus") || name.includes("phosphate") || name.includes("phos")) {
    return SOURCES.phosphorus;
  }
  
  return null;
}

export interface UrgencyInfo {
  level: "Normal" | "Non-urgent" | "Moderate" | "High" | "Emergency";
  nextStep: string;
  badgeClass: string;
}

/**
 * Computes clinical urgency level and action-oriented next steps based on lab findings.
 */
export function getUrgencyAndNextStep(
  markerName: string | null | undefined,
  status: string | null | undefined,
  valueStr: string | null | undefined
): UrgencyInfo {
  const marker = (markerName || "").toLowerCase().trim();
  const flag = (status || "").toUpperCase().trim();
  const value = valueStr ? parseFloat(valueStr) : NaN;

  // 1. Check for absolute EMERGENCY cases
  const isEmergency = 
    flag.includes("CRITICAL") || 
    flag.includes("PANIC") ||
    (marker.includes("glucose") && value > 350) ||
    (marker.includes("potassium") && (value < 2.5 || value > 6.0)) ||
    (marker.includes("hemoglobin") && value < 7.0);

  if (isEmergency) {
    return {
      level: "Emergency",
      nextStep: "Seek immediate emergency medical attention or contact your provider immediately.",
      badgeClass: "bg-red-600 text-white border border-red-700 font-bold"
    };
  }

  // 2. Check for HIGH urgency cases
  const isHigh = 
    flag.includes("HIGH") || 
    flag.includes("LOW") || 
    flag.includes("ABNORMAL") ||
    (marker.includes("hba1c") && value >= 8.5) ||
    (marker.includes("egfr") && value < 45) ||
    (marker.includes("creatinine") && value > 2.0) ||
    (marker.includes("tsh") && (value < 0.1 || value > 10.0)) ||
    (marker.includes("glucose") && value > 180);

  if (isHigh) {
    // If it's elevated but not emergency, let's distinguish High vs Moderate
    const isModerateMarkerOnly = 
      marker.includes("cholesterol") || 
      marker.includes("lipid") || 
      marker.includes("triglyceride") || 
      marker.includes("vitamin") || 
      marker.includes("uric");

    if (isModerateMarkerOnly) {
      return {
        level: "Moderate",
        nextStep: "Discuss these findings with your doctor during a routine visit or within 30 days.",
        badgeClass: "bg-amber-500/10 text-amber-500 border border-amber-500/20"
      };
    }

    return {
      level: "High",
      nextStep: "Schedule an appointment with your primary care provider to discuss these findings within 7-14 days.",
      badgeClass: "bg-red-500/10 text-red-500 border border-red-500/20"
    };
  }

  // 3. Check for MODERATE level
  if (
    flag.includes("BORDERLINE") || 
    (marker.includes("hba1c") && value >= 5.7 && value < 8.5) ||
    (marker.includes("glucose") && value >= 100 && value <= 180) ||
    (marker.includes("cholesterol") && value > 200) ||
    (marker.includes("ldl") && value > 130)
  ) {
    return {
      level: "Moderate",
      nextStep: "Discuss these results with your care provider at your next visit or within 30 days.",
      badgeClass: "bg-amber-500/10 text-amber-500 border border-amber-500/20"
    };
  }

  // 4. Check for NON-URGENT deviations
  if (flag.includes("WARNING") || flag.includes("ELEVATED")) {
    return {
      level: "Non-urgent",
      nextStep: "Monitor these levels and mention them during your next routine screening.",
      badgeClass: "bg-orange-500/10 text-orange-500 border border-orange-500/20"
    };
  }

  // 5. NORMAL values
  if (flag.includes("NORMAL") || flag.includes("OK") || flag.includes("NEGATIVE") || flag === "N") {
    return {
      level: "Normal",
      nextStep: "Maintain standard routine wellness screening intervals.",
      badgeClass: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
    };
  }

  // Default Fallback
  return {
    level: "Normal",
    nextStep: "Maintain routine evaluations with your physician.",
    badgeClass: "bg-slate-500/10 text-slate-300 border border-slate-500/20"
  };
}

/* ==========================================================================
   MILESTONE 2: MEDICAL CONSENSUS GROUNDED AI CLINICAL GUIDELINES
   ========================================================================== */

export interface ClinicalGuideline {
  id: string;
  code: string;
  title: string;
  organization: string;
  region: "India" | "International";
  year: number;
  url: string;
  evidenceLevel: string;
  keyTopics: string[];
  summary: string;
}

export const CLINICAL_GUIDELINES: Record<string, ClinicalGuideline> = {
  // --- CARDIOLOGY ---
  ihci_icmr_2024: {
    id: "ihci_icmr_2024",
    code: "IHCI/ICMR 2024",
    title: "India Hypertension Control Initiative (IHCI) & ICMR Standard Treatment Workflow for Hypertension",
    organization: "IHCI/ICMR",
    region: "India",
    year: 2024,
    url: "https://stw.icmr.org.in",
    evidenceLevel: "National Health Protocol (MoHFW/ICMR/WHO)",
    keyTopics: ["hypertension", "blood pressure", "bp", "ihci", "high bp", "systolic", "diastolic", "salt intake"],
    summary: "Targets BP < 140/90 mmHg for general adult population and < 130/80 mmHg in high-risk diabetes/CVD; advises dietary salt reduction (< 5g/day) and structured treatment adherence."
  },
  csi_lipid_2024: {
    id: "csi_lipid_2024",
    code: "CSI Lipid 2024",
    title: "Cardiological Society of India (CSI) Guidelines on Dyslipidemia Management in Indians",
    organization: "CSI",
    region: "India",
    year: 2024,
    url: "https://csi.org.in",
    evidenceLevel: "National Expert Consensus",
    keyTopics: ["cholesterol", "ldl", "hdl", "triglycerides", "lipid", "statin", "ascvd", "dyslipidemia"],
    summary: "Highlights premature atherosclerosis risk in South Asians; recommends aggressive LDL reduction (target < 70 mg/dL in high risk, < 50 mg/dL in very high risk) and addressing high triglycerides/low HDL phenotype."
  },
  acc_aha_2024: {
    id: "acc_aha_2024",
    code: "ACC/AHA 2024",
    title: "2024 ACC/AHA Clinical Practice Guidelines for High Blood Pressure and Lipid Management",
    organization: "ACC/AHA",
    region: "International",
    year: 2024,
    url: "https://www.acc.org/Guidelines/Guidelines-Clinical-Topics/High-Blood-Pressure",
    evidenceLevel: "Class I (Level A)",
    keyTopics: ["hypertension", "blood pressure", "bp", "cholesterol", "ldl", "hdl", "lipid", "statin", "ascvd", "triglycerides", "lipid management"],
    summary: "Recommends BP target < 130/80 mmHg and high-intensity statins for high ASCVD risk with LDL target < 70 mg/dL (< 55 mg/dL for secondary prevention)."
  },
  esc_2025: {
    id: "esc_2025",
    code: "ESC 2025",
    title: "ESC 2025 Guidelines for Management of Cardiovascular Diseases & Heart Failure",
    organization: "ESC",
    region: "International",
    year: 2025,
    url: "https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines",
    evidenceLevel: "Class I (Level A)",
    keyTopics: ["heart failure", "hfref", "hfpef", "lvef", "atrial fibrillation", "afib", "troponin", "nt-probnp", "doac", "arni", "quadruple therapy"],
    summary: "Mandates 4-pillar foundation therapy (ARNI/ACEi + Beta-blocker + MRA + SGLT2i) for HFrEF and DOACs over VKAs for AF stroke prevention."
  },

  // --- ENDOCRINOLOGY ---
  rssdi_t2dm_2024: {
    id: "rssdi_t2dm_2024",
    code: "RSSDI 2024",
    title: "Research Society for the Study of Diabetes in India (RSSDI) Clinical Practice Recommendations for T2DM",
    organization: "RSSDI",
    region: "India",
    year: 2024,
    url: "https://rssdi.in",
    evidenceLevel: "Grade A (India Consensus)",
    keyTopics: ["hba1c", "a1c", "diabetes", "glucose", "sugar", "postprandial", "fasting", "metformin", "sglt2", "dpp4", "insulin", "cgm"],
    summary: "Recommends glycemic target HbA1c < 7.0% for most adults; underscores high post-prandial glycemic spikes due to carbohydrate-heavy Indian diets and early dual therapy when HbA1c > 8.0%."
  },
  icmr_t2dm_stw: {
    id: "icmr_t2dm_stw",
    code: "ICMR T2D STW",
    title: "ICMR Standard Treatment Workflow for Type 2 Diabetes Mellitus Screening and Management",
    organization: "ICMR",
    region: "India",
    year: 2023,
    url: "https://stw.icmr.org.in",
    evidenceLevel: "National Health Workflow (ICMR)",
    keyTopics: ["diabetes", "prediabetes", "hba1c", "screening", "microalbuminuria", "retinopathy", "diabetic foot"],
    summary: "Recommends opportunistic diabetes screening starting at age 30 for Indians; mandates annual urine microalbumin testing, dilated retinal screening, and comprehensive foot exams."
  },
  ada_2025: {
    id: "ada_2025",
    code: "ADA 2025",
    title: "American Diabetes Association Standards of Care in Diabetes — 2025",
    organization: "ADA",
    region: "International",
    year: 2025,
    url: "https://diabetesjournals.org/care/pages/standards_of_care",
    evidenceLevel: "Grade A",
    keyTopics: ["hba1c", "a1c", "glucose", "diabetes", "fasting glucose", "insulin", "metformin", "sglt2", "glp-1", "time-in-range", "cgm"],
    summary: "Recommends glycemic target HbA1c < 7.0% for most adults, early SGLT2i or GLP-1 RA therapy for T2D with CKD or ASCVD."
  },

  // --- NEUROLOGY ---
  icmr_stroke_stw: {
    id: "icmr_stroke_stw",
    code: "ICMR Stroke STW",
    title: "ICMR Standard Treatment Workflow for Acute Ischemic Stroke & Secondary Prevention",
    organization: "ICMR",
    region: "India",
    year: 2024,
    url: "https://stw.icmr.org.in",
    evidenceLevel: "National Health Workflow (ICMR)",
    keyTopics: ["stroke", "tia", "paralysis", "slurred speech", "weakness", "facial drooping", "thrombolysis", "headache", "brain"],
    summary: "Highlights time-critical BE-FAST recognition, emergency transfer within 4.5-hour thrombolysis window, strict blood pressure control, and structured long-term antiplatelet and statin secondary prevention."
  },
  aan_epilepsy_2024: {
    id: "aan_epilepsy_2024",
    code: "AAN/IEA 2024",
    title: "American Academy of Neurology & Indian Epilepsy Association Guidelines on Seizure Care",
    organization: "AAN",
    region: "International",
    year: 2024,
    url: "https://aan.com",
    evidenceLevel: "Class I Clinical Guideline",
    keyTopics: ["seizure", "epilepsy", "fits", "convulsions", "eeg", "antiepileptic", "neuroimaging"],
    summary: "Guides distinction between provoked and unprovoked seizures, emergency care for status epilepticus (> 5 minutes), brain MRI protocols, and patient counseling on strict medication adherence."
  },

  // --- GASTROENTEROLOGY ---
  isg_nafld_gerd_2024: {
    id: "isg_nafld_gerd_2024",
    code: "ISG MASLD 2024",
    title: "Indian Society of Gastroenterology (ISG) Guidelines on Metabolic Dysfunction-Associated Steatotic Liver Disease (MASLD)",
    organization: "ISG",
    region: "India",
    year: 2024,
    url: "https://isg.org.in",
    evidenceLevel: "National Consensus Guideline",
    keyTopics: ["liver", "nafld", "masld", "fatty liver", "sgpt", "alt", "ast", "fib-4", "gerd", "dyspepsia", "cirrhosis"],
    summary: "Addresses lean-MASLD prevalence in South Asians; recommends non-invasive fibrosis assessment (FIB-4 score), 7–10% weight loss through Indian-appropriate dietary changes, and avoiding hepatotoxic herbal formulations."
  },
  icmr_gerd_stw: {
    id: "icmr_gerd_stw",
    code: "ICMR GERD STW",
    title: "ICMR Standard Treatment Workflow for Gastroesophageal Reflux Disease & Dyspepsia",
    organization: "ICMR",
    region: "India",
    year: 2023,
    url: "https://stw.icmr.org.in",
    evidenceLevel: "National Health Workflow (ICMR)",
    keyTopics: ["gerd", "acid reflux", "heartburn", "dyspepsia", "acidity", "ppi", "gastritis", "ulcer"],
    summary: "Evaluates alarm symptoms (dysphagia, weight loss, vomiting blood) for urgent endoscopy; emphasizes short-term targeted acid suppression, meal-sleep interval ≥ 2 hours, and avoidance of oily/spicy triggers."
  },
  acg_aga_2024: {
    id: "acg_aga_2024",
    code: "ACG/AGA 2024",
    title: "American College of Gastroenterology & AGA Guidelines for GERD and Liver Health",
    organization: "ACG/AGA",
    region: "International",
    year: 2024,
    url: "https://gi.org",
    evidenceLevel: "Grade A",
    keyTopics: ["gerd", "reflux", "ibs", "liver", "endoscopy", "colonoscopy", "barretts", "gut"],
    summary: "Evidence-based management of gastroesophageal reflux, criteria for diagnostic endoscopy, non-pharmacologic lifestyle modifications, and monitoring of chronic gastrointestinal symptoms."
  },

  // --- PULMONOLOGY ---
  icmr_asthma_copd_stw: {
    id: "icmr_asthma_copd_stw",
    code: "ICMR Asthma/COPD STW",
    title: "ICMR Standard Treatment Workflow for Bronchial Asthma & COPD in India",
    organization: "ICMR",
    region: "India",
    year: 2024,
    url: "https://stw.icmr.org.in",
    evidenceLevel: "National Health Workflow (ICMR)",
    keyTopics: ["asthma", "copd", "wheezing", "breathlessness", "cough", "inhaler", "spirometry", "air pollution", "aqi", "chulha"],
    summary: "Emphasizes objective confirmation by spirometry/reversibility, preference for inhaled corticosteroids over oral steroids, spacer use for inhalers, and minimizing biomass smoke, chulha, and particulate pollution exposure."
  },
  gold_2025: {
    id: "gold_2025",
    code: "GOLD 2025",
    title: "Global Strategy for Diagnosis, Management, and Prevention of COPD (GOLD 2025)",
    organization: "GOLD",
    region: "International",
    year: 2025,
    url: "https://goldcopd.org",
    evidenceLevel: "Global Standard",
    keyTopics: ["copd", "emphysema", "chronic bronchitis", "fev1", "fvc", "exacerbation", "bronchodilator", "smoking cessation"],
    summary: "Defines ABCD assessment groups, early combined LABA+LAMA bronchodilation for symptom reduction, prompt treatment of exacerbations, and smoking cessation as the primary disease-modifying intervention."
  },

  // --- NEPHROLOGY ---
  icmr_ckd_stw: {
    id: "icmr_ckd_stw",
    code: "ICMR CKD STW",
    title: "ICMR Standard Treatment Workflow for Chronic Kidney Disease Screening & Early Staging",
    organization: "ICMR",
    region: "India",
    year: 2024,
    url: "https://stw.icmr.org.in",
    evidenceLevel: "National Health Workflow (ICMR)",
    keyTopics: ["kidney", "ckd", "creatinine", "egfr", "albumin", "uacr", "proteinuria", "nsaid", "electrolyte", "nephrotoxic"],
    summary: "Recommends dual eGFR and urine albumin screening in all individuals with diabetes or hypertension, strict avoidance of over-the-counter NSAIDs and heavy-metal containing formulations, and dietary sodium restriction."
  },
  kdigo_2024: {
    id: "kdigo_2024",
    code: "KDIGO 2024",
    title: "KDIGO 2024 Clinical Practice Guideline for Evaluation and Management of Chronic Kidney Disease",
    organization: "KDIGO",
    region: "International",
    year: 2024,
    url: "https://kdigo.org/guidelines/ckd-evaluation-management/",
    evidenceLevel: "Grade 1A",
    keyTopics: ["egfr", "creatinine", "kidney", "ckd", "albumin", "uacr", "proteinuria", "potassium", "hyperkalemia", "ras inhibition", "acei", "arb"],
    summary: "Recommends RAS inhibitor (ACEi/ARB) plus SGLT2 inhibitor for patients with eGFR < 60 mL/min/1.73m² or UACR ≥ 30 mg/g to delay CKD progression."
  },

  // --- PSYCHIATRY ---
  telemanas_nmhp_2024: {
    id: "telemanas_nmhp_2024",
    code: "Tele-MANAS/NMHP 2024",
    title: "Tele-MANAS & National Mental Health Programme (MoHFW) Comprehensive Care Framework",
    organization: "Tele-MANAS",
    region: "India",
    year: 2024,
    url: "https://telemanas.mohfw.gov.in",
    evidenceLevel: "National Health Mission Framework",
    keyTopics: ["mental health", "depression", "anxiety", "stress", "sleep", "insomnia", "suicide", "crisis", "counseling", "phq-9", "gad-7"],
    summary: "Framework for stepped mental healthcare in India; provides 24x7 toll-free crisis intervention (14416 / 1-800-891-4416), structured PHQ-9/GAD-7 triage, destigmatization, and linkage with district mental health programs."
  },
  apa_dsm5_2024: {
    id: "apa_dsm5_2024",
    code: "APA/DSM-5-TR 2024",
    title: "American Psychiatric Association Practice Guidelines for Depressive and Anxiety Disorders",
    organization: "APA",
    region: "International",
    year: 2024,
    url: "https://psychiatry.org",
    evidenceLevel: "Clinical Practice Guideline",
    keyTopics: ["depression", "anxiety", "panic", "bipolar", "psychotherapy", "cbt", "ssri", "mood"],
    summary: "Recommends evidence-based psychotherapy (CBT) and pharmacotherapy for moderate-to-severe depression and anxiety; stresses ruling out medical mimics (thyroid disorders, anemia, vitamin B12 deficiency)."
  },

  // --- DERMATOLOGY ---
  iadvl_dermatology_2024: {
    id: "iadvl_dermatology_2024",
    code: "IADVL 2024",
    title: "IADVL Consensus on Topical Steroid Stewardship & Common Dermatoses in India",
    organization: "IADVL",
    region: "India",
    year: 2024,
    url: "https://iadvl.org",
    evidenceLevel: "National Expert Consensus",
    keyTopics: ["skin", "rash", "itching", "eczema", "fungal", "steroid abuse", "acne", "psoriasis", "sunscreen", "melanoma"],
    summary: "Strongly cautions against unprescribed over-the-counter topical steroid combinations (steroid-modified tinea/fungal infections); advocates rational barrier moisturization, sunscreen adapted for Indian Fitzpatrick skin types IV–VI, and dermatological confirmation for persistent rashes."
  },
  aad_eczema_2024: {
    id: "aad_eczema_2024",
    code: "AAD 2024",
    title: "American Academy of Dermatology Guidelines for Care and Management of Atopic Dermatitis",
    organization: "AAD",
    region: "International",
    year: 2024,
    url: "https://aad.org",
    evidenceLevel: "Grade A",
    keyTopics: ["eczema", "atopic dermatitis", "psoriasis", "skin barrier", "emollient", "topical therapy"],
    summary: "Focuses on regular emollient barrier restoration, non-soap cleansers, identification of environmental triggers, and phototherapy/systemic therapy escalation for recalcitrant inflammatory skin disease."
  },

  // --- ORTHOPEDICS ---
  ioa_osteoarthritis_stw: {
    id: "ioa_osteoarthritis_stw",
    code: "IOA/ICMR STW 2024",
    title: "Indian Orthopaedic Association (IOA) & ICMR Standard Treatment Workflow for Knee Osteoarthritis",
    organization: "IOA",
    region: "India",
    year: 2024,
    url: "https://ioaindia.org",
    evidenceLevel: "National Workflow (ICMR/IOA)",
    keyTopics: ["joint", "knee", "bone", "arthritis", "osteoarthritis", "osteoporosis", "calcium", "vitamin d", "back pain", "physiotherapy", "dexa"],
    summary: "Recommends core non-pharmacological management: quadriceps-strengthening exercises, weight reduction, ergonomic posture, screening for Vitamin D3 deficiency, and conservative joint preservation prior to surgical referral."
  },
  aaos_joint_2024: {
    id: "aaos_joint_2024",
    code: "AAOS 2024",
    title: "AAOS Clinical Practice Guidelines for Musculoskeletal Health & Joint Preservation",
    organization: "AAOS",
    region: "International",
    year: 2024,
    url: "https://aaos.org",
    evidenceLevel: "Strong Recommendation",
    keyTopics: ["joint", "orthopedics", "fracture", "ligament", "mri knee", "cartilage", "rehabilitation", "sprain"],
    summary: "Promotes structured physical therapy, low-impact aerobic conditioning, judicious short-term pain relief, and clear criteria for advanced diagnostic imaging (MRI) and specialist orthopedic evaluation."
  },

  // --- ONCOLOGY ---
  ncg_india_2024: {
    id: "ncg_india_2024",
    code: "NCG India 2024",
    title: "National Cancer Grid (NCG) India Evidence-Based Management Guidelines for Common Cancers",
    organization: "NCG India",
    region: "India",
    year: 2024,
    url: "https://tmc.gov.in/ncg",
    evidenceLevel: "National Consensus Framework (Tata Memorial Centre / NCG)",
    keyTopics: ["cancer", "tumor", "screening", "oral cancer", "breast cancer", "cervical cancer", "tobacco", "biopsy", "pet-ct", "oncology"],
    summary: "Uniform, evidence-based Indian cancer guidelines; emphasizes early screening for oral (visual exam for non-healing ulcers/tobacco users), breast (clinical examination/mammography), and cervical cancer (HPV DNA/Pap smear), and multidisciplinary tumor board care."
  },
  nccn_screening_2025: {
    id: "nccn_screening_2025",
    code: "NCCN 2025",
    title: "NCCN Clinical Practice Guidelines for Screening, Early Detection & Survivorship",
    organization: "NCCN",
    region: "International",
    year: 2025,
    url: "https://nccn.org",
    evidenceLevel: "Category 1",
    keyTopics: ["oncology", "chemotherapy", "radiation", "immunotherapy", "tumor marker", "neutropenic fever", "psa", "ca-125", "cea", "staging"],
    summary: "Comprehensive screening algorithms, interpretation of staging/tumor markers as longitudinal trends rather than standalone diagnostic proof, urgent evaluation of neutropenic fever (≥ 38°C during chemotherapy), and survivor symptom monitoring."
  }
};

/**
 * Searches the guideline database for matching guidelines based on prompt text, biomarkers, and active specialist ID.
 */
export function lookupRelevantGuidelines(text: string, specialistId?: string): ClinicalGuideline[] {
  const query = (text || "").toLowerCase();
  const matched = new Set<ClinicalGuideline>();

  // Map each of the 10 specialists to their respective core Indian and international guidelines
  switch (specialistId) {
    case "cardiologist":
      matched.add(CLINICAL_GUIDELINES.ihci_icmr_2024);
      matched.add(CLINICAL_GUIDELINES.csi_lipid_2024);
      matched.add(CLINICAL_GUIDELINES.acc_aha_2024);
      matched.add(CLINICAL_GUIDELINES.esc_2025);
      break;
    case "endocrinologist":
      matched.add(CLINICAL_GUIDELINES.rssdi_t2dm_2024);
      matched.add(CLINICAL_GUIDELINES.icmr_t2dm_stw);
      matched.add(CLINICAL_GUIDELINES.ada_2025);
      break;
    case "neurologist":
      matched.add(CLINICAL_GUIDELINES.icmr_stroke_stw);
      matched.add(CLINICAL_GUIDELINES.aan_epilepsy_2024);
      break;
    case "gastroenterologist":
      matched.add(CLINICAL_GUIDELINES.isg_nafld_gerd_2024);
      matched.add(CLINICAL_GUIDELINES.icmr_gerd_stw);
      matched.add(CLINICAL_GUIDELINES.acg_aga_2024);
      break;
    case "pulmonologist":
      matched.add(CLINICAL_GUIDELINES.icmr_asthma_copd_stw);
      matched.add(CLINICAL_GUIDELINES.gold_2025);
      break;
    case "nephrologist":
      matched.add(CLINICAL_GUIDELINES.icmr_ckd_stw);
      matched.add(CLINICAL_GUIDELINES.kdigo_2024);
      break;
    case "psychiatrist":
      matched.add(CLINICAL_GUIDELINES.telemanas_nmhp_2024);
      matched.add(CLINICAL_GUIDELINES.apa_dsm5_2024);
      break;
    case "dermatologist":
      matched.add(CLINICAL_GUIDELINES.iadvl_dermatology_2024);
      matched.add(CLINICAL_GUIDELINES.aad_eczema_2024);
      break;
    case "orthopedist":
      matched.add(CLINICAL_GUIDELINES.ioa_osteoarthritis_stw);
      matched.add(CLINICAL_GUIDELINES.aaos_joint_2024);
      break;
    case "oncologist":
      matched.add(CLINICAL_GUIDELINES.ncg_india_2024);
      matched.add(CLINICAL_GUIDELINES.nccn_screening_2025);
      break;
  }

  // Cross-cutting topic matching from user query or clinical context
  Object.values(CLINICAL_GUIDELINES).forEach((guideline) => {
    if (guideline.keyTopics.some((topic) => query.includes(topic))) {
      matched.add(guideline);
    }
  });

  return Array.from(matched);
}

/**
 * Generates prompt augmentation block to be injected into specialist system instructions.
 */
export function buildGuidelinePromptAugmentation(guidelines: ClinicalGuideline[]): string {
  if (!guidelines || guidelines.length === 0) return "";

  let prompt = `\n\n### GUIDELINE REFERENCES (general, population-level information)\n`;
  prompt += `You may use these published guideline summaries to explain general targets and concepts. They describe populations, not this user; the user's own doctor sets personal targets and treatment.\n\n`;

  guidelines.forEach((g) => {
    prompt += `- **${g.code}** (${g.title}): ${g.summary} [Evidence: ${g.evidenceLevel}]\n`;
  });

  prompt += `\n### CITATION RULES\n`;
  prompt += `When you state a general target or concept taken from one of the references above, cite it with this exact syntax (use only these ids):\n`;
  guidelines.forEach((g) => {
    prompt += `- \`[${g.code}](cite:${g.id})\`\n`;
  });
  prompt += `Never cite anything else and never invent guidelines, studies, statistics or links.\n`;

  return prompt;
}
