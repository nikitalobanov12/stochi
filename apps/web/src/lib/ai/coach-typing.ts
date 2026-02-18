const BASE_DELAY_MS = 26;
const MEDIUM_PUNCTUATION_DELAY_MS = 95;
const SENTENCE_DELAY_MS = 150;

export function getTypingStepDelayMs(character: string): number {
  if (character === "." || character === "!" || character === "?") {
    return SENTENCE_DELAY_MS;
  }

  if (character === "," || character === ";" || character === ":") {
    return MEDIUM_PUNCTUATION_DELAY_MS;
  }

  return BASE_DELAY_MS;
}
