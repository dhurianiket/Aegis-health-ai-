import { Medication, DrugInteraction } from "../types/health";

export interface LabBiomarker {
  id?: string;
  testName: string;
  marker?: string;
  value: string;
  numericValue?: number | null;
  unit?: string;
  referenceRange?: string | null;
  flag?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | "ABNORMAL" | "UNKNOWN" | string;
  date?: string;
}

export interface DrugLabContraindication {
  id: string;
  medicationId?: string;
  medicationName: string;
  rxcui?: string | null;
  biomarkerName: string;
  biomarkerValue: string;
  severity: "critical" | "moderate" | "safe";
  title: string;
  description: string;
  plainSummary: string;
  clinicalRationale: string;
  recommendedAction: string;
  detectedAt: string;
}

export interface BioRegimenSafetySummary {
  overallRiskLevel: "critical" | "moderate" | "safe";
  criticalAlertCount: number;
  warningCount: number;
  compatibleCount: number;
  totalMedicationsCount: number;
  totalBiomarkersCount: number;
  drugLabContraindications: DrugLabContraindication[];
  drugDrugInteractions: DrugInteraction[];
}

/**
 * Drug category lookup maps supporting RxCUI and string lowercasing matching
 */
const DRUG_CATEGORIES: Record<string, { rxcuis: string[]; keywords: string[] }> = {
  acei: {
    rxcuis: ["29046", "3827", "35208", "8588", "197806", "8629"],
    keywords: ["lisinopril", "enalapril", "ramipril", "benazepril", "captopril", "perindopril", "quinapril", "fosinopril"]
  },
  arb: {
    rxcuis: ["5224", "69747", "214354", "33408", "83515", "68600"],
    keywords: ["losartan", "valsartan", "candesartan", "irbesartan", "olmesartan", "telmisartan"]
  },
  potassium_sparing: {
    rxcuis: ["9997", "216094", "10767", "597"],
    keywords: ["spironolactone", "eplerenone", "triamterene", "amiloride"]
  },
  biguanide: {
    rxcuis: ["6809"],
    keywords: ["metformin", "glucophage"]
  },
  nsaid: {
    rxcuis: ["5640", "7258", "6707", "140587", "3355", "3257"],
    keywords: ["ibuprofen", "naproxen", "meloxicam", "celecoxib", "indomethacin", "diclofenac", "ketorolac", "aspirin"]
  },
  statin: {
    rxcuis: ["83367", "301542", "36567", "36214", "259255", "861634"],
    keywords: ["atorvastatin", "rosuvastatin", "simvastatin", "pravastatin", "lovastatin", "pitavastatin", "lipitor", "crestor"]
  },
  anticoagulant: {
    rxcuis: ["11289", "1364430", "1114195", "105586"],
    keywords: ["warfarin", "coumadin", "dabigatran", "pradaxa", "rivaroxaban", "xarelto", "apixaban", "eliquis"]
  }
};

/**
 * Robust drug matching helper using RxCUI or generic name lowercasing
 */
export function isMedInCategory(med: Medication, categoryKey: string): boolean {
  const cat = DRUG_CATEGORIES[categoryKey];
  if (!cat) return false;

  // 1. Match by RxCUI
  if (med.rxcui && cat.rxcuis.includes(med.rxcui)) {
    return true;
  }

  // 2. Match by string lowercasing (genericName or brandName)
  const name = (med.genericName || med.brandName || "").toLowerCase();
  return cat.keywords.some((kw) => name.includes(kw));
}

/**
 * Extracts parsed numeric value from string lab display values (e.g. "5.4 mmol/L" -> 5.4, "> 3.5" -> 3.5)
 */
export function parseNumericValue(valStr: string | number | null | undefined): number | null {
  if (valStr === null || valStr === undefined) return null;
  if (typeof valStr === "number") return isNaN(valStr) ? null : valStr;
  
  const cleaned = String(valStr).replace(/[^0-9.]/g, " ").trim();
  const parts = cleaned.split(/\s+/).map(p => parseFloat(p)).filter(n => !isNaN(n));
  return parts.length > 0 ? parts[0] : null;
}

/**
 * Evaluates real-time drug-lab & drug-drug contraindications
 */
export function evaluateDrugLabContraindications(
  medications: Medication[],
  biomarkers: LabBiomarker[]
): DrugLabContraindication[] {
  const contraindications: DrugLabContraindication[] = [];
  const activeMeds = medications.filter((m) => m.genericName);

  if (activeMeds.length === 0 || biomarkers.length === 0) {
    return contraindications;
  }

  // Group biomarkers by normalized test type
  const getBiomarker = (keys: string[]) => {
    return biomarkers.find((b) => {
      const name = (b.testName || b.marker || "").toLowerCase();
      return keys.some((k) => name.includes(k));
    });
  };

  const potassiumBio = getBiomarker(["potassium", "k+"]);
  const egfrBio = getBiomarker(["egfr", "gfr", "filtration rate"]);
  const creatBio = getBiomarker(["creatinine", "creat"]);
  const altBio = getBiomarker(["alt", "sgpt"]);
  const astBio = getBiomarker(["ast", "sgot"]);
  const inrBio = getBiomarker(["inr", "prothrombin"]);

  activeMeds.forEach((med) => {
    const medName = med.genericName || med.brandName || "Medication";

    // 1. ACEi / ARB + Potassium (>= 5.0)
    if ((isMedInCategory(med, "acei") || isMedInCategory(med, "arb")) && potassiumBio) {
      const kVal: number | null = parseNumericValue(potassiumBio.value) ?? potassiumBio.numericValue ?? null;
      const isHighK = (kVal !== null && kVal >= 5.0) || potassiumBio.flag === "HIGH" || potassiumBio.flag === "CRITICAL";

      if (isHighK) {
        const displayVal = kVal !== null ? `${kVal}` : potassiumBio.value;
        contraindications.push({
          id: `contra-${med.id}-potassium`,
          medicationId: med.id,
          medicationName: medName,
          rxcui: med.rxcui,
          biomarkerName: "Potassium",
          biomarkerValue: `${displayVal} ${potassiumBio.unit || "mmol/L"}`,
          severity: "critical",
          title: "Hyperkalemia Alert (ACEi/ARB + High Potassium)",
          description: `Active treatment with ${medName} reduces renal potassium excretion. Elevated serum potassium increases the risk of severe hyperkalemia.`,
          plainSummary: `High blood potassium (${displayVal}) detected alongside ${medName}. This combination increases the risk of hyperkalemia and cardiac irregularities.`,
          clinicalRationale: "RAAS blockade impairs aldosterone-mediated distal renal potassium secretion.",
          recommendedAction: "Order repeat electrolyte panel and consider temporary dose reduction or potassium binder.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Spironolactone + Potassium (>= 5.0)
    if (isMedInCategory(med, "potassium_sparing") && potassiumBio) {
      const kVal: number | null = parseNumericValue(potassiumBio.value) ?? potassiumBio.numericValue ?? null;
      const isHighK = (kVal !== null && kVal >= 5.0) || potassiumBio.flag === "HIGH" || potassiumBio.flag === "CRITICAL";

      if (isHighK) {
        const displayVal = kVal !== null ? `${kVal}` : potassiumBio.value;
        contraindications.push({
          id: `contra-${med.id}-spiro-potassium`,
          medicationId: med.id,
          medicationName: medName,
          rxcui: med.rxcui,
          biomarkerName: "Potassium",
          biomarkerValue: `${displayVal} ${potassiumBio.unit || "mmol/L"}`,
          severity: "critical",
          title: "Severe Hyperkalemia Risk (Spironolactone + High Potassium)",
          description: `Direct aldosterone antagonist ${medName} severely impairs renal potassium excretion. Elevated potassium creates urgent cardiac risk.`,
          plainSummary: `${medName} combined with elevated potassium (${displayVal}) can lead to dangerous potassium buildup in the blood.`,
          clinicalRationale: "Competitive binding at mineralocorticoid receptors stops renal K+ excretion.",
          recommendedAction: "Hold aldosterone antagonist and evaluate urgent serum potassium lowering options.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 3. Metformin + eGFR / Creatinine (eGFR < 30 or Creatinine > 1.5)
    if (isMedInCategory(med, "biguanide") && (egfrBio || creatBio)) {
      const egfrVal: number | null = egfrBio ? (parseNumericValue(egfrBio.value) ?? egfrBio.numericValue ?? null) : null;
      const creatVal: number | null = creatBio ? (parseNumericValue(creatBio.value) ?? creatBio.numericValue ?? null) : null;

      const isCriticalGFR = egfrVal !== null && egfrVal < 30;
      const isModerateGFR = (egfrVal !== null && egfrVal >= 30 && egfrVal < 45) || (creatVal !== null && creatVal > 1.5);

      if (isCriticalGFR || isModerateGFR) {
        const summaryText = egfrVal !== null ? `eGFR ${egfrVal}` : `Creatinine ${creatVal}`;
        contraindications.push({
          id: `contra-${med.id}-metformin-kidney`,
          medicationId: med.id,
          medicationName: medName,
          rxcui: med.rxcui,
          biomarkerName: egfrVal !== null ? "eGFR" : "Creatinine",
          biomarkerValue: egfrVal !== null ? `${egfrVal} mL/min/1.73m²` : `${creatVal} mg/dL`,
          severity: isCriticalGFR ? "critical" : "moderate",
          title: isCriticalGFR ? "Lactic Acidosis Risk (Metformin + eGFR < 30)" : "Renal Monitoring Needed (Metformin + Reduced Filtration)",
          description: `${medName} clearance is primarily renal. Reduced kidney filtration causes drug accumulation and risk of metformin-associated lactic acidosis (MALA).`,
          plainSummary: `${medName} requires healthy kidney function. Low kidney filtration (${summaryText}) increases drug accumulation risk.`,
          clinicalRationale: "MALA risk increases markedly when renal clearance falls below 30 mL/min/1.73m².",
          recommendedAction: isCriticalGFR ? "Discontinue Metformin and initiate alternative glycemic control." : "Monitor eGFR quarterly and max dose 1000mg/day.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 4. ACEi / ARB / NSAID + Creatinine (> 1.5)
    if ((isMedInCategory(med, "acei") || isMedInCategory(med, "arb") || isMedInCategory(med, "nsaid")) && creatBio) {
      const creatVal: number | null = parseNumericValue(creatBio.value) ?? creatBio.numericValue ?? null;
      if (creatVal !== null && creatVal > 1.5) {
        contraindications.push({
          id: `contra-${med.id}-creat-aki`,
          medicationId: med.id,
          medicationName: medName,
          rxcui: med.rxcui,
          biomarkerName: "Creatinine",
          biomarkerValue: `${creatVal} ${creatBio.unit || "mg/dL"}`,
          severity: creatVal > 2.5 ? "critical" : "moderate",
          title: "Acute Kidney Stress Warning (Elevated Creatinine)",
          description: `Pre-existing renal impairment with Creatinine ${creatVal} mg/dL alongside nephrotoxic/hemodynamic med ${medName}.`,
          plainSummary: `Taking kidney-affecting medications (like ${medName}) when creatinine is elevated (${creatVal} mg/dL) requires kidney function monitoring.`,
          clinicalRationale: "Altered efferent arteriolar tone or prostaglandin inhibition in compromised nephrons.",
          recommendedAction: "Review fluid status, re-check renal panel within 14 days, avoid double nephrotoxic therapy.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 5. Statins + ALT / AST (> 120 U/L or HIGH)
    if (isMedInCategory(med, "statin") && (altBio || astBio)) {
      const altVal: number | null = altBio ? (parseNumericValue(altBio.value) ?? altBio.numericValue ?? null) : null;
      const astVal: number | null = astBio ? (parseNumericValue(astBio.value) ?? astBio.numericValue ?? null) : null;
      const isHighLiver = (altVal !== null && altVal > 120) || (astVal !== null && astVal > 120) || altBio?.flag === "HIGH" || astBio?.flag === "HIGH";

      if (isHighLiver) {
        const liverDisplay = altVal !== null ? `${altVal} U/L` : (astVal !== null ? `${astVal} U/L` : "Elevated");
        contraindications.push({
          id: `contra-${med.id}-statin-liver`,
          medicationId: med.id,
          medicationName: medName,
          rxcui: med.rxcui,
          biomarkerName: altVal !== null ? "ALT" : "AST",
          biomarkerValue: liverDisplay,
          severity: "moderate",
          title: "Hepatic Stress Alert (Statin + Elevated Transaminases)",
          description: `${medName} metabolism can exacerbate hepatic transaminitis when ALT/AST levels exceed 3x upper limit of normal.`,
          plainSummary: `Statin medication (${medName}) with elevated liver enzymes requires medical monitoring of liver function.`,
          clinicalRationale: "HMG-CoA reductase inhibitor hepatic clearance considerations during active transaminitis.",
          recommendedAction: "Re-check liver enzyme panel and assess for hepatic symptoms.",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 6. Anticoagulants + INR (> 3.5)
    if (isMedInCategory(med, "anticoagulant") && inrBio) {
      const inrVal: number | null = parseNumericValue(inrBio.value) ?? inrBio.numericValue ?? null;
      if (inrVal !== null && inrVal > 3.5) {
        contraindications.push({
          id: `contra-${med.id}-anticoag-inr`,
          medicationId: med.id,
          medicationName: medName,
          rxcui: med.rxcui,
          biomarkerName: "INR",
          biomarkerValue: `${inrVal}`,
          severity: "critical",
          title: "Supratherapeutic INR Bleeding Risk",
          description: `INR of ${inrVal} exceeds standard target (2.0 - 3.0) while taking ${medName}, creating high risk of spontaneous hemorrhage.`,
          plainSummary: `Elevated INR level (${inrVal}) increases the risk of spontaneous bleeding with anticoagulants (${medName}).`,
          clinicalRationale: "Excess inhibition of vitamin K-dependent clotting factors or direct factor Xa/IIa inhibition.",
          recommendedAction: "Hold anticoagulant dose, evaluate for bleeding signs, and consult prescribing physician immediately.",
          detectedAt: new Date().toISOString(),
        });
      }
    }
  });

  return contraindications;
}

/**
 * Consolidates total safety risk summary
 */
export function buildBioRegimenSafetySummary(
  medications: Medication[],
  biomarkers: LabBiomarker[],
  rxnormInteractions: DrugInteraction[] = []
): BioRegimenSafetySummary {
  const drugLabContraindications = evaluateDrugLabContraindications(medications, biomarkers);
  
  const criticalCount = drugLabContraindications.filter((c) => c.severity === "critical").length +
    rxnormInteractions.filter((i) => i.severity === "severe").length;

  const warningCount = drugLabContraindications.filter((c) => c.severity === "moderate").length +
    rxnormInteractions.filter((i) => i.severity === "moderate").length;

  const totalPairs = (medications.length * (medications.length - 1)) / 2;
  const compatibleCount = Math.max(0, totalPairs - rxnormInteractions.length);

  let overallRiskLevel: "critical" | "moderate" | "safe" = "safe";
  if (criticalCount > 0) overallRiskLevel = "critical";
  else if (warningCount > 0) overallRiskLevel = "moderate";

  return {
    overallRiskLevel,
    criticalAlertCount: criticalCount,
    warningCount,
    compatibleCount,
    totalMedicationsCount: medications.length,
    totalBiomarkersCount: biomarkers.length,
    drugLabContraindications,
    drugDrugInteractions: rxnormInteractions,
  };
}
