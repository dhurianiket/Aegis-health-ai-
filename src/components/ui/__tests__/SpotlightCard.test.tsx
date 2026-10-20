import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SpotlightCard } from '../SpotlightCard';

describe('SpotlightCard Component', () => {
  it('renders children properly', () => {
    render(
      <SpotlightCard>
        <span data-testid="child">Medical Telemetry</span>
      </SpotlightCard>
    );

    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByText('Medical Telemetry')).toBeDefined();
  });

  it('applies default classes and container query classes when enabled', () => {
    const { container, rerender } = render(
      <SpotlightCard className="test-card">
        <p>Card Content</p>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.classList.contains('aegis-spotlight-card')).toBe(true);
    expect(card.classList.contains('test-card')).toBe(true);

    rerender(
      <SpotlightCard enableContainerQuery>
        <p>Card Content</p>
      </SpotlightCard>
    );
    expect((container.firstChild as HTMLElement).classList.contains('bento-card-container')).toBe(true);
  });

  it('updates CSS variables on pointer move', () => {
    const onPointerMoveMock = vi.fn();
    const { container } = render(
      <SpotlightCard
        spotlightColor="rgba(16, 185, 129, 0.25)"
        onPointerMove={onPointerMoveMock}
      >
        <p>Hover test</p>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 10,
      right: 110,
      bottom: 110,
      width: 100,
      height: 100,
      x: 10,
      y: 10,
      toJSON: () => {},
    });

    fireEvent.pointerMove(card, { clientX: 50, clientY: 60 });

    expect(card.style.getPropertyValue('--mouse-x')).toBe('40px');
    expect(card.style.getPropertyValue('--mouse-y')).toBe('50px');
    expect(card.style.getPropertyValue('--spotlight-color')).toBe('rgba(16, 185, 129, 0.25)');
    expect(onPointerMoveMock).toHaveBeenCalled();
  });

  it('uses accentColor for default spotlight color if none specified', () => {
    const { container } = render(
      <SpotlightCard accentColor="rose">
        <p>Rose card</p>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.pointerMove(card, { clientX: 20, clientY: 30 });
    expect(card.style.getPropertyValue('--spotlight-color')).toBe('rgba(251, 113, 133, 0.16)');
  });
});
