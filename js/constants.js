export const PDFJS_VERSION = "3.11.174";

export const PDFJS_WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

export const PDF_RENDER_SCALE = Object.freeze({
  maxFit: 3.05,
  previewWidthFallback: 960,
  /** Floor preview target width vs viewport when layout width is still stale (cap matches CSS shell). */
  previewViewportWidthFraction: 0.75,
  previewTargetWidthCapPx: 1400,
  previewHorizontalPadding: 16,
  /** Space reserved below preview content (pager strip). */
  previewVerticalPadding: 14,
  minPreviewTargetWidth: 240,
  minPreviewTargetHeight: 200,
  /** Matches `.workspace { max-height }` — used when preview has no layout height yet. */
  workspaceMaxHeightVh: 85,
});

export const STAMP_LAYOUT = Object.freeze({
  defaultPadPx: 18,
  placementRetries: 8,
});

/** Preview scale limits (resize handle) */
export const STAMP_SCALE = Object.freeze({
  min: 0.35,
  max: 3,
});

/** Default stamp UI scale vs PDF preview on load (readable on large previews). */
export const STAMP_DEFAULT_PREVIEW_SCALE = 0.8;

/** Transparent margin after crop (avoids clipping anti-aliased ink) */
export const SIGNATURE_CROP_PAD_PX = 2;

/** Ink for signature stroke + default “Signed” raster */
export const SIGNATURE_INK = Object.freeze({
  hex: "#003366",
  fontFamily: '"Caveat", cursive',
  fontCss: '600 56px Caveat, cursive',
  fontLoadSpec: "600 56px Caveat",
  padText: 8,
});

export const SIGNATURE_PAD = Object.freeze({
  lineWidthCssPx: 2.75,
  cssWidth: 320,
  cssHeight: 160,
});

/** Pad preview: light stroke on dark pad (document export uses SIGNATURE_INK). */
export const SIGNATURE_PAD_PREVIEW = Object.freeze({
  stroke: "#ffffff",
  globalAlpha: 0.92,
});
