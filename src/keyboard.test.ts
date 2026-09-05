import { describe, expect, it } from "vitest";

import {
  findFreeRange,
  resizeSlotEnd,
  shiftSlotDay,
  shiftSlotTime,
} from "./keyboard";
import type { AvailabilitySlot, DayOfWeek } from "./types";

const bounds = { startMinutes: 540, endMinutes: 1020 }; // 09:00-17:00
const slot = (startTime: string, endTime: string): AvailabilitySlot => ({
  id: 1,
  dayOfWeek: 1,
  startTime,
  endTime,
});

describe("shiftSlotTime", () => {
  it("moves later and earlier, preserving duration", () => {
    expect(shiftSlotTime(slot("10:00", "11:00"), 30, bounds)).toEqual({
      startTime: "10:30",
      endTime: "11:30",
    });
    expect(shiftSlotTime(slot("10:00", "11:00"), -30, bounds)).toEqual({
      startTime: "09:30",
      endTime: "10:30",
    });
  });

  it("clamps at the top of the window instead of refusing", () => {
    // Holding the key should park it at the edge, not stop one step short.
    expect(shiftSlotTime(slot("09:15", "10:15"), -60, bounds)).toEqual({
      startTime: "09:00",
      endTime: "10:00",
    });
  });

  it("clamps at the bottom, keeping the slot inside the window", () => {
    expect(shiftSlotTime(slot("16:00", "17:00"), 60, bounds)).toBeNull();
    expect(shiftSlotTime(slot("15:45", "16:45"), 60, bounds)).toEqual({
      startTime: "16:00",
      endTime: "17:00",
    });
  });

  it("returns null when already flush, so no no-op change is emitted", () => {
    expect(shiftSlotTime(slot("09:00", "10:00"), -30, bounds)).toBeNull();
    expect(shiftSlotTime(slot("16:00", "17:00"), 30, bounds)).toBeNull();
  });
});

describe("resizeSlotEnd", () => {
  it("grows and shrinks from the end edge", () => {
    expect(resizeSlotEnd(slot("10:00", "11:00"), 30, 30, bounds)).toEqual({
      startTime: "10:00",
      endTime: "11:30",
    });
    expect(resizeSlotEnd(slot("10:00", "11:00"), -30, 30, bounds)).toEqual({
      startTime: "10:00",
      endTime: "10:30",
    });
  });

  it("never shrinks below one snap increment", () => {
    expect(resizeSlotEnd(slot("10:00", "10:30"), -30, 30, bounds)).toBeNull();
  });

  it("never extends past the window", () => {
    expect(resizeSlotEnd(slot("16:00", "17:00"), 30, 30, bounds)).toBeNull();
    expect(resizeSlotEnd(slot("16:00", "16:30"), 60, 30, bounds)).toEqual({
      startTime: "16:00",
      endTime: "17:00",
    });
  });

  it("leaves the start time alone", () => {
    const r = resizeSlotEnd(slot("10:00", "11:00"), 30, 30, bounds)!;
    expect(r.startTime).toBe("10:00");
  });
});

describe("shiftSlotDay", () => {
  const sundayFirst: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
  const mondayFirst: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

  it("steps in display order", () => {
    expect(shiftSlotDay(slot("10:00", "11:00"), 1, sundayFirst)).toBe(2);
    expect(shiftSlotDay(slot("10:00", "11:00"), -1, sundayFirst)).toBe(0);
  });

  it("respects the configured week start rather than raw day numbers", () => {
    // Monday-first: stepping left from Monday has nowhere to go.
    expect(shiftSlotDay(slot("10:00", "11:00"), -1, mondayFirst)).toBeNull();
    // Stepping right from Saturday reaches Sunday, the last column.
    const sat = { ...slot("10:00", "11:00"), dayOfWeek: 6 as DayOfWeek };
    expect(shiftSlotDay(sat, 1, mondayFirst)).toBe(0);
  });

  it("stops at the edges instead of wrapping", () => {
    const sun = { ...slot("10:00", "11:00"), dayOfWeek: 0 as DayOfWeek };
    expect(shiftSlotDay(sun, -1, sundayFirst)).toBeNull();
    const sat = { ...slot("10:00", "11:00"), dayOfWeek: 6 as DayOfWeek };
    expect(shiftSlotDay(sat, 1, sundayFirst)).toBeNull();
  });
});

describe("findFreeRange", () => {
  it("returns the top of the window when the day is empty", () => {
    expect(findFreeRange(60, 30, bounds, [])).toEqual({
      startTime: "09:00",
      endTime: "10:00",
    });
  });

  it("skips past an occupied range", () => {
    expect(findFreeRange(60, 30, bounds, [{ start: 540, end: 600 }])).toEqual({
      startTime: "10:00",
      endTime: "11:00",
    });
  });

  it("finds a gap between two occupied ranges", () => {
    expect(
      findFreeRange(60, 30, bounds, [
        { start: 540, end: 600 },
        { start: 720, end: 780 },
      ])
    ).toEqual({ startTime: "10:00", endTime: "11:00" });
  });

  it("returns null when nothing fits", () => {
    expect(
      findFreeRange(60, 30, bounds, [{ start: 540, end: 1020 }])
    ).toBeNull();
  });

  it("treats touching ranges as free, matching the overlap rule", () => {
    // A slot ending at 10:00 does not block one starting at 10:00.
    expect(findFreeRange(60, 60, bounds, [{ start: 540, end: 600 }])).toEqual({
      startTime: "10:00",
      endTime: "11:00",
    });
  });
});
