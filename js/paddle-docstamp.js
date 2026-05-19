import { auth, db, doc, setDoc } from "./auth.js";

export const PADDLE_CLIENT_TOKEN = "live_4c337f8e6823fd7753ff3a0ddce";
export const PADDLE_PRICE_ID = "pri_01ks048m7nd7wg7a3y8beq6pbq";

export const PADDLE_CHECKOUT_SETTINGS = {
  displayMode: "overlay",
  theme: "dark",
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

export const openLifetimeCheckout = () => {
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
    items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
    customer: {
      email: user.email ?? "",
    },
  });
};
