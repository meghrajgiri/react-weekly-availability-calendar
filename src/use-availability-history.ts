import { useCallback, useRef, useState } from "react";
import type { AvailabilitySlot } from "./types";

/**
 * History state for undo/redo management
 */
interface HistoryState {
  past: AvailabilitySlot[][];
  present: AvailabilitySlot[];
  future: AvailabilitySlot[][];
}

/**
 * Hook that provides undo/redo functionality for availability slots.
 * Maintains a history stack and provides methods to navigate through it.
 *
 * @param initialSlots - The initial slots array
 * @returns Object with current slots, onChange callback, undo, redo, and history info
 *
 * @example
 * const { slots, handleSlotsChange, undo, redo, canUndo, canRedo } = useAvailabilityHistory(initialSlots);
 *
 * return (
 *   <>
 *     <AvailabilityCalendar slots={slots} onSlotsChange={handleSlotsChange} />
 *     <button onClick={undo} disabled={!canUndo}>Undo</button>
 *     <button onClick={redo} disabled={!canRedo}>Redo</button>
 *   </>
 * );
 */
export function useAvailabilityHistory(initialSlots: AvailabilitySlot[]) {
  const historyRef = useRef<HistoryState>({
    past: [],
    present: initialSlots,
    future: [],
  });

  const [, setVersion] = useState(0);

  const handleSlotsChange = useCallback((newSlots: AvailabilitySlot[]) => {
    historyRef.current = {
      past: [...historyRef.current.past, historyRef.current.present],
      present: newSlots,
      future: [],
    };
    setVersion((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    const { past, present, future } = historyRef.current;
    if (past.length === 0) return;

    const newPast = past.slice(0, -1);
    const newPresent = past[past.length - 1];
    const newFuture = [present, ...future];

    historyRef.current = {
      past: newPast,
      present: newPresent,
      future: newFuture,
    };
    setVersion((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    const { past, present, future } = historyRef.current;
    if (future.length === 0) return;

    const newPast = [...past, present];
    const newPresent = future[0];
    const newFuture = future.slice(1);

    historyRef.current = {
      past: newPast,
      present: newPresent,
      future: newFuture,
    };
    setVersion((v) => v + 1);
  }, []);

  const reset = useCallback((slots: AvailabilitySlot[]) => {
    historyRef.current = {
      past: [],
      present: slots,
      future: [],
    };
    setVersion((v) => v + 1);
  }, []);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  return {
    slots: historyRef.current.present,
    handleSlotsChange,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    history: {
      past: historyRef.current.past,
      present: historyRef.current.present,
      future: historyRef.current.future,
    },
  };
}
