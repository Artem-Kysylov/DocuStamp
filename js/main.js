import { configurePdfWorker } from "./pdfjs-config.js";
import { wireDropzone } from "./dropzone.js";
import { wireToolbar } from "./toolbar.js";
import { wireSignatureModal } from "./signature-modal.js";
import { wirePdfPager } from "./load-pdf.js";
import { wireGlobalReplaceDrop } from "./global-replace-drop.js";
import { wireStampPageSyncToggle } from "./page-sync.js";

import { wireSectionReveal } from "./section-reveal.js";

configurePdfWorker();
wireDropzone();
wireToolbar();
wirePdfPager();
wireStampPageSyncToggle();
wireGlobalReplaceDrop();
wireSignatureModal();
wireSectionReveal();
