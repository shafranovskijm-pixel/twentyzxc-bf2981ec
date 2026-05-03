import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootLazyThirdParty } from "./lib/lazy-third-party";

createRoot(document.getElementById("root")!).render(<App />);

// Load fonts and analytics after first paint, never blocking the UI.
bootLazyThirdParty();
