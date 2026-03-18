type TwitterWindow = Window & {
  twttr?: {
    widgets?: {
      load?: (element?: HTMLElement) => void;
    };
  };
};

type InstagramWindow = Window & {
  instgrm?: {
    Embeds?: {
      process?: () => void;
    };
  };
};

const EMBED_PRECONNECTS = [
  "https://platform.twitter.com",
  "https://cdn.syndication.twimg.com",
  "https://syndication.twitter.com",
  "https://widgets.sofascore.com",
  "https://www.sofascore.com",
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function ensurePreconnect(href: string) {
  if (!document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = href;
    preconnect.crossOrigin = "anonymous";
    document.head.appendChild(preconnect);
  }

  const dnsHref = href.replace(/^https?:/, "");
  if (!document.head.querySelector(`link[rel="dns-prefetch"][href="${dnsHref}"]`)) {
    const dnsPrefetch = document.createElement("link");
    dnsPrefetch.rel = "dns-prefetch";
    dnsPrefetch.href = dnsHref;
    document.head.appendChild(dnsPrefetch);
  }
}

function warmEmbedHosts() {
  EMBED_PRECONNECTS.forEach(ensurePreconnect);
}

function isNearViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.top <= window.innerHeight * 1.35;
}

function markEmbedReady(wrapper: HTMLElement | null, ready: boolean) {
  if (!wrapper) return;
  wrapper.dataset.embedReady = ready ? "true" : "false";
}

function reactivateInlineScripts(container: HTMLElement) {
  const scripts = Array.from(
    container.querySelectorAll<HTMLScriptElement>("script:not([data-pitchside-activated])"),
  );

  scripts.forEach((oldScript) => {
    const nextScript = document.createElement("script");

    Array.from(oldScript.attributes).forEach((attr) => {
      nextScript.setAttribute(attr.name, attr.value);
    });

    nextScript.dataset.pitchsideActivated = "true";
    nextScript.text = oldScript.text;
    oldScript.parentNode?.replaceChild(nextScript, oldScript);
  });
}

function normalizeSofascoreEmbeds(container: HTMLElement) {
  const sofascoreIframes = Array.from(
    container.querySelectorAll<HTMLIFrameElement>(
      'iframe[src*="sofascore.com"], iframe[src*="widgets.sofascore.com"]',
    ),
  );

  sofascoreIframes.forEach((iframe, index) => {
    const src = iframe.getAttribute("src");
    if (!src) return;
    const wrapper = iframe.closest<HTMLElement>("[data-social-embed='sofascore']");

    const parsedHeight = Number.parseInt(iframe.getAttribute("height") || "", 10);
    const safeHeight = Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : 760;
    const eager = isNearViewport(iframe);

    iframe.dataset.embedSrc = src;
    iframe.removeAttribute("sandbox");
    iframe.setAttribute("loading", eager ? "eager" : "lazy");
    iframe.setAttribute("fetchpriority", eager ? "high" : "auto");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute("title", iframe.getAttribute("title") || `Sofascore embed ${index + 1}`);
    iframe.setAttribute("height", String(safeHeight));

    markEmbedReady(wrapper, false);
    iframe.style.width = "100%";
    iframe.style.maxWidth = "100%";
    iframe.style.display = "block";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.style.background = "transparent";
    iframe.style.minHeight = `${Math.max(safeHeight, 420)}px`;
    iframe.style.opacity = "0";
    iframe.style.transition = "opacity 120ms ease";

    const handleLoad = () => {
      iframe.style.opacity = "1";
      markEmbedReady(wrapper, true);
    };

    iframe.addEventListener("load", handleLoad, { once: true });
    window.setTimeout(handleLoad, eager ? 800 : 1400);

    if (iframe.src !== src) {
      iframe.src = src;
      return;
    }
  });
}

function observeTwitterEmbed(wrapper: HTMLElement) {
  if (wrapper.dataset.twitterObserved === "true") return;
  wrapper.dataset.twitterObserved = "true";
  markEmbedReady(wrapper, false);

  const finishIfReady = () => {
    const hasIframe = !!wrapper.querySelector("iframe");
    const renderedTweet = wrapper.querySelector(".twitter-tweet");
    if (!hasIframe && !(renderedTweet instanceof HTMLElement && renderedTweet.classList.contains("twitter-tweet-rendered"))) {
      return false;
    }

    markEmbedReady(wrapper, true);
    return true;
  };

  if (finishIfReady()) return;

  const observer = new MutationObserver(() => {
    if (finishIfReady()) {
      observer.disconnect();
      delete wrapper.dataset.twitterObserved;
    }
  });

  observer.observe(wrapper, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  window.setTimeout(() => {
    markEmbedReady(wrapper, true);
    observer.disconnect();
    delete wrapper.dataset.twitterObserved;
  }, 3000);
}

function hydrateTacticalEmbeds(container: HTMLElement) {
  const embedNodes = Array.from(
    container.querySelectorAll<HTMLElement>("[data-tactical-board-embed]:not([data-tactical-mounted='true'])"),
  );

  embedNodes.forEach((node, index) => {
    const id = node.dataset.tacticalBoardEmbed?.trim();
    if (!id) return;

    const title = escapeHtml(node.dataset.title || `Tactical board ${index + 1}`);
    const description = escapeHtml(node.dataset.description || "Interactive tactical sequence");
    node.dataset.tacticalMounted = "true";
    node.innerHTML = `
      <div class="border-b border-white/10 px-4 py-4">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Interactive Tactics</p>
        <h4 class="mt-2 text-lg font-black font-outfit text-white">${title}</h4>
        <p class="mt-2 text-sm leading-6 text-white/68">${description}</p>
      </div>
      <iframe
        src="/tactics/embed/${encodeURIComponent(id)}"
        title="${title}"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        style="display:block;width:100%;min-height:540px;border:none;background:#08111f;"
      ></iframe>
    `;
  });
}

async function hydrateTwitterEmbeds(container: HTMLElement) {
  const wrappers = Array.from(container.querySelectorAll<HTMLElement>("[data-social-embed='twitter']"));
  if (wrappers.length === 0 && !container.querySelector(".twitter-tweet")) return;

  wrappers.forEach(observeTwitterEmbed);

  const twitterWindow = window as TwitterWindow;
  if (!twitterWindow.twttr?.widgets?.load) {
    await ensureScript("twitter-wjs", "https://platform.twitter.com/widgets.js");
  }

  twitterWindow.twttr?.widgets?.load?.(container);
  window.setTimeout(() => twitterWindow.twttr?.widgets?.load?.(container), 600);
}

async function hydrateInstagramEmbeds(container: HTMLElement) {
  const hasInstagram = !!container.querySelector(".instagram-media, [data-social-embed='instagram']");
  if (!hasInstagram) return;

  const instagramWindow = window as InstagramWindow;
  if (!instagramWindow.instgrm?.Embeds?.process) {
    await ensureScript("instagram-embed-js", "https://www.instagram.com/embed.js");
  }

  instagramWindow.instgrm?.Embeds?.process?.();
}

async function hydrateEmbeds(container: HTMLElement) {
  warmEmbedHosts();
  reactivateInlineScripts(container);
  normalizeSofascoreEmbeds(container);
  hydrateTacticalEmbeds(container);

  await Promise.allSettled([
    hydrateTwitterEmbeds(container),
    hydrateInstagramEmbeds(container),
  ]);
}

export function scheduleEmbedHydration(container: HTMLElement | null) {
  if (!container) return () => {};

  let cancelled = false;

  const runHydration = () => {
    if (cancelled || !document.body.contains(container)) return;
    void hydrateEmbeds(container);
  };

  runHydration();

  const rafId = window.requestAnimationFrame(runHydration);
  const timeouts = [
    window.setTimeout(runHydration, 300),
    window.setTimeout(runHydration, 900),
  ];

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      runHydration();
    }
  };

  window.addEventListener("focus", runHydration);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(rafId);
    timeouts.forEach((timeout) => window.clearTimeout(timeout));
    window.removeEventListener("focus", runHydration);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
