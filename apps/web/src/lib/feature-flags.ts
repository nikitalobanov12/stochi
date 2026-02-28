import { env } from "~/env";
import {
  resolveBooleanFlag,
  resolveBooleanFlagWithKillSwitch,
} from "~/lib/feature-flags-utils";

const COACH_OVERLAY_HARD_DISABLED = true;

export function isCoachOverlayEnabled(): boolean {
  return resolveBooleanFlagWithKillSwitch(
    env.FEATURE_COACH_OVERLAY,
    false,
    COACH_OVERLAY_HARD_DISABLED,
  );
}

export function isProtocolHealthScoreEnabled(): boolean {
  return resolveBooleanFlag(env.FEATURE_PROTOCOL_HEALTH_SCORE, true);
}

export { resolveBooleanFlag };
