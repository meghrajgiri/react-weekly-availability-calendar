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
  style.textContent = CSS_TEXT;
  document.head.appendChild(style);
  injected = true;
}

const CSS_TEXT = /* css */ `
/* ─── Availability Calendar ─── */

:root {
  --ac-bg: #ffffff;
  --ac-fg: #111827;
  --ac-card: #ffffff;
  --ac-card-fg: #111827;
  --ac-border: #e5e7eb;
  --ac-accent: #dbeafe;
  --ac-accent-fg: #1e40af;
  --ac-muted-fg: #6b7280;
  --ac-shadow: rgba(0, 0, 0, 0.1);
}

.ac-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ac-fg);
  box-sizing: border-box;
}

.ac-root *,
.ac-root *::before,
.ac-root *::after {
  box-sizing: border-box;
}

/* ─── Grid container ─── */
.ac-grid-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--ac-border);
  background: var(--ac-card);
  padding: 1px;
}
.ac-grid-container--grabbing {
  cursor: grabbing;
}

.ac-grid-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  border-radius: 0.375rem;
  background: var(--ac-card);
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.ac-grid-inner {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: min(60vh, 480px);
  width: max-content;
  min-width: 100%;
  padding-bottom: 1px;
}
@media (min-width: 768px) {
  .ac-grid-inner {
    width: 100%;
  }
}

/* ─── Time column ─── */
.ac-time-column {
  position: sticky;
  left: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--ac-card);
  width: 3.5rem;
}
@media (min-width: 640px) {
  .ac-time-column {
    width: 4rem;
  }
}

.ac-time-header {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ac-border);
  background: var(--ac-header-bg, var(--ac-bg));
}

.ac-time-body {
  position: relative;
  isolation: isolate;
  background: var(--ac-card);
}

.ac-time-label {
  position: absolute;
  right: 2px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  pointer-events: none;
  font-size: 10px;
  line-height: 1rem;
  color: var(--ac-time-label-fg, var(--ac-muted-fg));
  white-space: nowrap;
}
@media (min-width: 640px) {
  .ac-time-label {
    right: 4px;
    font-size: 0.75rem;
  }
}

/* ─── Days area ─── */
.ac-days-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  border-left: 1px solid var(--ac-border);
  min-width: 700px;
}
@media (min-width: 768px) {
  .ac-days-area {
    min-width: 0;
  }
}

.ac-days-header {
  position: sticky;
  top: 0;
  z-index: 40;
  flex-shrink: 0;
  background: var(--ac-header-bg, var(--ac-bg));
}

.ac-days-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(7, 100px);
}
@media (min-width: 768px) {
  .ac-days-grid {
    grid-template-columns: repeat(7, minmax(100px, 1fr));
  }
}

.ac-day-header-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--ac-border);
  border-right: 1px solid var(--ac-border);
  padding: 0 0.25rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ac-header-fg, var(--ac-card-fg));
  background: var(--ac-header-bg, var(--ac-bg));
}
.ac-day-header-cell:last-child {
  border-right: none;
}

.ac-day-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border-right: 1px solid var(--ac-border);
}
.ac-day-column:last-child {
  border-right: none;
}

.ac-day-body {
  position: relative;
  user-select: none;
  background: var(--ac-card);
}
.ac-day-body--crosshair {
  cursor: crosshair;
}
.ac-day-body--grabbing {
  cursor: grabbing;
}
.ac-day-body--touch-none {
  touch-action: none;
}

/* ─── Row grid lines ─── */
.ac-row-border {
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
}
.ac-row-border--hour {
  border-top: 1px solid var(--ac-grid-line, var(--ac-border));
}
.ac-row-border--sub {
  border-top-width: 1px;
  border-top-color: var(--ac-grid-line, var(--ac-border));
}
.ac-row-border--dashed {
  border-top-style: dashed;
}
.ac-row-border--dotted {
  border-top-style: dotted;
}
.ac-row-border--solid {
  border-top-style: solid;
}

/* ─── Create preview ─── */
.ac-create-preview {
  pointer-events: none;
  position: absolute;
  left: 2px;
  right: 2px;
  z-index: 10;
  border-radius: 0.5rem;
  border: 1px solid var(--ac-preview-border, var(--ac-border));
  background: var(--ac-preview-bg, var(--ac-accent));
}

/* ─── Blocked slot ─── */
.ac-blocked-slot {
  pointer-events: none;
  position: absolute;
  left: 2px;
  right: 2px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.375rem;
  border: 1px solid var(--ac-blocked-border, color-mix(in srgb, var(--ac-fg) 15%, transparent));
  background:
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      var(--ac-blocked-stripe, color-mix(in srgb, var(--ac-fg) 8%, transparent)) 4px,
      var(--ac-blocked-stripe, color-mix(in srgb, var(--ac-fg) 8%, transparent)) 8px
    ),
    var(--ac-blocked-bg, color-mix(in srgb, var(--ac-bg) 90%, transparent));
  padding: 0 0.25rem;
  text-align: center;
}

.ac-blocked-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: var(--ac-blocked-fg, var(--ac-muted-fg));
}
.ac-blocked-label--sm {
  font-size: 0.875rem;
}
.ac-blocked-label--xs {
  font-size: 0.75rem;
}

/* ─── Slot block ─── */
.ac-slot {
  position: absolute;
  left: 2px;
  right: 2px;
  z-index: 10;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--ac-slot-border, var(--ac-border));
  background: var(--ac-accent);
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--ac-accent-fg);
}
.ac-slot--interactive {
  touch-action: none;
  cursor: grab;
}
.ac-slot--interactive:active {
  cursor: grabbing;
}
.ac-slot--compact {
  display: flex;
  align-items: center;
  padding: 2px 0.25rem;
}
.ac-slot--tall {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0.25rem;
}
.ac-slot--hidden {
  pointer-events: none;
  opacity: 0;
}
.ac-slot:focus-visible {
  outline: 2px solid var(--ac-accent-fg);
  outline-offset: 1px;
}

/* ─── Slot remove button ─── */
.ac-slot-remove-btn {
  position: absolute;
  z-index: 30;
  display: flex;
  cursor: pointer;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--ac-accent-fg) 80%, transparent);
  padding: 0;
  touch-action: manipulation;
}
.ac-slot-remove-btn:hover {
  background: color-mix(in srgb, var(--ac-accent) 10%, transparent);
}
.ac-slot-remove-btn:focus-visible {
  outline: 2px solid var(--ac-accent-fg);
  outline-offset: 1px;
}
.ac-slot-remove-btn--compact {
  right: 0;
  top: 0;
  height: 100%;
  width: 2rem;
  min-width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
.ac-slot-remove-btn--tall {
  right: 0;
  top: 0;
  min-height: 2.75rem;
  min-width: 2.75rem;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 0.375rem;
}
@media (min-width: 768px) {
  .ac-slot-remove-btn--tall {
    right: 2px;
    top: 4px;
    min-height: 0;
    min-width: 0;
    align-items: center;
    justify-content: center;
    padding: 2px;
  }
}

/* ─── Slot resize handles ─── */
.ac-slot-resize {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 20;
  cursor: ns-resize;
  touch-action: none;
}
.ac-slot-resize--start {
  top: 0;
  min-height: 2.75rem;
  padding-top: 0.75rem;
}
.ac-slot-resize--end {
  bottom: 0;
  min-height: 2.75rem;
  padding-bottom: 0.75rem;
}
@media (min-width: 768px) {
  .ac-slot-resize--start {
    min-height: 0;
    padding-top: 0;
    height: 10px;
  }
  .ac-slot-resize--end {
    min-height: 0;
    padding-bottom: 0;
    height: 10px;
  }
}

/* ─── Slot content ─── */
.ac-slot-content-compact {
  min-width: 0;
  width: 100%;
  padding-right: 2.25rem;
}
.ac-slot-content-compact p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  line-height: 1.25;
  margin: 0;
}

.ac-slot-top-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.25rem;
  padding-right: 3rem;
}
@media (min-width: 768px) {
  .ac-slot-top-row {
    padding-right: 1.25rem;
  }
}

.ac-slot-bottom-row {
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.25rem;
}

.ac-slot-time {
  white-space: nowrap;
  min-width: 0;
}

.ac-slot-duration {
  font-weight: 500;
}

/* ─── Move ghost ─── */
.ac-move-ghost {
  box-sizing: border-box;
  pointer-events: none;
  position: fixed;
  z-index: 100;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--ac-slot-border, var(--ac-border));
  background: var(--ac-accent);
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--ac-accent-fg);
  box-shadow:
    0 20px 25px -5px var(--ac-shadow),
    0 8px 10px -6px var(--ac-shadow);
  outline: 2px solid color-mix(in srgb, var(--ac-accent) 20%, transparent);
  outline-offset: -1px;
}
.ac-move-ghost--compact {
  display: flex;
  align-items: center;
  padding: 2px 0.25rem;
}
.ac-move-ghost--tall {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0.25rem;
}

.ac-ghost-content-compact {
  min-width: 0;
  width: 100%;
  padding-right: 1.25rem;
}
.ac-ghost-content-compact p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  line-height: 1.25;
  margin: 0;
}

.ac-ghost-top-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.25rem;
  padding-right: 1.25rem;
}

.ac-ghost-bottom-row {
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.25rem;
}
`;
