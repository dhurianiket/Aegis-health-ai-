import { describe, it, expect } from 'vitest';
import { generatePhlebotomyRequisitionPdf } from '../phlebotomyRequisitionPdfService';
import { LabBookingConfirmation, LAB_PARTNERS, LAB_PACKAGES_CATALOG } from '../integrations/labBookingService';

describe('phlebotomyRequisitionPdfService', () => {
  const mockConfirmation: LabBookingConfirmation = {
    success: true,
    bookingId: 'AEGIS-LAB-20261110-XYZ123',
    partnerBookingRef: 'THY-2026-987654',
    partner: LAB_PARTNERS.thyrocare,
    selectedPackage: LAB_PACKAGES_CATALOG[0],
    patientName: 'Aniket Dhuri',
    scheduledDate: '2026-11-11',
    scheduledSlot: '07:00 AM – 07:30 AM',
    address: 'Powai, Mumbai',
    pincode: '400076',
    totalPayable: 1299,
    phlebotomyProtocol: 'Requires 10 hours overnight fasting. Plain water allowed.',
    status: 'COLLECTION_ASSIGNED',
    message: 'Technician dispatched for home collection.', createdAt: '2026-11-10T12:00:00Z',
  };

  it('generates a valid PDF blob for phlebotomy requisition', async () => {
    const blob = await generatePhlebotomyRequisitionPdf({
      confirmation: mockConfirmation,
    });

    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });
});
