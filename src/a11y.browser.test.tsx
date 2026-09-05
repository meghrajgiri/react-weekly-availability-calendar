import { useState } from "react";
import { render } from "vitest-browser-react";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";

import { AvailabilityCalendar } from "./availability-calendar";
import type { AvailabilityCalendarProps, AvailabilitySlot } from "./types";

/**
 * Runs axe against the real component in a real browser.
 *
 * Storybook's a11y addon reports the same rules, but only when somebody opens
 * the panel. These assertions run in CI, so a regression fails the build
 * instead of waiting to be noticed.
 */

const slots: AvailabilitySlot[] = [
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
  { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
];

function Harness(props: Partial<AvailabilityCalendarProps>) {
  const [current, setCurrent] = useState<AvailabilitySlot[]>(
    props.slots ?? slots
  );
  return (
    <div style={{ height: 700, width: 900 }}>
      <AvailabilityCalendar
        snapMinutes={30}
        timeFormat="12"
        startHour={9}
        endHour={17}
        {...props}
        slots={current}
        onSlotsChange={setCurrent}
      />
    </div>
  );
}

async function violations(scope: Element) {
  const results = await axe.run(scope, {
    resultTypes: ["violations"],
    // Reported against the harness, not the component under test.
    rules: { region: { enabled: false } },
  });
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    help: v.help,
  }));
}

async function settled() {
  await vi.waitFor(() => {
    if (document.querySelectorAll("[data-day-column-body]").length !== 7) {
      throw new Error("not rendered");
    }
  });
  return document.body;
}

describe("axe", () => {
  it("reports no violations for the default calendar", async () => {
    render(<Harness />);
    expect(await violations(await settled())).toEqual([]);
  });

  it("reports no violations in readOnly mode", async () => {
    render(<Harness readOnly />);
    expect(await violations(await settled())).toEqual([]);
  });

  it("reports no violations with blocked slots", async () => {
    render(
      <Harness
        blockedSlots={[
          {
            dayOfWeek: 2,
            startTime: "12:00",
            endTime: "13:00",
            label: "Lunch",
          },
          {
            dayOfWeek: 4,
            startTime: "09:30",
            endTime: "10:30",
            label: "Standup",
          },
        ]}
      />
    );
    expect(await violations(await settled())).toEqual([]);
  });

  it("reports no violations with an empty calendar", async () => {
    render(<Harness slots={[]} />);
    expect(await violations(await settled())).toEqual([]);
  });

  it("reports no violations with disabled days", async () => {
    render(
      <Harness
        disabledDays={[0, 6]}
        slots={[
          { id: 1, dayOfWeek: 0, startTime: "10:00", endTime: "11:00" },
          { id: 2, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        ]}
      />
    );
    expect(await violations(await settled())).toEqual([]);
  });

  it("reports no violations with onSlotClick and custom rendering", async () => {
    render(
      <Harness
        onSlotClick={() => {}}
        renderSlot={(_s, info) => <span>{info.startLabel}</span>}
      />
    );
    expect(await violations(await settled())).toEqual([]);
  });
});
