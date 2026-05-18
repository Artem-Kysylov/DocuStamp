import { loadPdfFromFile } from "./load-pdf.js";
import { resetWorkspaceToIntro } from "./reset-workspace.js";
import { showToast } from "./ui-utils.js";

const USER_PDF_LOAD = "docstamp:user-pdf-load";
const EXPORTED = "docstamp:exported";

/** Shown in the toolbar when loading the built-in demo asset. */
const DEMO_FILENAME = "sample.pdf";

let fromInstantDemo = false;
let postCtaShown = false;

const exitDemoChrome = () => {
  document.getElementById("btn-download")?.classList.remove("toolbar__btn--demo-pulse");
};

const hidePostCta = () => {
  const cta = document.getElementById("demo-post-cta");
  if (cta) {
    cta.hidden = true;
  }
};

const showPostCta = () => {
  if (postCtaShown || !fromInstantDemo) {
    return;
  }
  postCtaShown = true;
  exitDemoChrome();
  const cta = document.getElementById("demo-post-cta");
  if (cta) {
    cta.hidden = false;
  }
};

const runDemoStampEntrance = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const stamp = document.querySelector(".stamp");
      if (!stamp) {
        return;
      }
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (reduceMotion) {
        return;
      }
      stamp.classList.add("stamp--demo-reveal");
      const onEnd = (event) => {
        if (event.animationName !== "stamp-demo-entrance") {
          return;
        }
        stamp.classList.remove("stamp--demo-reveal");
        stamp.removeEventListener("animationend", onEnd);
      };
      stamp.addEventListener("animationend", onEnd);
    });
  });
};

const startDemoChrome = () => {
  document.getElementById("btn-download")?.classList.add("toolbar__btn--demo-pulse");
};

const wireEngagement = () => {
  const overlay = document.getElementById("stamp-overlay");
  overlay?.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.isTrusted || !fromInstantDemo || postCtaShown) {
        return;
      }
      if (!event.target.closest?.(".stamp")) {
        return;
      }
      showPostCta();
    },
    true,
  );

  document.getElementById("btn-draw-signature")?.addEventListener("click", (event) => {
    if (event.isTrusted && fromInstantDemo && !postCtaShown) {
      showPostCta();
    }
  });
};

const loadInstantDemoPdf = async () => {
  let response;
  try {
    response = await fetch(new URL("sample.pdf", window.location.href));
  } catch {
    showToast("Could not load the demo PDF.", "error");
    return;
  }

  if (!response.ok) {
    showToast("Demo file is missing. Add sample.pdf to the site root.", "error");
    return;
  }

  const blob = await response.blob();
  const file = new File([blob], DEMO_FILENAME, { type: "application/pdf" });

  await loadPdfFromFile(file, { fromDemo: true });

  const workspace = document.getElementById("workspace");
  if (!workspace || workspace.hidden) {
    return;
  }

  fromInstantDemo = true;
  postCtaShown = false;
  hidePostCta();
  startDemoChrome();
  runDemoStampEntrance();
};

export const wireInstantDemo = () => {
  const btn = document.getElementById("btn-instant-demo");
  const fileInput = document.getElementById("file-input");
  const uploadCtaBtn = document.getElementById("demo-post-cta-upload");

  if (!btn || !fileInput) {
    return;
  }

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void loadInstantDemoPdf();
  });

  document.addEventListener(USER_PDF_LOAD, () => {
    fromInstantDemo = false;
    postCtaShown = false;
    hidePostCta();
    exitDemoChrome();
  });

  document.addEventListener(EXPORTED, () => {
    if (fromInstantDemo) {
      showPostCta();
    }
  });

  uploadCtaBtn?.addEventListener("click", () => {
    fromInstantDemo = false;
    postCtaShown = false;
    hidePostCta();
    exitDemoChrome();
    void resetWorkspaceToIntro().then(() => {
      fileInput.click();
    });
  });

  wireEngagement();
};
