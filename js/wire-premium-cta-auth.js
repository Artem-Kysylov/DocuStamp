import {
  auth,
  db,
  doc,
  getDoc,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
  setDoc,
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
    if (typeof Paddle.Environment?.set === "function") {
      Paddle.Environment.set("sandbox");
    }
    const maybePromise = Paddle.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      eventCallback: async (paddleEvent) => {
        if (paddleEvent?.name !== "checkout.completed") {
          return;
        }
        await persistProAndReload();
      },
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
const LOGGED_IN_PRO_LABEL = "Pro Lifetime Activated 💎";
/** Fallback when Firebase returns no photo URL (SVG placeholder; avoid interpolating URLs into HTML). */
const DEFAULT_AVATAR_SRC = "./logo/default-avatar.svg";

let checkoutCompletionReloadScheduled = false;

const persistProAndReload = async () => {
  if (checkoutCompletionReloadScheduled) {
    return;
  }
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return;
  }
  checkoutCompletionReloadScheduled = true;
  try {
    await setDoc(doc(db, "users", uid), { isPro: true }, { merge: true });
    window.location.reload();
  } catch (err) {
    checkoutCompletionReloadScheduled = false;
    console.error("Failed to save Pro status:", err);
  }
};

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
  initializePaddleSandbox();

  const cta = document.querySelector(PREMIUM_CTA_SELECTOR);
  /** @type {boolean} */
  let latestIsPro = false;

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
    latestIsPro = isPro;

    syncPremiumCta(user, isPro);
    syncProBadge(isPro);
  });

  if (!cta) {
    return;
  }

  cta.addEventListener("click", async (event) => {
    event.preventDefault();

    if (latestIsPro) {
      return;
    }

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
          eventCallback: async (paddleEvent) => {
            if (paddleEvent?.name !== "checkout.completed") {
              return;
            }
            await persistProAndReload();
          },
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
      const email = user.email ?? "there";
      showToast(`Welcome, ${email}`, "success");
    } catch {
      // Popup cancelled or auth error — label remains default via listener
    }
  });
}
