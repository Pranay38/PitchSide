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

const SOFASCORE_OBSERVER = typeof window !== "undefined" && "IntersectionObserver" in window
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const iframe = entry.target as HTMLIFrameElement;
            const lazySrc = iframe.getAttribute("data-lazy-src");
            if (lazySrc && iframe.getAttribute("src") !== lazySrc) {
              iframe.setAttribute("src", lazySrc);
            }
            SOFASCORE_OBSERVER?.unobserve(iframe);
          }
        });
      },
      { rootMargin: "800px 0px" } // Load right before it comes into view
    )
  : null;

function normalizeSofascoreEmbeds(container: HTMLElement) {
  const sofascoreIframes = Array.from(
    container.querySelectorAll<HTMLIFrameElement>(".lazy-embed-iframe")
  );

  sofascoreIframes.forEach((iframe, index) => {
    const src = iframe.getAttribute("data-lazy-src");
    if (!src) return;
    const wrapper = iframe.closest<HTMLElement>("[data-social-embed='sofascore']");

    const parsedHeight = Number.parseInt(iframe.getAttribute("height") || "", 10);
    const safeHeight = Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : 760;

    iframe.removeAttribute("sandbox");
    iframe.setAttribute("loading", "lazy");
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
      iframe.classList.remove("lazy-embed-iframe");
      markEmbedReady(wrapper, true);
    };

    iframe.addEventListener("load", handleLoad, { once: true });
    
    // Fallback if load event fails or observer fails
    window.setTimeout(() => handleLoad(), 5000);

    if (SOFASCORE_OBSERVER) {
      SOFASCORE_OBSERVER?.observe(iframe);
    } else {
      // Fallback for older browsers
      iframe.setAttribute("src", src);
    }
  });
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
