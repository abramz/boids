import { ReactNode, useRef } from "react";
import { Instances } from "@react-three/drei";
import BoidEntity from "../behavior/Boid";
import Boid from "./Boid";

export const GROUP_NAME = "Boids";

export interface BoidProps {
  boidSize: number;
  boids: BoidEntity[];
}
export default function Boids({ boidSize, boids }: BoidProps): ReactNode {
  const ref = useRef(null);

  return (
    <Instances ref={ref} limit={boids.length} name={GROUP_NAME}>
      <boxGeometry args={[boidSize, boidSize, boidSize]} />
      <meshStandardMaterial toneMapped={false} />
      {boids.map((boid, i) => (
        <Boid key={i} boid={boid} />
      ))}
    </Instances>
  );
}
