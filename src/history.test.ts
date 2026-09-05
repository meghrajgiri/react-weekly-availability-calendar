import { describe, expect, it } from "vitest";

import { historyReducer, initialHistory } from "./history";
import type { AvailabilitySlot } from "./types";

const slots = (n: number): AvailabilitySlot[] => [
  { id: n, dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
];

const change = (
  state: ReturnType<typeof initialHistory>,
  next: AvailabilitySlot[],
  limit = 50
) => historyReducer(state, { type: "change", slots: next, limit });

describe("initialHistory", () => {
  it("starts with empty stacks", () => {
    const s = initialHistory(slots(1));
    expect(s).toEqual({ past: [], present: slots(1), future: [] });
  });
});

describe("historyReducer — change", () => {
  it("pushes the previous value onto the undo stack", () => {
    const a = slots(1);
    const b = slots(2);
    const s = change(initialHistory(a), b);
    expect(s.present).toBe(b);
    expect(s.past).toEqual([a]);
  });

  it("ignores an emission identical to the current value", () => {
    const a = slots(1);
    const start = initialHistory(a);
    expect(change(start, a)).toBe(start);
  });

  it("clears the redo stack — a new edit invalidates the redone branch", () => {
    let s = change(initialHistory(slots(1)), slots(2));
    s = historyReducer(s, { type: "undo" });
    expect(s.future).toHaveLength(1);
    s = change(s, slots(3));
    expect(s.future).toEqual([]);
  });

  it("trims the oldest entries past the limit", () => {
    let s = initialHistory(slots(0));
    for (let i = 1; i <= 10; i++) s = change(s, slots(i), 3);
    expect(s.past).toHaveLength(3);
    // The retained window is the most recent, so the oldest is dropped.
    expect(s.past[0]).toEqual(slots(7));
    expect(s.present).toEqual(slots(10));
  });

  it("keeps everything when the limit is Infinity", () => {
    let s = initialHistory(slots(0));
    for (let i = 1; i <= 200; i++) s = change(s, slots(i), Infinity);
    expect(s.past).toHaveLength(200);
  });
});

describe("historyReducer — undo/redo", () => {
  it("undo restores the previous value", () => {
    const a = slots(1);
    const b = slots(2);
    let s = change(initialHistory(a), b);
    s = historyReducer(s, { type: "undo" });
    expect(s.present).toBe(a);
    expect(s.past).toEqual([]);
    expect(s.future).toEqual([b]);
  });

  it("redo reapplies the undone value", () => {
    const a = slots(1);
    const b = slots(2);
    let s = change(initialHistory(a), b);
    s = historyReducer(s, { type: "undo" });
    s = historyReducer(s, { type: "redo" });
    expect(s.present).toBe(b);
    expect(s.future).toEqual([]);
  });

  it("undo on an empty past is a no-op and preserves identity", () => {
    const start = initialHistory(slots(1));
    expect(historyReducer(start, { type: "undo" })).toBe(start);
  });

  it("redo on an empty future is a no-op and preserves identity", () => {
    const start = initialHistory(slots(1));
    expect(historyReducer(start, { type: "redo" })).toBe(start);
  });

  it("round-trips a long sequence back to the origin", () => {
    const origin = slots(0);
    let s = initialHistory(origin);
    for (let i = 1; i <= 20; i++) s = change(s, slots(i));
    for (let i = 0; i < 20; i++) s = historyReducer(s, { type: "undo" });
    expect(s.present).toBe(origin);
    expect(s.past).toEqual([]);
    expect(s.future).toHaveLength(20);
  });

  it("redoing everything returns to the latest value", () => {
    let s = initialHistory(slots(0));
    for (let i = 1; i <= 5; i++) s = change(s, slots(i));
    const latest = s.present;
    for (let i = 0; i < 5; i++) s = historyReducer(s, { type: "undo" });
    for (let i = 0; i < 5; i++) s = historyReducer(s, { type: "redo" });
    expect(s.present).toBe(latest);
    expect(s.future).toEqual([]);
  });
});

describe("historyReducer — reset", () => {
  it("replaces the value and clears both stacks", () => {
    let s = change(initialHistory(slots(1)), slots(2));
    s = historyReducer(s, { type: "undo" });
    const fresh = slots(99);
    s = historyReducer(s, { type: "reset", slots: fresh });
    expect(s).toEqual({ past: [], present: fresh, future: [] });
  });
});
