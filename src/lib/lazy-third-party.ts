/**
 * Lazy initialisation of third-party scripts (Google Fonts, Yandex Metrika).
 *
 * Runs after first paint / on idle, so the initial render is never blocked
 * by external CDNs. This is critical for Yandex Browser users without a VPN,
 * where fonts.googleapis.com can be slow or unreachable and freeze the page.
 */

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Inter+Tight:wght@500;600;700;800&display=swap";

const METRIKA_ID = 101339397;

function injectFonts() {
  if (document.getElementById("__google_fonts")) return;
  const link = document.createElement("link");
  link.id = "__google_fonts";
  link.rel = "stylesheet";
  link.href = FONTS_HREF;
  link.crossOrigin = "anonymous";
  // Don't block rendering even if the request hangs.
  (link as any).fetchPriority = "low";
  document.head.appendChild(link);
}

function injectYandexMetrika() {
  const w = window as any;
  if (w.__metrikaLoaded) return;
  w.__metrikaLoaded = true;

  // Queue-based stub so any ym() calls before script loads are buffered.
  w.ym =
    w.ym ||
    function () {
      (w.ym.a = w.ym.a || []).push(arguments);
    };
  w.ym.l = Number(new Date());

  const s = document.createElement("script");
  s.async = true;
  s.defer = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  s.onload = () => {
    try {
      w.ym(METRIKA_ID, "init", {
        webvisor: true,
        clickmap: true,
        accurateTrackBounce: true,
        trackLinks: true,
      });
    } catch {
      /* ignore */
    }
  };
  // If Metrika is blocked or unreachable, don't break anything.
  s.onerror = () => {
    /* swallow */
  };
  document.head.appendChild(s);
}

function whenIdle(cb: () => void, timeout = 2500) {
  const w = window as any;
  if (typeof w.requestIdleCallback === "function") {
    w.requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, 1500);
  }
}

export function bootLazyThirdParty() {
  if (typeof window === "undefined") return;

  const start = () => {
    whenIdle(injectFonts);
    // Defer analytics a bit more so it never competes with first paint.
    whenIdle(injectYandexMetrika, 4000);
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}