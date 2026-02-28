import { env } from "~/env";
import { resolveBooleanFlag } from "~/lib/feature-flags-utils";

export function isCoachOverlayEnabled(): boolean {
  return resolveBooleanFlag(env.FEATURE_COACH_OVERLAY, false);
}

export function isProtocolHealthScoreEnabled(): boolean {
  return resolveBooleanFlag(env.FEATURE_PROTOCOL_HEALTH_SCORE, true);
}

export { resolveBooleanFlag };
