import type { AvailabilitySlot } from "./types";

/** Undo/redo stacks around the current slots. */
export interface HistoryState {
  past: AvailabilitySlot[][];
  present: AvailabilitySlot[];
  future: AvailabilitySlot[][];
}

/** Actions accepted by {@link historyReducer}. */
export type HistoryAction =
  | { type: "change"; slots: AvailabilitySlot[]; limit: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; slots: AvailabilitySlot[] };

/** Builds the initial history state for a set of slots. */
export function initialHistory(slots: AvailabilitySlot[]): HistoryState {
  return { past: [], present: slots, future: [] };
}

/**
 * Pure undo/redo transition.
 *
 * Kept separate from the hook so the stack behaviour — trimming, no-op
 * suppression, redo invalidation — is directly testable without a DOM.
 *
 * Every branch returns the existing state object unchanged when nothing
 * happens, so React can bail out of the re-render.
 */
export function historyReducer(
  state: HistoryState,
  action: HistoryAction
): HistoryState {
  switch (action.type) {
    case "change": {
      // A drag that ends where it began emits the same array; that should not
      // consume an undo step.
      if (action.slots === state.present) return state;
      const past = [...state.past, state.present];
      return {
        past:
          past.length > action.limit
            ? past.slice(past.length - action.limit)
            : past,
        present: action.slots,
        // Any new edit invalidates the redo branch.
        future: [],
      };
    }
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (previous === undefined) return state;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      const [next, ...rest] = state.future;
      if (next === undefined) return state;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }
    case "reset":
      return initialHistory(action.slots);
  }
}
