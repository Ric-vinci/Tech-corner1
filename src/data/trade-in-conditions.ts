export const FULLY_WORKING_CONDITION_POINTS = [
  { text: "Device must not have Screen Burn", help: "screen-burn" },
  "Must be fully functional",
  "No software or hardware faults",
  "Screen/LCD not damaged",
  "Not liquid damaged",
  "Casing and camera lens must not be cracked",
  "Average wear and tear acceptable",
] as const;

export const FAULTY_CONDITION_POINTS = [
  "No missing parts",
  "Intact, not bent in half or crushed",
  "Screen/LCD can be cracked",
  "Moderate Liquid damage is acceptable",
] as const;

export const NO_POWER_CONDITION_POINTS = [
  "Device does not power on",
  "Must be intact and not crushed",
  "Account locks must still be removed before posting",
] as const;
