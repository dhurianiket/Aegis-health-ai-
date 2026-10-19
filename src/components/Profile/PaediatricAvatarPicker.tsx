/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kid-friendly Customizable Procedural SVG Avatar Studio for DPDP Paediatric Profiles.
 * Designed under India DPDP Act 2023 Section 9 principles: zero behavioural tracking,
 * reassuring non-clinical visual customization for children and parents.
 * Fully responsive across mobile, tablet, and desktop viewports.
 */

import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import {
  AvatarAccessory,
  AvatarExpression,
  AvatarHairStyle,
  PAEDIATRIC_AVATAR_PRESETS,
  PaediatricAvatarConfig,
  SKIN_TONE_OPTIONS,
  resolveProfileAvatar,
} from '../../data/avatars/avatarPresets';
import { ProceduralAvatar } from '../Avatars/ProceduralAvatar';

interface PaediatricAvatarPickerProps {
  value?: PaediatricAvatarConfig;
  onChange: (next: PaediatricAvatarConfig) => void;
  isMinorProfile?: boolean;
}

const HAIR_OPTIONS: Array<{ id: AvatarHairStyle; label: string }> = [
  { id: 'spiky', label: 'Spiky Explorer' },
  { id: 'curly', label: 'Curly Cloud' },
  { id: 'crown', label: 'Royal Crown' },
  { id: 'bob', label: 'Classic Bob' },
  { id: 'wave', label: 'Ocean Wave' },
  { id: 'bun', label: 'Top Bun' },
];

const ACCESSORY_OPTIONS: Array<{ id: AvatarAccessory; label: string }> = [
  { id: 'star-badge', label: 'Star Badge' },
  { id: 'shield-pin', label: 'Super Shield' },
  { id: 'leaf-pin', label: 'Sprout Pin' },
  { id: 'glasses-round', label: 'Round Glasses' },
  { id: 'headband-aura', label: 'Cyber Halo' },
  { id: 'none', label: 'No Accessory' },
];

const EXPRESSION_OPTIONS: Array<{ id: AvatarExpression; label: string }> = [
  { id: 'happy', label: 'Cheerful' },
  { id: 'celebrating', label: 'Super Star' },
  { id: 'neutral', label: 'Calm' },
  { id: 'listening', label: 'Curious' },
];

export default function PaediatricAvatarPicker({
  value,
  onChange,
  isMinorProfile = true,
}: PaediatricAvatarPickerProps) {
  const currentConfig: PaediatricAvatarConfig = value || {
    presetId: PAEDIATRIC_AVATAR_PRESETS[0].id,
    expression: 'happy',
  };

  const resolvedDef = resolveProfileAvatar(currentConfig, isMinorProfile);

  const handleSelectPreset = (presetId: string) => {
    const preset = PAEDIATRIC_AVATAR_PRESETS.find((p) => p.id === presetId);
    onChange({
      ...currentConfig,
      presetId,
      hairStyle: preset?.geometry.hairStyle,
      accessory: preset?.geometry.accessory,
      expression: preset?.defaultExpression || 'happy',
    });
  };

  return (
    <div
      data-testid="paediatric-avatar-picker"
      className="p-4 sm:p-5 rounded-2xl bg-indigo-950/35 border border-indigo-500/30 space-y-5 shadow-inner"
    >
      {/* Top Preview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/95 border-2 border-indigo-400/50 flex items-center justify-center p-1.5 shrink-0 shadow-lg shadow-indigo-500/10">
            <ProceduralAvatar
              definition={resolvedDef}
              expression={currentConfig.expression}
              size={64}
            />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              {isMinorProfile ? 'Paediatric Health Buddy Studio' : 'Companion Avatar Studio'}
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
              {resolvedDef.name}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {isMinorProfile
                ? 'Kid-friendly procedural SVG companion for reassuring growth & vaccine tracking.'
                : 'Customize a procedural SVG companion avatar for this profile.'}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Character Presets — Responsive 2 -> 3 -> 5 Grid with Full Labels */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-200">
            1. Choose Buddy Character
          </label>
          <span className="text-[11px] text-indigo-300 font-medium">
            {PAEDIATRIC_AVATAR_PRESETS.length} presets
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {PAEDIATRIC_AVATAR_PRESETS.map((preset, idx) => {
            const isSelected = currentConfig.presetId === preset.id;
            const isLastOddOnMobile = idx === PAEDIATRIC_AVATAR_PRESETS.length - 1;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                aria-label={`Select ${preset.name}`}
                aria-pressed={isSelected}
                className={`group relative flex flex-col items-center justify-center gap-2 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isLastOddOnMobile ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/15 ring-1 ring-indigo-400/60'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-950/60 flex items-center justify-center shrink-0">
                  <ProceduralAvatar definition={preset} size={42} showStatusRing={false} />
                </div>
                <span className="text-[11px] font-semibold leading-tight text-center">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Tone Palette & Expression Pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3">
          <label className="block text-xs font-semibold text-slate-200 mb-2">
            2. Tone Palette
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {SKIN_TONE_OPTIONS.map((tone) => {
              const selected = currentConfig.skinToneId === tone.id;
              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => onChange({ ...currentConfig, skinToneId: tone.id })}
                  title={tone.label}
                  aria-label={`Tone ${tone.label}`}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                    selected
                      ? 'border-white scale-110 ring-2 ring-indigo-400 shadow-sm'
                      : 'border-white/25 hover:scale-105'
                  }`}
                  style={{ backgroundColor: tone.skinBase }}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3">
          <label className="block text-xs font-semibold text-slate-200 mb-2">
            3. Expression Mood
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPRESSION_OPTIONS.map((expr) => {
              const isSelected = (currentConfig.expression || 'happy') === expr.id;
              return (
                <button
                  key={expr.id}
                  type="button"
                  onClick={() => onChange({ ...currentConfig, expression: expr.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-950/60 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {expr.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 3: Hair Style & Badge / Accessory Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            4. Hair Style
          </label>
          <select
            aria-label="Avatar Hair Style"
            value={currentConfig.hairStyle || resolvedDef.geometry.hairStyle}
            onChange={(e) =>
              onChange({ ...currentConfig, hairStyle: e.target.value as AvatarHairStyle })
            }
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-indigo-400"
          >
            {HAIR_OPTIONS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            5. Badge / Accessory
          </label>
          <select
            aria-label="Avatar Accessory"
            value={currentConfig.accessory || resolvedDef.geometry.accessory}
            onChange={(e) =>
              onChange({ ...currentConfig, accessory: e.target.value as AvatarAccessory })
            }
            className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-indigo-400"
          >
            {ACCESSORY_OPTIONS.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
