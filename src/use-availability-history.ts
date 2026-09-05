import { useCallback, useMemo, useReducer } from "react";

import { historyReducer, initialHistory } from "./history";

import type { AvailabilitySlot } from "./types";

/** Options for {@link useAvailabilityHistory}. */
export interface UseAvailabilityHistoryOptions {
  /**
   * Maximum number of undo steps to retain. Older entries are dropped from the
   * bottom of the stack. Defaults to 50; pass `Infinity` to keep everything.
   *
   * A single drag emits many `onSlotsChange` calls, so an unbounded stack grows
   * quickly over a long editing session.
   */
  limit?: number;
}

/** Return value of {@link useAvailabilityHistory}. */
export interface UseAvailabilityHistoryResult {
  /** Current slots — pass to `AvailabilityCalendar`'s `slots`. */
  slots: AvailabilitySlot[];
  /** Change handler — pass to `AvailabilityCalendar`'s `onSlotsChange`. */
  onSlotsChange: (next: AvailabilitySlot[]) => void;
  /** Step back one change. No-op when `canUndo` is false. */
  undo: () => void;
  /** Step forward one undone change. No-op when `canRedo` is false. */
  redo: () => void;
  /** Replace the slots and clear both stacks. */
  reset: (slots: AvailabilitySlot[]) => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Number of retained undo steps. */
  undoCount: number;
  /** Number of retained redo steps. */
  redoCount: number;
}

/**
 * Adds undo/redo around the calendar's slot state.
 *
 * The calendar is controlled: it renders whatever `slots` it is given and
 * reports edits through `onSlotsChange`. This hook sits in that gap, recording
 * each reported change so it can be stepped back and forward.
 *
 * @param initialSlots - Starting slots. Changing this later has no effect;
 *   call `reset` to load a different set.
 * @param options - See {@link UseAvailabilityHistoryOptions}.
 *
 * @example
 * const { slots, onSlotsChange, undo, redo, canUndo, canRedo } =
 *   useAvailabilityHistory(initialSlots);
 *
 * return (
 *   <>
 *     <button onClick={undo} disabled={!canUndo}>Undo</button>
 *     <button onClick={redo} disabled={!canRedo}>Redo</button>
 *     <AvailabilityCalendar
 *       slots={slots}
 *       onSlotsChange={onSlotsChange}
 *       snapMinutes={30}
 *       timeFormat="12"
 *     />
 *   </>
 * );
 */
export function useAvailabilityHistory(
  initialSlots: AvailabilitySlot[],
  options: UseAvailabilityHistoryOptions = {}
): UseAvailabilityHistoryResult {
  const { limit = 50 } = options;

  // Real reducer state rather than a ref plus a dummy re-render counter: the
  // stack depths are rendered (they drive the buttons' disabled state), so they
  // belong in state React can track.
  const [history, dispatch] = useReducer(
    historyReducer,
    initialSlots,
    initialHistory
  );

  const onSlotsChange = useCallback(
    (next: AvailabilitySlot[]) =>
      dispatch({ type: "change", slots: next, limit }),
    [limit]
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const reset = useCallback(
    (slots: AvailabilitySlot[]) => dispatch({ type: "reset", slots }),
    []
  );

  return useMemo(
    () => ({
      slots: history.present,
      onSlotsChange,
      undo,
      redo,
      reset,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      undoCount: history.past.length,
      redoCount: history.future.length,
    }),
    [history, onSlotsChange, undo, redo, reset]
  );
}
