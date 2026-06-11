import { describe, it, expect } from 'vitest';
import { isDuplicateClass } from '../medicationInteractionDB';

describe('isDuplicateClass', () => {
  it('should return true when both medications are statins', () => {
    expect(isDuplicateClass('atorvastatin', 'simvastatin')).toBe(true);
  });

  it('should return true when both medications are NSAIDs', () => {
    expect(isDuplicateClass('ibuprofen', 'naproxen')).toBe(true);
  });

  it('should be case-insensitive for statins', () => {
    expect(isDuplicateClass('Atorvastatin', 'SIMVASTATIN')).toBe(true);
  });

  it('should be case-insensitive for NSAIDs', () => {
    expect(isDuplicateClass('Ibuprofen', 'NAPROXEN')).toBe(true);
  });

  it('should return false when one is a statin and the other is an NSAID', () => {
    expect(isDuplicateClass('atorvastatin', 'ibuprofen')).toBe(false);
  });

  it('should return false when medications are from neither class', () => {
    expect(isDuplicateClass('tylenol', 'aspirin')).toBe(false);
  });

  it('should return false when one medication is in a class and the other is not', () => {
    expect(isDuplicateClass('atorvastatin', 'tylenol')).toBe(false);
    expect(isDuplicateClass('ibuprofen', 'tylenol')).toBe(false);
  });

  it('should handle exact same medication if in a tracked class', () => {
    expect(isDuplicateClass('atorvastatin', 'atorvastatin')).toBe(true);
    expect(isDuplicateClass('ibuprofen', 'ibuprofen')).toBe(true);
  });
});
