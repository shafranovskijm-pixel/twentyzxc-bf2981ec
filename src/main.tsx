import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootLazyThirdParty } from "./lib/lazy-third-party";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// Remove the static boot fallback (defined in index.html) once React mounts.
requestAnimationFrame(() => {
  try {
    (window as any).__clearBoot?.();
  } catch {
    /* ignore */
  }
});

// Load fonts and analytics after first paint, never blocking the UI.
bootLazyThirdParty();
