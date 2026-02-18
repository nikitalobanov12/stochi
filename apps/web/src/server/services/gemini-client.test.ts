import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  extractTextFromGeminiResponse,
  getGeminiModelName,
} from "./gemini-client";

describe("gemini-client", () => {
  it("extracts text from candidate parts", () => {
    const text = extractTextFromGeminiResponse({
      candidates: [
        {
          content: {
            parts: [{ text: "hello" }, { text: " world" }],
          },
        },
      ],
    });

    assert.equal(text, "hello world");
  });

  it("returns null when no text is present", () => {
    const text = extractTextFromGeminiResponse({ candidates: [] });
    assert.equal(text, null);
  });

  it("uses fallback model when model env is missing", () => {
    const model = getGeminiModelName("");
    assert.equal(model, "gemini-3-flash-preview");
  });
});
