/**
 * Lazy initialisation of third-party scripts (Google Fonts, Yandex Metrika).
 *
 * Runs after first paint / on idle, so the initial render is never blocked
 * by external CDNs. This is critical for Yandex Browser users without a VPN,
 * where fonts.googleapis.com can be slow or unreachable and freeze the page.
 */

const METRIKA_ID = 101339397;

// Google Fonts intentionally NOT loaded on the home page anymore. The site
// uses safe system-font stacks defined in index.css. Loading them — even
// lazily — was still hurting Yandex Browser users without VPN, where
// fonts.googleapis.com / fonts.gstatic.com can hang for many seconds.

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
    // Defer analytics so it never competes with first paint.
    whenIdle(injectYandexMetrika, 4000);
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}