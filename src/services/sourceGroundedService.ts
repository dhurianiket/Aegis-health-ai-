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
