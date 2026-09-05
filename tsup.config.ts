import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // tsup's treeshake step runs rollup after esbuild and strips the banner
  // below, so the two are mutually exclusive. Correct "use client" output
  // matters more than the 1-4% it saved on this bundle, and consumers still
  // tree-shake it themselves via "sideEffects": false.
  treeshake: false,
  // The component is a client component (hooks + pointer events). Without
  // this directive, importing it from a Next.js App Router server component
  // fails at build time.
  banner: { js: '"use client";' },
});
