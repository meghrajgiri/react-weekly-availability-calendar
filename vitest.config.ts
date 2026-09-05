import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    projects: [
      {
        // Pure functions: fast, no DOM needed.
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        // Interaction: a real browser, because every drag calculation in this
        // component reads getBoundingClientRect. jsdom returns zeros for it, so
        // jsdom drag tests would pass while asserting nothing.
        plugins: [react()],
        // Pre-declared so Vite does not re-optimise mid-run; a reload during
        // collection breaks the browser context import.
        optimizeDeps: {
          include: ["vitest-browser-react"],
        },
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.tsx"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
