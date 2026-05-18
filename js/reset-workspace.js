import { STAMP_DEFAULT_PREVIEW_SCALE } from "./constants.js";
import { updateToolbarExportNote } from "./export-note.js";
import { appState } from "./state.js";
import { clearDropzoneError, clearWorkspaceStatus } from "./messages.js";
import {
  disposePdfPreview,
  setDocWorkspaceActive,
} from "./load-pdf.js";

export const resetWorkspaceToIntro = async () => {
  await disposePdfPreview();
  appState.pdfBytes = null;
  appState.fileName = "";
  appState.stampPngBytes = null;
  appState.stampRotationDeg = 0;
  appState.stampScale = STAMP_DEFAULT_PREVIEW_SCALE;

  const modal = document.getElementById("signature-modal");
  const drawBtn = document.getElementById("btn-draw-signature");
  if (modal) {
    modal.hidden = true;
  }
  if (drawBtn) {
    drawBtn.setAttribute("aria-expanded", "false");
  }

  const intro = document.getElementById("intro-section");
  const workspace = document.getElementById("workspace");
  if (intro) {
    intro.hidden = false;
  }
  if (workspace) {
    workspace.hidden = true;
  }
  setDocWorkspaceActive(false);

  const canvas = document.getElementById("pdf-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  }

  const overlay = document.getElementById("stamp-overlay");
  if (overlay) {
    overlay.replaceChildren();
  }

  const docName = document.getElementById("doc-name");
  if (docName) {
    docName.textContent = "—";
  }

  const downloadBtn = document.getElementById("btn-download");
  if (downloadBtn) {
    downloadBtn.disabled = true;
    updateToolbarExportNote();
  }

  clearDropzoneError();
  clearWorkspaceStatus();
};
