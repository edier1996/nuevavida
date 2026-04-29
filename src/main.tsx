import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Marca de build para invalidar cache de CDN cuando se requiere.
(window as Window & { __NUEVAVIDA_BUILD__?: string }).__NUEVAVIDA_BUILD__ = "2026-04-24-03-10";

createRoot(document.getElementById("root")!).render(<App />);
