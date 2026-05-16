import {
  STAMP_DEFAULT_PREVIEW_SCALE,
  STAMP_LAYOUT,
  STAMP_SCALE,
} from "./constants.js";
import { appState } from "./state.js";
import { maybePropagateStampSync } from "./page-sync.js";
import { randomStampRotationDeg, renderDefaultSignedPng } from "./signature-image.js";

const boundDrag = new WeakSet();
const boundResize = new WeakSet();

const oppositeCorner = Object.freeze({
  tl: "br",
  tr: "bl",
  bl: "tr",
  br: "tl",
});

const handleDraggedCorner = (handle) => {
  if (handle.classList.contains("stamp__handle--tl")) {
    return "tl";
  }
  if (handle.classList.contains("stamp__handle--tr")) {
    return "tr";
  }
  if (handle.classList.contains("stamp__handle--bl")) {
    return "bl";
  }
  return "br";
};

const cornerClient = (which, frameEl) => {
  const r = frameEl.getBoundingClientRect();
  switch (which) {
    case "tl":
      return { x: r.left, y: r.top };
    case "tr":
      return { x: r.right, y: r.top };
    case "bl":
      return { x: r.left, y: r.bottom };
    case "br":
      return { x: r.right, y: r.bottom };
    default:
      return { x: r.left, y: r.top };
  }
};

const setStampScaleOnly = (stamp, scale) => {
  const s = Math.min(STAMP_SCALE.max, Math.max(STAMP_SCALE.min, scale));
  appState.stampScale = s;
  stamp.style.setProperty("--stamp-scale", String(s));
};

const snapFixedCornerInClientSpace = (
  stamp,
  frameEl,
  fixed,
  fixAnchorClient,
) => {
  const actual = cornerClient(fixed, frameEl);
  const dx = fixAnchorClient.x - actual.x;
  const dy = fixAnchorClient.y - actual.y;
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    return;
  }
  stamp.style.left = `${String(stamp.offsetLeft + dx)}px`;
  stamp.style.top = `${String(stamp.offsetTop + dy)}px`;
};

export const recenterStamp = (stamp, overlay) => {
  const overlayRect = overlay.getBoundingClientRect();
  const before = stamp.getBoundingClientRect();
  const cx = before.left - overlayRect.left + before.width / 2;
  const cy = before.top - overlayRect.top + before.height / 2;

  requestAnimationFrame(() => {
    const after = stamp.getBoundingClientRect();
    const ncx = after.left - overlayRect.left + after.width / 2;
    const ncy = after.top - overlayRect.top + after.height / 2;
    stamp.style.left = `${String(stamp.offsetLeft + (cx - ncx))}px`;
    stamp.style.top = `${String(stamp.offsetTop + (cy - ncy))}px`;
  });
};

const bindStampResize = (handle, stamp, overlay) => {
  if (boundResize.has(handle)) {
    return;
  }
  boundResize.add(handle);

  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    if (event.button !== 0) {
      return;
    }

    const frame = stamp.querySelector(".stamp__frame");
    if (!frame) {
      return;
    }

    handle.setPointerCapture(event.pointerId);

    const dragged = handleDraggedCorner(handle);
    const fixed = oppositeCorner[dragged];
    const fixAnchorClient = cornerClient(fixed, frame);
    const startDist = Math.max(
      20,
      Math.hypot(
        event.clientX - fixAnchorClient.x,
        event.clientY - fixAnchorClient.y,
      ),
    );
    const startScale = appState.stampScale;

    const onMove = (moveEvent) => {
      const curDist = Math.max(
        20,
        Math.hypot(
          moveEvent.clientX - fixAnchorClient.x,
          moveEvent.clientY - fixAnchorClient.y,
        ),
      );
      const nextScale = startScale * (curDist / startDist);
      setStampScaleOnly(stamp, nextScale);
      snapFixedCornerInClientSpace(stamp, frame, fixed, fixAnchorClient);
    };

    const onEnd = (endEvent) => {
      handle.releasePointerCapture(endEvent.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
      maybePropagateStampSync();
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  });
};

const bindStampDelete = (button, overlay) => {
  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    void restoreDefaultSignature(overlay);
  });
};

export const bindStampDrag = (stamp) => {
  if (boundDrag.has(stamp)) {
    return;
  }
  boundDrag.add(stamp);

  stamp.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest(".stamp__delete, .stamp__handle")) {
      return;
    }

    const overlay = stamp.offsetParent;
    if (!overlay) {
      return;
    }

    stamp.classList.add("is-dragging");
    stamp.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    const originLeft = stamp.offsetLeft;
    const originTop = stamp.offsetTop;

    const maxLeft = overlay.clientWidth - stamp.offsetWidth;
    const maxTop = overlay.clientHeight - stamp.offsetHeight;

    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const nextLeft = Math.max(0, Math.min(originLeft + dx, maxLeft));
      const nextTop = Math.max(0, Math.min(originTop + dy, maxTop));
      stamp.style.left = `${String(nextLeft)}px`;
      stamp.style.top = `${String(nextTop)}px`;
    };

    const onEnd = (endEvent) => {
      stamp.releasePointerCapture(endEvent.pointerId);
      stamp.classList.remove("is-dragging");
      stamp.removeEventListener("pointermove", onMove);
      stamp.removeEventListener("pointerup", onEnd);
      stamp.removeEventListener("pointercancel", onEnd);
      maybePropagateStampSync();
    };

    stamp.addEventListener("pointermove", onMove);
    stamp.addEventListener("pointerup", onEnd);
    stamp.addEventListener("pointercancel", onEnd);
  });
};

export const assignStampRotation = (stampEl, deg) => {
  appState.stampRotationDeg = deg;
  stampEl.style.setProperty("--stamp-rot", `${String(deg)}deg`);
};

const setStampSource = (stampEl, source) => {
  const del = stampEl.querySelector(".stamp__delete");
  if (!del) {
    return;
  }
  const isCustom = source === "custom";
  del.hidden = !isCustom;
  del.setAttribute("aria-hidden", isCustom ? "false" : "true");
  if (!isCustom) {
    del.tabIndex = -1;
  } else {
    del.removeAttribute("tabIndex");
  }
};

const applyStampImageSizing = (stampEl, overlay) => {
  const img = stampEl.querySelector(".stamp__img");
  if (!img?.naturalWidth) {
    return;
  }
  const cap = 220;
  const base = Math.min(img.naturalWidth, cap);
  stampEl.style.setProperty("--stamp-base-w", `${String(base)}px`);
  recenterStamp(stampEl, overlay);
};

export const applyStampFromPng = (
  stampEl,
  overlay,
  dataUrl,
  pngBytes,
  ariaLabel = "Signature",
  options = {},
) => {
  const img = stampEl.querySelector(".stamp__img");
  if (!img) {
    return;
  }

  const source = options.source === "custom" ? "custom" : "default";

  appState.stampPngBytes = new Uint8Array(pngBytes);
  stampEl.setAttribute("aria-label", ariaLabel);
  img.alt = ariaLabel;
  setStampSource(stampEl, source);

  appState.stampScale = STAMP_DEFAULT_PREVIEW_SCALE;
  stampEl.style.setProperty(
    "--stamp-scale",
    String(STAMP_DEFAULT_PREVIEW_SCALE),
  );

  const onReady = () => {
    applyStampImageSizing(stampEl, overlay);
  };

  img.onload = onReady;
  img.src = dataUrl;

  if (img.complete && img.naturalWidth > 0) {
    onReady();
  }
};

export const ensureStamp = (overlay) => {
  let stamp = overlay.querySelector(".stamp");
  if (stamp) {
    return stamp;
  }

  stamp = document.createElement("div");
  stamp.className = "stamp";
  stamp.setAttribute("role", "group");
  stamp.setAttribute("aria-label", "Signature");

  const del = document.createElement("button");
  del.type = "button";
  del.className = "stamp__delete";
  del.innerHTML = "×";
  del.setAttribute("aria-label", "Remove signature and restore default");

  const frame = document.createElement("div");
  frame.className = "stamp__frame";

  const img = document.createElement("img");
  img.className = "stamp__img";
  img.draggable = false;

  frame.appendChild(img);

  const cornerSpecs = [
    ["stamp__handle--tl", "nwse-resize"],
    ["stamp__handle--tr", "nesw-resize"],
    ["stamp__handle--bl", "nesw-resize"],
    ["stamp__handle--br", "nwse-resize"],
  ];

  for (const [className, cursor] of cornerSpecs) {
    const handle = document.createElement("span");
    handle.className = `stamp__handle ${className}`;
    handle.setAttribute("aria-hidden", "true");
    handle.style.cursor = cursor;
    frame.appendChild(handle);
    bindStampResize(handle, stamp, overlay);
  }

  stamp.appendChild(del);
  stamp.appendChild(frame);
  overlay.appendChild(stamp);

  bindStampDrag(stamp);
  bindStampDelete(del, overlay);
  setStampSource(stamp, "default");

  return stamp;
};

export const restoreDefaultSignature = async (overlay) => {
  const stamp = ensureStamp(overlay);
  assignStampRotation(stamp, randomStampRotationDeg());
  const { dataUrl, bytes } = await renderDefaultSignedPng();
  applyStampFromPng(stamp, overlay, dataUrl, bytes, "Signed", {
    source: "default",
  });
  const img = stamp.querySelector(".stamp__img");
  if (img?.decode) {
    try {
      await img.decode();
    } catch {
      /* ignore */
    }
  }
  applyStampImageSizing(stamp, overlay);
  scheduleDefaultStampPlacement(stamp, overlay);
};

const placeStampDefault = (stamp, overlay) => {
  const { defaultPadPx: pad } = STAMP_LAYOUT;
  const maxLeft = Math.max(pad, overlay.clientWidth - stamp.offsetWidth - pad);
  const maxTop = Math.max(pad, overlay.clientHeight - stamp.offsetHeight - pad);
  stamp.style.left = `${String(maxLeft)}px`;
  stamp.style.top = `${String(maxTop)}px`;
};

export const scheduleDefaultStampPlacement = (stamp, overlay, attempt = 0) => {
  requestAnimationFrame(() => {
    const ready = overlay.clientWidth > 0 && overlay.clientHeight > 0;
    if (ready || attempt > STAMP_LAYOUT.placementRetries) {
      placeStampDefault(stamp, overlay);
      maybePropagateStampSync();
      return;
    }
    scheduleDefaultStampPlacement(stamp, overlay, attempt + 1);
  });
};
