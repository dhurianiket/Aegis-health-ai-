import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { DecryptedText } from '../DecryptedText';

describe('DecryptedText Component', () => {
  it('renders screen-reader accessible plain text', () => {
    render(<DecryptedText text="Autonomous Clinical Intelligence" />);

    // Screen reader accessible span should always have full exact text
    const srElement = screen.getByText('Autonomous Clinical Intelligence', { selector: '.sr-only' });
    expect(srElement).toBeDefined();
  });

  it('renders visual characters with aria-hidden="true"', () => {
    const { container } = render(<DecryptedText text="Zero-Knowledge Vault" />);

    const ariaHiddenSpan = container.querySelector('span[aria-hidden="true"]');
    expect(ariaHiddenSpan).not.toBeNull();
  });

  it('triggers hover decryption on mouse enter', () => {
    vi.useFakeTimers();
    const { container } = render(
      <DecryptedText text="Verified Diagnostic" animateOn="hover" speed={10} maxIterations={4} />
    );

    const rootSpan = container.firstChild as HTMLElement;
    act(() => {
      fireEvent.mouseEnter(rootSpan);
      vi.advanceTimersByTime(50);
    });

    // Screen reader text remains unchanged
    expect(screen.getByText('Verified Diagnostic', { selector: '.sr-only' })).toBeDefined();

    act(() => {
      fireEvent.mouseLeave(rootSpan);
    });

    vi.useRealTimers();
  });
});
