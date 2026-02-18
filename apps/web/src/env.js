import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    // OAuth credentials - at least one provider pair must be configured
    BETTER_AUTH_GITHUB_CLIENT_ID: z.string().optional(),
    BETTER_AUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
    BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
    BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
    DATABASE_URL: z.string().url(),
    // Go engine URL (optional - falls back to TypeScript implementation)
    ENGINE_URL: z.string().url().optional(),
    // Shared secret for internal service-to-service auth with Go engine
    ENGINE_INTERNAL_KEY: z.string().optional(),
    // HuggingFace Inference API key (optional - enables AI dosage suggestions)
    HUGGINGFACE_API_KEY: z.string().optional(),
    // OpenAI API key (optional - enables RAG embeddings for Learn section)
    OPENAI_API_KEY: z.string().optional(),
    // Gemini API key (optional - enables Gemini for Coach chat)
    GEMINI_API_KEY: z.string().optional(),
    // Gemini model override (optional)
    GEMINI_MODEL: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_GITHUB_CLIENT_ID: process.env.BETTER_AUTH_GITHUB_CLIENT_ID,
    BETTER_AUTH_GITHUB_CLIENT_SECRET:
      process.env.BETTER_AUTH_GITHUB_CLIENT_SECRET,
    BETTER_AUTH_GOOGLE_CLIENT_ID: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
    BETTER_AUTH_GOOGLE_CLIENT_SECRET:
      process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    ENGINE_URL: process.env.ENGINE_URL,
    ENGINE_INTERNAL_KEY: process.env.ENGINE_INTERNAL_KEY,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

// Runtime validation: ensure at least one OAuth provider is configured
const hasGitHub =
  env.BETTER_AUTH_GITHUB_CLIENT_ID && env.BETTER_AUTH_GITHUB_CLIENT_SECRET;
const hasGoogle =
  env.BETTER_AUTH_GOOGLE_CLIENT_ID && env.BETTER_AUTH_GOOGLE_CLIENT_SECRET;

if (!process.env.SKIP_ENV_VALIDATION && !hasGitHub && !hasGoogle) {
  throw new Error(
    "At least one OAuth provider must be configured. " +
      "Set BETTER_AUTH_GITHUB_CLIENT_ID + BETTER_AUTH_GITHUB_CLIENT_SECRET " +
      "or BETTER_AUTH_GOOGLE_CLIENT_ID + BETTER_AUTH_GOOGLE_CLIENT_SECRET",
  );
}
