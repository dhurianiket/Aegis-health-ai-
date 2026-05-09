/**
 * VoiceService - Wrapper for the Web Speech API (SpeechRecognition).
 * Handles voice-to-text transcription for health queries.
 */

export interface VoiceServiceOptions {
  onResult: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  language?: string;
}

export class VoiceService {
  private recognition: any;
  private isListening: boolean = false;

  constructor(options: VoiceServiceOptions) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      options.onError?.("Speech recognition is not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = options.language || 'en-US';

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      options.onResult(text);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      options.onEnd?.();
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      options.onError?.(event.error);
    };
  }

  start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.error("Speech recognition start error:", e);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
