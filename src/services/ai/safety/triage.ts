/**
 * Deterministic pre-LLM red-flag / crisis triage for the Specialist Lounge.
 *
 * Runs BEFORE any Gemini call. If a message matches a curated emergency
 * pattern (English, Hindi/Devanagari, Hinglish/romanised Hindi), the caller
 * must NOT send it to the model and must show the fixed emergency card.
 *
 * Design notes
 * - Pure TS, no dependencies, no I/O: safe for the SPA and unit tests.
 * - Text is normalised (NFKC, lowercase, apostrophes dropped, punctuation ->
 *   space, Devanagari nukta stripped, chandrabindu -> anusvara, spaces
 *   collapsed) and every pattern is matched on whole-word boundaries
 *   (whitespace/start/end — JS `\b` is ASCII-only and fails for Devanagari).
 * - Negation-light: for physical-symptom categories only, an immediately
 *   preceding English cue ("no chest pain", "history of seizures") or a
 *   following Hindi/Hinglish negation ("seene me dard nahi") suppresses that
 *   single match. Self-harm/suicide matches are NEVER suppressed.
 * - Tuned to prefer false positives over false negatives: showing a helpline
 *   card to someone who didn't need it is cheaper than missing a crisis.
 */

export type TriageCategory =
  | "self_harm"
  | "cardiac"
  | "stroke"
  | "breathing"
  | "bleeding"
  | "seizure"
  | "anaphylaxis"
  | "overdose"
  | "unconscious";

export interface TriageResult {
  isEmergency: boolean;
  /** All matched categories, highest priority first. */
  categories: TriageCategory[];
  primary: TriageCategory | null;
  /** Show the Tele-MANAS mental-health helpline. */
  showMentalHealthLine: boolean;
}

export interface Helpline {
  number: string;
  tel: string;
}

/** India emergency numbers. KIRAN is intentionally NOT listed (discontinued). */
export const EMERGENCY_HELPLINES = {
  national: { number: "112", tel: "tel:112" },
  ambulance: { number: "108", tel: "tel:108" },
  teleManasShort: { number: "14416", tel: "tel:14416" },
  teleManasTollFree: { number: "1-800-891-4416", tel: "tel:18008914416" },
} as const satisfies Record<string, Helpline>;

/** Priority order: first entry wins as `primary`. */
export const TRIAGE_PRIORITY: readonly TriageCategory[] = [
  "self_harm",
  "overdose",
  "unconscious",
  "cardiac",
  "stroke",
  "breathing",
  "anaphylaxis",
  "seizure",
  "bleeding",
];

const MENTAL_HEALTH_CATEGORIES: ReadonlySet<TriageCategory> = new Set<TriageCategory>([
  "self_harm",
  "overdose",
]);

const NEVER_NEGATE: ReadonlySet<TriageCategory> = new Set<TriageCategory>(["self_harm"]);

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

export function normalizeForTriage(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc'`]/g, "") // can't -> cant, i'm -> im
    .replace(/\u093c/g, "") // Devanagari nukta: ज़हर -> जहर, ढ़ -> ढ
    .replace(/\u0901/g, "\u0902") // chandrabindu -> anusvara: साँस -> सांस
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ") // punctuation, danda, emoji -> space
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Patterns (written against NORMALISED text; one space between words) */
/* ------------------------------------------------------------------ */

// Small helpers for readability.
const G = "(?: \\S+){0,3}"; // gap of up to 3 words
const HI_ME = "(?:में|मे|मैं)";
const HG_ME = "(?:me|mein|mai|main|mei|mien)";
const HG_NAHI = "(?:nahi|nahin|nhi|nai)";
const HG_BAHUT = "(?:bahut|bohot|bahot|boht|bht)";
const HG_ZYADA = "(?:zyada|jyada|jada|zada|jyaada|zyaada)";

const PATTERNS: Record<TriageCategory, readonly string[]> = {
  self_harm: [
    // English
    "(?:kill|killing|kil) my ?self",
    "end(?:ing)? (?:my (?:own )?life|it all)",
    "take my (?:own )?life",
    "suicid(?:e|al|ally)",
    "(?<!dont |do not |never |not )(?:want to|wanna|plan to|planning to) die",
    "want to be dead",
    "wish i (?:was|were) dead",
    "better off dead",
    "(?:dont|do not|no longer) want to (?:live|be alive|wake up)",
    "no reason to live",
    "(?:harm|harming|cutting) my ?self",
    "(?:want to|wanna|going to|gonna|urge to|thinking of|thinking about) (?:hurt|hurting|harm|harming|cut|cutting) my ?self",
    "self ?harm(?:ing)?",
    // Hindi (Devanagari)
    "आत्महत्या",
    "खुदकुशी",
    "मर(?:ना| जाना) चाहत(?:ा|ी|े)",
    "जीना नहीं चाहत(?:ा|ी|े)",
    "(?:अपनी )?जान (?:ले|दे) (?:लूं|लूंगा|लूंगी|दूं|दूंगा|दूंगी|लेना|देना)",
    "(?:खुद|अपने आप) को (?:मार|खत्म)",
    // Hinglish
    "a?atma?hatya",
    "khud ?k(?:h)?ushi",
    `mar(?:na| jana| jaana) chah(?:a)?t(?:a|i|e)`,
    `(?:jeena|jina|jeene|jine) ${HG_NAHI} chah(?:a)?t(?:a|i|e)`,
    "apni jaan (?:le|lena|de|dena|lelu|lelunga|lelungi|dedu|dedunga|dedungi)",
    "(?:khud|apne aap) ko (?:maar|mar|khatam|khatm|khtm)",
  ],
  cardiac: [
    "chest pains?",
    "pain in (?:my |the )?chest",
    "chest (?:tightness|pressure|heaviness)",
    "(?:tight|tightness|pressure|heaviness) (?:in )?(?:my |the )?chest",
    "crushing (?:chest|pain)",
    "heart attack",
    "cardiac arrest",
    // Hindi
    `(?:सीने|सीना|छाती) ${HI_ME} (?:दर्द|जकडन|भारीपन|दबाव)`,
    "(?:सीने|छाती) का दर्द",
    "दिल का दौरा",
    "हार्ट अटैक",
    // Hinglish
    `(?:seene|sine|seena|sina|chhati|chati|chaati) ${HG_ME} (?:dard|jakdan|jakadan|bhaaripan|bharipan|dabav|dabaav|dabaw)`,
    "dil ka (?:daura|dora)",
  ],
  stroke: [
    "(?<!heat |sun |brush |swim |back |key )stroke(?! volume)(?:s)?",
    "face (?:is )?droop(?:ing|y|ed)?",
    "droop(?:ing|y)? (?:face|mouth|smile)",
    "slurr(?:ed|ing) (?:speech|words)",
    "speech (?:is )?slurr(?:ed|ing)",
    "(?:one side|half|left side|right side) of (?:my |his |her |the )?(?:face|body)" + G + " (?:numb|weak|paralysed|paralyzed|droop(?:ing)?)",
    "(?:cant|cannot|can not) (?:lift|raise|move) (?:my|his|her) (?:arm|leg)",
    "sudden(?:ly)? (?:numbness|weakness|paralysis)",
    // Hindi
    "लकवा",
    "पक्षाघात",
    "(?:ब्रेन )?स्ट्रोक",
    "(?:मुंह|मुह|चेहरा|चेहरे) टेढा",
    "(?:जुबान|जबान|आवाज) लडखडा",
    "(?:आधा शरीर|एक तरफ)" + G + " (?:सुन्न|कमजोर|काम नहीं)",
    // Hinglish
    "lak(?:wa|va|waa)",
    "(?:muh|munh|moonh|mooh|chehra|chehre) (?:tedha|terha|teda|tedha ho)",
    "(?:zubaan|zuban|jubaan|juban|zabaan|awaaz|awaz) (?:ladkhada|ladkhara|lad khada)",
    "(?:aadha|adha|ek taraf)" + G + ` (?:sunn|sun|kamzor|kamjor|kaam ${HG_NAHI})`,
  ],
  breathing: [
    "(?:cant|cannot|can not|unable to|not able to|struggling to|hard to) breath(?:e)?",
    "gasping(?: for (?:air|breath))?",
    "choking",
    "(?:cant|cannot|can not) catch (?:my|his|her|their) breath",
    "(?:stopped|not|isnt|is not) breathing",
    "severe (?:shortness of breath|breathlessness|breathing (?:difficulty|problem|trouble))",
    "(?:lips|face) (?:are |is )?(?:turning )?blue",
    "turning blue",
    // Hindi
    "सांस नहीं (?:आ|ले|ली|हो)",
    "सांस (?:रुक|अटक)",
    "दम घुट",
    `सांस लेने ${HI_ME} (?:बहुत|ज्यादा) (?:तकलीफ|दिक्कत|परेशानी)`,
    "होंठ नीले",
    // Hinglish
    `(?:saans|sans|saas|sas|saans) ${HG_NAHI} (?:aa|aa rahi|aa raha|le|le pa|ho)`,
    "(?:saans|sans|saas|sas) (?:ruk|atak)",
    "dam ghut",
    `(?:saans|sans|saas|sas) lene ${HG_ME} (?:${HG_BAHUT}|${HG_ZYADA}) (?:takleef|taklif|takleef ho|dikkat|dikat|pareshani|problem)`,
    "(?:hont|honth|hoth) (?:neele|nile|neela)",
  ],
  bleeding: [
    "(?:heavy|heavily|severe|uncontrolled|uncontrollable|profuse|a lot of|lots of|massive) bleeding",
    "bleeding (?:heavily|a lot|profusely|badly|nonstop|non stop|(?:wont|will not|doesnt|does not|isnt|is not) stop(?:ping)?)",
    "(?:cant|cannot|can not) stop (?:the )?bleeding",
    "(?:vomiting|throwing up|coughing up|coughing|vomited|threw up) blood",
    "blood in (?:my |his |her )?vomit",
    // Hindi
    "(?:बहुत|ज्यादा|बहुत ज्यादा) खून (?:बह|निकल|आ)",
    "खून (?:बंद नहीं|रुक नहीं|नहीं रुक)",
    "खून की उल्टी",
    // Hinglish
    `(?:${HG_BAHUT}|${HG_ZYADA})(?: ${HG_ZYADA})? (?:khoon|khun|khoon|blood) (?:beh|bah|nikal|aa|jaa)`,
    `(?:khoon|khun|blood) (?:(?:band|ruk) ${HG_NAHI}|${HG_NAHI} ruk)`,
    "(?:khoon|khun) ki (?:ulti|ultee)",
  ],
  seizure: [
    "seizures?",
    "seizing",
    "convuls(?:ion|ions|ing|ed)",
    "having (?:a )?fits?",
    "epileptic (?:attack|fit)",
    // Hindi
    "(?:दौरा|दौरे) (?:पड|आ)",
    "मिर्गी",
    "झटके (?:आ|लग)",
    // Hinglish
    "(?:daura|dora|daure|dore) (?:pad|padh|par|aa)",
    "mirgi",
    "(?:jhatke|jatke) (?:aa|lag)",
    "fits? (?:aa|aya|aaya|aa rahe|aate)",
  ],
  anaphylaxis: [
    "anaphyla(?:xis|ctic)",
    "throat (?:is )?(?:closing|swelling|swollen|tight)",
    "(?:swollen|swelling) (?:throat|tongue)",
    "(?:tongue|lips|face) (?:is |are )?(?:swelling up|swelling|swollen)",
    "severe allergic reaction",
    // Hindi
    "गला (?:बंद|सूज)",
    `गले ${HI_ME} सूजन`,
    "(?:जीभ|होंठ|चेहरा) सूज",
    // Hinglish
    "gala (?:band|sooj|suj)",
    `gale ${HG_ME} (?:soojan|sujan|swelling)`,
    "(?:jeebh|jibh|jeeb|jib|hont|honth|chehra) (?:sooj|suj)",
  ],
  overdose: [
    "overdos(?:e|ed|ing)",
    "took (?:too many |all (?:my |the )?|a whole (?:bottle|strip) of |an entire (?:bottle|strip) of )(?:pills|tablets|medicines|meds|sleeping pills)",
    "(?:swallowed|drank|drunk|ate|consumed|took) (?:some )?(?:poison|bleach|pesticide|rat poison|acid|phenyl|phenol|insecticide|kerosene)",
    "(?<!food )(?:poisoning|poisoned)",
    // Hindi
    "जहर (?:खा|पी|निगल)",
    "(?:बहुत सारी|सारी|ढेर सारी) (?:गोलियां|गोली|दवाई|दवाइयां) (?:खा|ले)",
    "ओवरडोज",
    "(?:कीटनाशक|फिनाइल|चूहे मार) (?:पी|खा|दवा)",
    // Hinglish
    "(?:zeher|zehar|zahar|jahar|jeher|jaher|zaher) (?:kha|khaa|pi|pee|pii|nigal)",
    "(?:bahut saari|saari|sari|dher saari) (?:goliyan|goliya|goli|dawai|dawaiyan|tablets|pills) (?:kha|khaa|le|li)",
    "(?:keetnashak|kitnashak|phenyl|finyl|chuhe mar) (?:pi|pee|kha|khaa)",
  ],
  unconscious: [
    "unconscious",
    "unresponsive",
    "passed out",
    "fainted",
    "lost consciousness",
    "collapsed",
    "not responding",
    "(?:wont|will not|cant|cannot|can not|not|didnt|isnt) wak(?:e|ing) (?:him |her |them )?up",
    // Hindi
    "बेहोश",
    "होश (?:नहीं|खो)",
    // Hinglish
    "(?:behosh|behos|behoosh|behoshi)",
    `hosh (?:${HG_NAHI}|kho)`,
  ],
};

interface CompiledPattern {
  category: TriageCategory;
  re: RegExp;
}

const COMPILED: readonly CompiledPattern[] = (Object.keys(PATTERNS) as TriageCategory[]).flatMap(
  (category) =>
    PATTERNS[category].map((src) => ({
      category,
      // Whole-word boundary via whitespace/start/end (Unicode-safe).
      re: new RegExp(`(?:^| )(?:${src})(?= |$)`, "gu"),
    })),
);

/* ------------------------------------------------------------------ */
/* Negation-light                                                      */
/* ------------------------------------------------------------------ */

const PRE_NEGATION_CUES: ReadonlySet<string> = new Set([
  "no", "not", "never", "without", "denies", "deny", "denied", "nor",
  "dont", "doesnt", "didnt", "havent", "hasnt", "hadnt",
  "history", "risk", "prevent", "prevention", "preventing", "avoid",
]);
const PRE_SCOPE_BREAKERS: ReadonlySet<string> = new Set([
  "but", "and", "however", "now", "suddenly", "though", "although", "yet", "lekin", "par", "magar", "लेकिन", "पर", "मगर",
]);
const POST_NEGATION_CUES: ReadonlySet<string> = new Set([
  "नहीं", "नही", "nahi", "nahin", "nhi", "risk", "prevention",
]);

function isNegated(words: readonly string[], startWord: number, endWord: number): boolean {
  // Up to 3 words before the match, stopping at a scope breaker.
  for (let i = startWord - 1; i >= 0 && i >= startWord - 3; i--) {
    const w = words[i];
    if (PRE_SCOPE_BREAKERS.has(w)) break;
    if (PRE_NEGATION_CUES.has(w)) return true;
  }
  // Up to 2 words after the match ("seene me dard nahi hai", "stroke risk").
  for (let i = endWord; i < words.length && i < endWord + 2; i++) {
    if (POST_NEGATION_CUES.has(words[i])) return true;
  }
  return false;
}

function wordIndexAt(text: string, charIndex: number): number {
  if (charIndex <= 0) return 0;
  let count = 0;
  for (let i = 0; i < charIndex && i < text.length; i++) if (text[i] === " ") count++;
  return count;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const NOT_EMERGENCY: TriageResult = Object.freeze({
  isEmergency: false,
  categories: [],
  primary: null,
  showMentalHealthLine: false,
}) as TriageResult;

/** Max characters scanned; bounds work for pasted documents. */
const MAX_SCAN_CHARS = 4000;

export function triageMessage(input: string): TriageResult {
  if (typeof input !== "string" || !input.trim()) return NOT_EMERGENCY;
  const text = normalizeForTriage(input.slice(0, MAX_SCAN_CHARS));
  if (!text) return NOT_EMERGENCY;
  const words = text.split(" ");

  const hits = new Set<TriageCategory>();
  for (const { category, re } of COMPILED) {
    if (hits.has(category)) continue;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const matched = m[0];
      const leadingSpace = matched.startsWith(" ") ? 1 : 0;
      const start = m.index + leadingSpace;
      const end = m.index + matched.length;
      if (NEVER_NEGATE.has(category)) {
        hits.add(category);
        break;
      }
      const startWord = wordIndexAt(text, start);
      const endWord = wordIndexAt(text, end) + 1;
      if (!isNegated(words, startWord, endWord)) {
        hits.add(category);
        break;
      }
      if (re.lastIndex === m.index) re.lastIndex++;
    }
  }

  if (hits.size === 0) return NOT_EMERGENCY;
  const categories = TRIAGE_PRIORITY.filter((c) => hits.has(c));
  return {
    isEmergency: true,
    categories,
    primary: categories[0] ?? null,
    showMentalHealthLine: categories.some((c) => MENTAL_HEALTH_CATEGORIES.has(c)),
  };
}

/**
 * Fixed, non-AI transcript text stored in chat history in place of a model
 * reply, so a reloaded conversation still shows the safety response.
 */
/** First line of every emergency transcript; used to recognise stored triage replies. */
export const EMERGENCY_TRANSCRIPT_HEADER =
  "⚠️ **This may be a medical emergency. The AI guide has not answered this message.**";

/** Header used before the persona reframe (PR #268); still recognised for stored chats. */
const LEGACY_EMERGENCY_TRANSCRIPT_HEADERS: readonly string[] = [
  "⚠️ **This may be a medical emergency. The AI specialist has not answered this message.**",
];

/** True when `content` is a fixed emergency-card transcript produced by buildEmergencyTranscript. */
export function isEmergencyTranscript(content: string): boolean {
  const head = content.trimStart();
  return (
    head.startsWith(EMERGENCY_TRANSCRIPT_HEADER) ||
    LEGACY_EMERGENCY_TRANSCRIPT_HEADERS.some((h) => head.startsWith(h))
  );
}

export function buildEmergencyTranscript(result: TriageResult): string {
  const { national, ambulance, teleManasShort, teleManasTollFree } = EMERGENCY_HELPLINES;
  const lines = [
    EMERGENCY_TRANSCRIPT_HEADER,
    `Call **${national.number}** now (national emergency). If it does not connect, call **${ambulance.number}** for an ambulance.`,
    `⚠️ **यह एक मेडिकल इमरजेंसी हो सकती है।** अभी **${national.number}** पर कॉल करें। न लगे तो एम्बुलेंस के लिए **${ambulance.number}** पर कॉल करें।`,
  ];
  if (result.showMentalHealthLine) {
    lines.push(
      `You are not alone. Tele-MANAS (free, 24x7): **${teleManasShort.number}** or **${teleManasTollFree.number}**.`,
      `आप अकेले नहीं हैं। Tele-MANAS (निःशुल्क, 24x7): **${teleManasShort.number}** या **${teleManasTollFree.number}**।`,
    );
  }
  return lines.join("\n\n");
}
