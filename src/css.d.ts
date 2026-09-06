/**
 * CSS imported as a string.
 *
 * The package injects its own styles at runtime so consumers never have to
 * import a stylesheet, which means the CSS has to reach the bundle as text
 * rather than as a stylesheet the bundler extracts.
 */
declare module "*.css?raw" {
  const content: string;
  export default content;
}
