import { describe, it, expect } from 'vitest';
import {
  getAvailableLabPackages,
  findRecommendedPackagesForBiomarkers,
  checkPincodeServiceability,
  createLabBooking,
  LAB_PACKAGES_CATALOG,
  LAB_PARTNERS,
} from '../labBookingService';

describe('Aegis Diagnostic Partner & Lab Booking Service', () => {
  it('should list all available lab packages in catalog', () => {
    const all = getAvailableLabPackages();
    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(all.some((p) => p.code === 'AAROGYAM_C')).toBe(true);
  });

  it('should filter packages by partner ID correctly', () => {
    const thyrocarePkgs = getAvailableLabPackages({ partnerId: 'thyrocare' });
    expect(thyrocarePkgs.every((p) => p.partnerId === 'thyrocare')).toBe(true);
    expect(thyrocarePkgs.length).toBeGreaterThanOrEqual(3);

    const tata1mgPkgs = getAvailableLabPackages({ partnerId: 'tata_1mg' });
    expect(tata1mgPkgs.every((p) => p.partnerId === 'tata_1mg')).toBe(true);
  });

  it('should filter packages by clinical category', () => {
    const preventive = getAvailableLabPackages({ category: 'preventive' });
    expect(preventive.every((p) => p.category === 'preventive')).toBe(true);
  });

  it('should recommend packages matching abnormal biomarkers', () => {
    const diabetesRecs = findRecommendedPackagesForBiomarkers(['HbA1c', 'Glucose Fasting']);
    expect(diabetesRecs.length).toBeGreaterThan(0);
    // Should prioritize diabetic or full-body packages covering HbA1c
    expect(diabetesRecs[0].biomarkersCovered).toContain('HbA1c');

    const cardiacRecs = findRecommendedPackagesForBiomarkers(['ApoB', 'LDL', 'Total Cholesterol']);
    expect(cardiacRecs.length).toBeGreaterThan(0);
    expect(cardiacRecs.some((p) => p.biomarkersCovered.includes('ApoB'))).toBe(true);
  });

  it('should validate Indian 6-digit postal pincodes', () => {
    // Valid Mumbai metro pincode (400001)
    const mumbai = checkPincodeServiceability('400001');
    expect(mumbai.serviceable).toBe(true);
    expect(mumbai.partner).toBe('tata_1mg');

    // Valid Non-metro tier 2/3 pincode (e.g. Nagpur / Maharashtra 440001)
    const nagpur = checkPincodeServiceability('440001');
    expect(nagpur.serviceable).toBe(true);
    expect(nagpur.partner).toBe('thyrocare');

    // Invalid format (too short)
    const invalidShort = checkPincodeServiceability('123');
    expect(invalidShort.serviceable).toBe(false);
    expect(invalidShort.message).toContain('6-digit');

    // Out-of-bounds postal zone (e.g., 999999)
    const invalidZone = checkPincodeServiceability('999999');
    expect(invalidZone.serviceable).toBe(false);
  });

  it('should create an authorized lab booking with correct fee calculations', async () => {
    const pkg = LAB_PACKAGES_CATALOG.find((p) => p.code === 'AAROGYAM_C')!;
    const confirmation = await createLabBooking({
      packageId: pkg.id,
      patientName: 'Aniket Dhuri',
      age: 29,
      gender: 'male',
      phone: '8591330257',
      email: 'aniket@aegishealthai.co.in',
      address: 'Powai, Mumbai',
      pincode: '400076',
      preferredDate: '2026-11-12',
      preferredSlot: '07:00 AM - 07:30 AM',
    });

    expect(confirmation.success).toBe(true);
    expect(confirmation.bookingId).toMatch(/^AEGIS-LAB-/);
    expect(confirmation.partner.id).toBe('thyrocare');
    expect(confirmation.patientName).toBe('Aniket Dhuri');
    expect(confirmation.scheduledDate).toBe('2026-11-12');
    expect(confirmation.status).toBe('SCHEDULED');

    // Since Aarogyam C aegisPrice (1299) > waiveFeeAbove (500), collection fee should be waived
    expect(confirmation.totalPayable).toBe(pkg.aegisPrice);
  });
});
