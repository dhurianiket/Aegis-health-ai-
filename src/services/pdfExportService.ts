import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// OKLCH -> OKLAB -> Linear RGB -> sRGB Math
function oklchToOklab(l: number, c: number, h: number) {
  const hRad = (h * Math.PI) / 180;
  return {
    L: l,
    a: c * Math.cos(hRad),
    b: c * Math.sin(hRad)
  };
}

function oklabToLinearRgb(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = Math.pow(Math.max(l_, 0), 3);
  const m = Math.pow(Math.max(m_, 0), 3);
  const s = Math.pow(Math.max(s_, 0), 3);

  return {
    r:  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  };
}

function gammaCorrect(c: number) {
  const abs = Math.abs(c);
  if (abs <= 0.0031308) {
    return 12.92 * c;
  }
  return (Math.sign(c) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
}

function convertOklchToRgb(oklchString: string): string {
  // Regex to extract L, C, H
  // Handles formats like oklch(0.6 0.15 250) or oklch(60% 0.15 250 / 0.5)
  const regex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/;
  const match = oklchString.match(regex);
  
  if (!match) return oklchString;

  let lStr = match[1];
  let L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
  let C = parseFloat(match[2]);
  let H = parseFloat(match[3]);
  let alpha = match[4] ? parseFloat(match[4]) : 1;

  const oklab = oklchToOklab(L, C, H);
  const linRgb = oklabToLinearRgb(oklab.L, oklab.a, oklab.b);
  
  let R = Math.round(Math.max(0, Math.min(1, gammaCorrect(linRgb.r))) * 255);
  let G = Math.round(Math.max(0, Math.min(1, gammaCorrect(linRgb.g))) * 255);
  let B = Math.round(Math.max(0, Math.min(1, gammaCorrect(linRgb.b))) * 255);

  if (alpha !== 1) {
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
  return `rgb(${R}, ${G}, ${B})`;
}

// Helper to reliably map CSS values if it remains in OKLCH
const convertColorIfDetailed = (cssVal: string) => {
  if (!cssVal) return null;
  if (cssVal.includes('oklch')) {
    // Some browsers or styles return multiple oklch() within a single string (gradients, shadows)
    // We can replace all occurrences
    return cssVal.replace(/oklch\([^)]+\)/g, (match) => convertOklchToRgb(match));
  }
  return cssVal;
};

export const exportToPDF = async (
  elementId: string, 
  filename: string, 
  orientation: 'portrait' | 'landscape' = 'portrait'
) => {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  if (window.self !== window.top) {
    alert("Please open the app in a new tab (using the button in the top right) to download PDFs. The preview environment prevents direct file downloads.");
    return;
  }


  // 2. Clone the element to safely modify styles
  const clone = originalElement.cloneNode(true) as HTMLElement;
  const rect = originalElement.getBoundingClientRect();
  
  // Create a wrapper to render it off-screen
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = `${rect.width}px`;
  wrapper.style.height = `${rect.height}px`;
  
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // 3. Process all nested elements and compute their actual styles
    // We traverse the original element and copy resolved RGB colors over to the clone.
    const originalElements = [originalElement, ...Array.from(originalElement.querySelectorAll('*'))];
    const cloneElements = [clone, ...Array.from(clone.querySelectorAll('*'))];

    for (let i = 0; i < originalElements.length; i++) {
        const origEl = originalElements[i] as HTMLElement;
        const cloneEl = cloneElements[i] as HTMLElement;
        
        const computedStyle = window.getComputedStyle(origEl);
        
        // Convert color
        const color = computedStyle.color;
        const mappedColor = convertColorIfDetailed(color);
        if (mappedColor) cloneEl.style.color = mappedColor;

        // Convert background-color
        const bgColor = computedStyle.backgroundColor;
        const mappedBgColor = convertColorIfDetailed(bgColor);
        if (mappedBgColor) cloneEl.style.backgroundColor = mappedBgColor;

        // Convert border-color
        const borderColor = computedStyle.borderColor;
        const mappedBorderColor = convertColorIfDetailed(borderColor);
        if (mappedBorderColor) cloneEl.style.borderColor = mappedBorderColor;
    }

    // Force light mode on root clone
    clone.style.backgroundColor = 'white';
    clone.style.color = 'black';
    // Remove dark mode classes if any
    clone.classList.remove('dark');

    // 4. Run html2canvas
    const canvas = await html2canvas(clone, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Unable to render element: Canvas is empty. Please ensure the element is visible.");
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    
    // 5. Build PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    
    const imgWidth = imgProps.width;
    const imgHeight = imgProps.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    let finalImgWidth = imgWidth * ratio;
    let finalImgHeight = imgHeight * ratio;

    // For landscape (charts) scale to fit
    if (orientation === 'landscape') {
      pdf.addImage(imgData, 'JPEG', 0, 0, finalImgWidth, finalImgHeight);
    } else {
      // For portrait (reports), we might need multiple pages if height exceeds
      const pageHeight = pdfHeight;
      let heightLeft = finalImgHeight;
      let position = 0;

      // Ensure width is constrained to page width in portrait
      finalImgWidth = pdfWidth;
      finalImgHeight = (imgHeight * finalImgWidth) / imgWidth;
      heightLeft = finalImgHeight;

      pdf.addImage(imgData, 'JPEG', 0, position, finalImgWidth, finalImgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - finalImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, finalImgWidth, finalImgHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save(filename);
  } finally {
    // Cleanup
    document.body.removeChild(wrapper);
  }
};
