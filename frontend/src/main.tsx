import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Only import service worker in production or when explicitly enabled
const registerSW = async () => {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    try {
      const { registerSW: reg, setupInstallPrompt } = await import("./utils/sw-registration");
      reg();
      setupInstallPrompt();
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);

// Register service worker for PWA functionality (only in production)
registerSW();
