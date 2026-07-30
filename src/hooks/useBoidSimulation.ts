import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { suspend } from "suspend-react";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import createSimulation, {
  CreateSimulationOptions,
  Simulation,
} from "../behavior/createSimulation";

/* suspend-react's cache is shared with drei's, so the key has to be ours */
const CACHE_KEY = "boid-simulation";

/**
 * What the built simulation is cached under. Only the shape of the world is in
 * it, so retuning the flock mid-flight changes how it flies rather than
 * replacing it; `peek` on this is how a test reaches the simulation a render
 * built.
 */
export function simulationCacheKey({
  flockSize,
  flockCount,
  worldSize,
}: Pick<CreateSimulationOptions, "flockSize" | "flockCount" | "worldSize">): [
  string,
  number,
  number,
  number,
] {
  return [CACHE_KEY, flockSize, flockCount, worldSize];
}

export interface UseBoidSimulationOptions {
  /** How the world is built. Changing its shape builds a new flock. */
  world: CreateSimulationOptions;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

/**
 * Build the simulation once, then drive it a frame at a time.
 *
 * `createSimulation` is synchronous, a full flock building in about ten
 * milliseconds, so this is suspend-react as a keyed cache rather than for any
 * asynchrony: the build runs inside the render that then suspends, and the
 * boundary is really covering the GPU detection above it, which is a fetch.
 * The cache is module-global and nothing clears it in production, so the
 * simulation outlives the component that renders it; that only stays harmless
 * while the error boundary has no retry to remount it with.
 */
export default function useBoidSimulation({
  world,
  properties,
  forceFactors,
}: UseBoidSimulationOptions): Simulation {
  const simulation = suspend(
    async () => createSimulation(world),
    simulationCacheKey(world),
  );

  /* boxed, so that a falsy thrown value still reads as "this failed" */
  const failureRef = useRef<{ error: unknown } | undefined>(undefined);
  const [failure, setFailure] = useState<{ error: unknown } | undefined>();

  // r3f calls useFrame subscribers straight out of requestAnimationFrame, with
  // no try/catch and the next frame already queued, so a throw down in the step
  // never reaches React: it just repeats. Rethrowing during render is what
  // hands it to the error boundary.
  if (failure) {
    throw failure.error;
  }

  useFrame((_, delta) => {
    // the ref, not the state: r3f holds the callback from the last committed
    // render, and the render that sets the state throws above before it can
    // resubscribe, so the state is never visible from in here
    if (failureRef.current) {
      return; // one failed step is enough; wait for the rethrow above
    }

    try {
      simulation.step({ delta, properties, forceFactors });
    } catch (error) {
      failureRef.current = { error };
      setFailure(failureRef.current);
    }
  });

  return simulation;
}
