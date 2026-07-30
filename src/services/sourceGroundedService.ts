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
    name: "Mayo Clinic",
    url: "https://www.mayoclinic.org/tests-procedures/uric-acid-test/about/pac-20384813"
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
