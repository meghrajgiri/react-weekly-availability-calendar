import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Served from ui.meghrajgiri.com/availability-calendar, so assets resolve
  // relative to that path rather than the domain root.
  base: "/availability-calendar/",
  plugins: [react()],
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: fileURLToPath(new URL("../dist-site", import.meta.url)),
    emptyOutDir: true,
  },
});
