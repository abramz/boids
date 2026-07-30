import { ReactNode } from "react";
import { BACKGROUND_COLOR, fogDensity } from "../theme";
import useWorldSize from "../hooks/useWorldSize";

/**
 * Distance fog, sized against the world it fills.
 *
 * Its own component because the world size comes from GPU detection, which
 * suspends, and read from Simulation directly that would hold the whole scene
 * behind it. Suspense is transparent to r3f's tree, so `fog` still attaches to
 * the scene from inside a boundary.
 *
 * Fog and background share a colour so distance reads as depth rather than as
 * haze laid over the scene.
 */
export default function Fog(): ReactNode {
  const { worldSize } = useWorldSize();

  return (
    <fogExp2 attach="fog" args={[BACKGROUND_COLOR, fogDensity(worldSize)]} />
  );
}
