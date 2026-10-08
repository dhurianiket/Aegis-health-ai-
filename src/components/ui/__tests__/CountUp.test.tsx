import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { CountUp } from '../CountUp';

describe('CountUp Component', () => {
  const originalIntersectionObserver = global.IntersectionObserver;

  beforeAll(() => {
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  afterAll(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('renders initial formatted value with decimal precision', () => {
    const { container } = render(<CountUp to={99.4} from={0} decimals={1} />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.textContent).toMatch(/0\.0|99\.4/);
  });

  it('renders with custom separator and integer value', () => {
    const { container } = render(<CountUp to={1000} from={0} separator="," decimals={0} />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.textContent).toMatch(/0|1,000/);
  });
});
