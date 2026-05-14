import { exportStampedPdf } from "./export-pdf.js";

export const wireToolbar = () => {
  const downloadBtn = document.getElementById("btn-download");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      void exportStampedPdf();
    });
  }

  const replaceBtn = document.getElementById("btn-replace-document");
  const fileInput = document.getElementById("file-input");
  if (replaceBtn && fileInput) {
    replaceBtn.addEventListener("click", () => {
      fileInput.click();
    });
  }
};
