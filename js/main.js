import "./ui-utils.js";
import { configurePdfWorker } from "./pdfjs-config.js";
import { wireDropzone } from "./dropzone.js";
import { wireToolbar } from "./toolbar.js";
import { wireSignatureModal } from "./signature-modal.js";
import { wirePdfPager } from "./load-pdf.js";
import { wireGlobalReplaceDrop } from "./global-replace-drop.js";
import { wireStampPageSyncToggle } from "./page-sync.js";

import { wireSectionReveal } from "./section-reveal.js";
import { wireCookieConsent } from "./cookie-consent.js";
import { wireInstantDemo } from "./demo-controller.js";
import { wirePremiumCtaAuth } from "./wire-premium-cta-auth.js";

configurePdfWorker();
wireDropzone();
wireInstantDemo();
wireToolbar();
wirePdfPager();
wireStampPageSyncToggle();
wireGlobalReplaceDrop();
wireSignatureModal();
wireSectionReveal();
wireCookieConsent();
wirePremiumCtaAuth();
