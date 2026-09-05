import type { CSSProperties } from "react";

/** Tiny classnames utility — no external dependencies. */
export function cn(
  ...inputs: (string | undefined | null | false | 0)[]
): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Builds the inline custom-property override for a slot's colour.
 *
 * Returns an empty object when no colour is set, so the CSS falls back to
 * `var(--ac-accent)`. Typed as `CSSProperties` because React accepts custom
 * properties at runtime but they are not in the base type.
 */
export function slotColorVars(color: string | undefined): CSSProperties {
  return color ? ({ "--ac-slot-color": color } as CSSProperties) : {};
}
