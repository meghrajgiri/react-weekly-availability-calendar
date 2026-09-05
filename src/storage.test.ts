import { describe, expect, it } from "vitest";

import { fromStorageSlots, toStorageSlots } from "./storage";
import { hhmmToMinutes } from "./utils";
import type { AvailabilitySlot } from "./types";

const slot = (startTime: string, endTime: string): AvailabilitySlot => ({
  id: 1,
  dayOfWeek: 1,
  startTime,
  endTime,
});

describe("toStorageSlots", () => {
  it("rewrites an end-of-day end time", () => {
    expect(toStorageSlots([slot("22:00", "24:00")])[0].endTime).toBe("00:00");
  });

  it("leaves every other slot untouched", () => {
    const input = [slot("09:00", "17:00"), slot("00:00", "01:00")];
    expect(toStorageSlots(input)).toEqual(input);
  });

  it("never rewrites a start time", () => {
    expect(toStorageSlots([slot("00:00", "01:00")])[0].startTime).toBe("00:00");
  });

  it("does not mutate its input", () => {
    const input = [slot("22:00", "24:00")];
    const snapshot = structuredClone(input);
    toStorageSlots(input);
    expect(input).toEqual(snapshot);
  });

  it("preserves other fields", () => {
    const s = { ...slot("22:00", "24:00"), color: "#f00" };
    expect(toStorageSlots([s])[0]).toMatchObject({ color: "#f00" });
  });
});

describe("fromStorageSlots", () => {
  it("restores an end-of-day end time", () => {
    expect(fromStorageSlots([slot("22:00", "00:00")])[0].endTime).toBe("24:00");
  });

  it("round-trips exactly", () => {
    const input = [slot("22:00", "24:00"), slot("09:00", "17:00")];
    expect(fromStorageSlots(toStorageSlots(input))).toEqual(input);
  });

  it("produces a slot the calendar can actually place", () => {
    // The whole point: a raw "00:00" end parses to minute 0, which is earlier
    // than the start, so the slot would be rejected and vanish.
    const stored = slot("22:00", "00:00");
    expect(hhmmToMinutes(stored.endTime)).toBeLessThan(
      hhmmToMinutes(stored.startTime)
    );

    const restored = fromStorageSlots([stored])[0];
    expect(hhmmToMinutes(restored.endTime)).toBeGreaterThan(
      hhmmToMinutes(restored.startTime)
    );
  });
});
