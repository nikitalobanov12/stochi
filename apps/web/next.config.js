/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
});

/** @type {import("next").NextConfig} */
const config = {
  // Turbopack config (Next.js 16+)
  turbopack: {},
};

export default withPWA(config);
