import * as THREE from "three";
import { ReactNode, Suspense } from "react";
import { BOID_RADIUS } from "../config";
import Environment from "./Environment";
import Boids from "./Boids";
import useBehavior from "../hooks/useBehavior";

export interface SimulationProps {
  worldBoundary: THREE.Box3;
}

export default function Simulation({
  worldBoundary,
}: SimulationProps): ReactNode {
  const storageRef = useBehavior(BOID_RADIUS, worldBoundary);

  return (
    <>
      <Environment storageRef={storageRef} />
      <Suspense fallback={null}>
        <Boids boidRadius={BOID_RADIUS} storageRef={storageRef} />
      </Suspense>
    </>
  );
}
