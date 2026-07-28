import * as THREE from "three";
import { MutableRefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import BoidStore from "../storage/BoidStore";
import Boid, { BoidProperties, ForceFactors } from "../behavior/Boid";
import deriveBoidProperties from "../behavior/deriveBoidProperties";
import initialize from "../behavior/initialize";
import stepSimulation from "../behavior/step";
import suspend from "../helpers/suspend";
import { MouseTrackingState } from "./useMouseTracking";

export interface UseBoidSimulationOptions {
  flockSize: number;
  flockCount: number;
  boidProperties: BoidProperties;
  forceFactors: ForceFactors;
  worldBoundary: THREE.Box3;
  storageBoundary: THREE.Box3;
  trackingStateRef: MutableRefObject<MouseTrackingState>;
  trackingTargetRef: MutableRefObject<THREE.Vector3>;
  seedX?: number[];
  seedY?: number[];
  seedZ?: number[];
  seedPhi?: number[];
  seedTheta?: number[];
  seedStorageStart?: number;
}

export default function useBoidSimulation({
  flockSize,
  flockCount,
  boidProperties,
  forceFactors,
  worldBoundary,
  storageBoundary,
  trackingStateRef,
  trackingTargetRef,
  seedX,
  seedY,
  seedZ,
  seedPhi,
  seedTheta,
  seedStorageStart,
}: UseBoidSimulationOptions): [BoidStore, Boid[]] {
  const properties = deriveBoidProperties(boidProperties);

  const storage: BoidStore = suspend(initialize, [
    flockSize,
    flockCount,
    boidProperties.maxSpeed,
    worldBoundary,
    storageBoundary,
    seedX,
    seedY,
    seedZ,
    seedPhi,
    seedTheta,
    seedStorageStart,
  ]);
  const allBoids = storage.boids; // we can get this once and use it forever since we don't create/destroy boid references after this

  const frameRef = useRef<number>(1);
  useFrame((_, delta) => {
    frameRef.current = stepSimulation({
      storage,
      boids: allBoids,
      frameSign: frameRef.current,
      delta,
      properties,
      forceFactors,
      worldBoundary,
      seekTarget:
        trackingStateRef.current === MouseTrackingState.seek
          ? trackingTargetRef.current
          : undefined,
      avoidTarget:
        trackingStateRef.current === MouseTrackingState.avoid
          ? trackingTargetRef.current
          : undefined,
    });
  });

  return [storage, allBoids];
}
