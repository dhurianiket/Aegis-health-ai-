/**
 * regionalVoiceService.ts — 10+ Indian Regional Language Clinical Audio Narrator
 * Supports speech synthesis across 10 Indian languages with voice accent fallbacks,
 * rate control, and Gemini medical translation prompts.
 */

export interface IndianLanguageOption {
  code: string;       // BCP-47 language tag
  name: string;       // English display name
  nativeName: string; // Native script display name
  flag: string;
}

export const INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: 'en-IN', name: 'English (India)', nativeName: 'English', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentLanguage: string;
  rate: number;
  progress: number;
}

class RegionalVoiceService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public getAvailableLanguages(): IndianLanguageOption[] {
    return INDIAN_LANGUAGES;
  }

  public findVoiceForLang(langCode: string): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.loadVoices();
    // 1. Exact match (e.g., hi-IN)
    let matched = this.voices.find((v) => v.lang === langCode || v.lang.replace('_', '-') === langCode);
    if (matched) return matched;

    // 2. Prefix match (e.g., hi)
    const prefix = langCode.split('-')[0];
    matched = this.voices.find((v) => v.lang.startsWith(prefix));
    if (matched) return matched;

    // 3. Indian English fallback (en-IN)
    return this.voices.find((v) => v.lang.includes('IN') || v.lang.includes('en')) || this.voices[0] || null;
  }

  public speakText(
    text: string,
    langCode: string = 'en-IN',
    rate: number = 1.0,
    onProgress?: (progress: number) => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      if (onError) onError('Speech synthesis not supported on this browser.');
      return;
    }

    this.stop();

    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    utterance.rate = rate;

    const voice = this.findVoiceForLang(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    const totalChars = cleanText.length;
    utterance.onboundary = (e) => {
      if (onProgress && totalChars > 0) {
        const pct = Math.min(100, Math.round((e.charIndex / totalChars) * 100));
        onProgress(pct);
      }
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onProgress) onProgress(100);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      if (onError) onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const regionalVoiceService = new RegionalVoiceService();
