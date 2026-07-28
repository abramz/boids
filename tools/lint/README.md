# Lint toolchain

ESLint and the TypeScript it parses with, in their own package.

## Why it is separate

The root package compiles with TypeScript 7, which no longer exports the
classic JS compiler API. `typescript-eslint` is built on that API, and ESLint
itself ships only `espree`, which cannot parse TypeScript — so linting `.ts`
needs a TypeScript that still has the old API. Its peer range says so:
`>=4.8.4 <6.1.0`, including on canary. Hence TypeScript 6 here.

Not an npm workspace: workspaces hoist, and `typescript-eslint` would be free
to move to the root `node_modules`, where it would resolve `typescript` to
version 7 and break. A separate lockfile makes that impossible, at the cost of
a second `npm ci`.

```sh
npm --prefix tools/lint ci
```

The flat config stays at the repo root so editors find it; it re-exports the
one here, next to the plugins it imports.

## Constraint

Keep linting non-type-aware — no `parserOptions.project`, no type-aware rules.
TypeScript 6 must only ever _parse_; giving it a program over code TypeScript 7
compiles would put two compilers' opinions on the same source.

The CI lint job asserts the TypeScript version resolved here, so a hoist that
breaks the split fails the build rather than producing confusing lint errors.
