/** Observe continuous exposure, excluding background tabs. No observer means no view. */
export function observeExposure(element: Element, onView: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let visible = false;
  let recorded = false;
  const cancel = () => { clearTimeout(timer); timer = undefined; };
  const update = () => {
    if (!visible || document.visibilityState === "hidden" || recorded) { cancel(); return; }
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      recorded = true;
      onView();
      observer.disconnect();
    }, 1000);
  };
  const observer = new IntersectionObserver(entries => {
    const entry = entries[entries.length - 1];
    visible = !!entry?.isIntersecting && entry.intersectionRatio >= 0.5;
    update();
  }, { threshold: [0, 0.5] });
  observer.observe(element);
  document.addEventListener("visibilitychange", update);
  return () => { cancel(); observer.disconnect(); document.removeEventListener("visibilitychange", update); };
}
