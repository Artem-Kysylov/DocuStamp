import { PDF_RENDER_SCALE } from "./constants.js";
import { appState } from "./state.js";
import {
  clearDropzoneError,
  clearWorkspaceStatus,
  showPdfLoadError,
} from "./messages.js";
import { isPdfFile, readFileToBytes } from "./file-utils.js";
import {
  applyStampFromPng,
  assignStampRotation,
  ensureStamp,
  scheduleDefaultStampPlacement,
} from "./stamp.js";
import {
  randomStampRotationDeg,
  renderDefaultSignedPng,
} from "./signature-image.js";
import {
  maybePropagateStampSync,
  updateStampSyncToggleVisibility,
} from "./page-sync.js";

let pdfJsDocument = null;

const setDropzoneLoading = (active) => {
  const dz = document.getElementById("dropzone");
  if (!dz) {
    return;
  }
  if (active) {
    dz.classList.remove("is-dragover");
    dz.classList.add("is-loading");
    return;
  }
  dz.classList.remove("is-loading");
};

const setWorkspaceChrome = (active) => {
  document.body.classList.toggle("doc-loaded", active);
  document
    .getElementById("app-main")
    ?.classList.toggle("app-main--workspace", active);
  document
    .getElementById("dropzone")
    ?.classList.toggle("dropzone--dismissed", active);
};

export const setDocWorkspaceActive = setWorkspaceChrome;

const getPageCountWithPdfLib = async (bytes) => {
  const pdfLib = globalThis.PDFLib;
  if (!pdfLib?.PDFDocument?.load) {
    return null;
  }
  try {
    const doc = await pdfLib.PDFDocument.load(bytes, {
      ignoreEncryption: true,
    });
    return doc.getPageCount();
  } catch {
    return null;
  }
};

const saveStampFractionalPosition = (page, stamp, overlay) => {
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  if (w <= 0 || h <= 0) {
    return;
  }
  appState.stampPositionsByPage[page] = {
    xFrac: stamp.offsetLeft / w,
    yFrac: stamp.offsetTop / h,
  };
};

const clampStampInOverlay = (stamp, overlay) => {
  const maxLeft = Math.max(0, overlay.clientWidth - stamp.offsetWidth);
  const maxTop = Math.max(0, overlay.clientHeight - stamp.offsetHeight);
  stamp.style.left = `${String(
    Math.min(Math.max(0, stamp.offsetLeft), maxLeft),
  )}px`;
  stamp.style.top = `${String(
    Math.min(Math.max(0, stamp.offsetTop), maxTop),
  )}px`;
};

const restoreStampFractionalPosition = (page, stamp, overlay) => {
  const rec = appState.stampPositionsByPage[page];
  if (!rec) {
    return false;
  }
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  stamp.style.left = `${String(Math.round(rec.xFrac * w))}px`;
  stamp.style.top = `${String(Math.round(rec.yFrac * h))}px`;
  clampStampInOverlay(stamp, overlay);
  return true;
};

const updatePagerUi = () => {
  const pager = document.getElementById("pdf-pager");
  const label = document.getElementById("pdf-pager-label");
  const prev = document.getElementById("pdf-pager-prev");
  const next = document.getElementById("pdf-pager-next");
  if (!pager || !label || !prev || !next) {
    updateStampSyncToggleVisibility();
    return;
  }
  if (appState.pdfPageCount <= 1) {
    pager.hidden = true;
    updateStampSyncToggleVisibility();
    return;
  }
  pager.hidden = false;
  label.textContent = `Page ${String(appState.currentPdfPage)} / ${String(
    appState.pdfPageCount,
  )}`;
  prev.disabled = appState.currentPdfPage <= 1;
  next.disabled = appState.currentPdfPage >= appState.pdfPageCount;
  updateStampSyncToggleVisibility();
};

/** Box for PDF page bitmap (width + height) so the page fits in the viewport without scrolling. */
const getPreviewFitBox = () => {
  const preview = document.getElementById("preview");
  const workspace = document.getElementById("workspace");
  void workspace?.offsetWidth;

  let containerW = preview?.clientWidth ?? 0;
  let containerH = preview?.clientHeight ?? 0;

  if (containerW <= 0) {
    if (workspace && !workspace.hidden) {
      containerW = workspace.getBoundingClientRect().width;
      if (containerW > 0) {
        containerW -= 72;
      }
    }
  }

  if (containerW <= 0 && typeof window !== "undefined") {
    containerW = Math.min(
      PDF_RENDER_SCALE.previewWidthFallback,
      Math.max(320, window.innerWidth - 48),
    );
  }

  if (containerH <= 0 && typeof window !== "undefined") {
    const vhCap =
      (PDF_RENDER_SCALE.workspaceMaxHeightVh / 100) * window.innerHeight;
    containerH = Math.max(240, vhCap - 120);
  }

  const maxW = Math.max(
    PDF_RENDER_SCALE.minPreviewTargetWidth,
    containerW - PDF_RENDER_SCALE.previewHorizontalPadding,
  );
  const maxH = Math.max(
    PDF_RENDER_SCALE.minPreviewTargetHeight,
    containerH - PDF_RENDER_SCALE.previewVerticalPadding,
  );

  return { maxW, maxH };
};

const renderPdfPageToCanvas = async (pageNumber) => {
  if (!pdfJsDocument) {
    return;
  }
  const page = await pdfJsDocument.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });

  const { maxW, maxH } = getPreviewFitBox();
  const fitScale = Math.min(
    maxW / baseViewport.width,
    maxH / baseViewport.height,
    PDF_RENDER_SCALE.maxFit,
  );
  const viewport = page.getViewport({ scale: fitScale });

  const canvas = document.getElementById("pdf-canvas");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available in this browser.");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
};

const goToRelativePage = async (delta) => {
  const next = appState.currentPdfPage + delta;
  if (
    !pdfJsDocument ||
    next < 1 ||
    next > appState.pdfPageCount ||
    delta === 0
  ) {
    return;
  }

  const overlay = document.getElementById("stamp-overlay");
  const stamp = overlay?.querySelector(".stamp");
  if (stamp && overlay) {
    if (appState.stampSyncAcrossPages && appState.pdfPageCount > 1) {
      maybePropagateStampSync();
    } else {
      saveStampFractionalPosition(appState.currentPdfPage, stamp, overlay);
    }
  }

  appState.currentPdfPage = next;
  await renderPdfPageToCanvas(next);

  if (stamp && overlay) {
    if (!restoreStampFractionalPosition(next, stamp, overlay)) {
      scheduleDefaultStampPlacement(stamp, overlay);
    }
  }

  updatePagerUi();
};

let pagerHandlersBound = false;

export const wirePdfPager = () => {
  if (pagerHandlersBound) {
    return;
  }
  pagerHandlersBound = true;
  document.getElementById("pdf-pager-prev")?.addEventListener("click", () => {
    void goToRelativePage(-1);
  });
  document.getElementById("pdf-pager-next")?.addEventListener("click", () => {
    void goToRelativePage(1);
  });
};

export const disposePdfPreview = async () => {
  if (pdfJsDocument) {
    try {
      await pdfJsDocument.destroy();
    } catch {
      /* ignore */
    }
    pdfJsDocument = null;
  }
  appState.pdfPageCount = 0;
  appState.currentPdfPage = 1;
  appState.stampPositionsByPage = {};
  appState.stampSyncAcrossPages = false;
  updatePagerUi();
};

export const loadPdfFromFile = async (file) => {
  clearDropzoneError();
  clearWorkspaceStatus();

  if (!isPdfFile(file)) {
    showPdfLoadError("Please choose a PDF file.");
    return;
  }

  if (!window.pdfjsLib) {
    showPdfLoadError("Preview library failed to load. Check your connection.");
    return;
  }

  const downloadBtn = document.getElementById("btn-download");
  if (downloadBtn) {
    downloadBtn.disabled = true;
  }

  try {
    setDropzoneLoading(true);

    const bytes = await readFileToBytes(file);
    await disposePdfPreview();

    appState.pdfBytes = new Uint8Array(bytes);
    const bytesForPreview = new Uint8Array(bytes);
    appState.fileName = file.name || "document.pdf";

    const docNameEl = document.getElementById("doc-name");
    if (docNameEl) {
      docNameEl.textContent = appState.fileName;
    }

    const [pdf, libPageCount] = await Promise.all([
      pdfjsLib.getDocument({ data: bytesForPreview }).promise,
      getPageCountWithPdfLib(appState.pdfBytes),
    ]);
    pdfJsDocument = pdf;

    let pageCount = pdf.numPages;
    if (libPageCount != null) {
      if (libPageCount !== pdf.numPages) {
        console.warn(
          "DocStamp: pdf-lib page count differs from preview engine — using pdf.js count.",
          libPageCount,
          pdf.numPages,
        );
      } else {
        pageCount = libPageCount;
      }
    }
    appState.pdfPageCount = pageCount;
    appState.currentPdfPage = 1;

    const workspace = document.getElementById("workspace");
    if (workspace) {
      workspace.hidden = false;
    }
    setWorkspaceChrome(true);
    void workspace?.offsetWidth;
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    await renderPdfPageToCanvas(1);

    const overlay = document.getElementById("stamp-overlay");
    if (overlay) {
      overlay.replaceChildren();
      const stamp = ensureStamp(overlay);
      assignStampRotation(stamp, randomStampRotationDeg());
      const { dataUrl, bytes: pngBytes } = await renderDefaultSignedPng();
      applyStampFromPng(stamp, overlay, dataUrl, pngBytes, "Signed", {
        source: "default",
      });
      const img = stamp.querySelector(".stamp__img");
      if (img?.decode) {
        try {
          await img.decode();
        } catch {
          /* ignore decode errors */
        }
      }
      scheduleDefaultStampPlacement(stamp, overlay);
    }

    updatePagerUi();

    if (downloadBtn) {
      downloadBtn.disabled = false;
    }
  } catch (error) {
    console.error(error);
    showPdfLoadError("Could not read this PDF. Try another file.");
    if (downloadBtn) {
      downloadBtn.disabled = true;
    }
    appState.pdfBytes = null;
    appState.fileName = "";
    const docNameEl = document.getElementById("doc-name");
    if (docNameEl) {
      docNameEl.textContent = "—";
    }
    await disposePdfPreview();
    const intro = document.getElementById("intro-section");
    const workspace = document.getElementById("workspace");
    if (intro) {
      intro.hidden = false;
    }
    if (workspace) {
      workspace.hidden = true;
    }
    setWorkspaceChrome(false);
    const overlay = document.getElementById("stamp-overlay");
    if (overlay) {
      overlay.replaceChildren();
    }
    const canvas = document.getElementById("pdf-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    setDropzoneLoading(false);
  }
};
