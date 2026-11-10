import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpecialistLabBookingTrigger from '../SpecialistLabBookingTrigger';

describe('SpecialistLabBookingTrigger', () => {
  it('renders cardiologist cardiac lipid panel and triggers booking callback', () => {
    const handleBook = vi.fn();
    render(
      <SpecialistLabBookingTrigger
        specialistId="cardiologist"
        specialistName="Dr. Anya Patel"
        onBookTest={handleBook}
      />
    );

    expect(screen.getByText('Advanced Cardiac Risk & Apolipoprotein Panel')).toBeDefined();
    expect(screen.getByText('Tata 1mg Diagnostics')).toBeDefined();
    expect(screen.getByText('12-hour overnight fasting required')).toBeDefined();
    expect(screen.getByText('ApoB')).toBeDefined();

    const bookButton = screen.getByRole('button', { name: /Book Home Draw/i });
    expect(bookButton).toBeDefined();

    fireEvent.click(bookButton);
    expect(handleBook).toHaveBeenCalledTimes(1);
    expect(handleBook).toHaveBeenCalledWith(
      'pkg-cardiac-lipid-apob',
      expect.arrayContaining(['ApoB', 'Lipid Profile', 'hs-CRP'])
    );
  });

  it('renders endocrinologist diabetic care panel with correct biomarkers', () => {
    const handleBook = vi.fn();
    render(
      <SpecialistLabBookingTrigger
        specialistId="endocrinologist"
        specialistName="Dr. Rajesh Rao"
        onBookTest={handleBook}
      />
    );

    expect(screen.getByText('Diabetic Glycemic & Renal Microalbumin Panel')).toBeDefined();
    expect(screen.getByText('Thyrocare Technologies')).toBeDefined();
    expect(screen.getByText('8-hour fasting required')).toBeDefined();
    expect(screen.getByText('HbA1c')).toBeDefined();

    const bookButton = screen.getByRole('button', { name: /Book Home Draw/i });
    fireEvent.click(bookButton);
    expect(handleBook).toHaveBeenCalledWith(
      'pkg-diabetes-comprehensive',
      expect.arrayContaining(['HbA1c', 'Glucose Fasting', 'Microalbumin'])
    );
  });

  it('renders nephrologist renal strain panel and fasting advice', () => {
    const handleBook = vi.fn();
    render(
      <SpecialistLabBookingTrigger
        specialistId="nephrologist"
        specialistName="Dr. Meera Iyer"
        onBookTest={handleBook}
      />
    );

    expect(screen.getByText('Renal Function & Microvascular Strain Panel')).toBeDefined();
    expect(screen.getByText('Serum Creatinine')).toBeDefined();
    expect(screen.getByText('eGFR')).toBeDefined();
  });
});
