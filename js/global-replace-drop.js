import { loadPdfFromFile } from "./load-pdf.js";

const hasFiles = (dataTransfer) =>
  Boolean(dataTransfer?.types?.includes("Files"));

export const wireGlobalReplaceDrop = () => {
  const overlay = document.getElementById("global-drop-overlay");
  const workspace = document.getElementById("workspace");

  const show = () => {
    if (!overlay) {
      return;
    }
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
  };

  const hide = () => {
    if (!overlay) {
      return;
    }
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
  };

  const workspaceOpen = () => Boolean(workspace && !workspace.hidden);

  document.addEventListener(
    "dragenter",
    (event) => {
      if (!workspaceOpen() || !hasFiles(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
    },
    true,
  );

  document.addEventListener(
    "dragover",
    (event) => {
      if (!workspaceOpen() || !hasFiles(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      show();
    },
    true,
  );

  document.addEventListener(
    "dragleave",
    (event) => {
      if (!workspaceOpen()) {
        return;
      }
      if (event.relatedTarget === null) {
        hide();
      }
    },
    true,
  );

  document.addEventListener(
    "drop",
    (event) => {
      hide();
      if (!workspaceOpen() || !hasFiles(event.dataTransfer)) {
        return;
      }
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        void loadPdfFromFile(file);
      }
    },
    true,
  );

  document.addEventListener(
    "dragend",
    () => {
      hide();
    },
    true,
  );
};
