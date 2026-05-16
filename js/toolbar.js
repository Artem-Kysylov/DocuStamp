import { exportStampedPdf } from "./export-pdf.js";
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
