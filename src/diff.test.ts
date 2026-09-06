import { describe, expect, it } from "vitest";

import { diffSlots, mergeAdjacentSlots } from "./utils";
import type { AvailabilitySlot } from "./types";

const s = (
  id: string,
  startTime: string,
  endTime: string,
  extra: Partial<AvailabilitySlot> = {}
): AvailabilitySlot => ({ id, dayOfWeek: 1, startTime, endTime, ...extra });

describe("diffSlots", () => {
  it("reports nothing for an unchanged array", () => {
    const slots = [s("a", "09:00", "10:00")];
    expect(diffSlots(slots, slots)).toEqual({
      created: [],
      updated: [],
      removed: [],
    });
  });

  it("reports a creation", () => {
    const d = diffSlots([], [s("a", "09:00", "10:00")]);
    expect(d.created.map((x) => x.id)).toEqual(["a"]);
    expect(d.updated).toEqual([]);
    expect(d.removed).toEqual([]);
  });

  it("reports a removal", () => {
    const d = diffSlots([s("a", "09:00", "10:00")], []);
    expect(d.removed).toEqual(["a"]);
    expect(d.created).toEqual([]);
  });

  it("reports a time change as an update, not a create plus remove", () => {
    const d = diffSlots([s("a", "09:00", "10:00")], [s("a", "10:00", "11:00")]);
    expect(d.updated.map((x) => x.id)).toEqual(["a"]);
    expect(d.created).toEqual([]);
    expect(d.removed).toEqual([]);
  });

  it("notices a day change", () => {
    const d = diffSlots(
      [s("a", "09:00", "10:00")],
      [{ ...s("a", "09:00", "10:00"), dayOfWeek: 3 }]
    );
    expect(d.updated).toHaveLength(1);
  });

  it("notices custom fields, so extra data is not silently dropped", () => {
    const d = diffSlots(
      [s("a", "09:00", "10:00", { color: "#f00" })],
      [s("a", "09:00", "10:00", { color: "#0f0" })]
    );
    expect(d.updated).toHaveLength(1);
  });

  it("describes a merge as an update plus a removal", () => {
    // The behaviour a consumer most needs told about: two slots become one,
    // the survivor's range grows, and the absorbed id ceases to exist.
    const before = [s("a", "09:00", "10:00"), s("b", "10:00", "11:00")];
    const after = mergeAdjacentSlots(before);

    expect(after).toHaveLength(1);
    const d = diffSlots(before, after);
    expect(d.updated.map((x) => x.id)).toEqual(["a"]);
    expect(d.updated[0].endTime).toBe("11:00");
    expect(d.removed).toEqual(["b"]);
    expect(d.created).toEqual([]);
  });

  it("handles a wholesale replacement", () => {
    const d = diffSlots([s("a", "09:00", "10:00")], [s("b", "14:00", "15:00")]);
    expect(d.created.map((x) => x.id)).toEqual(["b"]);
    expect(d.removed).toEqual(["a"]);
    expect(d.updated).toEqual([]);
  });

  it("distinguishes numeric and string ids", () => {
    const numeric: AvailabilitySlot = {
      id: 1,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
    };
    const d = diffSlots([numeric], [{ ...numeric, id: "1" }]);
    expect(d.created).toHaveLength(1);
    expect(d.removed).toEqual([1]);
  });
});
