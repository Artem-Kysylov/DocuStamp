import { auth, loginWithGoogle } from "./auth.js";
import { updateToolbarExportNote } from "./export-note.js";
import { openLifetimeCheckout } from "./paddle-docstamp.js";

const paywallOverlay = () => document.getElementById("paywall-modal");

export const openPaywallModal = () => {
  const overlay = paywallOverlay();
  overlay?.classList.add("paywall-overlay--active");
  overlay?.setAttribute("aria-hidden", "false");
};

export const closePaywallModal = () => {
  const overlay = paywallOverlay();
  overlay?.classList.remove("paywall-overlay--active");
  overlay?.setAttribute("aria-hidden", "true");
};

export const wirePaywallModal = () => {
  document.getElementById("paywall-close-btn")?.addEventListener("click", () => {
    closePaywallModal();
  });

  document.getElementById("paywall-modal")?.addEventListener("click", (event) => {
    if (event.target?.id === "paywall-modal") {
      closePaywallModal();
    }
  });

  document.getElementById("paywall-cta-btn")?.addEventListener("click", async () => {
    if (!auth.currentUser) {
      try {
        await loginWithGoogle();
      } catch {
        return;
      }
    }
    closePaywallModal();
    openLifetimeCheckout();
  });

  document.addEventListener("docstamp:exported", () => {
    updateToolbarExportNote();
  });
};
