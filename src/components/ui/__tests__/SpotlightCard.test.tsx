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

  it('updates opacity on mouseEnter and mouseLeave', () => {
    const { container } = render(
      <SpotlightCard className="test-card">
        <p>Card Content</p>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    const overlay = screen.getByTestId('spotlight-overlay');

    // Initially opacity is 0
    expect(overlay.style.opacity).toBe('0');

    // On mouse enter, opacity transitions to 0.6
    fireEvent.mouseEnter(card);
    expect(overlay.style.opacity).toBe('0.6');

    // On mouse leave, opacity returns to 0
    fireEvent.mouseLeave(card);
    expect(overlay.style.opacity).toBe('0');
  });

  it('updates opacity on focus and blur', () => {
    const { container } = render(
      <SpotlightCard tabIndex={0} role="button">
        <p>Accessible Card</p>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    const overlay = screen.getByTestId('spotlight-overlay');

    fireEvent.focus(card);
    expect(overlay.style.opacity).toBe('0.6');

    fireEvent.blur(card);
    expect(overlay.style.opacity).toBe('0');
  });

  it('handles mouse movements to compute position', () => {
    const { container } = render(
      <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.25)">
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

    fireEvent.mouseMove(card, { clientX: 50, clientY: 60 });
    const overlay = screen.getByTestId('spotlight-overlay');
    expect(overlay.style.background).toContain('circle at 40px 50px');
    expect(overlay.style.background).toContain('rgba(16, 185, 129, 0.25)');
  });
});
