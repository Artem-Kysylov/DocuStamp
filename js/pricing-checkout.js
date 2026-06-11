import { auth, loginWithGoogle } from "./auth.js";
import { openCheckoutWithPriceId } from "./paddle-docstamp.js";
import { showToast } from "./ui-utils.js";

/**
 * Обработчик кликов по кнопкам оплаты в секции pricing
 */
const handleCheckoutClick = async (event) => {
  event.preventDefault();
  
  const button = event.currentTarget;
  const priceId = button.dataset.priceId;
  
  if (!priceId) {
    console.error("Missing data-price-id attribute on checkout button");
    return;
  }
  
  // Проверяем авторизацию
  if (!auth.currentUser) {
    try {
      const user = await loginWithGoogle();
      const email = user.email ?? "there";
      showToast(`Welcome, ${email}`, "success");
    } catch {
      // Popup cancelled or auth error
      return;
    }
  }
  
  // Открываем чекаут с нужным Price ID
  openCheckoutWithPriceId(priceId);
};

/**
 * Привязывает обработчики к кнопкам оплаты в секции pricing
 */
export const wirePricingCheckout = () => {
  // Находим все кнопки с классом checkout-btn
  const checkoutButtons = document.querySelectorAll('.checkout-btn');
  
  checkoutButtons.forEach(button => {
    button.addEventListener('click', handleCheckoutClick);
  });
};