import { ReactNode } from "react";
import { BACKGROUND_COLOR, fogDensity } from "../theme";
import useWorldSize from "../hooks/useWorldSize";

export default function Fog(): ReactNode {
  const { worldSize } = useWorldSize();

  return (
    <fogExp2 attach="fog" args={[BACKGROUND_COLOR, fogDensity(worldSize)]} />
  );
}
