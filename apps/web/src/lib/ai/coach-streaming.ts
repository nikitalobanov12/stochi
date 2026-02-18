export function buildStreamingFrames(
  text: string,
  wordsPerFrame: number = 3,
): string[] {
  if (text.length === 0) {
    return [""];
  }

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [text];
  }

  const frames: string[] = [];

  for (
    let index = wordsPerFrame;
    index < words.length;
    index += wordsPerFrame
  ) {
    frames.push(words.slice(0, index).join(" "));
  }

  frames.push(text);
  return frames;
}
