import { describe, expect, it } from "vitest";

import type { AvailabilitySlot } from "./types";
import {
  clampGhostToGridArea,
  formatClock,
  formatDurationLabel,
  hhmmToMinutes,
  mergeAdjacentSlots,
  minutesToHHmm,
  minutesToOffsetPx,
  newTempAvailabilitySlotId,
  overlaps,
  snapMinutesDown,
} from "./utils";

const slot = (
  id: number | string,
  dayOfWeek: AvailabilitySlot["dayOfWeek"],
  startTime: string,
  endTime: string
): AvailabilitySlot => ({ id, dayOfWeek, startTime, endTime });

describe("hhmmToMinutes", () => {
  it("parses well-formed times", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("09:30")).toBe(570);
    expect(hhmmToMinutes("23:59")).toBe(1439);
    expect(hhmmToMinutes("24:00")).toBe(1440);
  });

  it("tolerates surrounding whitespace and seconds", () => {
    expect(hhmmToMinutes("  09:30  ")).toBe(570);
    expect(hhmmToMinutes("09:30:45")).toBe(570);
  });

  it("never returns NaN for malformed input (bug #8)", () => {
    expect(hhmmToMinutes("")).toBe(0);
    expect(hhmmToMinutes("abc")).toBe(0);
    expect(hhmmToMinutes("--:--")).toBe(0);
    expect(hhmmToMinutes("9")).toBe(540);
  });

  it("clamps out-of-range values", () => {
    expect(hhmmToMinutes("99:99")).toBe(1440);
    expect(hhmmToMinutes("-5:00")).toBe(0);
  });
});

describe("minutesToHHmm", () => {
  it("pads to HH:mm", () => {
    expect(minutesToHHmm(0)).toBe("00:00");
    expect(minutesToHHmm(570)).toBe("09:30");
    expect(minutesToHHmm(1439)).toBe("23:59");
  });

  it("caps end-of-day at 24:00", () => {
    expect(minutesToHHmm(1440)).toBe("24:00");
    expect(minutesToHHmm(2000)).toBe("24:00");
  });

  it("round-trips with hhmmToMinutes", () => {
    for (const m of [0, 15, 570, 1439, 1440]) {
      expect(hhmmToMinutes(minutesToHHmm(m))).toBe(m);
    }
  });
});

describe("snapMinutesDown", () => {
  it("floors to the snap increment", () => {
    expect(snapMinutesDown(0, 30)).toBe(0);
    expect(snapMinutesDown(29, 30)).toBe(0);
    expect(snapMinutesDown(30, 30)).toBe(30);
    expect(snapMinutesDown(59, 30)).toBe(30);
    expect(snapMinutesDown(95, 10)).toBe(90);
    expect(snapMinutesDown(1439, 60)).toBe(1380);
  });

  it("is idempotent on already-aligned values", () => {
    for (const snap of [10, 30, 60]) {
      for (const m of [0, snap, snap * 7]) {
        expect(snapMinutesDown(snapMinutesDown(m, snap), snap)).toBe(m);
      }
    }
  });
});

describe("formatClock", () => {
  it("formats 24-hour times", () => {
    expect(formatClock(0, "24").primary).toBe("00:00");
    expect(formatClock(570, "24").primary).toBe("09:30");
    expect(formatClock(1380, "24").primary).toBe("23:00");
  });

  it("formats 12-hour times", () => {
    expect(formatClock(0, "12").primary).toBe("12:00 AM");
    expect(formatClock(570, "12").primary).toBe("9:30 AM");
    expect(formatClock(720, "12").primary).toBe("12:00 PM");
    expect(formatClock(1380, "12").primary).toBe("11:00 PM");
  });

  it("renders end-of-day as 24:00 rather than 00:00", () => {
    expect(formatClock(1440, "24").primary).toBe("24:00");
    expect(formatClock(1440, "12").primary).toBe("12:00 AM");
  });
});

describe("formatDurationLabel", () => {
  it("renders hours to one decimal", () => {
    expect(formatDurationLabel(60)).toBe("1h");
    expect(formatDurationLabel(90)).toBe("1.5h");
    expect(formatDurationLabel(30)).toBe("0.5h");
    expect(formatDurationLabel(10)).toBe("0.2h");
    expect(formatDurationLabel(1440)).toBe("24h");
  });
});

describe("overlaps", () => {
  it("detects genuine overlap", () => {
    expect(overlaps({ start: 0, end: 60 }, { start: 30, end: 90 })).toBe(true);
    expect(overlaps({ start: 30, end: 90 }, { start: 0, end: 60 })).toBe(true);
  });

  it("treats touching ranges as non-overlapping", () => {
    expect(overlaps({ start: 0, end: 60 }, { start: 60, end: 120 })).toBe(
      false
    );
  });

  it("treats disjoint ranges as non-overlapping", () => {
    expect(overlaps({ start: 0, end: 60 }, { start: 120, end: 180 })).toBe(
      false
    );
  });
});

describe("mergeAdjacentSlots", () => {
  it("returns an empty array unchanged", () => {
    expect(mergeAdjacentSlots([])).toEqual([]);
  });

  it("leaves non-adjacent slots alone", () => {
    const input = [slot(1, 1, "09:00", "10:00"), slot(2, 1, "11:00", "12:00")];
    expect(mergeAdjacentSlots(input)).toHaveLength(2);
  });

  it("merges touching slots and keeps the earliest id", () => {
    const merged = mergeAdjacentSlots([
      slot(1, 1, "09:00", "10:00"),
      slot(2, 1, "10:00", "11:00"),
    ]);
    expect(merged).toEqual([
      { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "11:00" },
    ]);
  });

  it("merges overlapping slots", () => {
    const merged = mergeAdjacentSlots([
      slot(1, 1, "09:00", "11:00"),
      slot(2, 1, "10:00", "12:00"),
    ]);
    expect(merged).toEqual([
      { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
    ]);
  });

  it("keeps a fully-contained slot from widening the range", () => {
    const merged = mergeAdjacentSlots([
      slot(1, 1, "09:00", "17:00"),
      slot(2, 1, "10:00", "11:00"),
    ]);
    expect(merged).toEqual([
      { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    ]);
  });

  it("never merges across different days", () => {
    const merged = mergeAdjacentSlots([
      slot(1, 1, "09:00", "10:00"),
      slot(2, 2, "10:00", "11:00"),
    ]);
    expect(merged).toHaveLength(2);
  });

  it("is order-independent", () => {
    const forward = mergeAdjacentSlots([
      slot(1, 1, "09:00", "10:00"),
      slot(2, 1, "10:00", "11:00"),
    ]);
    const reverse = mergeAdjacentSlots([
      slot(2, 1, "10:00", "11:00"),
      slot(1, 1, "09:00", "10:00"),
    ]);
    expect(reverse).toEqual(forward);
  });

  it("does not mutate its input", () => {
    const input = [slot(2, 1, "10:00", "11:00"), slot(1, 1, "09:00", "10:00")];
    const snapshot = structuredClone(input);
    mergeAdjacentSlots(input);
    expect(input).toEqual(snapshot);
  });

  it("drops the later slot's id when merging — the cause of bug #1", () => {
    // Documents today's behaviour: resizing slot 2's start edge onto slot 1
    // yields a single slot carrying id 1, so a drag tracking id 2 loses its
    // subject mid-gesture. Fixed by merging only on pointerup.
    const merged = mergeAdjacentSlots([
      slot(1, 1, "09:00", "10:00"),
      slot(2, 1, "10:00", "11:00"),
    ]);
    expect(merged.map((s) => s.id)).toEqual([1]);
    expect(merged.find((s) => s.id === 2)).toBeUndefined();
  });

  it("preserves extra fields from the surviving slot", () => {
    type TaggedSlot = AvailabilitySlot & { note: string };
    const input: TaggedSlot[] = [
      { ...slot(1, 1, "09:00", "10:00"), note: "keep" },
      { ...slot(2, 1, "10:00", "11:00"), note: "drop" },
    ];
    const merged = mergeAdjacentSlots(input);
    expect(merged[0]).toMatchObject({ id: 1, note: "keep" });
  });
});

describe("minutesToOffsetPx", () => {
  const ROW = 24;

  it("maps aligned times to exact row boundaries", () => {
    expect(minutesToOffsetPx(0, 30, ROW)).toBe(0);
    expect(minutesToOffsetPx(30, 30, ROW)).toBe(24);
    expect(minutesToOffsetPx(540, 30, ROW)).toBe(432); // 09:00 -> row 18
    expect(minutesToOffsetPx(1440, 30, ROW)).toBe(1152); // end of grid
  });

  it("positions non-aligned times proportionally (bug #6)", () => {
    // 09:15 with a 30-minute snap. The old Math.round row math put this at
    // row 19 (456px) — a 12px, i.e. 15-minute, error.
    expect(minutesToOffsetPx(555, 30, ROW)).toBe(444);
    // 09:10 landed on row 18 (432px) instead of 440px.
    expect(minutesToOffsetPx(550, 30, ROW)).toBe(440);
  });

  it("gives non-aligned slots their true height (bug #6)", () => {
    // 09:10-09:50 is 40 minutes. Rounded rows gave (20-18)*24 = 48px,
    // half again too tall; the true height is 32px.
    const h = minutesToOffsetPx(590, 30, ROW) - minutesToOffsetPx(550, 30, ROW);
    expect(h).toBe(32);
  });

  it("keeps height proportional to duration regardless of start offset", () => {
    for (const start of [0, 7, 15, 23, 600, 1000]) {
      const h =
        minutesToOffsetPx(start + 45, 30, ROW) -
        minutesToOffsetPx(start, 30, ROW);
      expect(h).toBeCloseTo(36, 10);
    }
  });

  it("scales with the snap increment", () => {
    expect(minutesToOffsetPx(60, 60, ROW)).toBe(24);
    expect(minutesToOffsetPx(60, 30, ROW)).toBe(48);
    expect(minutesToOffsetPx(60, 10, ROW)).toBe(144);
  });

  it("is monotonic", () => {
    let prev = -Infinity;
    for (let m = 0; m <= 1440; m += 7) {
      const px = minutesToOffsetPx(m, 30, ROW);
      expect(px).toBeGreaterThan(prev);
      prev = px;
    }
  });
});

describe("clampGhostToGridArea", () => {
  // Built as plain objects rather than `new DOMRect(...)` so the suite runs in
  // a plain node environment — the function only reads the edge properties.
  const rect = (
    left: number,
    top: number,
    width: number,
    height: number
  ): DOMRectReadOnly =>
    ({
      x: left,
      y: top,
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    }) as DOMRectReadOnly;

  const container = rect(0, 0, 700, 600);
  const daysGrid = rect(0, 45, 700, 555);

  it("keeps the ghost inside the grid when the pointer is centred", () => {
    const { left, top } = clampGhostToGridArea(
      300,
      300,
      20,
      10,
      80,
      48,
      container,
      daysGrid,
      45
    );
    expect(left).toBe(280);
    expect(top).toBe(290);
  });

  it("clamps against the left and header edges", () => {
    const { left, top } = clampGhostToGridArea(
      -500,
      -500,
      0,
      0,
      80,
      48,
      container,
      daysGrid,
      45
    );
    expect(left).toBe(0);
    expect(top).toBe(45);
  });

  it("clamps against the right and bottom edges", () => {
    const { left, top } = clampGhostToGridArea(
      5000,
      5000,
      0,
      0,
      80,
      48,
      container,
      daysGrid,
      45
    );
    expect(left).toBe(620);
    expect(top).toBe(552);
  });
});

describe("newTempAvailabilitySlotId", () => {
  it("is prefixed and unique across many calls", () => {
    const ids = new Set(
      Array.from({ length: 500 }, () => newTempAvailabilitySlotId())
    );
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id.startsWith("temp-")).toBe(true);
  });
});
