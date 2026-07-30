import { ReactNode, useState } from "react";
import { InternalWorld } from "../simulation/World";
import * as config from "./seededConfig";

export default function SeededWorld(): ReactNode {
  /* built once: the seeded generator advances as the flock is built, so a fresh
     one per render would hand every render a different flock */
  const [world] = useState(config.seededWorld);

  return (
    <InternalWorld
      world={world}
      properties={config.BOID_PROPERTIES}
      forceFactors={config.FORCE_FACTORS}
    />
  );
}
