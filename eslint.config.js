/**
 * Node resolves a config's imports relative to that config's own directory, and
 * the plugins live in tools/lint/node_modules - so the real config has to sit
 * there. This re-export keeps one at the root for editors to find.
 */
export { default } from "./tools/lint/eslint.config.js";
