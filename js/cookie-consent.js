const STORAGE_KEY = "cookie-consent";

const dismissBanner = (root) => {
  const remove = () => {
    root.removeEventListener("transitionend", remove);
    root.remove();
  };
  root.classList.remove("cookie-banner--visible");
  root.classList.add("cookie-banner--dismissing");
  root.addEventListener("transitionend", remove);
  window.setTimeout(() => {
    if (root.isConnected) {
      root.removeEventListener("transitionend", remove);
      root.remove();
    }
  }, 380);
};

export function wireCookieConsent() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      return;
    }
  } catch {
    return;
  }

  const banner = document.createElement("aside");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie notice");

  const text = document.createElement("p");
  text.className = "cookie-banner__text";
  text.textContent =
    "We use cookies to ensure you have the best experience and to process payments securely. No tracking, just pure utility.";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cookie-banner__btn";
  btn.textContent = "Got it";

  banner.append(text, btn);
  document.body.append(banner);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add("cookie-banner--visible");
    });
  });

  btn.addEventListener("click", () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore quota / private mode */
    }
    dismissBanner(banner);
  });
}
