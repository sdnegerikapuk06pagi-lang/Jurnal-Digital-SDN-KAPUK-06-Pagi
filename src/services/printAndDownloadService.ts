import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PrintDownloadOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4';
  filename?: string;
}

/**
 * Downloads an HTML element directly as a crisp, highly professional A4 PDF.
 * Uses an isolated fixed-dimension clone so that the result is never distorted
 * by responsive mobile/tablet screen sizes or viewport scrolling.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  options: PrintDownloadOptions = {}
): Promise<{ success: boolean; message: string }> {
  let offscreenWrapper: HTMLDivElement | null = null;
  try {
    const isLandscape =
      options.orientation === 'landscape' ||
      element.classList.contains('max-w-[297mm]') ||
      element.scrollWidth > 900;

    const orientation = isLandscape ? 'landscape' : 'portrait';

    // A4 dimensions in mm
    const pdfPageWidth = isLandscape ? 297 : 210;
    const pdfPageHeight = isLandscape ? 210 : 297;
    const marginMm = 8; // Clean professional margin
    const usableWidthMm = pdfPageWidth - marginMm * 2;
    const usableHeightMm = pdfPageHeight - marginMm * 2;

    // Standard 96 DPI pixel width for A4
    const targetWidthPx = isLandscape ? 1123 : 794;

    // Create an isolated clone to decouple from screen resolution/responsiveness
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove any elements marked no-print
    clone.querySelectorAll('.no-print').forEach((el) => (el as HTMLElement).remove());

    // Apply strict printable styles to the clone
    clone.style.width = `${targetWidthPx}px`;
    clone.style.maxWidth = `${targetWidthPx}px`;
    clone.style.minWidth = `${targetWidthPx}px`;
    clone.style.padding = isLandscape ? '20px 24px' : '24px 28px';
    clone.style.margin = '0';
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#000000';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

    // Format all tables for crisp printing
    const tables = clone.querySelectorAll('table');
    tables.forEach((table) => {
      const t = table as HTMLElement;
      t.style.width = '100%';
      t.style.borderCollapse = 'collapse';
      t.style.tableLayout = 'auto';
      t.style.backgroundColor = '#ffffff';
      t.style.color = '#000000';
    });

    const cells = clone.querySelectorAll('th, td');
    cells.forEach((cell) => {
      const c = cell as HTMLElement;
      c.style.borderColor = '#000000';
      c.style.borderWidth = '1px';
      c.style.borderStyle = 'solid';
      c.style.padding = isLandscape ? '4px 6px' : '5px 8px';
      c.style.fontSize = isLandscape ? '10px' : '11px';
      c.style.lineHeight = '1.3';
    });

    // Mount off-screen
    offscreenWrapper = document.createElement('div');
    offscreenWrapper.style.position = 'fixed';
    offscreenWrapper.style.top = '-99999px';
    offscreenWrapper.style.left = '0';
    offscreenWrapper.style.width = `${targetWidthPx}px`;
    offscreenWrapper.style.zIndex = '-9999';
    offscreenWrapper.style.backgroundColor = '#ffffff';
    offscreenWrapper.appendChild(clone);
    document.body.appendChild(offscreenWrapper);

    // Capture with html2canvas at high resolution (scale 2 = 192dpi)
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: targetWidthPx,
    });

    // Clean up clone
    if (offscreenWrapper && offscreenWrapper.parentNode) {
      document.body.removeChild(offscreenWrapper);
      offscreenWrapper = null;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = usableWidthMm;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = marginMm;

    // First page
    pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= usableHeightMm;

    // Multi-page pagination if document is long
    while (heightLeft > 5) {
      position = position - usableHeightMm;
      pdf.addPage('a4', orientation);
      pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= usableHeightMm;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    return {
      success: true,
      message: `Berkas PDF resmi "${cleanFilename}" berhasil diunduh dengan tata letak A4 rapi!`,
    };
  } catch (err: unknown) {
    if (offscreenWrapper && offscreenWrapper.parentNode) {
      document.body.removeChild(offscreenWrapper);
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('PDF generation fallback triggered:', errorMsg);

    // Fallback: download standalone printable HTML
    downloadPrintableHtml(
      element,
      options.title || 'Dokumen Resmi',
      filename.replace(/\.pdf$/i, '')
    );

    return {
      success: true,
      message: 'Dokumen berhasil diunduh sebagai Berkas HTML Resmi Siap Cetak (Buka berkas untuk Cetak/Simpan PDF).',
    };
  }
}

/**
 * Creates and downloads a standalone, beautifully formatted HTML file.
 * Includes official headers, print stylesheet, and single-click print button.
 */
export function downloadPrintableHtml(
  element: HTMLElement,
  title: string,
  filename: string
): void {
  const contentHtml = element.innerHTML;
  const isLandscape =
    element.classList.contains('max-w-[297mm]') || element.scrollWidth > 900;

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 16px;
      background: #f1f5f9;
      color: #0f172a;
    }
    .toolbar {
      max-width: ${isLandscape ? '297mm' : '210mm'};
      margin: 0 auto 16px auto;
      background: #1e3a8a;
      color: white;
      padding: 14px 20px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    }
    .toolbar h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
    }
    .toolbar p {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #bfdbfe;
    }
    .toolbar button {
      background: #fbbf24;
      color: #172554;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: background 0.2s;
    }
    .toolbar button:hover {
      background: #f59e0b;
    }
    .print-wrapper {
      max-width: ${isLandscape ? '297mm' : '210mm'};
      margin: 0 auto;
      background: #ffffff;
      padding: ${isLandscape ? '12mm 16mm' : '16mm 20mm'};
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      border: 1px solid #cbd5e1;
    }
    .no-print {
      display: none !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 8px 0;
    }
    th, td {
      border: 1px solid #000000 !important;
      padding: ${isLandscape ? '4px 6px' : '6px 8px'};
      font-size: ${isLandscape ? '10px' : '11px'};
    }
    th {
      background-color: #f8fafc !important;
      font-weight: 700;
    }
    @media print {
      @page {
        size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
        margin: 8mm 10mm 10mm 10mm;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .toolbar {
        display: none !important;
      }
      .print-wrapper {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        border-radius: 0 !important;
      }
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <h3>${title}</h3>
      <p>Klik tombol untuk mencetak ke kertas A4 atau simpan sebagai file PDF berkualitas tinggi.</p>
    </div>
    <button onclick="window.print()">🖨️ Cetak / Simpan PDF Sekarang</button>
  </div>
  <div class="print-wrapper">
    ${contentHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers printing using an isolated iframe with precise A4 styles,
 * avoiding any layout shrinkage from surrounding webpage UI.
 */
export function safePrintElement(element: HTMLElement, title: string = 'Dokumen Resmi'): void {
  try {
    const isLandscape =
      element.classList.contains('max-w-[297mm]') || element.scrollWidth > 900;

    // Create an invisible iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const cleanContent = element.innerHTML;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
      margin: 8mm 10mm 10mm 10mm;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background: #ffffff;
      font-size: ${isLandscape ? '10px' : '11px'};
    }
    .no-print {
      display: none !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 6px 0;
    }
    th, td {
      border: 1px solid #000000 !important;
      padding: ${isLandscape ? '4px 6px' : '5px 7px'};
      font-size: ${isLandscape ? '9.5px' : '10.5px'};
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: bold;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  ${cleanContent}
</body>
</html>`);
    doc.close();

    // Give iframe time to parse fonts/styles before invoking print
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 400);
  } catch (err) {
    console.warn('Iframe print failed, falling back to window.print():', err);
    window.print();
  }
}

/**
 * Direct print alias for instant A4 printing
 */
export const printElementDirectly = safePrintElement;

