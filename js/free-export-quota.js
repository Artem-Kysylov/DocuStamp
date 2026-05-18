const KEY_COUNT = "docstamp_free_exports";
const KEY_DATE = "docstamp_last_export_date";
const DAILY_ALLOWANCE = 2;

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

/** Resets quota when the calendar day changes (local date). */
export const ensureQuotaForCurrentDay = () => {
  const today = todayIsoDate();
  const storedDate = localStorage.getItem(KEY_DATE);
  if (storedDate !== today) {
    localStorage.setItem(KEY_DATE, today);
    localStorage.setItem(KEY_COUNT, String(DAILY_ALLOWANCE));
  }
};

/** Remaining free exports for today (non-Pro). */
export const getRemainingFreeExportsToday = () => {
  ensureQuotaForCurrentDay();
  const raw = localStorage.getItem(KEY_COUNT);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? Math.max(0, n) : DAILY_ALLOWANCE;
};

export const consumeFreeExportSlot = () => {
  ensureQuotaForCurrentDay();
  const raw = localStorage.getItem(KEY_COUNT);
  let n = parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    n = DAILY_ALLOWANCE;
  }
  const next = Math.max(0, n - 1);
  localStorage.setItem(KEY_COUNT, String(next));
  localStorage.setItem(KEY_DATE, todayIsoDate());
};
