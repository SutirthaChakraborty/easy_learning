// Keep values in sync with server/utils/constants.js

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function dayLabel(value) {
  return DAYS_OF_WEEK.find((d) => d.value === value)?.label || "";
}
