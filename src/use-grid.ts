import { useCallback, useMemo } from "react";

import {
  CONSULTATION_GRID_END_MINUTES,
  CONSULTATION_GRID_START_MINUTES,
  ROW_HEIGHT_PX,
} from "./constants";

/**
 * Hook that computes grid layout math based on the snap increment.
 * Provides row counts, row-to-minute conversions, and pointer-to-row mapping.
 * @param snapMinutes - Snap increment (10, 30, or 60 minutes).
 */
export function useConsultationGrid(snapMinutes: 10 | 30 | 60) {
  /** Total number of rows in the grid. */
  const totalRows = useMemo(
    () =>
      (CONSULTATION_GRID_END_MINUTES - CONSULTATION_GRID_START_MINUTES) /
      snapMinutes,
    [snapMinutes]
  );

  /** Converts a row index to minutes since midnight. */
  const rowToMinutes = useCallback(
    (rowIndex: number) =>
      CONSULTATION_GRID_START_MINUTES + rowIndex * snapMinutes,
    [snapMinutes]
  );

  /** Converts minutes since midnight to the nearest row index. */
  const minutesToRowIndex = useCallback(
    (minutes: number) =>
      Math.round((minutes - CONSULTATION_GRID_START_MINUTES) / snapMinutes),
    [snapMinutes]
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
    minutesToRowIndex,
    clientYToRow,
  };
}
