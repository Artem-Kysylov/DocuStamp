export const appState = {
  pdfBytes: null,
  fileName: "",
  /** Page count from pdf-lib (preview uses pdf.js) */
  pdfPageCount: 0,
  /** 1-based index of the page shown in the preview */
  currentPdfPage: 1,
  /**
   * Signature top-left as fractions of stamp overlay size, per 1-based page.
   * @type {Record<number, { xFrac: number; yFrac: number }>}
   */
  stampPositionsByPage: {},
  /** When true, signature placement applies to every page (preview + export). */
  stampSyncAcrossPages: false,
  /** PNG bytes for pdf-lib.embedPng */
  stampPngBytes: null,
  /** Preview + PDF rotation (deg); realism: −1.5 or +1 */
  stampRotationDeg: 0,
  /** Visual scale from corner handle */
  stampScale: 1,
};
