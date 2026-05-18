import {
  auth,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
} from "./auth.js";
import { showToast } from "./ui-utils.js";

const PREMIUM_CTA_SELECTOR = ".landing-pricing__cta--premium";
const HEADER_NAV_SELECTOR = ".app-header__nav";
const DEFAULT_CTA_LABEL = "Get Lifetime Access";
const LOGGED_IN_CTA_LABEL = "Proceed to Payment 🚀";
/** Fallback when Firebase returns no photo URL (SVG placeholder; avoid interpolating URLs into HTML). */
const DEFAULT_AVATAR_SRC = "./logo/default-avatar.svg";

const bindSignOutButton = () => {
  document.getElementById("btn-signout")?.addEventListener("click", () => {
    void logout();
  });
};

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
 * Syncs premium pricing CTA label with Firebase auth, header profile UI, and checkout/login click paths.
 */
export function wirePremiumCtaAuth() {
  const cta = document.querySelector(PREMIUM_CTA_SELECTOR);

  const syncCtaLabel = (user) => {
    if (!cta) {
      return;
    }
    cta.textContent = user ? LOGGED_IN_CTA_LABEL : DEFAULT_CTA_LABEL;
  };

  onAuthStateChanged(auth, (user) => {
    syncCtaLabel(user);
    syncHeaderNav(user);
  });

  if (!cta) {
    return;
  }

  cta.addEventListener("click", async (event) => {
    event.preventDefault();

    if (auth.currentUser) {
      console.log("Redirecting to Paddle for:", auth.currentUser.email);
      return;
    }

    try {
      const user = await loginWithGoogle();
      syncCtaLabel(user);
      const email = user.email ?? "there";
      showToast(`Welcome, ${email}`, "success");
    } catch {
      // Popup cancelled or auth error — label remains default via listener
    }
  });
}
