import { SIGNATURE_CROP_PAD_PX, SIGNATURE_INK } from "./constants.js";

/** Realism: stamp is never perfectly straight on paper (sync preview + PDF). */
export const randomStampRotationDeg = () =>
  Math.random() < 0.5 ? -1.5 : 1;

export const dataUrlToPngBytes = async (dataUrl) => {
  const response = await fetch(dataUrl);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
};

/**
 * Crops fully transparent margins so the bitmap matches the ink outline.
 * Uses a low alpha threshold so soft strokes are included.
 */
export const trimTransparentCanvas = (source) => {
  const ctx = source.getContext("2d");
  if (!ctx) {
    return source;
  }
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 8) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX) {
    return source;
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d");
  if (!octx) {
    return source;
  }
  octx.drawImage(source, minX, minY, w, h, 0, 0, w, h);
  return out;
};

/** Tight crop + optional transparent halo for smoother edges when embedding. */
export const trimTransparentWithPad = (source, pad = SIGNATURE_CROP_PAD_PX) => {
  const trimmed = trimTransparentCanvas(source);
  if (pad <= 0) {
    return trimmed;
  }
  const out = document.createElement("canvas");
  out.width = trimmed.width + pad * 2;
  out.height = trimmed.height + pad * 2;
  const ctx = out.getContext("2d");
  if (!ctx) {
    return trimmed;
  }
  ctx.drawImage(trimmed, pad, pad);
  return out;
};

export const rasterizePadPreviewToDocumentInk = (source) => {
  const ctx = source.getContext("2d");
  if (!ctx) {
    return source;
  }

  const inkMatch = /^#?([0-9a-f]{6})$/i.exec(SIGNATURE_INK.hex);
  if (!inkMatch) {
    return source;
  }
  const n = parseInt(inkMatch[1], 16);
  const inkR = (n >> 16) & 255;
  const inkG = (n >> 8) & 255;
  const inkB = n & 255;

  const { width, height } = source;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a <= 8) {
      continue;
    }
    data[i] = inkR;
    data[i + 1] = inkG;
    data[i + 2] = inkB;
  }

  ctx.putImageData(imageData, 0, 0);
  return source;
};

export const padCanvasToInkTrimmedPng = async (pad) => {
  const clone = document.createElement("canvas");
  clone.width = pad.width;
  clone.height = pad.height;
  const cctx = clone.getContext("2d");
  if (!cctx) {
    return canvasToTrimmedPng(pad);
  }
  cctx.drawImage(pad, 0, 0);
  rasterizePadPreviewToDocumentInk(clone);
  return canvasToTrimmedPng(clone);
};

export const renderDefaultSignedPng = async () => {
  await document.fonts.ready;
  await document.fonts.load(SIGNATURE_INK.fontLoadSpec);

  const c = document.createElement("canvas");
  const w = 320;
  const h = 100;
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) {
    throw new Error("Cannot create signature canvas.");
  }
  ctx.clearRect(0, 0, w, h);
  ctx.font = SIGNATURE_INK.fontCss;
  ctx.fillStyle = SIGNATURE_INK.hex;
  ctx.globalAlpha = 0.8;
  ctx.textBaseline = "middle";
  ctx.fillText("Signed", SIGNATURE_INK.padText, h / 2);
  ctx.globalAlpha = 1;

  const padded = trimTransparentWithPad(c, SIGNATURE_CROP_PAD_PX);
  const dataUrl = padded.toDataURL("image/png");
  const bytes = await dataUrlToPngBytes(dataUrl);
  return { dataUrl, bytes };
};

export const canvasToTrimmedPng = async (canvas) => {
  const padded = trimTransparentWithPad(canvas, SIGNATURE_CROP_PAD_PX);
  const dataUrl = padded.toDataURL("image/png");
  const bytes = await dataUrlToPngBytes(dataUrl);
  return { dataUrl, bytes, canvas: padded };
};
