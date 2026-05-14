import { SIGNATURE_PAD, SIGNATURE_PAD_PREVIEW } from "./constants.js";
import {
  applyStampFromPng,
  assignStampRotation,
  ensureStamp,
  scheduleDefaultStampPlacement,
} from "./stamp.js";
import {
  randomStampRotationDeg,
  padCanvasToInkTrimmedPng,
} from "./signature-image.js";
import { showWorkspaceStatus } from "./messages.js";

const setupPadResolution = (pad) => {
  const ctx = pad.getContext("2d");
  if (!ctx) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const cssW = SIGNATURE_PAD.cssWidth;
  const cssH = SIGNATURE_PAD.cssHeight;
  pad.style.width = `${String(cssW)}px`;
  pad.style.height = `${String(cssH)}px`;
  pad.width = Math.floor(cssW * dpr);
  pad.height = Math.floor(cssH * dpr);
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = SIGNATURE_PAD_PREVIEW.stroke;
  ctx.lineWidth = SIGNATURE_PAD.lineWidthCssPx;
  ctx.globalAlpha = SIGNATURE_PAD_PREVIEW.globalAlpha;
  return ctx;
};

const clearPad = (pad) => {
  const ctx = pad.getContext("2d");
  if (!ctx) {
    return;
  }
  const dpr = pad.width / SIGNATURE_PAD.cssWidth;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pad.width, pad.height);
  ctx.scale(dpr, dpr);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = SIGNATURE_PAD_PREVIEW.stroke;
  ctx.lineWidth = SIGNATURE_PAD.lineWidthCssPx;
  ctx.globalAlpha = SIGNATURE_PAD_PREVIEW.globalAlpha;
};

const getCssPoint = (pad, event) => {
  const rect = pad.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
};

const padHasVisibleInk = (pad) => {
  const ctx = pad.getContext("2d");
  if (!ctx) {
    return false;
  }
  const { data } = ctx.getImageData(0, 0, pad.width, pad.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 28) {
      return true;
    }
  }
  return false;
};

export const wireSignatureModal = () => {
  const modal = document.getElementById("signature-modal");
  const pad = document.getElementById("signature-pad");
  const openBtn = document.getElementById("btn-draw-signature");
  const closeBtn = document.getElementById("signature-modal-close");
  const cancelBtn = document.getElementById("signature-modal-cancel");
  const clearBtn = document.getElementById("signature-modal-clear");
  const applyBtn = document.getElementById("signature-modal-apply");

  if (
    !modal ||
    !pad ||
    !openBtn ||
    !closeBtn ||
    !cancelBtn ||
    !clearBtn ||
    !applyBtn
  ) {
    return;
  }

  let drawing = false;
  let last = { x: 0, y: 0 };

  const openModal = () => {
    modal.hidden = false;
    setupPadResolution(pad);
    clearPad(pad);
    openBtn.setAttribute("aria-expanded", "true");
    pad.focus({ preventScroll: true });
  };

  const closeModal = () => {
    modal.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus({ preventScroll: true });
  };

  openBtn.addEventListener("click", () => {
    openModal();
  });

  closeBtn.addEventListener("click", () => {
    closeModal();
  });

  cancelBtn.addEventListener("click", () => {
    closeModal();
  });

  clearBtn.addEventListener("click", () => {
    clearPad(pad);
  });

  applyBtn.addEventListener("click", () => {
    void (async () => {
      if (!padHasVisibleInk(pad)) {
        showWorkspaceStatus("Draw your signature on the pad first.");
        return;
      }
      const overlay = document.getElementById("stamp-overlay");
      if (!overlay) {
        closeModal();
        return;
      }
      const { dataUrl, bytes } = await padCanvasToInkTrimmedPng(pad);
      const stamp = ensureStamp(overlay);
      assignStampRotation(stamp, randomStampRotationDeg());
      applyStampFromPng(stamp, overlay, dataUrl, bytes, "Drawn signature", {
        source: "custom",
      });
      const img = stamp.querySelector(".stamp__img");
      if (img?.decode) {
        try {
          await img.decode();
        } catch {
          /* ignore */
        }
      }
      scheduleDefaultStampPlacement(stamp, overlay);
      closeModal();
    })();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  const ctxForDraw = () => pad.getContext("2d");

  pad.addEventListener("pointerdown", (event) => {
    const ctx = ctxForDraw();
    if (!ctx) {
      return;
    }
    event.preventDefault();
    pad.setPointerCapture(event.pointerId);
    drawing = true;
    last = getCssPoint(pad, event);
  });

  pad.addEventListener("pointermove", (event) => {
    if (!drawing) {
      return;
    }
    const ctx = ctxForDraw();
    if (!ctx) {
      return;
    }
    const p = getCssPoint(pad, event);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });

  const endStroke = () => {
    drawing = false;
  };

  pad.addEventListener("pointerup", endStroke);
  pad.addEventListener("pointercancel", endStroke);
  pad.addEventListener("lostpointercapture", endStroke);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
};
