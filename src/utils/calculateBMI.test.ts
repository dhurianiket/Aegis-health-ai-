import { describe, it, expect } from 'vitest';
import { calculateBMI } from './calculateBMI';

describe('calculateBMI', () => {
  it('should calculate BMI correctly for normal values', () => {
    // 75kg / (1.8m)^2 = 23.148... -> 23.1
    expect(calculateBMI(180, 75)).toBe(23.1);

    // 60kg / (1.6m)^2 = 23.4375 -> 23.4
    expect(calculateBMI(160, 60)).toBe(23.4);

    // 65kg / (1.7m)^2 = 22.491... -> 22.5
    expect(calculateBMI(170, 65)).toBe(22.5);
  });

  it('should return null when height or weight is missing', () => {
    expect(calculateBMI()).toBeNull();
    expect(calculateBMI(180)).toBeNull();
    expect(calculateBMI(undefined, 75)).toBeNull();
  });

  it('should return null when height or weight is zero', () => {
    expect(calculateBMI(0, 75)).toBeNull();
    expect(calculateBMI(180, 0)).toBeNull();
    expect(calculateBMI(0, 0)).toBeNull();
  });

  it('should return null when height or weight is negative', () => {
    expect(calculateBMI(-180, 75)).toBeNull();
    expect(calculateBMI(180, -75)).toBeNull();
    expect(calculateBMI(-180, -75)).toBeNull();
  });
});
