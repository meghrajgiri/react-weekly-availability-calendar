import { useState } from "react";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AvailabilityCalendar } from "./availability-calendar";
import { ROW_HEIGHT_PX } from "./constants";
import type { AvailabilityCalendarProps, AvailabilitySlot } from "./types";

/**
 * These run in a real browser on purpose.
 *
 * Every drag calculation in this component reads `getBoundingClientRect`, and
 * jsdom returns zeros for it — jsdom drag tests would pass while asserting
 * nothing at all. Real layout is the whole point.
 */

/** Renders a controlled calendar and reports every committed change. */
function Harness({
  initial = [],
  onChange,
  ...props
}: {
  initial?: AvailabilitySlot[];
  onChange?: (next: AvailabilitySlot[]) => void;
} & Partial<AvailabilityCalendarProps>) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initial);
  return (
    <div style={{ height: 700, width: 900 }}>
      <AvailabilityCalendar
        slots={slots}
        onSlotsChange={(next) => {
          setSlots(next);
          onChange?.(next);
        }}
        snapMinutes={60}
        timeFormat="24"
        startHour={9}
        endHour={17}
        {...props}
      />
    </div>
  );
}

const columns = () =>
  Array.from(document.querySelectorAll("[data-day-column-body]"));

/**
 * Waits for React to commit before measuring. Every assertion here depends on
 * real layout, so querying synchronously after render races the first paint.
 */
async function readyColumns() {
  await vi.waitFor(() => {
    if (columns().length !== 7) throw new Error("columns not rendered yet");
  });
  return columns();
}

/** The pixel centre of a given row within a day column. */
function rowPoint(col: Element, row: number, xFraction = 0.5) {
  const r = col.getBoundingClientRect();
  return {
    x: r.left + r.width * xFraction,
    y: r.top + row * ROW_HEIGHT_PX + ROW_HEIGHT_PX / 2,
  };
}

type Point = { x: number; y: number };

function pointer(type: string, at: Point, buttons: number) {
  return new PointerEvent(type, {
    clientX: at.x,
    clientY: at.y,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons,
    bubbles: true,
    cancelable: true,
  });
}

/** Lets React flush and the RAF-throttled ghost settle between steps. */
const tick = () =>
  new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

/**
 * Drives a pointer gesture at exact coordinates.
 *
 * Dispatched directly rather than through `userEvent`, for two reasons: this
 * component listens for *pointer* events, and the gesture has to land on
 * precise pixel positions rather than on an element's centre. `pointerdown`
 * goes to the target so React's delegated handler sees it; `pointermove` and
 * `pointerup` go to `document`, which is where the drag registers them.
 */
async function drag(target: Element, from: Point, to: Point, steps = 6) {
  target.dispatchEvent(pointer("pointerdown", from, 1));
  await tick();
  for (let i = 1; i <= steps; i++) {
    const at = {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    };
    document.dispatchEvent(pointer("pointermove", at, 1));
    await tick();
  }
  document.dispatchEvent(pointer("pointerup", to, 0));
  await tick();
}

/** A press and release with no movement in between. */
async function tap(target: Element, at: Point) {
  target.dispatchEvent(pointer("pointerdown", at, 1));
  await tick();
  document.dispatchEvent(pointer("pointerup", at, 0));
  await tick();
}

beforeEach(() => {
  document.body.style.margin = "0";
});

describe("drag to create", () => {
  it("creates a slot spanning the dragged rows", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const monday = (await readyColumns())[1];
    // 09:00 grid start, 60-minute rows: rows 0..2 is 09:00-12:00.
    await drag(monday, rowPoint(monday, 0), rowPoint(monday, 2));

    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "12:00",
    });
  });

  it("does not create anything in readOnly mode", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} readOnly />);

    const monday = (await readyColumns())[1];
    await drag(monday, rowPoint(monday, 0), rowPoint(monday, 2));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("stays on the origin day when multiDayCreate is off", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const cols = await readyColumns();
    await drag(cols[1], rowPoint(cols[1], 0), rowPoint(cols[4], 2));

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next).toHaveLength(1);
    expect(next[0].dayOfWeek).toBe(1);
  });

  it("spans every covered column when multiDayCreate is on", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} multiDayCreate />);

    const cols = await readyColumns();
    await drag(cols[1], rowPoint(cols[1], 0), rowPoint(cols[4], 2));

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next.map((s) => s.dayOfWeek).sort()).toEqual([1, 2, 3, 4]);
    for (const s of next) {
      expect(s).toMatchObject({ startTime: "09:00", endTime: "12:00" });
    }
  });

  it("spans correctly when the drag touches Sunday, which is falsy", async () => {
    // Sunday is day 0. An earlier prototype gated the multi-day span on
    // `startDay && currentDay`, so any range touching Sunday silently
    // collapsed. This pins that it does not.
    const onChange = vi.fn();
    render(<Harness onChange={onChange} multiDayCreate />);

    const cols = await readyColumns();
    await drag(cols[2], rowPoint(cols[2], 0), rowPoint(cols[0], 1));

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next.map((s) => s.dayOfWeek).sort()).toEqual([0, 1, 2]);
  });
});

describe("drag to move", () => {
  it("moves a slot to another day and time", async () => {
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
        ]}
      />
    );

    const cols = await readyColumns();
    const slot = cols[1].querySelector("[data-availability-block]")!;
    const r = slot.getBoundingClientRect();

    await drag(
      slot,
      { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      rowPoint(cols[3], 3)
    );

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("a");
    expect(next[0].dayOfWeek).toBe(3);
    expect(next[0].startTime).not.toBe("09:00");
  });
});

describe("drag to resize", () => {
  it("extends a slot by its bottom edge", async () => {
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
        ]}
      />
    );

    const cols = await readyColumns();
    const handle = cols[1].querySelector('[data-slot-resize="end"]')!;
    const r = handle.getBoundingClientRect();

    await drag(
      handle,
      { x: r.left + r.width / 2, y: r.bottom - 2 },
      rowPoint(cols[1], 3)
    );

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next[0].startTime).toBe("09:00");
    expect(next[0].endTime).toBe("13:00");
  });

  it("survives being resized onto an adjacent slot — audit bug #1", async () => {
    // Merging used to run on every pointermove, and a merge keeps only the
    // earliest slot's id. Resizing the later slot's start edge onto its
    // neighbour therefore destroyed the id the gesture was tracking, and the
    // drag froze for the rest of the gesture. This is the regression guard.
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          { id: "first", dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
          { id: "second", dayOfWeek: 1, startTime: "12:00", endTime: "14:00" },
        ]}
      />
    );

    const cols = await readyColumns();
    const blocks = cols[1].querySelectorAll("[data-availability-block]");
    expect(blocks).toHaveLength(2);

    const handle = blocks[1].querySelector('[data-slot-resize="start"]')!;
    const r = handle.getBoundingClientRect();

    // Drag the second slot's start edge up to touch the first slot's end.
    await drag(
      handle,
      { x: r.left + r.width / 2, y: r.top + 2 },
      rowPoint(cols[1], 1)
    );

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    // The two touch, so they merge into one continuous 09:00-14:00 range.
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ startTime: "09:00", endTime: "14:00" });
  });
});

describe("removing and activating", () => {
  it("removes a slot via its close button", async () => {
    const onChange = vi.fn();
    render(
      <Harness
        onChange={onChange}
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "11:00" },
        ]}
      />
    );

    await readyColumns();
    const removeBtn = document.querySelector<HTMLElement>(
      '[aria-label="Remove slot"]'
    )!;
    await userEvent.click(removeBtn);

    const next = onChange.mock.lastCall![0] as AvailabilitySlot[];
    expect(next).toEqual([]);
  });

  it("fires onSlotClick on a click, but not on a drag", async () => {
    const onSlotClick = vi.fn();
    render(
      <Harness
        onSlotClick={onSlotClick}
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        ]}
      />
    );

    const cols = await readyColumns();
    const slot = cols[1].querySelector("[data-availability-block]")!;
    const r = slot.getBoundingClientRect();
    const centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };

    // A press and release with no movement is a click.
    await tap(slot, centre);
    expect(onSlotClick).toHaveBeenCalledTimes(1);

    // A real drag is not.
    onSlotClick.mockClear();
    await drag(slot, centre, rowPoint(cols[3], 4));
    expect(onSlotClick).not.toHaveBeenCalled();
  });

  it("activates a focused slot with Enter", async () => {
    const onSlotClick = vi.fn();
    render(
      <Harness
        onSlotClick={onSlotClick}
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        ]}
      />
    );

    await readyColumns();
    const slot = document.querySelector<HTMLElement>(
      "[data-availability-block]"
    )!;
    slot.focus();
    expect(document.activeElement).toBe(slot);

    await userEvent.keyboard("{Enter}");
    expect(onSlotClick).toHaveBeenCalledTimes(1);
  });
});

describe("visible hour range", () => {
  it("renders only the configured hours", async () => {
    render(<Harness startHour={9} endHour={17} />);
    const col = (await readyColumns())[1];
    // 8 hours at 60-minute rows.
    expect(col.getBoundingClientRect().height).toBe(8 * ROW_HEIGHT_PX);
  });

  it("clips a slot that starts before the window", async () => {
    render(
      <Harness
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "06:00", endTime: "11:00" },
        ]}
      />
    );
    const col = (await readyColumns())[1];
    const block = col.querySelector("[data-availability-block]")!;
    // Clipped to 09:00-11:00, so two rows tall and flush with the top.
    expect(block.getBoundingClientRect().height).toBe(2 * ROW_HEIGHT_PX);
    expect(block.getBoundingClientRect().top).toBe(
      col.getBoundingClientRect().top
    );
  });

  it("does not render a slot entirely outside the window", async () => {
    render(
      <Harness
        initial={[
          { id: "a", dayOfWeek: 1, startTime: "02:00", endTime: "04:00" },
        ]}
      />
    );
    const cols = await readyColumns();
    expect(cols[1].querySelectorAll("[data-availability-block]")).toHaveLength(
      0
    );
  });
});
