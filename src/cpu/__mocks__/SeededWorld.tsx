import { ReactNode } from "react";
import { InternalWorld } from "../simulation/World";
import * as config from "./seededConfig";

export default function SeededWorld(): ReactNode {
  return (
    <InternalWorld
      flockSize={config.FLOCK_SIZE}
      flockCount={config.FLOCK_COUNT}
      worldBoundary={config.WORLD_BOUNDARY}
      storageBoundary={config.STORAGE_BOUNDARY}
      boidProperties={config.BOID_PROPERTIES}
      forceFactors={config.FORCE_FACTORS}
      seedX={config.SEED_X}
      seedY={config.SEED_Y}
      seedZ={config.SEED_Z}
      seedPhi={config.SEED_PHI}
      seedTheta={config.SEED_THETA}
      seedStorageStart={config.SEED_STORAGE_START}
    />
  );
}
