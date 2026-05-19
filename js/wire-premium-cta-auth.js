import {
  auth,
  db,
  doc,
  getDoc,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
} from "./auth.js";
import { updateToolbarExportNote } from "./export-note.js";
import { initializePaddle, openLifetimeCheckout } from "./paddle-docstamp.js";
import { getLatestIsPro, setLatestIsPro } from "./pro-status.js";
import { showToast } from "./ui-utils.js";

const PREMIUM_CTA_SELECTOR = ".landing-pricing__cta--premium";
const HEADER_NAV_SELECTOR = ".app-header__nav";
const DEFAULT_CTA_LABEL = "Get Lifetime Access";
const LOGGED_IN_CTA_LABEL = "Proceed to Payment 🚀";
const LOGGED_IN_PRO_LABEL = "Pro Lifetime Activated 💎";
/** Fallback when Firebase returns no photo URL (SVG placeholder; avoid interpolating URLs into HTML). */
const DEFAULT_AVATAR_SRC = "./logo/default-avatar.svg";

/**
 * @param user
 */
const fetchUserIsPro = async (user) => {
  if (!user) {
    return false;
  }
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    return Boolean(snap.exists && snap.data()?.isPro === true);
  } catch (err) {
    console.error("Firestore read failed:", err);
    return false;
  }
};

const wrapLocalProcessingBadge = (localBadge) => {
  const tray = document.createElement("div");
  tray.className = "fixed-badges-tray";
  localBadge.parentNode?.insertBefore(tray, localBadge);
  tray.appendChild(localBadge);
  return tray;
};

/**
 * @param {boolean} isPro
 */
const syncProBadge = (isPro) => {
  const localBadge = document.querySelector(".local-processing-badge");
  if (!localBadge) {
    return;
  }

  const tray =
    localBadge.closest(".fixed-badges-tray") ?? wrapLocalProcessingBadge(localBadge);

  let proEl = tray.querySelector(".badge-pro-lifetime");
  if (isPro) {
    if (!proEl) {
      proEl = document.createElement("span");
      proEl.className = "badge-pro-lifetime";
      proEl.textContent = "Pro Lifetime";
      tray.insertBefore(proEl, localBadge);
    }
    return;
  }
  proEl?.remove();
};

const bindSignOutButton = () => {
  document.getElementById("btn-signout")?.addEventListener("click", () => {
    void logout();
  });
};

/**
 * @param user
 */
const syncHeaderNav = (user) => {
  const headerNav = document.querySelector(HEADER_NAV_SELECTOR);
  if (!headerNav) {
    return;
  }

  if (user) {
    headerNav.innerHTML = `
      <a class="app-header__link" href="#pricing">Pricing</a>
      <div class="user-profile">
        <img alt="User avatar" class="user-profile__avatar" referrerpolicy="no-referrer" width="32" height="32" decoding="async">
        <button type="button" id="btn-signout" class="user-profile__logout">Sign out</button>
      </div>
    `;
    const avatar = headerNav.querySelector(".user-profile__avatar");
    if (avatar instanceof HTMLImageElement) {
      avatar.src = user.photoURL || DEFAULT_AVATAR_SRC;
    }
    bindSignOutButton();
    return;
  }

  headerNav.innerHTML = `<a class="app-header__link" href="#pricing">Pricing</a>`;
};

/**
 * Syncs premium pricing CTA label with Firebase auth, header profile UI, checkout/login click paths, and Pro UI from Firestore.
 */
export function wirePremiumCtaAuth() {
  initializePaddle();

  const cta = document.querySelector(PREMIUM_CTA_SELECTOR);

  /**
   * @param user
   * @param {boolean} isPro
   */
  const syncPremiumCta = (user, isPro) => {
    if (!cta) {
      return;
    }
    if (!user) {
      cta.textContent = DEFAULT_CTA_LABEL;
      cta.classList.remove("landing-pricing__cta--disabled");
      cta.removeAttribute("aria-disabled");
      cta.removeAttribute("tabindex");
      return;
    }
    if (isPro) {
      cta.textContent = LOGGED_IN_PRO_LABEL;
      cta.classList.add("landing-pricing__cta--disabled");
      cta.setAttribute("aria-disabled", "true");
      cta.setAttribute("tabindex", "-1");
      return;
    }
    cta.textContent = LOGGED_IN_CTA_LABEL;
    cta.classList.remove("landing-pricing__cta--disabled");
    cta.removeAttribute("aria-disabled");
    cta.removeAttribute("tabindex");
  };

  onAuthStateChanged(auth, async (user) => {
    syncHeaderNav(user);

    const isPro = user ? await fetchUserIsPro(user) : false;
    setLatestIsPro(isPro);

    syncPremiumCta(user, isPro);
    syncProBadge(isPro);
    updateToolbarExportNote();
  });

  if (!cta) {
    return;
  }

  cta.addEventListener("click", async (event) => {
    event.preventDefault();

    if (getLatestIsPro()) {
      return;
    }

    if (auth.currentUser) {
      openLifetimeCheckout();
      return;
    }

    try {
      const user = await loginWithGoogle();
      const email = user.email ?? "there";
      showToast(`Welcome, ${email}`, "success");
    } catch {
      // Popup cancelled or auth error — label remains default via listener
    }
  });
}
