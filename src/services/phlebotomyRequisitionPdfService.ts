/**
 * Aegis Health AI — Doorstep Phlebotomy Requisition Slip PDF Service
 * 
 * Generates an official 1-page high-DPI Phlebotomy Requisition Slip (PDF)
 * for the visiting technician, featuring patient demographics, fasting protocol,
 * vacutainer color codes, and diagnostic partner fulfillment credentials.
 */

import { jsPDF } from "jspdf";
import { LabBookingConfirmation } from "./integrations/labBookingService";

export interface PhlebotomySlipOptions {
  confirmation: LabBookingConfirmation;
}

export async function generatePhlebotomyRequisitionPdf({
  confirmation,
}: PhlebotomySlipOptions): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  let y = 16;

  // 1. Top Header Navy Banner
  doc.setFillColor(10, 25, 47); // #0A192F
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, "F");

  // Header Brand & Title
  doc.setTextColor(52, 211, 153); // #34D399 (Emerald)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("AEGIS HEALTH AI", margin + 8, y + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("DOORSTEP PHLEBOTOMY REQUISITION SLIP", margin + 8, y + 16);

  // Top Right Accreditation & Booking Ref
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text("NVIDIA INCEPTION MEMBER", pageWidth - margin - 8, y + 8, { align: "right" });
  doc.setTextColor(52, 211, 153);
  doc.setFont("helvetica", "bold");
  doc.text(`REF: ${confirmation.bookingId}`, pageWidth - margin - 8, y + 16, { align: "right" });

  y += 30;

  // 2. Patient & Logistics Grid
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 2, 2, "FD");

  doc.setTextColor(15, 23, 42); // #0F172A
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT & LOGISTICS DETAILS", margin + 6, y + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  // Left column
  doc.text(`Patient Name:`, margin + 6, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(confirmation.patientName, margin + 32, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Schedule:`, margin + 6, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${confirmation.scheduledDate} (${confirmation.scheduledSlot})`, margin + 32, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Address:`, margin + 6, y + 27);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${confirmation.address} - ${confirmation.pincode}`, margin + 32, y + 27);

  // Right column
  const rightColX = margin + 105;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Partner Lab:`, rightColX, y + 13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 118, 110);
  doc.text(`${confirmation.partner.name}`, rightColX + 26, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Partner Ref:`, rightColX, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${confirmation.partnerBookingRef}`, rightColX + 26, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Accreditation:`, rightColX, y + 27);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${confirmation.partner.accreditation}`, rightColX + 26, y + 27);

  y += 40;

  // 3. Test Package Requisition Details
  doc.setFillColor(240, 253, 250); // #F0FDFA
  doc.setDrawColor(153, 246, 228); // #99F6E4
  doc.roundedRect(margin, y, pageWidth - margin * 2, 38, 2, 2, "FD");

  doc.setTextColor(17, 94, 89);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("PRESCRIBED TEST REQUISITION", margin + 6, y + 6);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${confirmation.selectedPackage.name} (${confirmation.selectedPackage.parameterCount} Parameters)`, margin + 6, y + 14);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Sample Matrix: ${confirmation.selectedPackage.sampleType}`, margin + 6, y + 21);

  // Biomarkers Covered list
  const biomarkersList = confirmation.selectedPackage.biomarkersCovered.join(" · ");
  const splitBiomarkers = doc.splitTextToSize(`Biomarkers: ${biomarkersList}`, pageWidth - margin * 2 - 12);
  doc.text(splitBiomarkers, margin + 6, y + 27);

  y += 44;

  // 4. Technician Specimen Collection & Vacutainer Guide
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 54, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.text("PHLEBOTOMIST SPECIMEN COLLECTION PROTOCOL", margin + 6, y + 6);

  // Vacutainer Table Header
  const vY = y + 12;
  doc.setFillColor(15, 38, 71);
  doc.rect(margin + 4, vY, pageWidth - margin * 2 - 8, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TUBE TYPE", margin + 8, vY + 4);
  doc.text("ADDITIVE", margin + 45, vY + 4);
  doc.text("TARGET TESTS / BIOMARKERS", margin + 85, vY + 4);
  doc.text("INVERSION", margin + 145, vY + 4);

  // Row 1: Purple (EDTA)
  doc.setTextColor(109, 40, 217); // Purple
  doc.setFontSize(7.5);
  doc.text("LAVENDER / PURPLE", margin + 8, vY + 11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.text("K2-EDTA", margin + 45, vY + 11);
  doc.text("HbA1c, Complete Blood Count (CBC), ESR", margin + 85, vY + 11);
  doc.text("8-10 times gently", margin + 145, vY + 11);

  // Row 2: Gold / Yellow (SST)
  doc.setTextColor(180, 83, 9); // Amber
  doc.setFont("helvetica", "bold");
  doc.text("GOLD / YELLOW", margin + 8, vY + 18);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.text("SST Gel Separator", margin + 45, vY + 18);
  doc.text("Lipid Profile, LFT, KFT, Thyroid TSH, Iron, Vitamins", margin + 85, vY + 18);
  doc.text("5 times gently", margin + 145, vY + 18);

  // Row 3: Grey (Fluoride)
  doc.setTextColor(71, 85, 105); // Grey
  doc.setFont("helvetica", "bold");
  doc.text("GREY TUBE", margin + 8, vY + 25);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.text("Sodium Fluoride", margin + 45, vY + 25);
  doc.text("Fasting Plasma Blood Glucose (FBS)", margin + 85, vY + 25);
  doc.text("8-10 times gently", margin + 145, vY + 25);

  // Fasting Alert Box inside
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.roundedRect(margin + 4, vY + 30, pageWidth - margin * 2 - 8, 8, 1, 1, "F");
  doc.setTextColor(146, 64, 14); // Amber-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(`PATIENT FASTING PROTOCOL: ${confirmation.phlebotomyProtocol}`, margin + 8, vY + 35.5);

  y += 60;

  // 5. Verification Sign-Off & Chain-of-Custody Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, "D");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CHAIN-OF-CUSTODY & SAMPLE COLLECTION SIGN-OFF", margin + 6, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  doc.text("Sample Draw Time:  ____ : ____  AM / PM", margin + 6, y + 14);
  doc.text("Vacutainers Collected:  [  ] Purple   [  ] Gold   [  ] Grey", margin + 6, y + 21);

  doc.text("Phlebotomist Name & ID: ______________________", margin + 80, y + 14);
  doc.text("Phlebotomist Signature: ______________________", margin + 80, y + 21);

  doc.text("Patient Fasting Confirmed: [  ] Yes   [  ] No", margin + 150, y + 14);
  doc.text("Patient Signature: __________________", margin + 150, y + 21);

  y += 34;

  // 6. Footer Legal & Technology Note
  doc.setDrawColor(15, 38, 71);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Aegis Health AI Technologies · Registered Indian Enterprise (MSME Udyam: UDYAM-MH-33-0782403) · Member of NVIDIA Inception Program",
    margin,
    y + 4
  );
  doc.text(
    "Digital Synchronization: Automated lab result ingestion active via Cloudflare Edge / NABL partner LIMS gateway. For inquiries: +91 8591330257 | aegishealthai.co.in",
    margin,
    y + 8
  );

  return doc.output("blob");
}

export async function downloadPhlebotomyRequisitionPdf(
  confirmation: LabBookingConfirmation
): Promise<void> {
  const blob = await generatePhlebotomyRequisitionPdf({ confirmation });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Aegis_Phlebotomy_Requisition_${confirmation.bookingId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
