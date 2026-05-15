/** @typedef {'error' | 'success'} ToastType */

const TOAST_VISIBLE_MS = 4000;
const TOAST_EXIT_MS = 320;
const CONTAINER_ID = "toast-container";

const ensureToastContainer = () => {
  let el = document.getElementById(CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    el.className = "toast-container";
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
};

/**
 * @param {string} message
 * @param {ToastType} [type]
 */
export function showToast(message, type = "error") {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("toast--visible");
    });
  });

  window.setTimeout(() => {
    toast.classList.remove("toast--visible");
    const onDone = () => {
      toast.removeEventListener("transitionend", onDone);
      toast.remove();
    };
    toast.addEventListener("transitionend", onDone);
    window.setTimeout(() => {
      if (toast.isConnected) {
        toast.removeEventListener("transitionend", onDone);
        toast.remove();
      }
    }, TOAST_EXIT_MS);
  }, TOAST_VISIBLE_MS);
}

globalThis.showToast = showToast;
