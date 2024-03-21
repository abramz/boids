import * as THREE from "three";
import { Instance } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ReactNode, useLayoutEffect, useRef } from "react";
import niceColors from "nice-color-palettes/500.json";
import BoidEntity from "../behavior/Boid";

export interface BoidProps {
  boid: BoidEntity;
}

const PALETTE = niceColors[84];

export default function Boid({ boid }: BoidProps): ReactNode {
  const ref = useRef<THREE.Object3D & { color: THREE.Color }>();

  useLayoutEffect(() => {
    ref.current!.position.copy(boid.position);
    ref.current!.color.set(PALETTE[boid.parentId % 5]);
  }, [boid]);

  const frameRef = useRef(1);
  useFrame(() => {
    if (
      (frameRef.current > 0 && boid.id % 2) ||
      (frameRef.current < 0 && !(boid.id % 2))
    ) {
      ref.current!.position.copy(boid.position);
    }

    frameRef.current *= -1;
  });

  return <Instance ref={ref} name={`Boid-${boid.coumpundId}`} />;
}
