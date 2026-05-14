export const showDropzoneError = (message) => {
  const el = document.getElementById("dropzone-error");
  if (!el) {
    return;
  }
  el.textContent = message;
  el.hidden = false;
};

export const clearDropzoneError = () => {
  const el = document.getElementById("dropzone-error");
  if (!el) {
    return;
  }
  el.textContent = "";
  el.hidden = true;
};

/** When the upload strip is hidden, surface errors in the workspace strip. */
export const showPdfLoadError = (message) => {
  const intro = document.getElementById("intro-section");
  if (intro?.hidden) {
    showWorkspaceStatus(message);
    return;
  }
  showDropzoneError(message);
};

export const showWorkspaceStatus = (message) => {
  const el = document.getElementById("workspace-status");
  if (!el) {
    return;
  }
  el.textContent = message;
  el.hidden = false;
};

export const clearWorkspaceStatus = () => {
  const el = document.getElementById("workspace-status");
  if (!el) {
    return;
  }
  el.textContent = "";
  el.hidden = true;
};
