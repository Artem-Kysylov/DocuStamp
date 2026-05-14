/** Fade-in + slight slide-up when blocks enter the viewport. */
export const wireSectionReveal = () => {
  const nodes = document.querySelectorAll(".section-reveal");
  if (nodes.length === 0) {
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    for (const el of nodes) {
      el.classList.add("is-visible");
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    {
      root: null,
      rootMargin: "0px 0px -6% 0px",
      threshold: 0.12,
    }
  );

  for (const el of nodes) {
    observer.observe(el);
  }
};
