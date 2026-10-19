import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  ProceduralAvatar,
  AuraCompanion,
  type AvatarController,
} from '../ProceduralAvatar';
import {
  AURA_AVATAR_DEFINITION,
  PAEDIATRIC_AVATAR_PRESETS,
  SPECIALIST_AVATARS,
  resolveProfileAvatar,
} from '../../../data/avatars/avatarPresets';
import PaediatricAvatarPicker from '../../Profile/PaediatricAvatarPicker';
import AuraCursorGuide from '../AuraCursorGuide';
import { SpecialistId } from '../../../types/ai';

describe('Clean-Room Procedural SVG Avatar System', () => {
  it('renders AuraCompanion with state-driven expressions (idle, listening, thinking, speaking, concerned)', () => {
    const { rerender } = render(<AuraCompanion />);
    const svg = screen.getByTestId('procedural-avatar-aura');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('data-avatar-state')).toBe('idle');

    rerender(<AuraCompanion isListening />);
    expect(svg.getAttribute('data-avatar-state')).toBe('listening');
    expect(svg.getAttribute('data-avatar-expression')).toBe('listening');

    rerender(<AuraCompanion isGenerating />);
    expect(svg.getAttribute('data-avatar-state')).toBe('thinking');
    expect(svg.getAttribute('data-avatar-expression')).toBe('thinking');

    rerender(<AuraCompanion isSpeaking />);
    expect(svg.getAttribute('data-avatar-state')).toBe('speaking');
    expect(svg.getAttribute('data-avatar-expression')).toBe('speaking');

    rerender(<AuraCompanion hasTriageAlert isListening />);
    expect(svg.getAttribute('data-avatar-state')).toBe('concerned');
    expect(svg.getAttribute('data-avatar-expression')).toBe('concerned');
  });

  it('supports imperative AvatarController ref (play, setExpression, and 2.5D lookAt gaze vector)', () => {
    const controllerRef = createRef<AvatarController>();
    render(<ProceduralAvatar ref={controllerRef} definition={AURA_AVATAR_DEFINITION} gesture="explain" />);
    const svg = screen.getByTestId('procedural-avatar-aura');

    act(() => {
      controllerRef.current?.play('speaking');
    });
    expect(svg.getAttribute('data-avatar-state')).toBe('speaking');

    act(() => {
      controllerRef.current?.setExpression('concerned');
    });
    expect(svg.getAttribute('data-avatar-expression')).toBe('concerned');

    act(() => {
      controllerRef.current?.lookAt(0.75, -0.5);
    });
    expect(svg.getAttribute('data-avatar-gaze')).toBe('0.75,-0.5');
  });

  it('defines and renders all 10 Specialist Lounge AI health guide personas', () => {
    const specialistIds = Object.keys(SPECIALIST_AVATARS) as SpecialistId[];
    expect(specialistIds).toHaveLength(10);

    for (const id of specialistIds) {
      const { unmount } = render(<ProceduralAvatar specialistId={id} state="idle" />);
      const el = screen.getByTestId(`procedural-avatar-${id}`);
      expect(el).toBeTruthy();
      expect(SPECIALIST_AVATARS[id].name).toContain('(AI)');
      unmount();
    }
  });

  it('resolves and customizes DPDP Paediatric Profile avatars via PaediatricAvatarPicker', () => {
    const onChange = vi.fn();
    render(
      <PaediatricAvatarPicker
        value={{ presetId: 'astro-cub', expression: 'happy' }}
        onChange={onChange}
        isMinorProfile={true}
      />
    );

    expect(screen.getByTestId('paediatric-avatar-picker')).toBeTruthy();
    const sproutBtn = screen.getByRole('button', { name: /Select Sprout Ranger/i });
    fireEvent.click(sproutBtn);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        presetId: 'sprout-buddy',
        hairStyle: 'curly',
        accessory: 'leaf-pin',
      })
    );

    const resolved = resolveProfileAvatar(
      {
        presetId: 'sprout-buddy',
        skinToneId: 'rich-espresso',
        hairStyle: 'crown',
        accessory: 'shield-pin',
        expression: 'celebrating',
      },
      true
    );
    expect(resolved.id).toBe('sprout-buddy');
    expect(resolved.geometry.hairStyle).toBe('crown');
    expect(resolved.geometry.accessory).toBe('shield-pin');
    expect(resolved.defaultExpression).toBe('celebrating');
    expect(PAEDIATRIC_AVATAR_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('explains hovered UI controls and steps through the guided tour in AuraCursorGuide', () => {
    const onNavigateTab = vi.fn();
    render(
      <div>
        <button aria-label="Edit Profile">Edit</button>
        <AuraCursorGuide activeTab="profile" onNavigateTab={onNavigateTab} />
      </div>
    );

    expect(screen.getByTestId('aura-cursor-guide')).toBeTruthy();
    expect(screen.getByTestId('aura-guide-title').textContent).toContain('Profile & Paediatric Buddy Studio');

    const editBtn = screen.getByRole('button', { name: 'Edit Profile' });
    fireEvent.pointerOver(editBtn);

    expect(screen.getByTestId('aura-guide-title').textContent).toContain('Edit Profile & Avatar Studio');
    expect(screen.getByTestId('aura-guide-action').textContent).toContain('customize the 2.5D SVG character');

    const nextTourBtn = screen.getByTestId('aura-guide-next-tour');
    fireEvent.click(nextTourBtn);
    expect(onNavigateTab).toHaveBeenCalledWith('upload');
  });
});
