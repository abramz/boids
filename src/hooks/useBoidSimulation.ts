import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { clear, suspend } from "suspend-react";
import { BoidProperties, ForceFactors } from "../behavior/Boid";
import createSimulation, {
  CreateSimulationOptions,
  Simulation,
} from "../behavior/createSimulation";

const CACHE_KEY = "boid-simulation";

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
  world: CreateSimulationOptions;
  properties: BoidProperties;
  forceFactors: ForceFactors;
}

export default function useBoidSimulation({
  world,
  properties,
  forceFactors,
}: UseBoidSimulationOptions): Simulation {
  const simulation = suspend(
    async () => createSimulation(world),
    simulationCacheKey(world),
  );

  const { flockSize, flockCount, worldSize } = world;
  useEffect(
    () => () => clear(simulationCacheKey({ flockSize, flockCount, worldSize })),
    [flockSize, flockCount, worldSize],
  );

  const failureRef = useRef<{ error: unknown } | undefined>(undefined);
  const [failure, setFailure] = useState<{ error: unknown } | undefined>();

  if (failure) {
    throw failure.error;
  }

  useFrame((_, delta) => {
    if (failureRef.current) {
      return;
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
