import { describe, it, expect } from "vitest";
import {
  triageMessage,
  normalizeForTriage,
  buildEmergencyTranscript,
  EMERGENCY_HELPLINES,
  type TriageCategory,
} from "../triage";

type Case = [lang: "en" | "hi" | "hinglish", text: string, category: TriageCategory];

// Synthetic phrases only.
const POSITIVES: Case[] = [
  // self-harm / suicidal ideation
  ["en", "I want to kill myself", "self_harm"],
  ["en", "I've been having suicidal thoughts lately.", "self_harm"],
  ["en", "honestly i just want to die", "self_harm"],
  ["en", "I don't want to live anymore", "self_harm"],
  ["en", "I keep thinking about hurting myself", "self_harm"],
  ["en", "I want to end my life", "self_harm"],
  ["hi", "मैं आत्महत्या करना चाहता हूँ", "self_harm"],
  ["hi", "मुझे अब जीना नहीं चाहती", "self_harm"],
  ["hi", "मैं मर जाना चाहता हूं।", "self_harm"],
  ["hinglish", "main khudkushi kar lunga", "self_harm"],
  ["hinglish", "mujhe marna chahta hu bas", "self_harm"],
  ["hinglish", "ab jeena nahi chahti", "self_harm"],
  ["hinglish", "aatmahatya ke vichar aa rahe hain", "self_harm"],
  // cardiac
  ["en", "I have severe chest pain spreading to my left arm", "cardiac"],
  ["en", "Crushing pressure in my chest!!", "cardiac"],
  ["en", "I think my dad is having a heart attack", "cardiac"],
  ["hi", "सीने में दर्द हो रहा है", "cardiac"],
  ["hi", "पापा को दिल का दौरा पड़ा है", "cardiac"],
  ["hinglish", "seene mein dard ho raha hai", "cardiac"],
  ["hinglish", "chhati me dard aur pasina", "cardiac"],
  // stroke
  ["en", "My mom's face is drooping and her speech is slurred", "stroke"],
  ["en", "I think he's having a stroke", "stroke"],
  ["en", "suddenly can't lift my arm", "stroke"],
  ["hi", "दादी का मुँह टेढ़ा हो गया है", "stroke"],
  ["hi", "लकवा मार गया लगता है", "stroke"],
  ["hinglish", "papa ka muh tedha ho gaya aur zubaan ladkhada rahi hai", "stroke"],
  // breathing
  ["en", "I can't breathe", "breathing"],
  ["en", "he is gasping for air", "breathing"],
  ["en", "baby's lips are turning blue", "breathing"],
  ["hi", "सांस नहीं आ रही है", "breathing"],
  ["hi", "साँस लेने में बहुत तकलीफ़ है", "breathing"],
  ["hinglish", "saans nahi aa rahi", "breathing"],
  ["hinglish", "saans lene me bahut dikkat ho rahi hai", "breathing"],
  // bleeding
  ["en", "Heavy bleeding that won't stop", "bleeding"],
  ["en", "the bleeding won't stop after the cut", "bleeding"],
  ["en", "she is vomiting blood", "bleeding"],
  ["hi", "बहुत ज़्यादा खून बह रहा है", "bleeding"],
  ["hi", "खून की उल्टी हो रही है", "bleeding"],
  ["hinglish", "bahut khoon beh raha hai", "bleeding"],
  ["hinglish", "khoon ruk nahi raha", "bleeding"],
  // seizure
  ["en", "My son is having a seizure", "seizure"],
  ["en", "convulsions for 5 minutes", "seizure"],
  ["hi", "बच्चे को दौरा पड़ रहा है", "seizure"],
  ["hi", "मिर्गी का अटैक", "seizure"],
  ["hinglish", "usko jhatke aa rahe hain", "seizure"],
  ["hinglish", "mirgi ka daura", "seizure"],
  // anaphylaxis
  ["en", "After peanuts my throat is closing", "anaphylaxis"],
  ["en", "severe allergic reaction, tongue swelling", "anaphylaxis"],
  ["hi", "गला बंद हो रहा है", "anaphylaxis"],
  ["hi", "जीभ सूज गई है", "anaphylaxis"],
  ["hinglish", "gala band ho raha hai", "anaphylaxis"],
  ["hinglish", "gale me sujan aa gayi", "anaphylaxis"],
  // overdose / poisoning
  ["en", "I took too many pills", "overdose"],
  ["en", "my child swallowed bleach", "overdose"],
  ["en", "possible overdose of paracetamol", "overdose"],
  ["hi", "उसने ज़हर खा लिया", "overdose"],
  ["hi", "सारी गोलियां खा ली", "overdose"],
  ["hinglish", "usne zeher kha liya", "overdose"],
  ["hinglish", "saari goliyan kha li", "overdose"],
  // unconscious
  ["en", "She passed out and is unresponsive", "unconscious"],
  ["en", "grandpa won't wake up", "unconscious"],
  ["hi", "पापा बेहोश हो गए", "unconscious"],
  ["hi", "उन्हें होश नहीं आ रहा", "unconscious"],
  ["hinglish", "mummy behosh ho gayi", "unconscious"],
  ["hinglish", "hosh nahi aa raha", "unconscious"],
];

const NEGATIVES: string[] = [
  "chest x-ray report normal",
  "My chest X-ray report is normal",
  "my heart rate is 72",
  "What does my HbA1c of 6.1 mean?",
  "Summarize my labs",
  "What do my latest results mean for my cardiologist health?",
  "I had food poisoning last month, is my liver ok?",
  "How do I prevent heat stroke in summer?",
  "What is a normal stroke volume?",
  "No chest pain, just mild acidity after meals",
  "I don't have chest pain or breathlessness",
  "family history of heart attack, should I check lipids?",
  "no history of seizures",
  "denies fainted episodes",
  "My kidney function eGFR is 88",
  "Is ibuprofen safe with my BP medicine?",
  "seene me dard nahi hai, bas thakaan hai",
  "सीने में दर्द नहीं है",
  "mera sugar level kya hai?",
  "मेरी रिपोर्ट नॉर्मल है क्या?",
  "I cut my finger while cooking, small scratch",
  "this headache is killing me",
  "I don't want to die of heart disease like my uncle",
  "Can I take my tablets after food?",
  "stroke risk factors for diabetics",
  "my breath smells after garlic",
  "",
  "   ",
];

describe("triage: normalisation", () => {
  it("lowercases, strips punctuation/apostrophes and collapses spaces", () => {
    expect(normalizeForTriage("  I CAN'T   breathe!!! ")).toBe("i cant breathe");
  });
  it("strips Devanagari nukta, danda and folds chandrabindu", () => {
    expect(normalizeForTriage("साँस नहीं आ रही। ज़हर")).toBe("सांस नहीं आ रही जहर");
  });
});

describe("triage: positives (en / hi / hinglish)", () => {
  it.each(POSITIVES)("[%s] %s -> %s", (_lang, text, category) => {
    const r = triageMessage(text);
    expect(r.isEmergency).toBe(true);
    expect(r.categories).toContain(category);
  });

  it("covers all 9 categories in all 3 languages", () => {
    const seen = new Set(POSITIVES.map(([lang, , c]) => `${lang}:${c}`));
    const cats: TriageCategory[] = [
      "self_harm", "cardiac", "stroke", "breathing", "bleeding",
      "seizure", "anaphylaxis", "overdose", "unconscious",
    ];
    for (const c of cats) for (const l of ["en", "hi", "hinglish"]) expect(seen.has(`${l}:${c}`)).toBe(true);
  });
});

describe("triage: benign negatives", () => {
  it.each(NEGATIVES.map((t) => [t]))("%j is not an emergency", (text) => {
    const r = triageMessage(text);
    expect(r.isEmergency).toBe(false);
    expect(r.categories).toEqual([]);
  });
});

describe("triage: priority, mental-health line, negation scope", () => {
  it("self-harm wins priority and enables Tele-MANAS", () => {
    const r = triageMessage("chest pain and I want to kill myself");
    expect(r.primary).toBe("self_harm");
    expect(r.showMentalHealthLine).toBe(true);
  });
  it("physical-only emergencies do not show Tele-MANAS", () => {
    expect(triageMessage("I can't breathe").showMentalHealthLine).toBe(false);
  });
  it("self-harm is never suppressed by a negation cue", () => {
    expect(triageMessage("no I am suicidal").categories).toContain("self_harm");
  });
  it("negation scope stops at 'but'", () => {
    expect(triageMessage("no fever but chest pain since morning").categories).toContain("cardiac");
  });
  it("detects a later non-negated occurrence after a negated one", () => {
    expect(triageMessage("no chest pain yesterday, today chest pain is crushing").isEmergency).toBe(true);
  });
  it("bounds very long input", () => {
    const long = "normal ".repeat(5000) + "chest pain";
    expect(triageMessage(long).isEmergency).toBe(false);
  });
});

describe("triage: transcript & helplines", () => {
  it("uses 112 first, 108 backup, Tele-MANAS; never KIRAN", () => {
    expect(EMERGENCY_HELPLINES.national.tel).toBe("tel:112");
    expect(EMERGENCY_HELPLINES.ambulance.tel).toBe("tel:108");
    expect(EMERGENCY_HELPLINES.teleManasShort.tel).toBe("tel:14416");
    expect(EMERGENCY_HELPLINES.teleManasTollFree.tel).toBe("tel:18008914416");
    const t = buildEmergencyTranscript(triageMessage("I want to kill myself"));
    expect(t.indexOf("112")).toBeLessThan(t.indexOf("108"));
    expect(t).toContain("14416");
    expect(t).toContain("1-800-891-4416");
    expect(t.toLowerCase()).not.toContain("kiran");
    expect(t).toMatch(/[\u0900-\u097F]/); // contains Hindi
  });
  it("omits Tele-MANAS for non-mental-health emergencies", () => {
    expect(buildEmergencyTranscript(triageMessage("heart attack"))).not.toContain("14416");
  });
});
