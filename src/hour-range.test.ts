import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveHourRange } from "./constants";
import { minutesToOffsetPx, snapMinutesDown } from "./utils";

afterEach(() => vi.restoreAllMocks());

describe("resolveHourRange", () => {
  it("converts a valid range to minutes", () => {
    expect(resolveHourRange(9, 17)).toEqual({
      startMinutes: 540,
      endMinutes: 1020,
    });
    expect(resolveHourRange(0, 24)).toEqual({
      startMinutes: 0,
      endMinutes: 1440,
    });
  });

  it("accepts the extremes", () => {
    expect(resolveHourRange(0, 1)).toEqual({ startMinutes: 0, endMinutes: 60 });
    expect(resolveHourRange(23, 24)).toEqual({
      startMinutes: 1380,
      endMinutes: 1440,
    });
  });

  const bad: [string, number, number][] = [
    ["inverted", 17, 9],
    ["equal", 9, 9],
    ["negative start", -1, 12],
    ["end past midnight", 9, 25],
    ["NaN start", NaN, 12],
    ["Infinity end", 0, Infinity],
  ];

  it.each(bad)("falls back to the full day for %s", (_label, a, b) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveHourRange(a, b)).toEqual({
      startMinutes: 0,
      endMinutes: 1440,
    });
    // Silently rendering an empty grid would be far harder to diagnose.
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("snapMinutesDown with a grid origin", () => {
  it("snaps relative to the origin, so rows stay aligned", () => {
    // 09:00 start, 30-minute snap. 09:40 must floor to 09:30, not 09:00.
    expect(snapMinutesDown(580, 30, 540)).toBe(570);
    expect(snapMinutesDown(569, 30, 540)).toBe(540);
    expect(snapMinutesDown(570, 30, 540)).toBe(570);
  });

  it("defaults to a midnight origin", () => {
    expect(snapMinutesDown(95, 10)).toBe(90);
    expect(snapMinutesDown(95, 10, 0)).toBe(90);
  });

  it("stays aligned for origins that are not whole hours", () => {
    // 09:30 origin, 60-minute rows: boundaries fall at 09:30, 10:30, ...
    expect(snapMinutesDown(600, 60, 570)).toBe(570);
    expect(snapMinutesDown(630, 60, 570)).toBe(630);
  });
});

describe("minutesToOffsetPx with a grid origin", () => {
  const ROW = 24;

  it("puts the grid start at the top", () => {
    expect(minutesToOffsetPx(540, 30, ROW, 540)).toBe(0);
  });

  it("measures from the origin, not midnight", () => {
    // 10:00 is one row below a 09:00 start at 60-minute rows.
    expect(minutesToOffsetPx(600, 60, ROW, 540)).toBe(24);
    // The same time is ten rows down when the grid starts at midnight.
    expect(minutesToOffsetPx(600, 60, ROW, 0)).toBe(240);
  });

  it("keeps height independent of the origin", () => {
    const h = (origin: number) =>
      minutesToOffsetPx(660, 30, ROW, origin) -
      minutesToOffsetPx(600, 30, ROW, origin);
    expect(h(0)).toBe(h(540));
    expect(h(0)).toBe(48);
  });

  it("goes negative above the window, which is what clipping relies on", () => {
    expect(minutesToOffsetPx(480, 60, ROW, 540)).toBe(-24);
  });
});
