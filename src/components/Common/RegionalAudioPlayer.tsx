import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Globe, Sparkles } from 'lucide-react';
import {
  regionalVoiceService,
  INDIAN_LANGUAGES,
  IndianLanguageOption,
} from '../../services/ai/regionalVoiceService';

interface RegionalAudioPlayerProps {
  textToNarrate: string;
  title?: string;
  className?: string;
}

export const RegionalAudioPlayer: React.FC<RegionalAudioPlayerProps> = ({
  textToNarrate,
  title = 'Clinical Audio Summary',
  className = '',
}) => {
  const [selectedLang, setSelectedLang] = useState<string>('en-IN');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    return () => {
      regionalVoiceService.stop();
    };
  }, []);

  const handlePlayPause = () => {
    if (!textToNarrate) return;

    if (isPlaying && !isPaused) {
      regionalVoiceService.pause();
      setIsPaused(true);
    } else if (isPlaying && isPaused) {
      regionalVoiceService.resume();
      setIsPaused(false);
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      setProgress(0);

      regionalVoiceService.speakText(
        textToNarrate,
        selectedLang,
        playbackRate,
        (pct) => setProgress(pct),
        () => {
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
        },
        () => {
          setIsPlaying(false);
          setIsPaused(false);
        }
      );
    }
  };

  const handleStop = () => {
    regionalVoiceService.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  const handleRateToggle = () => {
    const nextRates = [1.0, 1.25, 1.5];
    const nextIdx = (nextRates.indexOf(playbackRate) + 1) % nextRates.length;
    const newRate = nextRates[nextIdx];
    setPlaybackRate(newRate);
    if (isPlaying) {
      handleStop();
    }
  };

  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === selectedLang) || INDIAN_LANGUAGES[0];

  return (
    <div
      className={`bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-teal-500/30 rounded-3xl p-4 md:p-5 shadow-xl ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              {title}
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-mono text-[10px] font-semibold">
                10+ Languages
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 font-light">
              Narrating in <span className="text-teal-300 font-semibold">{currentLangObj.name} ({currentLangObj.nativeName})</span>
            </p>
          </div>
        </div>

        {/* Language Picker Dropdown */}
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <select
            value={selectedLang}
            onChange={(e) => {
              setSelectedLang(e.target.value);
              if (isPlaying) handleStop();
            }}
            className="bg-slate-950 border border-white/15 text-slate-200 text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:border-teal-400 cursor-pointer"
          >
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} — {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Bar & Progress */}
      <div className="bg-slate-950/80 rounded-2xl p-3 border border-white/10 flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          {isPlaying && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {isPlaying && (
          <button
            onClick={handleStop}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors border border-white/10 shrink-0"
            title="Stop Playback"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{isPlaying ? (isPaused ? 'PAUSED' : 'PLAYING') : 'READY'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Speed Toggle Button */}
        <button
          onClick={handleRateToggle}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-teal-300 transition-colors shrink-0"
          title="Playback Speed"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};
