import { getRemainingFreeExportsToday } from "./free-export-quota.js";
import { getLatestIsPro } from "./pro-status.js";

export const updateToolbarExportNote = () => {
  const el = document.getElementById("toolbar-export-note");
  const downloadBtn = document.getElementById("btn-download");
  if (!el || !downloadBtn) {
    return;
  }

  if (downloadBtn.disabled) {
    el.hidden = true;
    el.textContent = "";
    return;
  }

  if (getLatestIsPro()) {
    el.hidden = true;
    el.textContent = "";
    return;
  }

  const count = getRemainingFreeExportsToday();
  el.textContent = `${count} free exports remaining today`;
  el.hidden = false;
};
