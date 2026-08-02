## boids

Some toy experiments with three.js, boids, shaders, and more.

Drag to orbit, right-drag to pan, scroll to zoom. The leva panel on the right
tunes the flock while it flies.

## Development

Node 24, pinned in `.nvmrc` and run by CI. Two installs — the lint toolchain is
a separate package, for reasons in
[`tools/lint/README.md`](tools/lint/README.md):

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
npm run bench          # vitest bench, a frame at production scale
```

### The spatial index

`src/storage/` holds the index every neighbor query goes through: a hash grid
over the cells the boids occupy, with no outer boundary. How it is built and
queried is documented on `HashGrid` itself.

It has no boundary because the world is a set of forces boids steer by rather
than a wall. Nothing clamps a position, so a boid can be anywhere, and an index
with a fixed extent would stop being able to answer for the ones outside it.

What keeps the flock about the world instead is the leash: a pull home that is
zero inside the world box and grows with how far a boid has strayed past it
(`DRAW_TO_CENTER_FACTOR` in `src/config.ts`). Edge avoidance, the force that
does turn boids at the wall, ships switched off.

### Deploys and PR previews

Production is served from the root of the `gh-pages` branch; every pull request
gets a preview at `/boids/pr-<number>/`, linked from a comment and removed when
the PR closes. Both share one branch because GitHub Pages allows a single
deployment per repository — `scripts/gh-pages.sh` keeps them from treading on
each other.

Previews from forked repositories will not deploy: `pull_request` grants forks
a read-only token.

### Tests

The simulation is plain functions under `src/behavior/`, not a `useFrame`
closure: `createSimulation.ts` builds a world and drives it, `step.ts` advances
it one frame. Most of the suite runs without a renderer.

What gates a change to anything numeric:

- **Golden fixtures** (`src/__fixtures__/golden.simulation.json`) pin position
  and velocity for every boid at fixed frames. Re-record deliberately and
  commit the fixture on its own:

  ```sh
  UPDATE_GOLDEN=1 npx vitest run golden.sim
  ```

- **`src/__tests__/three-math-contract.test.ts`** pins the two three.js
  primitives the flock is seeded through, `MathUtils.seededRandom` and
  `Vector3.setFromSpherical`. If it still passes but a golden moved, the shift
  did not come from three reseeding the flock and the regression is ours: do
  not re-record. What three computes from a position afterwards is pinned in
  the suite that uses it, and fails there under its own name.

- **`src/behavior/__tests__/shippedConfig.test.ts`** flies the values
  `config.ts` actually ships, and bounds mean speed and how far the leash lets
  the flock get. It notices a force factor wound down.

- **`src/__tests__/framing.test.ts`** ties where the flock settles to what the
  camera and the fog are sized for, which nothing else connects. Retune either
  side and it catches the flock leaving the frame.

- **`src/__tests__/config.test.ts`** pins `GRID_CELL_SIZE` to the radius a boid
  actually queries, coupling `PERCEPTION_RADIUS` and `BOID_SIZE` to the size of
  an index cell.

`NEIGHBOR_LIMIT` bounds the answer where `PERCEPTION_RADIUS` bounds the search.
Uncapped, a boid in a dense patch averages every heading in range and they
cancel, leaving a weak consensus the steering forces then act on at full
strength, since `seekVelocity` normalizes whatever it is handed. Starlings
track about seven nearest birds rather than everything within a distance
(Ballerini et al., 2008).

`e2e/smoke.spec.ts` is the only test that runs a real browser, and the only one
that catches a blank canvas or a dead WebGL context.
