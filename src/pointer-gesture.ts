/** Callbacks for a tracked pointer gesture. */
export interface PointerGestureHandlers {
  /** Fired for each move belonging to this pointer. */
  onMove?: (event: PointerEvent) => void;
  /** Fired once on pointerup or pointercancel. */
  onEnd: (event: PointerEvent) => void;
}

/**
 * Tracks one pointer from press to release on `document`.
 *
 * Every drag in the calendar needs the same three listeners, registered in the
 * capture phase with a non-passive `pointermove` so it can be prevented, all
 * filtered to a single `pointerId`, and all torn down together. Repeating that
 * per gesture invites the one bug that matters here: forgetting to abort, which
 * leaves a drag live after the pointer is gone.
 *
 * Listeners go on `document` rather than the element because a drag routinely
 * travels outside the column it began in.
 *
 * @param pointerId - Only events from this pointer are delivered.
 * @returns A function that removes every listener. Safe to call more than once.
 */
export function trackPointerGesture(
  pointerId: number,
  { onMove, onEnd }: PointerGestureHandlers
): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  const moveOptions: AddEventListenerOptions = {
    signal,
    capture: true,
    passive: false,
  };
  const endOptions: AddEventListenerOptions = { signal, capture: true };

  const handleMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    onMove?.(event);
  };
  const handleEnd = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    onEnd(event);
  };

  document.addEventListener("pointermove", handleMove, moveOptions);
  document.addEventListener("pointerup", handleEnd, endOptions);
  document.addEventListener("pointercancel", handleEnd, endOptions);

  return () => controller.abort();
}
