import { PDFJS_WORKER_URL } from "./constants.js";

export const configurePdfWorker = () => {
  if (!window.pdfjsLib) {
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
};
