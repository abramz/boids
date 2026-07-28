## boids

Some toy expirements with three.js, boids, shaders, and more.

## Development

Node 24 (see `.nvmrc`). Two installs — the lint toolchain is a separate package,
for reasons in [`tools/lint/README.md`](tools/lint/README.md):

```sh
npm ci
npm --prefix tools/lint ci
```

```sh
npm run dev            # dev server
npm run build          # typecheck + production build
npm run preview        # serve the build at /boids/
npm run lint           # eslint (via tools/lint)
npm run typecheck      # tsc, both projects
npm run format         # prettier --check
npm test               # vitest, watch mode
npm run test:ci        # vitest, single run
npm run test:coverage  # vitest with coverage
npm run test:e2e       # playwright browser smoke test
```

### Deploys and PR previews

Production is served from the root of the `gh-pages` branch; every pull request
gets a preview at `/boids/pr-<number>/`, linked from a comment and removed when
the PR closes. Both share one branch because GitHub Pages allows a single
deployment per repository — `scripts/gh-pages.sh` keeps them from treading on
each other.

Previews from forked repositories will not deploy: `pull_request` grants forks
a read-only token.

### Tests

The simulation is a plain function in `src/behavior/step.ts`, not a `useFrame`
closure, so most of the suite runs without a renderer.

Two things to know before changing anything numeric:

- **Golden fixtures** (`src/__fixtures__/golden.simulation.json`) pin position
  and velocity for every boid at fixed frames. Re-record deliberately and
  commit the fixture on its own:

  ```sh
  UPDATE_GOLDEN=1 npx vitest run golden.sim
  ```

- **`src/__tests__/three-math-contract.test.ts`** pins the three.js primitives
  the simulation is built on. If it still passes but a golden moved, three did
  not change and the regression is ours — do not re-record.

`e2e/smoke.spec.ts` is the only test that runs a real browser, and the only one
that catches a blank canvas, a dead WebGL context, or three's classes being
tree-shaken out of the bundle.
