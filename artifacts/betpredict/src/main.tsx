import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production the API runs on a separate host (e.g. Render). VITE_API_URL is
// baked in at build time; when unset we fall back to same-origin relative
// requests so local dev against the local API server keeps working.
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
