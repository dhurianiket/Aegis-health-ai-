import { describe, it, expect } from "vitest";
import { firstNameOnly, pseudonymiseName, pseudonymiseRecordText, redactIdentifiers } from "../pseudonymise";
import { buildPatientDataBlock } from "../../ai/specialists/loungePrompt";

// All identifiers below are synthetic / clearly fake.
const OCR = [
  "Patient: Ramesh Kumar Sharma  Age: 52 Y  Sex: M",
  "Mobile: +91 98765 43210  Alt: 9123456780",
  "Email: ramesh.sharma@example.com",
  "Aadhaar No: 2345 6789 0123",
  "ABHA: 91-1234-5678-9012  ABHA address: rameshks@abdm",
  "UHID: SYN12345",
  "Lab: 022-2345 6789",
  "HbA1c 7.9 % (ref 4.0-5.6)  Glucose (F) 142 mg/dL  eGFR 58 mL/min/1.73m2  Platelets 250000 /uL",
  "Mr. Sharma was advised follow-up on 12/10/2026.",
].join("\n");

describe("pseudonymisation", () => {
  it("firstNameOnly strips honorifics and never returns the surname", () => {
    expect(firstNameOnly("Dr. Ramesh Kumar Sharma")).toBe("Ramesh");
    expect(firstNameOnly("Myself")).toBeNull();
    expect(firstNameOnly("")).toBeNull();
  });

  it("redacts phone, email, Aadhaar-like, ABHA number/address and labelled ids", () => {
    const out = redactIdentifiers(OCR);
    for (const s of ["98765 43210", "9123456780", "ramesh.sharma@example.com", "2345 6789 0123", "91-1234-5678-9012", "rameshks@abdm", "SYN12345", "2345 6789"]) {
      expect(out).not.toContain(s);
    }
  });

  it("keeps lab values, units, ranges and dates intact", () => {
    const out = pseudonymiseRecordText(OCR, "Ramesh Kumar Sharma");
    for (const s of ["HbA1c 7.9 %", "4.0-5.6", "142 mg/dL", "eGFR 58 mL/min/1.73m2", "250000 /uL", "Age: 52 Y", "12/10/2026"]) {
      expect(out).toContain(s);
    }
  });

  it("replaces the full name with the first name and removes the surname", () => {
    const out = pseudonymiseName(OCR, "Ramesh Kumar Sharma");
    expect(out).not.toMatch(/Sharma/);
    expect(out).not.toMatch(/Ramesh Kumar Sharma/);
    expect(out).toContain("Patient: Ramesh");
  });

  it("buildPatientDataBlock never contains the full name or raw identifiers", () => {
    const block = buildPatientDataBlock({
      patientContext: `PATIENT PROFILE:\n- Name: (withheld)\nPAST SBAR SUMMARIES:\n${OCR}`,
      supplementaryContext: "[Google Forms Intake]\nContact number?: 9988776655\nFull name?: Ramesh Kumar Sharma",
      profileFullName: "Ramesh Kumar Sharma",
    });
    expect(block).not.toMatch(/Sharma/);
    expect(block).not.toContain("9988776655");
    expect(block).not.toContain("ramesh.sharma@example.com");
    expect(block).toContain("HbA1c 7.9 %");
    expect(block).toMatch(/<patient_data>[\s\S]*<\/patient_data>/);
  });
});

describe("pseudonymisation — common-word surnames", () => {
  it("does not clobber report words when the surname is a common word", () => {
    const out = pseudonymiseRecordText("PATIENT PROFILE:\nSynthetic Patient came for review.", "Synthetic Patient");
    expect(out).toContain("PATIENT PROFILE:");
    expect(out).not.toContain("Synthetic Patient");
    expect(out).toContain("Synthetic came for review.");
  });
});
