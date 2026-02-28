export function resolveBooleanFlag(
  value: "true" | "false" | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

export function resolveBooleanFlagWithKillSwitch(
  value: "true" | "false" | undefined,
  defaultValue: boolean,
  killSwitchEnabled: boolean,
): boolean {
  if (killSwitchEnabled) {
    return false;
  }

  return resolveBooleanFlag(value, defaultValue);
}
