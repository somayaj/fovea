const STORAGE_KEY = "fovea.mobile.shell";

function applyMobileShellClass() {
  document.documentElement.dataset.foveaMobileShell = "true";
  document.documentElement.classList.add("fovea-mobile-shell");
}

/** True when running inside the Fovea native mobile shell (Expo WebView) or mobile preview mode. */
export function isMobileShell() {
  if (typeof window === "undefined") return false;
  if (window.fovea?.isMobileShell) return true;
  if (sessionStorage.getItem(STORAGE_KEY) === "1") return true;
  return new URLSearchParams(window.location.search).get("mobile") === "1";
}

export function enableMobileShell() {
  sessionStorage.setItem(STORAGE_KEY, "1");
  applyMobileShellClass();
}

export function clearMobileShell() {
  sessionStorage.removeItem(STORAGE_KEY);
  delete document.documentElement.dataset.foveaMobileShell;
  document.documentElement.classList.remove("fovea-mobile-shell");
}

/** Tag the document so styles match the responsive mobile web app. */
export function initMobileShell() {
  const fromQuery = new URLSearchParams(window.location.search).get("mobile") === "1";
  if (fromQuery || window.fovea?.isMobileShell) {
    enableMobileShell();
    return;
  }
  if (sessionStorage.getItem(STORAGE_KEY) === "1") {
    applyMobileShellClass();
  }
}
