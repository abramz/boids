import { ReactNode, useState } from "react";
import { InternalWorld } from "../simulation/World";
import * as config from "./seededConfig";

export default function SeededWorld(): ReactNode {
  const [world] = useState(config.seededWorld);

  return (
    <InternalWorld
      world={world}
      properties={config.BOID_PROPERTIES}
      forceFactors={config.FORCE_FACTORS}
    />
  );
}
