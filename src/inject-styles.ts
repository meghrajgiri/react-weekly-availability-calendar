import cssText from "./styles.css?raw";

const STYLE_ID = "ac-availability-calendar-styles";

let injected = false;

/**
 * Injects the calendar CSS into the document head as a `<style>` tag.
 * Called once on first render. No-ops on subsequent calls and in SSR.
 */
export function injectStyles() {
  if (injected) return;
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) {
    injected = true;
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
  injected = true;
}
