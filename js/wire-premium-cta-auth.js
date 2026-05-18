import {
  auth,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
} from "./auth.js";
import { showToast } from "./ui-utils.js";

const PADDLE_CLIENT_TOKEN = "test_53d800b69911a0c5df9abc3db19";

/**
 * Runs after the rest of main.js (including section reveal). Never throws — a failing Paddle init must not break the whole app.
 */
const initializePaddleSandbox = () => {
  if (typeof Paddle === "undefined") {
    console.error("Paddle SDK not loaded");
    return;
  }
  try {
    const maybePromise = Paddle.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      environment: "sandbox",
    });
    if (maybePromise != null && typeof maybePromise.then === "function") {
      void maybePromise.catch((err) => {
        console.error("Paddle.Initialize failed:", err);
      });
    }
  } catch (err) {
    console.error("Paddle.Initialize failed:", err);
  }
};

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
  initializePaddleSandbox();

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
      const user = auth.currentUser;
      if (typeof Paddle === "undefined" || typeof Paddle.Checkout?.open !== "function") {
        console.error("Paddle SDK not loaded");
        return;
      }
      Paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "dark",
          locale: "en",
        },
        items: [
          {
            priceId: "pri_01krxw0cgqnstwgajbv61zf4cw",
            quantity: 1,
          },
        ],
        customer: {
          email: user.email ?? "",
        },
      });
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
