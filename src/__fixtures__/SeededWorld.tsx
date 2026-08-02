import { ReactNode, useState } from "react";
import { InternalWorld } from "../simulation/World";
import * as config from "./seededConfig";

export default function SeededWorld(): ReactNode {
  /* held across renders because seededWorld() reseeds a generator three keeps
     one of, per process: calling it again restarts the sequence anything else
     mid-simulation is drawing from */
  const [world] = useState(config.seededWorld);

  return (
    <InternalWorld
      world={world}
      properties={config.BOID_PROPERTIES}
      forceFactors={config.FORCE_FACTORS}
    />
  );
}
