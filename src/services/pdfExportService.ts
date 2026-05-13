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
      pixelRatio: 4, // Higher density for laser-sharp text and charts
      width: targetWidth,
      cacheBust: true,
      style: {
        transform: "none",
        opacity: "1",
        visibility: "visible",
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

export const generateTrendNarrative = async (trendSummariesJSON: string, dateRange: string) => {
  const getAI = (await import("../lib/geminiClient")).default;
  const { safeGeminiCall, CORE_SYSTEM_PROMPT } = await import("./ai/promptFramework");
  const { safeJsonParse } = await import("../utils/aiUtils");
  
  const ai = getAI();
  
  const response = await safeGeminiCall(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: [{ role: "user", parts: [{ text: `${CORE_SYSTEM_PROMPT}\n\nGenerate a trend narrative for a PDF report spanning ${dateRange}.\n\nTrends:\n${trendSummariesJSON}\n\nReturn JSON: { "narrative_paragraphs": ["..."], "overall_summary": "...", "disclaimer": "..." }` }] }],
    config: { temperature: 0, responseMimeType: "application/json" }
  }));
  return safeJsonParse<any>(response.text, {
    narrative_paragraphs: ["Analysis unavailable."],
    overall_summary: "No summary available.",
    disclaimer: "For informational purposes only."
  });
};

