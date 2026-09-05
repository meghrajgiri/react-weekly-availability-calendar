import type { AvailabilitySlot, BlockedSlot } from "../src";

export const slots: AvailabilitySlot[] = [
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
  { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
  { id: 3, dayOfWeek: 5, startTime: "10:00", endTime: "13:00" },
];

export const blocked: BlockedSlot[] = [
  { dayOfWeek: 2, startTime: "12:00", endTime: "13:00", label: "Lunch" },
  { dayOfWeek: 4, startTime: "12:00", endTime: "13:00", label: "Lunch" },
];

export const colouredSlots: AvailabilitySlot[] = [
  { ...slots[0], color: "#f59e0b" },
  { ...slots[1], color: "#10b981" },
  { ...slots[2], color: "#ec4899" },
  { id: 4, dayOfWeek: 2, startTime: "15:00", endTime: "16:30" },
];
