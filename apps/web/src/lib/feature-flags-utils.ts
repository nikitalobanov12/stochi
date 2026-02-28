export function resolveBooleanFlag(
  value: "true" | "false" | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}
