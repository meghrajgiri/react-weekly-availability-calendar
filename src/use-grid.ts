import { useCallback, useMemo } from "react";

import { ROW_HEIGHT_PX } from "./constants";
import { minutesToOffsetPx } from "./utils";

/**
 * Hook that computes grid layout math based on the snap increment.
 * Provides row counts, row-to-minute conversions, and pointer-to-row mapping.
 * @param snapMinutes - Snap increment (10, 30, or 60 minutes).
 */
export function useConsultationGrid(
  snapMinutes: 10 | 30 | 60,
  startMinutes: number,
  endMinutes: number
) {
  /** Total number of rows in the grid. */
  const totalRows = useMemo(
    () => Math.max(1, Math.ceil((endMinutes - startMinutes) / snapMinutes)),
    [snapMinutes, startMinutes, endMinutes]
  );

  /** Converts a row index to minutes since midnight. */
  const rowToMinutes = useCallback(
    (rowIndex: number) => startMinutes + rowIndex * snapMinutes,
    [snapMinutes, startMinutes]
  );

  /**
   * Converts minutes since midnight to a pixel offset from the top of the grid.
   * Proportional, so slots that do not align to `snapMinutes` still render at
   * their true position and height.
   */
  const minutesToPx = useCallback(
    (minutes: number) =>
      minutesToOffsetPx(minutes, snapMinutes, ROW_HEIGHT_PX, startMinutes),
    [snapMinutes, startMinutes]
  );

  /** Converts a pointer clientY position to a row index within a column element. */
  const clientYToRow = useCallback(
    (clientY: number, columnEl: HTMLElement) => {
      const rect = columnEl.getBoundingClientRect();
      const y = clientY - rect.top;
      const row = Math.floor(y / ROW_HEIGHT_PX);
      return Math.max(0, Math.min(totalRows - 1, row));
    },
    [totalRows]
  );

  return {
    totalRows,
    rowToMinutes,
    minutesToPx,
    clientYToRow,
  };
}
