import { useEffect, useRef } from "react";

/**
 * Keeps a ref pointing at the latest value, updated in an effect rather than
 * during render.
 *
 * Long-lived pointer handlers are registered on `document` once per gesture and
 * need to read current props without being re-bound on every render. Writing
 * `ref.current = value` in the render body is the obvious way to do that, but
 * React may discard or replay a render, which would leave the ref holding a
 * value that was never committed. Updating in an effect means the ref only ever
 * reflects committed state.
 *
 * Reads must therefore happen after commit — event handlers, effects, or
 * timeouts — never during render. That is exactly how the calendar uses these
 * refs.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
