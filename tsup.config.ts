import { defineConfig } from "tsup";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Resolves `*.css?raw` imports to the file's text.
 *
 * Vite understands `?raw` natively, so the docs site and the browser tests
 * need nothing. esbuild does not, hence this shim — it keeps a single import
 * form working across all three consumers of the stylesheet.
 */
const cssAsText = {
  name: "css-as-text",
  setup(build: {
    onResolve: (
      o: { filter: RegExp },
      cb: (a: { path: string; importer: string }) => unknown
    ) => void;
    onLoad: (
      o: { filter: RegExp; namespace: string },
      cb: (a: { path: string }) => unknown
    ) => void;
  }) {
    build.onResolve({ filter: /\.css\?raw$/ }, (args) => ({
      path: path.resolve(
        path.dirname(args.importer),
        args.path.replace(/\?raw$/, "")
      ),
      namespace: "css-text",
    }));
    build.onLoad({ filter: /.*/, namespace: "css-text" }, async (args) => ({
      contents: await readFile(args.path, "utf8"),
      loader: "text",
    }));
  },
};

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  treeshake: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  esbuildPlugins: [cssAsText as any],
  // tsup's treeshake step runs rollup after esbuild and drops banners, so the
  // "use client" directive is prepended afterwards instead. Both matter: the
  // directive is required for the Next.js App Router, and treeshaking keeps
  // the bundle from carrying what nobody imports.
  async onSuccess() {
    const { readFile, writeFile, rm } = await import("node:fs/promises");

    for (const file of ["dist/index.js", "dist/index.cjs"]) {
      const source = await readFile(file, "utf8");
      if (!source.includes("ac-grid-container")) {
        throw new Error(
          `${file} does not contain the inlined stylesheet. The css-as-text ` +
            `plugin has stopped working and the component would render unstyled.`
        );
      }
      if (source.startsWith('"use client"')) continue;
      await writeFile(file, `"use client";\n${source}`);
    }

    // esbuild emits a standalone stylesheet as well as inlining it, even
    // though the import is loaded as text. Nothing references it — the package
    // injects its styles at runtime and `exports` only maps the JS — so it is
    // 32 kB of dead weight in every install. Removed after the guard above has
    // confirmed the styles really are inside the bundle.
    for (const stray of [
      "dist/index.css",
      "dist/index.css.map",
      "dist/index.cjs.css",
      "dist/index.cjs.css.map",
    ]) {
      await rm(stray, { force: true });
    }
  },
});
