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
    // Nested to match `base` above. Vite's `base` only rewrites the URLs in the
    // emitted HTML; it does not nest the files. A static host serving
    // dist-site as the web root would then 404 on /availability-calendar/,
    // so the directory layout has to mirror the URL path.
    outDir: fileURLToPath(
      new URL("../dist-site/availability-calendar", import.meta.url)
    ),
    emptyOutDir: true,
  },
});
