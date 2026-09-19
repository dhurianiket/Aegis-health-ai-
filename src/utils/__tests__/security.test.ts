import { describe, it, expect } from 'vitest';
import { sanitizeHref, isSafeUrl } from '../security';

describe('security.ts — URL Sanitization & XSS Defense', () => {
  it('allows safe HTTPS and HTTP links', () => {
    expect(sanitizeHref('https://example.com')).toBe('https://example.com');
    expect(sanitizeHref('http://example.com/page?query=1')).toBe('http://example.com/page?query=1');
    expect(isSafeUrl('https://example.com')).toBe(true);
  });

  it('allows relative paths and anchors', () => {
    expect(sanitizeHref('/dashboard')).toBe('/dashboard');
    expect(sanitizeHref('#section-1')).toBe('#section-1');
    expect(sanitizeHref('blob:https://example.com/uuid')).toBe('blob:https://example.com/uuid');
    expect(sanitizeHref('mailto:support@aegishealthai.co.in')).toBe('mailto:support@aegishealthai.co.in');
  });

  it('neutralizes javascript: XSS attacks', () => {
    expect(sanitizeHref('javascript:alert(document.cookie)')).toBe('#');
    expect(sanitizeHref('javascript:alert(1)', '/safe-fallback')).toBe('/safe-fallback');
    expect(sanitizeHref('JAVASCRIPT:alert(1)')).toBe('#');
    expect(sanitizeHref('  javascript:void(0)')).toBe('#');
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('neutralizes data: and vbscript: attack vectors', () => {
    expect(sanitizeHref('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(sanitizeHref('vbscript:msgbox(1)')).toBe('#');
    expect(isSafeUrl('data:text/html,...')).toBe(false);
    expect(isSafeUrl('vbscript:...')).toBe(false);
  });

  it('handles null, undefined, and non-string values safely', () => {
    expect(sanitizeHref(null)).toBe('#');
    expect(sanitizeHref(undefined)).toBe('#');
    expect(sanitizeHref('')).toBe('#');
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
  });
});
