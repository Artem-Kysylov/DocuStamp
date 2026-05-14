import { loadPdfFromFile } from "./load-pdf.js";

export const wireDropzone = () => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");

  if (!dropzone || !fileInput) {
    return;
  }

  let dragDepth = 0;

  const setDragOver = (active) => {
    dropzone.classList.toggle("is-dragover", active);
  };

  dropzone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth += 1;
    setDragOver(true);
  });

  dropzone.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      setDragOver(false);
    }
  });

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void loadPdfFromFile(file);
    }
  });

  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", () => {
    const picked = fileInput.files?.[0];
    fileInput.value = "";
    if (picked) {
      void loadPdfFromFile(picked);
    }
  });
};
