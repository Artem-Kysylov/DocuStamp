let latestIsPro = false;

/** @type {Set<(isPro: boolean) => void>} */
const listeners = new Set();

export const setLatestIsPro = (value) => {
  latestIsPro = Boolean(value);
  for (const fn of listeners) {
    try {
      fn(latestIsPro);
    } catch {
      /* ignore subscriber errors */
    }
  }
};

export const getLatestIsPro = () => latestIsPro;

/** Immediate callback with current value; returns unsubscribe. */
export const subscribeProStatus = (fn) => {
  listeners.add(fn);
  fn(latestIsPro);
  return () => {
    listeners.delete(fn);
  };
};
