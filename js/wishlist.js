import {
  db,
  doc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
} from "./auth.js";

const WISHLIST_FEATURES = ["batch_zip", "text_stamps"];
const WISHLIST_REF = doc(db, "metadata", "wishlist");
const VOTED_STORAGE_PREFIX = "docstamp_voted_";

/**
 * @param {string} feature
 */
const votedStorageKey = (feature) => `${VOTED_STORAGE_PREFIX}${feature}`;

/**
 * @param {string} feature
 */
const hasVoted = (feature) =>
  localStorage.getItem(votedStorageKey(feature)) === "1";

/**
 * @param {string} feature
 */
const markVoted = (feature) => {
  localStorage.setItem(votedStorageKey(feature), "1");
};

/**
 * @param {string} feature
 */
const clearVoted = (feature) => {
  localStorage.removeItem(votedStorageKey(feature));
};

/**
 * @param {string} feature
 */
const syncVotedButton = (feature) => {
  const button = document.getElementById(`btn-vote-${feature}`);
  if (button && hasVoted(feature)) {
    button.classList.add("wishlist-btn-vote--voted");
  }
};

/**
 * @param {string} feature
 * @param {number} count
 */
const renderVoteCount = (feature, count) => {
  const countEl = document.getElementById(`count-${feature}`);
  if (countEl) {
    countEl.textContent = String(count);
  }
};

/**
 * @param {Record<string, unknown> | undefined} data
 */
const applyWishlistCounts = (data) => {
  for (const feature of WISHLIST_FEATURES) {
    const raw = data?.[feature];
    const count = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    renderVoteCount(feature, count);
  }
};

/**
 * @param {string} feature
 */
const castVote = async (feature) => {
  if (hasVoted(feature)) {
    return;
  }

  const button = document.getElementById(`btn-vote-${feature}`);
  markVoted(feature);
  button?.classList.add("wishlist-btn-vote--voted");

  try {
    await updateDoc(WISHLIST_REF, { [feature]: increment(1) });
  } catch (err) {
    if (err?.code === "not-found") {
      await setDoc(WISHLIST_REF, {
        batch_zip: feature === "batch_zip" ? 1 : 0,
        text_stamps: feature === "text_stamps" ? 1 : 0,
      });
      return;
    }

    console.error("Wishlist vote failed:", err);
    clearVoted(feature);
    button?.classList.remove("wishlist-btn-vote--voted");
  }
};

export const wireWishlist = () => {
  const container = document.getElementById("wishlist-container");
  if (!container) {
    return;
  }

  for (const feature of WISHLIST_FEATURES) {
    syncVotedButton(feature);
    document
      .getElementById(`btn-vote-${feature}`)
      ?.addEventListener("click", () => {
        void castVote(feature);
      });
  }

  onSnapshot(
    WISHLIST_REF,
    (snapshot) => {
      applyWishlistCounts(snapshot.exists() ? snapshot.data() : undefined);
    },
    (err) => {
      console.error("Wishlist snapshot failed:", err);
    }
  );
};
