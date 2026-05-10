import { describe, it, expect, vi } from "vitest";
import {
  checkLabResultForAlerts,
  getConsolidatedAlerts,
} from "../alertService";
import {
  LabResult,
  DocumentType,
  MedicationStatus,
  LabStatus,
} from "../../types/medical";

describe("AlertService", () => {
  describe("checkLabResultForAlerts", () => {
    it("should return a critical alert for very high Glucose", () => {
      const result: LabResult = {
        id: "1",
        userId: "u1",
        docId: "d1",
        markerName: "Glucose",
        value: 190,
        unit: "mg/dL",
        status: LabStatus.CRITICAL,
        date: new Date().toISOString(),
      };

      const alert = checkLabResultForAlerts(result);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe("critical");
      expect(alert?.title).toContain("Critical High Glucose");
    });

    it("should return a high alert for moderately high HbA1c", () => {
      const result: LabResult = {
        id: "2",
        userId: "u1",
        docId: "d1",
        markerName: "HbA1c",
        value: 6.2,
        unit: "%",
        status: LabStatus.ABNORMAL,
        date: new Date().toISOString(),
      };

      const alert = checkLabResultForAlerts(result);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe("high");
      expect(alert?.title).toContain("Elevated HbA1c");
    });

    it("should return null for normal values", () => {
      const result: LabResult = {
        id: "3",
        userId: "u1",
        docId: "d1",
        markerName: "Glucose",
        value: 85,
        unit: "mg/dL",
        status: LabStatus.NORMAL,
        date: new Date().toISOString(),
      };

      const alert = checkLabResultForAlerts(result);
      expect(alert).toBeNull();
    });
  });

  describe("getConsolidatedAlerts", () => {
    it("should aggregate alerts from labs and medications", () => {
      const labs: LabResult[] = [
        {
          id: "1",
          userId: "u1",
          docId: "d1",
          markerName: "Glucose",
          value: 190,
          unit: "mg/dL",
          status: LabStatus.CRITICAL,
          date: new Date().toISOString(),
        },
      ];

      const meds = [
        {
          id: "m1",
          userId: "u1",
          name: "Atorvastatin",
          dosage: "20mg",
          frequency: "Daily",
          status: MedicationStatus.ACTIVE,
          startDate: new Date().toISOString(),
        },
        {
          id: "m2",
          userId: "u1",
          name: "Simvastatin",
          dosage: "10mg",
          frequency: "Daily",
          status: MedicationStatus.ACTIVE,
          startDate: new Date().toISOString(),
        },
      ];

      const alerts = getConsolidatedAlerts(labs, meds as any);
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      expect(alerts.some((a) => a.type === "lab_value")).toBe(true);
      expect(alerts.some((a) => a.type === "medication")).toBe(true);
    });
  });
});
