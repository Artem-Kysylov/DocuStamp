import { exportStampedPdf } from "./export-pdf.js";
import { updateToolbarExportNote } from "./export-note.js";
import { consumeFreeExportSlot, getRemainingFreeExportsToday } from "./free-export-quota.js";
import { openPaywallModal } from "./paywall-modal.js";
import { getLatestIsPro } from "./pro-status.js";
import { resetWorkspaceToIntro } from "./reset-workspace.js";

const USER_PDF_LOAD = "docstamp:user-pdf-load";

const triggerIntroReenterMotion = () => {
  const intro = document.getElementById("intro-section");
  if (!intro) {
    return;
  }
  intro.classList.remove("dropzone-section--reenter");
  requestAnimationFrame(() => {
    intro.classList.add("dropzone-section--reenter");
    intro.addEventListener(
      "animationend",
      () => {
        intro.classList.remove("dropzone-section--reenter");
      },
      { once: true },
    );
  });
};

export const wireToolbar = () => {
  const downloadBtn = document.getElementById("btn-download");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (getLatestIsPro()) {
        void exportStampedPdf();
        updateToolbarExportNote();
        return;
      }

      const remaining = getRemainingFreeExportsToday();
      if (remaining <= 0) {
        openPaywallModal();
        updateToolbarExportNote();
        return;
      }

      consumeFreeExportSlot();
      updateToolbarExportNote();
      void exportStampedPdf();
    });
  }

  const fileInput = document.getElementById("file-input");
  const replaceBtn = document.getElementById("btn-replace-document");
  if (replaceBtn && fileInput) {
    replaceBtn.addEventListener("click", () => {
      fileInput.click();
    });
  }

  const clearBtn = document.getElementById("clear-doc-btn");
  if (clearBtn && fileInput) {
    clearBtn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent(USER_PDF_LOAD));
      fileInput.value = "";
      void resetWorkspaceToIntro().then(() => {
        document.body.classList.remove("doc-loaded");
        triggerIntroReenterMotion();
      });
    });
  }
};
