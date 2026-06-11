import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Modern PDF Export Service
 * Uses html-to-image for high-fidelity captures, especially for SVG/Charts.
 */
/**
 * exportToPDF - High-fidelity DOM-to-PDF serialization.
 *
 * Captures a DOM node, applies light-mode overrides for print clarity,
 * and generates a multi-page A4 document using canvas-to-PDF bridging.
 *
 * @async
 * @param {string} elementId - ID of the DOM element to capture
 * @param {string} [filename='report.pdf'] - Output filename
 * @param {'p'|'l'} [orientation='p'] - Page orientation (portrait/landscape)
 * @returns {Promise<void>}
 */
export const exportToPDF = async (
  elementId: string,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
) => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  // Detect iframe environment
  const isIframe = window.self !== window.top;

  if (isIframe) {
    console.warn(
      "PDF export triggered inside an iframe. If download fails, please open in a new tab.",
    );
  }

  // 1. Create a hidden container to render a high-quality version
  const container = document.createElement("div");
  container.className = "pdf-export-hidden-container";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "-10000px";
  container.style.zIndex = "-9999";
  container.style.pointerEvents = "none";

  // Custom widths for PDF consistency
  // Portrait (A4 ~ 800px width), Landscape (wider for charts)
  const targetWidth = orientation === "landscape" ? 1200 : 900;
  container.style.width = `${targetWidth}px`;

  // Clone the target element
  const clone = originalElement.cloneNode(true) as HTMLElement;

  // Clean up styles for PDF - Ensure it's not hidden/squashed
  clone.style.display = "block";
  clone.style.visibility = "visible";
  clone.style.width = "100%";
  clone.style.height = "auto";
  clone.style.minHeight = "100px";
  clone.style.overflow = "visible";
  clone.style.margin = "0";
  clone.style.padding = orientation === "landscape" ? "40px" : "60px";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#000000";

  // Ensure Recharts charts rerender or are captured correctly
  // We often need to give Recharts a bit of time or a specific container
  const rechartsContainers = clone.querySelectorAll(
    ".recharts-responsive-container",
  );
  rechartsContainers.forEach((c) => {
    (c as HTMLElement).style.width = "100%";
    (c as HTMLElement).style.height = "400px";
    (c as HTMLElement).style.minHeight = "400px";
  });

  // Remove dark mode and interactive elements from clone
  clone.classList.remove("dark");
  clone.classList.add("light-mode-pdf");

  // Remove specific elements like buttons inside the clone
  const buttons = clone.querySelectorAll("button, select, .print-hidden");
  buttons.forEach((b) => ((b as HTMLElement).style.display = "none"));

  container.appendChild(clone);

  // Inject specific PDF styles to ensure perfect light mode conversion
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    .light-mode-pdf-container * {
      color: #1e293b !important;
      border-color: #e2e8f0 !important;
      background-color: transparent !important;
      text-shadow: none !important;
      box-shadow: none !important;
      font-family: -apple-system, Arial, sans-serif !important;
    }
    .light-mode-pdf-container {
      background-color: #ffffff !important;
      color: #1e293b !important;
    }
    .light-mode-pdf-container .recharts-cartesian-grid-horizontal line,
    .light-mode-pdf-container .recharts-cartesian-grid-vertical line {
      stroke: #f1f5f9 !important;
    }
    .light-mode-pdf-container .recharts-text {
      fill: #64748b !important;
    }
    /* Specific overrides for SBAR monochrome look */
    #sbar-content {
      background-color: #fafafa !important;
      padding: 40px !important;
      border: 1px solid #e2e8f0 !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      height: auto !important;
      max-height: none !important;
    }
  `;
  container.appendChild(styleTag);
  clone.classList.add("light-mode-pdf-container");

  document.body.appendChild(container);

  try {
    // Wait for internal renderings (like charts) to settle and fonts to load
    await new Promise((r) => setTimeout(r, 600));

    // 2. Convert to Image using html-to-image
    const dataUrl = await toPng(clone, {
      backgroundColor: "#ffffff",
      quality: 1.0,
      pixelRatio: 2, // Higher density for laser-sharp text and charts
      skipAutoScale: true,
      width: targetWidth,
      cacheBust: true,
      fontEmbedCSS: "", // Skip fetching external CSS/fonts
      style: {
        transform: "none",
        opacity: "1",
        visibility: "visible",
        fontFamily: "-apple-system, Arial, sans-serif",
      },
    });

    // 3. Generate PDF
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
      compress: false, // Disable compression for better quality
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate MM height accurately based on targetWidth
    // A4 is 210mm wide. targetWidth (900 or 1200) is mapped to 210mm.
    const pxToMm = pdfWidth / targetWidth;
    const finalImgWidth = pdfWidth;

    // We use the ACTUAL height of the rendered clone
    const cloneHeight = clone.getBoundingClientRect().height;
    const finalImgHeight = cloneHeight * pxToMm;

    if (orientation === "landscape" || finalImgHeight <= pdfHeight) {
      // Single page fitting
      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        finalImgWidth,
        finalImgHeight,
        undefined,
        "SLOW",
      );
    } else {
      // Multi-page splitting logic
      let heightLeft = finalImgHeight;
      let position = 0;

      while (heightLeft > 0) {
        // Draw the image shifted by 'position'
        // We use SLOW alias for better interpolation
        pdf.addImage(
          dataUrl,
          "PNG",
          0,
          position,
          finalImgWidth,
          finalImgHeight,
          undefined,
          "SLOW",
        );

        heightLeft -= pdfHeight;
        position -= pdfHeight;

        if (heightLeft > 0) {
          pdf.addPage();
          // Optional: Add some white overlap/padding between pages to avoid text clipping in middle
        }
      }
    }

    // 4. Handle Download
    if (isIframe) {
      // Use Blob to try and force a download or show dataUrl in a way that works in iframes
      // This is still tricky in some restricted iFrames, but standard practice.
      pdf.save(filename);
    } else {
      pdf.save(filename);
    }
  } catch (error) {
    console.error("PDF Export error:", error);
    throw error;
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
};

export interface SBAROutput {
  situation: string;
  background: string;
  assessment: string[];
  recommendation: string[];
}

export interface TrendSummary {
  biomarker: string;
  direction: string;
  deltaPercent: number | string;
}

export interface LabObservation {
  testName?: string;
  markerName?: string;
  value: number | string;
  unit?: string;
  flag: "HIGH" | "LOW" | "CRITICAL" | string;
  referenceRange?: string;
}

export async function generateDoctorReport(params: {
  profile: { name: string; age?: number; sex?: string; conditions?: string[] };
  sbar: SBAROutput;
  trendSummaries: TrendSummary[];
  flaggedObservations: LabObservation[];
  reportDateRange: { from: string; to: string };
}): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;
  const lineHeight = 6;

  // 1. Document Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Aegis Health AI Patient Health Summary", marginLeft, y);
  y += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dateStamp = `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  doc.text(dateStamp, marginLeft, y);
  y += 10;

  // 2. Patient Metadata Matrix
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Patient Information", marginLeft, y);
  y += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${params.profile.name || "Unknown"}`, marginLeft, y);
  y += lineHeight;
  doc.text(`Age: ${params.profile.age || "N/A"}`, marginLeft, y);
  doc.text(`Sex: ${params.profile.sex || "N/A"}`, marginLeft + 60, y);
  y += lineHeight;
  doc.text(
    `Conditions: ${params.profile.conditions?.length ? params.profile.conditions.join(", ") : "None reported"}`,
    marginLeft,
    y,
  );
  y += 12;

  // 3. Verbatim Disclaimer Block
  const disclaimerText =
    "This document was prepared by the patient using Aegis Health AI. It is a patient-generated informational summary and does NOT constitute a medical record, diagnosis, or clinical assessment. Always verify values against original laboratory reports.";

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");

  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 6);
  const blockHeight = disclaimerLines.length * 4 + 6;

  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(200, 200, 200);
  doc.rect(marginLeft, y, contentWidth, blockHeight, "FD");
  doc.text(disclaimerLines, marginLeft + 3, y + 5);
  y += blockHeight + 10;

  autoPageBreak();

  // 4. Structured SBAR Framework
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SBAR Clinical Summary", marginLeft, y);
  y += 8;

  const renderSBARSection = (title: string, content: string | string[]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, marginLeft, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const lines =
      typeof content === "string"
        ? doc.splitTextToSize(content, contentWidth)
        : doc.splitTextToSize(
            content.map((c) => `• ${c}`).join("\n"),
            contentWidth,
          );

    for (const line of lines) {
      autoPageBreak();
      doc.text(line, marginLeft, y);
      y += 5;
    }
    y += 4;
  };

  renderSBARSection("SITUATION", params.sbar?.situation || "-");
  renderSBARSection("BACKGROUND", params.sbar?.background || "-");
  renderSBARSection("ASSESSMENT", params.sbar?.assessment || []);
  renderSBARSection("RECOMMENDATION", params.sbar?.recommendation || []);
  y += 6;
  autoPageBreak();

  // 5. Flagged Biomarkers Data Grid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Critical & Flagged Biomarkers", marginLeft, y);
  y += 8;

  const colWidths = [50, 25, 25, 30, 40];
  const colX = [
    marginLeft,
    marginLeft + colWidths[0],
    marginLeft + colWidths[0] + colWidths[1],
    marginLeft + colWidths[0] + colWidths[1] + colWidths[2],
    marginLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setFillColor(230, 230, 230);
  doc.rect(marginLeft, y, contentWidth, 8, "F");

  doc.text("Test", colX[0] + 2, y + 5.5);
  doc.text("Value", colX[1] + 2, y + 5.5);
  doc.text("Unit", colX[2] + 2, y + 5.5);
  doc.text("Flag", colX[3] + 2, y + 5.5);
  doc.text("Reference Range", colX[4] + 2, y + 5.5);
  y += 10;

  doc.setFontSize(9);
  if (!params.flaggedObservations || params.flaggedObservations.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text(
      "No highly concerning biomarkers flagged in this window.",
      marginLeft + 2,
      y + 4,
    );
    y += 10;
  } else {
    for (const obs of params.flaggedObservations) {
      autoPageBreak();
      const isCritical = String(obs.flag).toUpperCase() === "CRITICAL";
      doc.setFont("helvetica", isCritical ? "bold" : "normal");

      const testName = String(obs.testName || obs.markerName || "-");
      const val = String(obs.value || "-");
      const unit = String(obs.unit || "-");
      const flag = String(obs.flag || "-").toUpperCase();
      const ref = String(obs.referenceRange || "-");

      const testLines = doc.splitTextToSize(testName, colWidths[0] - 4);
      const rowHeight = Math.max(testLines.length * 4 + 2, 8);

      doc.text(testLines, colX[0] + 2, y + 5);
      doc.text(val, colX[1] + 2, y + 5);
      doc.text(unit, colX[2] + 2, y + 5);
      doc.text(flag, colX[3] + 2, y + 5);
      doc.text(ref, colX[4] + 2, y + 5);

      doc.setDrawColor(220, 220, 220);
      doc.line(
        marginLeft,
        y + rowHeight,
        marginLeft + contentWidth,
        y + rowHeight,
      );
      y += rowHeight + 2;
    }
  }
  y += 6;
  autoPageBreak();

  // 6. Chronological Trend Summaries
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Chronological Trend Summaries", marginLeft, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (!params.trendSummaries || params.trendSummaries.length === 0) {
    doc.text(
      "Insufficient historical data to compute chronological trends.",
      marginLeft,
      y,
    );
    y += 6;
  } else {
    for (const trend of params.trendSummaries) {
      autoPageBreak();
      const arrow =
        trend.direction?.toLowerCase() === "up" ||
        trend.direction?.toLowerCase() === "worsened"
          ? "↑"
          : trend.direction?.toLowerCase() === "down" ||
              trend.direction?.toLowerCase() === "improved"
            ? "↓"
            : "-";
      const pct = trend.deltaPercent !== null ? `${trend.deltaPercent}%` : "";
      doc.text(`• [${arrow} ${pct}] ${trend.biomarker}`, marginLeft, y);
      y += 6;
    }
  }

  // 7. Static Global Running Footer (Handle manually across all pages)
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by Aegis Health AI — For discussion with healthcare professional.",
      marginLeft,
      doc.internal.pageSize.getHeight() - 10,
    );
    // Reset colors if needed for logic
    doc.setTextColor(0, 0, 0);
  }

  function autoPageBreak(heightNeeded = 15) {
    if (y + heightNeeded > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  }

  return doc.output("blob");
}
