import { appState } from "./state.js";

let toastHideTimer = 0;

export const maybePropagateStampSync = () => {
  if (!appState.stampSyncAcrossPages || appState.pdfPageCount <= 1) {
    return;
  }
  const overlay = document.getElementById("stamp-overlay");
  const stamp = overlay?.querySelector(".stamp");
  if (!stamp || !overlay) {
    return;
  }
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  if (w <= 0 || h <= 0) {
    return;
  }
  const payload = {
    xFrac: stamp.offsetLeft / w,
    yFrac: stamp.offsetTop / h,
  };
  for (let p = 1; p <= appState.pdfPageCount; p += 1) {
    appState.stampPositionsByPage[p] = { ...payload };
  }
};

export const showStampSyncToast = (message) => {
  const el = document.getElementById("doc-toast");
  if (!el) {
    return;
  }
  el.textContent = message;
  el.hidden = false;
  window.clearTimeout(toastHideTimer);
  toastHideTimer = window.setTimeout(() => {
    el.hidden = true;
  }, 2600);
};

export const updateStampSyncToggleVisibility = () => {
  const btn = document.getElementById("stamp-sync-toggle");
  if (!btn) {
    return;
  }
  const show = appState.pdfPageCount > 1;
  btn.hidden = !show;
  if (!show) {
    appState.stampSyncAcrossPages = false;
    btn.setAttribute("aria-checked", "false");
    btn.classList.remove("is-active");
  }
};

export const wireStampPageSyncToggle = () => {
  const btn = document.getElementById("stamp-sync-toggle");
  if (!btn) {
    return;
  }
  btn.addEventListener("click", () => {
    if (appState.pdfPageCount <= 1) {
      return;
    }
    const next = !appState.stampSyncAcrossPages;
    appState.stampSyncAcrossPages = next;
    btn.setAttribute("aria-checked", next ? "true" : "false");
    btn.classList.toggle("is-active", next);
    if (next) {
      maybePropagateStampSync();
      showStampSyncToast("Signature applied to all slides");
    }
  });
};
