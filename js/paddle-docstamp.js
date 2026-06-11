import { auth, db, doc, setDoc } from "./auth.js";

export const PADDLE_CLIENT_TOKEN = "live_4c337f8e6823fd7753ff3a0ddce";

// Новые Price ID для боевых тарифов
export const PADDLE_PRICE_IDS = {
  YEARLY: "pri_01ktv9x8ba3qd0fy0fe1nvwdx6",   // $19 - 1 Year Pass
  LIFETIME: "pri_01ktv9wepg8z8mz8myz328gprz"  // $29 - Pro Lifetime Access
};

export const PADDLE_CHECKOUT_SETTINGS = {
  displayMode: "overlay",
  theme: "light",
  locale: "en",
};

let checkoutCompletionReloadScheduled = false;

export const persistProAndReload = async () => {
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

export const initializePaddle = () => {
  if (typeof Paddle === "undefined") {
    console.error("Paddle SDK not loaded");
    return;
  }
  try {
    const maybePromise = Paddle.Initialize({
      token: PADDLE_CLIENT_TOKEN,
      checkout: {
        settings: PADDLE_CHECKOUT_SETTINGS,
      },
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

export const openCheckoutWithPriceId = (priceId) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("DocStamp: login required before Paddle checkout");
    return;
  }
  if (typeof Paddle === "undefined" || typeof Paddle.Checkout?.open !== "function") {
    console.error("Paddle SDK not loaded");
    return;
  }
  
  Paddle.Checkout.open({
    settings: PADDLE_CHECKOUT_SETTINGS,
    items: [{ priceId, quantity: 1 }],
    customer: {
      email: user.email ?? "",
    },
    customData: {
      firebaseUid: user.uid  // Передается в webhook как event.data.custom_data.firebaseUid
    }
  });
};

// Обратная совместимость - используем Lifetime по умолчанию
export const openLifetimeCheckout = () => {
  openCheckoutWithPriceId(PADDLE_PRICE_IDS.LIFETIME);
};
