import { buildDownloadName } from "./file-utils.js";
import {
  clearWorkspaceStatus,
  showWorkspaceStatus,
} from "./messages.js";
import { appState } from "./state.js";

const drawStampOnPdfPage = (
  page,
  pageWidth,
  pageHeight,
  left,
  top,
  stampWidth,
  stampHeight,
  canvasRect,
  pngImage,
  toDegrees,
) => {
  const xPdf = (left / canvasRect.width) * pageWidth;
  const widthPdf = (stampWidth / canvasRect.width) * pageWidth;
  const heightPdf = (stampHeight / canvasRect.height) * pageHeight;
  const yPdf =
    ((canvasRect.height - top - stampHeight) / canvasRect.height) *
    pageHeight;

  page.drawImage(pngImage, {
    x: xPdf,
    y: yPdf,
    width: widthPdf,
    height: heightPdf,
    rotate: toDegrees(appState.stampRotationDeg),
    opacity: 0.95,
  });
};

export const exportStampedPdf = async () => {
  clearWorkspaceStatus();

  const pdfLib = globalThis.PDFLib;
  if (!appState.pdfBytes || !pdfLib) {
    showWorkspaceStatus("PDF tools are not ready yet.");
    return;
  }

  if (!appState.stampPngBytes?.length) {
    showWorkspaceStatus("Signature image is not ready.");
    return;
  }

  const stamp = document.querySelector(".stamp");
  const canvas = document.getElementById("pdf-canvas");
  if (!stamp || !canvas) {
    showWorkspaceStatus("Nothing to export yet.");
    return;
  }

  const { PDFDocument, degrees } = pdfLib;

  try {
    const doc = await PDFDocument.load(appState.pdfBytes, {
      ignoreEncryption: true,
    });
    const pageCount = doc.getPageCount();
    const currentIndex = Math.min(
      Math.max(0, appState.currentPdfPage - 1),
      pageCount - 1,
    );

    const canvasRect = canvas.getBoundingClientRect();
    const img = stamp.querySelector(".stamp__img");
    if (!img) {
      showWorkspaceStatus("Signature image is missing.");
      return;
    }
    const stampRect = img.getBoundingClientRect();

    const left = stampRect.left - canvasRect.left;
    const top = stampRect.top - canvasRect.top;
    const stampWidth = stampRect.width;
    const stampHeight = stampRect.height;

    const pngImage = await doc.embedPng(appState.stampPngBytes);

    const syncAll =
      appState.stampSyncAcrossPages && pageCount > 1;

    if (syncAll) {
      for (let i = 0; i < pageCount; i += 1) {
        const page = doc.getPage(i);
        const { width: pageWidth, height: pageHeight } = page.getSize();
        drawStampOnPdfPage(
          page,
          pageWidth,
          pageHeight,
          left,
          top,
          stampWidth,
          stampHeight,
          canvasRect,
          pngImage,
          degrees,
        );
      }
    } else {
      const page = doc.getPage(currentIndex);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      drawStampOnPdfPage(
        page,
        pageWidth,
        pageHeight,
        left,
        top,
        stampWidth,
        stampHeight,
        canvasRect,
        pngImage,
        degrees,
      );
    }

    const outputBytes = await doc.save();
    const blob = new Blob([outputBytes], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = buildDownloadName(appState.fileName);
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    document.dispatchEvent(new CustomEvent("docstamp:exported"));
  } catch (error) {
    console.error(error);
    const detail =
      error instanceof Error && error.message
        ? ` ${error.message}`
        : "";
    showWorkspaceStatus(
      `Export failed.${detail}`.slice(0, 240),
    );
  }
};
