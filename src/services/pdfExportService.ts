/**
 * PDF Export Service
 * Handles exporting React components to PDF with Tailwind v4 OKLCH color support
 * 
 * Features:
 * - Three-tier fallback strategy (iframe detection → print dialog → canvas)
 * - OKLCH to RGB color conversion using W3C color space math
 * - Recursive DOM element cloning with CSS style conversion
 * - Quality presets and customizable options
 * - Error handling with user-friendly messages
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * OKLCH Color Space - Represents a color in the OKLCH color space
 * L: Lightness (0-1)
 * C: Chroma (0-0.4)
 * H: Hue (0-360)
 */
interface OklchColor {
  l: number;
  c: number;
  h: number;
}

/**
 * Linear RGB values (0-1 range)
 */
interface LinearRgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Standard RGB values (0-255 range)
 */
interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Export options for PDF generation
 */
interface PdfExportOptions {
  filename?: string;
  title?: string;
  quality?: 'high' | 'medium' | 'low';
  scale?: number;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Quality preset configurations
 */
const QUALITY_PRESETS = {
  high: {
    scale: 2,
    jpegQuality: 0.95,
    timeout: 30000,
    description: 'High quality (larger file, slower)',
  },
  medium: {
    scale: 1.5,
    jpegQuality: 0.85,
    timeout: 15000,
    description: 'Medium quality (balanced, recommended)',
  },
  low: {
    scale: 1,
    jpegQuality: 0.75,
    timeout: 10000,
    description: 'Low quality (faster, smaller file)',
  },
};

/**
 * CSS variable replacements for Tailwind v4 OKLCH colors
 * Maps oklch() color values to standard rgb() values
 */
const OKLCH_COLOR_MAP: Record<string, string> = {
  // Indigo palette (primary colors)
  'oklch(50.26% 0.109 292.32)': 'rgb(241, 245, 250)', // indigo-50
  'oklch(70.2% 0.21 293.05)': 'rgb(188, 212, 245)', // indigo-200
  'oklch(64.3% 0.192 293.2)': 'rgb(165, 197, 241)', // indigo-300
  'oklch(54.61% 0.22 293.1)': 'rgb(110, 152, 219)', // indigo-500
  'oklch(46.89% 0.2 293.09)': 'rgb(79, 120, 201)', // indigo-600
  'oklch(44.15% 0.177 293.08)': 'rgb(67, 102, 176)', // indigo-700
  'oklch(34.56% 0.138 293.16)': 'rgb(42, 63, 109)', // indigo-900

  // Slate palette (neutral colors)
  'oklch(98.04% 0.003 264.36)': 'rgb(251, 251, 252)', // slate-50
  'oklch(95.08% 0.004 264.17)': 'rgb(241, 242, 245)', // slate-100
  'oklch(92.13% 0.005 264.08)': 'rgb(226, 232, 240)', // slate-200
  'oklch(85.26% 0.007 264.04)': 'rgb(203, 213, 225)', // slate-300
  'oklch(78.41% 0.009 264.14)': 'rgb(148, 163, 184)', // slate-400
  'oklch(64.44% 0.011 264.16)': 'rgb(71, 85, 105)', // slate-600
  'oklch(52.33% 0.009 264.12)': 'rgb(30, 41, 59)', // slate-800
  'oklch(42.19% 0.008 264.18)': 'rgb(15, 23, 42)', // slate-900

  // Red palette
  'oklch(51.86% 0.24 29.23)': 'rgb(239, 68, 68)', // red-500
  'oklch(55.1% 0.245 27.57)': 'rgb(253, 130, 92)', // orange-500

  // Green palette
  'oklch(55.26% 0.243 142.45)': 'rgb(34, 197, 94)', // green-500

  // Yellow palette
  'oklch(64.76% 0.258 95.62)': 'rgb(234, 179, 8)', // yellow-500
};

/**
 * Convert OKLCH color to OKLab color space (intermediate step)
 * @param oklch - OKLCH color
 * @returns OKLab color
 */
function oklchToOklab(oklch: OklchColor): { l: number; a: number; b: number } {
  const h_rad = (oklch.h * Math.PI) / 180;
  return {
    l: oklch.l,
    a: oklch.c * Math.cos(h_rad),
    b: oklch.c * Math.sin(h_rad),
  };
}

/**
 * Convert OKLab to Linear RGB using the cone response inverse
 * This uses the official W3C color space conversion matrix
 * @param oklab - OKLab color
 * @returns Linear RGB values (0-1)
 */
function oklabToLinearRgb(oklab: { l: number; a: number; b: number }): LinearRgb {
  // OKLab to LMS (cone response)
  const L_ = oklab.l + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const M_ = oklab.l - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const S_ = oklab.l - 0.0894841775 * oklab.a - 1.291486575 * oklab.b;

  // LMS to response (cube root inverse)
  const l = L_ * L_ * L_;
  const m = M_ * M_ * M_;
  const s = S_ * S_ * S_;

  // LMS to Linear RGB using the official matrix
  return {
    r: 4.0767245293 * l - 3.3072168827 * m + 0.2307590544 * s,
    g: -1.2681437731 * l + 2.6093323231 * m - 0.3411293802 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  };
}

/**
 * Apply gamma correction to convert linear RGB to sRGB
 * @param linear - Linear RGB value (0-1)
 * @returns sRGB value (0-1)
 */
function gammaCorrect(linear: number): number {
  if (linear <= 0.0031308) {
    return linear * 12.92;
  }
  return 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
}

/**
 * Convert OKLCH color string to RGB color string
 * Supports both format: "oklch(L% C H)" and "oklch(L, C, H)"
 * @param oklchString - OKLCH color string
 * @returns RGB color string like "rgb(255, 0, 0)"
 */
function oklchStringToRgb(oklchString: string): string {
  // Parse oklch(L% C H) format
  const oklchMatch = oklchString.match(
    /oklch\(\s*([\d.]+)%?\s*,?\s*([\d.]+)\s*,?\s*([\d.]+)\s*\)/i
  );

  if (!oklchMatch) {
    return oklchString; // Return original if parsing fails
  }

  let l = parseFloat(oklchMatch[1]);
  const c = parseFloat(oklchMatch[2]);
  const h = parseFloat(oklchMatch[3]);

  // Normalize lightness to 0-1 range if it was in percentage
  if (l > 1) {
    l = l / 100;
  }

  const oklch: OklchColor = { l, c, h };
  const oklab = oklchToOklab(oklch);
  const linearRgb = oklabToLinearRgb(oklab);

  // Apply gamma correction
  const r = gammaCorrect(linearRgb.r);
  const g = gammaCorrect(linearRgb.g);
  const b = gammaCorrect(linearRgb.b);

  // Clamp values to 0-255 range
  const r8bit = Math.round(Math.max(0, Math.min(1, r)) * 255);
  const g8bit = Math.round(Math.max(0, Math.min(1, g)) * 255);
  const b8bit = Math.round(Math.max(0, Math.min(1, b)) * 255);

  return `rgb(${r8bit}, ${g8bit}, ${b8bit})`;
}

/**
 * Check if running inside an iframe
 * @returns true if in iframe
 */
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // Assume iframe if cross-origin error
  }
}

/**
 * Check if window.print() is available
 * @returns true if print is available
 */
function canUseWindowPrint(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.print === 'function';
  } catch (e) {
    return false;
  }
}

/**
 * Recursively clone a DOM element and convert all OKLCH colors to RGB
 * Handles:
 * - Direct oklch() color values in style attributes
 * - CSS variables (var() with oklch() fallbacks)
 * - Child elements
 * @param element - Original DOM element
 * @returns Cloned element with converted colors
 */
function cloneElementWithColorConversion(element: Element): Element {
  const clone = element.cloneNode(false) as Element;

  // Get computed styles
  const computedStyle = window.getComputedStyle(element);

  // Convert inline styles
  if (element instanceof HTMLElement && element.style.cssText) {
    let cssText = element.style.cssText;

    // Replace all oklch() values with rgb() values
    cssText = cssText.replace(/oklch\([^)]+\)/gi, (match) => {
      const precomputed = OKLCH_COLOR_MAP[match];
      if (precomputed) {
        return precomputed;
      }
      return oklchStringToRgb(match);
    });

    // Replace CSS variables that contain oklch values
    cssText = cssText.replace(/var\(--[^,)]+(?:,[^)]*oklch\([^)]+\)[^)]*)\)/gi, (match) => {
      const oklchMatch = match.match(/oklch\([^)]+\)/);
      if (oklchMatch) {
        const precomputed = OKLCH_COLOR_MAP[oklchMatch[0]];
        if (precomputed) {
          return precomputed;
        }
        return oklchStringToRgb(oklchMatch[0]);
      }
      return match;
    });

    if (clone instanceof HTMLElement) {
      clone.style.cssText = cssText;
    }
  }

  // Process computed styles for elements that rely on Tailwind classes
  if (clone instanceof HTMLElement) {
    // Get all CSS properties that might contain oklch
    const propertiesToCheck = [
      'color',
      'backgroundColor',
      'borderColor',
      'boxShadow',
      'textShadow',
      'fill',
      'stroke',
    ];

    propertiesToCheck.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value.includes('oklch')) {
        const converted = oklchStringToRgb(value);
        clone instanceof HTMLElement && (clone.style[prop as any] = converted);
      }
    });
  }

  // Recursively clone child elements
  Array.from(element.children).forEach((child) => {
    clone.appendChild(cloneElementWithColorConversion(child));
  });

  return clone;
}

/**
 * Show a toast notification to the user
 * @param message - Message to display
 * @param type - Type of notification (success, error, info)
 */
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 transition-all duration-300 ${
    type === 'success'
      ? 'bg-green-500'
      : type === 'error'
        ? 'bg-red-500'
        : 'bg-blue-500'
  }`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 4000);
}

/**
 * Main function to export dashboard to PDF
 * Uses three-tier fallback strategy:
 * 1. If in iframe: Show alert and suggest opening in new tab
 * 2. If can use print: Open native print dialog
 * 3. Fallback: Use html2canvas + jsPDF with OKLCH conversion
 * @param options - Export options
 */
export async function exportDashboardToPdf(
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    filename = 'health-report.pdf',
    title = 'Health Report',
    quality = 'medium',
    orientation = 'portrait',
  } = options;

  // Get quality preset
  const preset = QUALITY_PRESETS[quality];

  try {
    // Strategy 1: Check if in iframe
    if (isInIframe()) {
      showToast(
        '📋 To export PDF, please open this app in a new browser tab',
        'info'
      );
      alert(
        'PDF export is not available in preview mode.\n\nPlease click the arrow icon at the top right to open the app in a full browser tab, then try the export again.'
      );
      return;
    }

    // Strategy 2: Use native print dialog if available
    if (canUseWindowPrint()) {
      showToast('🖨️ Print dialog opening...', 'info');
      window.print();
      return;
    }

    // Strategy 3: Use html2canvas + jsPDF fallback
    showToast(`⏳ Generating PDF (${preset.description})...`, 'info');

    // Get the element to export
    const element = document.getElementById('dashboard-export-area');
    if (!element) {
      showToast(
        '❌ Export area not found. Make sure your dashboard has id="dashboard-export-area"',
        'error'
      );
      console.error('Dashboard export area not found');
      return;
    }

    // Clone element and convert colors
    const clonedElement = cloneElementWithColorConversion(element);

    // Create a temporary container for the cloned element
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '1200px';
    tempContainer.style.zIndex = '-1';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Render canvas from the cloned element
    const canvas = await html2canvas(tempContainer, {
      scale: preset.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      timeout: preset.timeout,
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Calculate PDF dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    // Create PDF
    const pdfOrientation = ratio > 1 ? 'landscape' : 'portrait';
    const pageSize = pdfOrientation === 'landscape' ? [297, 210] : [210, 297]; // A4 in mm
    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: 'a4',
    });

    // Calculate dimensions to fit page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // mm
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = (contentWidth / canvasWidth) * canvasHeight;

    // Convert canvas to image and add to PDF
    const imageData = canvas.toDataURL('image/jpeg', preset.jpegQuality);
    let currentHeight = margin;

    // Add title if provided
    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, pageWidth / 2, currentHeight + 5, { align: 'center' });
      currentHeight += 15;
    }

    // Add image, handling page breaks
    let remainingHeight = contentHeight;
    let imageYPosition = 0;

    while (remainingHeight > 0) {
      const availableHeight = pageHeight - currentHeight - margin;

      if (remainingHeight <= availableHeight) {
        // Fits on current page
        pdf.addImage(
          imageData,
          'JPEG',
          margin,
          currentHeight,
          contentWidth,
          remainingHeight
        );
        remainingHeight = 0;
      } else {
        // Need to split across pages
        const heightOnThisPage = availableHeight;
        const sourceHeight = (heightOnThisPage / canvasHeight) * canvasWidth;

        // Create temporary canvas for this portion
        const portionCanvas = document.createElement('canvas');
        portionCanvas.width = canvasWidth;
        portionCanvas.height = sourceHeight;
        const ctx = portionCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            imageYPosition,
            canvasWidth,
            sourceHeight,
            0,
            0,
            canvasWidth,
            sourceHeight
          );

          const portionImageData = portionCanvas.toDataURL(
            'image/jpeg',
            preset.jpegQuality
          );
          pdf.addImage(
            portionImageData,
            'JPEG',
            margin,
            currentHeight,
            contentWidth,
            heightOnThisPage
          );
        }

        imageYPosition += sourceHeight;
        remainingHeight -= heightOnThisPage;

        if (remainingHeight > 0) {
          pdf.addPage();
          currentHeight = margin;
        }
      }
    }

    // Add footer with date
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Save PDF
    pdf.save(filename);
    showToast(`✅ PDF exported successfully: ${filename}`, 'success');
  } catch (error) {
    console.error('PDF export failed:', error);
    showToast(
      `❌ Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
  }
}

/**
 * Export dashboard to image (PNG)
 * @param options - Export options
 */
export async function exportDashboardToImage(
  options: PdfExportOptions = {}
): Promise<void> {
  const { filename = 'health-report.png', quality = 'medium' } = options;

  const preset = QUALITY_PRESETS[quality];

  try {
    showToast(`⏳ Generating image (${preset.description})...`, 'info');

    const element = document.getElementById('dashboard-export-area');
    if (!element) {
      showToast(
        '❌ Export area not found. Make sure your dashboard has id="dashboard-export-area"',
        'error'
      );
      return;
    }

    const clonedElement = cloneElementWithColorConversion(element);
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    const canvas = await html2canvas(tempContainer, {
      scale: preset.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      timeout: preset.timeout,
    });

    document.body.removeChild(tempContainer);

    // Create download link
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();

    showToast(`✅ Image exported successfully: ${filename}`, 'success');
  } catch (error) {
    console.error('Image export failed:', error);
    showToast(
      `❌ Failed to export image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
  }
}

/**
 * Convert OKLCH CSS variable to RGB for immediate use
 * Useful for dynamic styling during export
 * @param oklchValue - OKLCH color string
 * @returns RGB color string
 */
export function convertOklchToRgb(oklchValue: string): string {
  const precomputed = OKLCH_COLOR_MAP[oklchValue];
  if (precomputed) {
    return precomputed;
  }
  return oklchStringToRgb(oklchValue);
}
