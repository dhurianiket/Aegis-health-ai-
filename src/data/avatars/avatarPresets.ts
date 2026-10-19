/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clean-room procedural 2D/3D-inspired SVG avatar definitions for Aegis Health AI.
 * Zero external copyleft dependencies — pure TypeScript data definitions rendered
 * via Aegis's native SVG interpolation engine.
 */

import { SpecialistId } from '../../types/ai';

export type AvatarExpression =
  | 'neutral'
  | 'happy'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'concerned'
  | 'celebrating';

export type AvatarAnimationState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'concerned'
  | 'celebrating';

export type AvatarHeadShape = 'rounded' | 'oval' | 'soft-square' | 'heart' | 'chibi';

export type AvatarHairStyle =
  | 'wave'
  | 'crown'
  | 'short-neat'
  | 'parted'
  | 'curly'
  | 'bun'
  | 'headwrap'
  | 'spiky'
  | 'bob'
  | 'sage';

export type AvatarAccessory =
  | 'none'
  | 'glasses-round'
  | 'glasses-modern'
  | 'headband-aura'
  | 'stethoscope-collar'
  | 'neural-halo'
  | 'star-badge'
  | 'leaf-pin'
  | 'heart-pin'
  | 'shield-pin';

export type AvatarEyeStyle = 'gentle' | 'bright' | 'wise' | 'cheerful';

export interface AvatarPalette {
  bgGradientStart: string;
  bgGradientEnd: string;
  skinBase: string;
  skinShadow: string;
  hairColor: string;
  accentColor: string;
  clothingColor: string;
  glowColor: string;
}

export interface AvatarGeometry {
  headShape: AvatarHeadShape;
  hairStyle: AvatarHairStyle;
  accessory: AvatarAccessory;
  eyeStyle: AvatarEyeStyle;
}

export interface ProceduralAvatarDefinition {
  id: string;
  name: string;
  subtitle?: string;
  category: 'coach' | 'specialist' | 'paediatric';
  palette: AvatarPalette;
  geometry: AvatarGeometry;
  defaultExpression: AvatarExpression;
}

export interface PaediatricAvatarConfig {
  presetId: string;
  hairStyle?: AvatarHairStyle;
  accessory?: AvatarAccessory;
  accentColor?: string;
  skinToneId?: string;
  expression?: AvatarExpression;
}

export const SKIN_TONE_OPTIONS: Array<{
  id: string;
  label: string;
  skinBase: string;
  skinShadow: string;
}> = [
  { id: 'warm-amber', label: 'Warm Amber', skinBase: '#E0A97E', skinShadow: '#C28558' },
  { id: 'golden-honey', label: 'Golden Honey', skinBase: '#C98A5B', skinShadow: '#A5693D' },
  { id: 'rich-espresso', label: 'Rich Espresso', skinBase: '#8D5534', skinShadow: '#6A3B1F' },
  { id: 'soft-peach', label: 'Soft Peach', skinBase: '#F3C6A5', skinShadow: '#D8A17C' },
  { id: 'radiant-bronze', label: 'Radiant Bronze', skinBase: '#B07248', skinShadow: '#8B522C' },
  { id: 'sky-bot', label: 'Friendly Bot Cyan', skinBase: '#A5F3FC', skinShadow: '#38BDF8' },
];

/**
 * Aura AI Health Coach — Primary Companion Avatar Definition
 */
export const AURA_AVATAR_DEFINITION: ProceduralAvatarDefinition = {
  id: 'aura',
  name: 'Aura AI',
  subtitle: 'Clinical Health Companion',
  category: 'coach',
  palette: {
    bgGradientStart: '#0F172A',
    bgGradientEnd: '#1E1B4B',
    skinBase: '#E8B896',
    skinShadow: '#C7926E',
    hairColor: '#312E81',
    accentColor: '#14B8A6',
    clothingColor: '#4F46E5',
    glowColor: '#2DD4BF',
  },
  geometry: {
    headShape: 'oval',
    hairStyle: 'wave',
    accessory: 'headband-aura',
    eyeStyle: 'bright',
  },
  defaultExpression: 'neutral',
};

/**
 * 10 Specialist Lounge AI Health Information Guide Avatars
 */
export const SPECIALIST_AVATARS: Record<SpecialistId, ProceduralAvatarDefinition> = {
  cardiologist: {
    id: 'cardiologist',
    name: 'Heart Health Guide (AI)',
    subtitle: 'Cardiology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#1F1224',
      bgGradientEnd: '#3B0A2A',
      skinBase: '#DDA37A',
      skinShadow: '#BA7D54',
      hairColor: '#1E293B',
      accentColor: '#F43F5E',
      clothingColor: '#881337',
      glowColor: '#FB7185',
    },
    geometry: {
      headShape: 'rounded',
      hairStyle: 'parted',
      accessory: 'heart-pin',
      eyeStyle: 'gentle',
    },
    defaultExpression: 'neutral',
  },
  endocrinologist: {
    id: 'endocrinologist',
    name: 'Diabetes & Thyroid Guide (AI)',
    subtitle: 'Endocrinology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#1C1917',
      bgGradientEnd: '#3B2510',
      skinBase: '#C98A5B',
      skinShadow: '#A5693D',
      hairColor: '#27272A',
      accentColor: '#F59E0B',
      clothingColor: '#78350F',
      glowColor: '#FBBF24',
    },
    geometry: {
      headShape: 'oval',
      hairStyle: 'bun',
      accessory: 'glasses-modern',
      eyeStyle: 'wise',
    },
    defaultExpression: 'neutral',
  },
  neurologist: {
    id: 'neurologist',
    name: 'Brain & Nerve Health Guide (AI)',
    subtitle: 'Neurology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#0F172A',
      bgGradientEnd: '#2E1065',
      skinBase: '#E5B591',
      skinShadow: '#C38E68',
      hairColor: '#311042',
      accentColor: '#A855F7',
      clothingColor: '#4C1D95',
      glowColor: '#C084FC',
    },
    geometry: {
      headShape: 'oval',
      hairStyle: 'short-neat',
      accessory: 'neural-halo',
      eyeStyle: 'wise',
    },
    defaultExpression: 'neutral',
  },
  gastroenterologist: {
    id: 'gastroenterologist',
    name: 'Digestive & Liver Health Guide (AI)',
    subtitle: 'Gastroenterology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#062019',
      bgGradientEnd: '#064E3B',
      skinBase: '#D4986A',
      skinShadow: '#B07448',
      hairColor: '#1E293B',
      accentColor: '#10B981',
      clothingColor: '#065F46',
      glowColor: '#34D399',
    },
    geometry: {
      headShape: 'rounded',
      hairStyle: 'curly',
      accessory: 'leaf-pin',
      eyeStyle: 'gentle',
    },
    defaultExpression: 'neutral',
  },
  pulmonologist: {
    id: 'pulmonologist',
    name: 'Lung & Breathing Guide (AI)',
    subtitle: 'Pulmonology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#082F49',
      bgGradientEnd: '#0369A1',
      skinBase: '#EAB897',
      skinShadow: '#C79270',
      hairColor: '#0F172A',
      accentColor: '#38BDF8',
      clothingColor: '#0284C7',
      glowColor: '#7DD3FC',
    },
    geometry: {
      headShape: 'soft-square',
      hairStyle: 'wave',
      accessory: 'stethoscope-collar',
      eyeStyle: 'bright',
    },
    defaultExpression: 'neutral',
  },
  nephrologist: {
    id: 'nephrologist',
    name: 'Kidney Health Guide (AI)',
    subtitle: 'Nephrology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#0F172A',
      bgGradientEnd: '#1E3A8A',
      skinBase: '#B97A50',
      skinShadow: '#935932',
      hairColor: '#18181B',
      accentColor: '#3B82F6',
      clothingColor: '#1D4ED8',
      glowColor: '#60A5FA',
    },
    geometry: {
      headShape: 'rounded',
      hairStyle: 'sage',
      accessory: 'glasses-round',
      eyeStyle: 'wise',
    },
    defaultExpression: 'neutral',
  },
  psychiatrist: {
    id: 'psychiatrist',
    name: 'Mental Wellbeing Guide (AI)',
    subtitle: 'Psychiatry & Wellbeing Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#1E1B4B',
      bgGradientEnd: '#3730A3',
      skinBase: '#DFAA82',
      skinShadow: '#BC845B',
      hairColor: '#2E1065',
      accentColor: '#818CF8',
      clothingColor: '#4338CA',
      glowColor: '#A5B4FC',
    },
    geometry: {
      headShape: 'heart',
      hairStyle: 'headwrap',
      accessory: 'none',
      eyeStyle: 'gentle',
    },
    defaultExpression: 'happy',
  },
  dermatologist: {
    id: 'dermatologist',
    name: 'Skin Health Guide (AI)',
    subtitle: 'Dermatology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#27171C',
      bgGradientEnd: '#4C1D2E',
      skinBase: '#E9B998',
      skinShadow: '#C7926E',
      hairColor: '#3F1D2B',
      accentColor: '#EC4899',
      clothingColor: '#9D174D',
      glowColor: '#F472B6',
    },
    geometry: {
      headShape: 'oval',
      hairStyle: 'bob',
      accessory: 'star-badge',
      eyeStyle: 'bright',
    },
    defaultExpression: 'neutral',
  },
  orthopedist: {
    id: 'orthopedist',
    name: 'Bone & Joint Health Guide (AI)',
    subtitle: 'Orthopedics Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#0F172A',
      bgGradientEnd: '#1E293B',
      skinBase: '#CD8E62',
      skinShadow: '#A66A40',
      hairColor: '#0F172A',
      accentColor: '#06B6D4',
      clothingColor: '#0E7490',
      glowColor: '#22D3EE',
    },
    geometry: {
      headShape: 'soft-square',
      hairStyle: 'short-neat',
      accessory: 'shield-pin',
      eyeStyle: 'bright',
    },
    defaultExpression: 'neutral',
  },
  oncologist: {
    id: 'oncologist',
    name: 'Cancer Care Information Guide (AI)',
    subtitle: 'Oncology Information Guide',
    category: 'specialist',
    palette: {
      bgGradientStart: '#1E1B2E',
      bgGradientEnd: '#3B2F63',
      skinBase: '#E2AC84',
      skinShadow: '#BF8760',
      hairColor: '#27272A',
      accentColor: '#FBBF24',
      clothingColor: '#5B21B6',
      glowColor: '#FDE047',
    },
    geometry: {
      headShape: 'rounded',
      hairStyle: 'crown',
      accessory: 'star-badge',
      eyeStyle: 'gentle',
    },
    defaultExpression: 'neutral',
  },
};

/**
 * Kid-friendly customizable avatars for DPDP Paediatric Profiles (Section 9 compliant,
 * zero behavioural tracking, reassuring non-clinical visual design).
 */
export const PAEDIATRIC_AVATAR_PRESETS: ProceduralAvatarDefinition[] = [
  {
    id: 'astro-cub',
    name: 'Astro Explorer',
    subtitle: 'Brave Space Health Buddy',
    category: 'paediatric',
    palette: {
      bgGradientStart: '#1E1B4B',
      bgGradientEnd: '#312E81',
      skinBase: '#E0A97E',
      skinShadow: '#C28558',
      hairColor: '#1E1B4B',
      accentColor: '#38BDF8',
      clothingColor: '#4F46E5',
      glowColor: '#7DD3FC',
    },
    geometry: {
      headShape: 'chibi',
      hairStyle: 'spiky',
      accessory: 'star-badge',
      eyeStyle: 'cheerful',
    },
    defaultExpression: 'happy',
  },
  {
    id: 'sprout-buddy',
    name: 'Sprout Ranger',
    subtitle: 'Nature & Growth Champion',
    category: 'paediatric',
    palette: {
      bgGradientStart: '#064E3B',
      bgGradientEnd: '#047857',
      skinBase: '#C98A5B',
      skinShadow: '#A5693D',
      hairColor: '#1F2937',
      accentColor: '#34D399',
      clothingColor: '#059669',
      glowColor: '#6EE7B7',
    },
    geometry: {
      headShape: 'chibi',
      hairStyle: 'curly',
      accessory: 'leaf-pin',
      eyeStyle: 'cheerful',
    },
    defaultExpression: 'happy',
  },
  {
    id: 'sunshine-hero',
    name: 'Sunshine Hero',
    subtitle: 'Super Shield Protector',
    category: 'paediatric',
    palette: {
      bgGradientStart: '#451A03',
      bgGradientEnd: '#78350F',
      skinBase: '#F3C6A5',
      skinShadow: '#D8A17C',
      hairColor: '#451A03',
      accentColor: '#FBBF24',
      clothingColor: '#D97706',
      glowColor: '#FDE047',
    },
    geometry: {
      headShape: 'chibi',
      hairStyle: 'crown',
      accessory: 'shield-pin',
      eyeStyle: 'cheerful',
    },
    defaultExpression: 'celebrating',
  },
  {
    id: 'wonder-scholar',
    name: 'Wonder Scholar',
    subtitle: 'Curious Science Whiz',
    category: 'paediatric',
    palette: {
      bgGradientStart: '#2E1065',
      bgGradientEnd: '#4C1D95',
      skinBase: '#B07248',
      skinShadow: '#8B522C',
      hairColor: '#1E1B4B',
      accentColor: '#F472B6',
      clothingColor: '#7C3AED',
      glowColor: '#F9A8D4',
    },
    geometry: {
      headShape: 'chibi',
      hairStyle: 'bob',
      accessory: 'glasses-round',
      eyeStyle: 'bright',
    },
    defaultExpression: 'happy',
  },
  {
    id: 'aqua-spark',
    name: 'Aqua Bot',
    subtitle: 'Friendly Cyber Companion',
    category: 'paediatric',
    palette: {
      bgGradientStart: '#083344',
      bgGradientEnd: '#155E75',
      skinBase: '#A5F3FC',
      skinShadow: '#38BDF8',
      hairColor: '#0284C7',
      accentColor: '#22D3EE',
      clothingColor: '#0369A1',
      glowColor: '#67E8F9',
    },
    geometry: {
      headShape: 'chibi',
      hairStyle: 'wave',
      accessory: 'headband-aura',
      eyeStyle: 'cheerful',
    },
    defaultExpression: 'happy',
  },
];

/**
 * Resolves a custom PaediatricAvatarConfig into a complete ProceduralAvatarDefinition.
 */
export function resolveProfileAvatar(
  config?: PaediatricAvatarConfig,
  fallbackIsMinor = false
): ProceduralAvatarDefinition {
  const defaultPreset = fallbackIsMinor
    ? PAEDIATRIC_AVATAR_PRESETS[0]
    : AURA_AVATAR_DEFINITION;

  if (!config) return defaultPreset;

  const basePreset =
    PAEDIATRIC_AVATAR_PRESETS.find((p) => p.id === config.presetId) ||
    Object.values(SPECIALIST_AVATARS).find((p) => p.id === config.presetId) ||
    defaultPreset;

  const skinOption = config.skinToneId
    ? SKIN_TONE_OPTIONS.find((s) => s.id === config.skinToneId)
    : undefined;

  return {
    ...basePreset,
    palette: {
      ...basePreset.palette,
      ...(skinOption
        ? { skinBase: skinOption.skinBase, skinShadow: skinOption.skinShadow }
        : {}),
      ...(config.accentColor
        ? {
            accentColor: config.accentColor,
            glowColor: config.accentColor,
          }
        : {}),
    },
    geometry: {
      ...basePreset.geometry,
      ...(config.hairStyle ? { hairStyle: config.hairStyle } : {}),
      ...(config.accessory ? { accessory: config.accessory } : {}),
    },
    defaultExpression: config.expression || basePreset.defaultExpression,
  };
}
