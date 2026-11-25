/**
 * regionalVoiceService.ts — 10+ Indian Regional Language Clinical Audio Narrator
 * Uses Google Cloud Text-to-Speech (Chirp 3 HD / Neural2) via Cloudflare Edge when signed in,
 * with automatic fallback to browser SpeechSynthesis for offline / Guest Demo mode.
 */
import { getAuthToken } from '../../lib/authTokenProvider';
import { getEdgeApiBaseUrl } from '../../lib/geminiClient';

export type AudioPlaybackSource = 'cloud' | 'browser';

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
  private currentAudio: HTMLAudioElement | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private playbackEpoch = 0;

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
    let matched = this.voices.find((v) => v.lang === langCode || v.lang.replace('_', '-') === langCode);
    if (matched) return matched;

    const prefix = langCode.split('-')[0];
    matched = this.voices.find((v) => v.lang.startsWith(prefix));
    if (matched) return matched;

    return this.voices.find((v) => v.lang.includes('IN') || v.lang.includes('en')) || this.voices[0] || null;
  }

  public async synthesizeCloudSpeech(
    text: string,
    langCode: string = 'en-IN',
    rate: number = 1.0,
    fetchImpl: typeof fetch = fetch,
    baseUrlOverride?: string,
  ): Promise<string> {
    const cleanText = text.replace(/[*_#`~]/g, '').trim().slice(0, 3000);
    if (!cleanText) {
      throw new Error('Speech text must not be empty.');
    }
    const token = (await getAuthToken())?.trim() || '';
    if (!token) {
      throw new Error('Authentication required for Cloud HD audio.');
    }

    const baseUrl = (baseUrlOverride || getEdgeApiBaseUrl()).replace(/\/$/, '');
    const res = await fetchImpl(`${baseUrl}/api/audio/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: cleanText,
        languageCode: langCode,
        speakingRate: rate,
      }),
    });

    if (!res.ok) {
      throw new Error(`Cloud TTS returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as { audioContent?: unknown };
    if (typeof data.audioContent !== 'string' || !data.audioContent) {
      throw new Error('Cloud TTS response missing audioContent');
    }
    return data.audioContent;
  }

  private speakWithBrowserSpeech(
    cleanText: string,
    langCode: string,
    rate: number,
    onProgress?: (progress: number) => void,
    onEnd?: () => void,
    onError?: (err: any) => void,
    onSourceChange?: (source: AudioPlaybackSource) => void,
  ) {
    if (!this.synth) {
      if (onError) onError('Speech synthesis not supported on this browser.');
      return;
    }

    onSourceChange?.('browser');
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

  public speakText(
    text: string,
    langCode: string = 'en-IN',
    rate: number = 1.0,
    onProgress?: (progress: number) => void,
    onEnd?: () => void,
    onError?: (err: any) => void,
    onSourceChange?: (source: AudioPlaybackSource) => void,
  ) {
    this.stop();

    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) return;

    const myEpoch = ++this.playbackEpoch;

    void (async () => {
      try {
        if (typeof Audio !== 'undefined') {
          const token = (await getAuthToken())?.trim() || '';
          if (myEpoch !== this.playbackEpoch) return;

          if (token) {
            const audioB64 = await this.synthesizeCloudSpeech(cleanText, langCode, rate);
            if (myEpoch !== this.playbackEpoch) return;

            const audio = new Audio(`data:audio/mp3;base64,${audioB64}`);
            audio.playbackRate = rate;
            this.currentAudio = audio;
            onSourceChange?.('cloud');

            audio.ontimeupdate = () => {
              if (onProgress && audio.duration > 0 && Number.isFinite(audio.duration)) {
                const pct = Math.min(100, Math.round((audio.currentTime / audio.duration) * 100));
                onProgress(pct);
              }
            };
            audio.onended = () => {
              if (this.currentAudio === audio) this.currentAudio = null;
              if (onProgress) onProgress(100);
              if (onEnd) onEnd();
            };
            audio.onerror = () => {
              if (this.currentAudio === audio) this.currentAudio = null;
              if (myEpoch === this.playbackEpoch) {
                this.speakWithBrowserSpeech(cleanText, langCode, rate, onProgress, onEnd, onError, onSourceChange);
              }
            };

            await audio.play();
            return;
          }
        }
      } catch (cloudErr) {
        if (myEpoch !== this.playbackEpoch) return;
        console.warn('[Voice] Cloud TTS unavailable, falling back to browser SpeechSynthesis:', cloudErr);
      }

      if (myEpoch === this.playbackEpoch) {
        this.speakWithBrowserSpeech(cleanText, langCode, rate, onProgress, onEnd, onError, onSourceChange);
      }
    })();
  }

  public pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      void this.currentAudio.play();
    }
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    this.playbackEpoch += 1;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    const cloudActive = !!(this.currentAudio && !this.currentAudio.paused && !this.currentAudio.ended);
    return cloudActive || !!(this.synth && this.synth.speaking);
  }
}

export const regionalVoiceService = new RegionalVoiceService();
