const MAX_COACH_COMMAND_LENGTH = 120;
const ALLOWED_STACK_INTENTS = [
  "interactions",
  "compounds",
  "settings",
] as const;

export type StackIntent = (typeof ALLOWED_STACK_INTENTS)[number];

export function buildLogCommandHref(command: string): string {
  const trimmedCommand = command.trim();
  const encodedCommand = encodeURIComponent(trimmedCommand);
  return `/dashboard/log?coachCommand=${encodedCommand}`;
}

export function parseCoachCommandParam(
  rawValue: string | string[] | undefined,
): string | null {
  const rawCommand = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (!rawCommand) {
    return null;
  }

  const normalizedCommand = rawCommand.trim();
  if (normalizedCommand.length === 0) {
    return null;
  }

  return normalizedCommand.slice(0, MAX_COACH_COMMAND_LENGTH);
}

export function buildStackIntentHref(
  stackId: string,
  intent: StackIntent,
): string {
  const normalizedStackId = stackId.trim();
  const encodedStackId = encodeURIComponent(normalizedStackId);
  return `/dashboard/stacks/${encodedStackId}?intent=${intent}`;
}

export function parseStackIntentParam(
  rawValue: string | string[] | undefined,
): StackIntent | null {
  const rawIntent = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (!rawIntent) {
    return null;
  }

  const normalizedIntent = rawIntent.trim().toLowerCase();
  return ALLOWED_STACK_INTENTS.includes(normalizedIntent as StackIntent)
    ? (normalizedIntent as StackIntent)
    : null;
}
