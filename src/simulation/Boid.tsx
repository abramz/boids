import { Instance, PositionMesh } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ReactNode, useLayoutEffect, useRef } from "react";
import niceColors from "nice-color-palettes/500.json";
import BoidEntity from "../behavior/Boid";

export interface BoidProps {
  boid: BoidEntity;
}

const PALETTE = niceColors[84];

export default function Boid({ boid }: BoidProps): ReactNode {
  const ref = useRef<PositionMesh>(null!);

  useLayoutEffect(() => {
    ref.current.position.copy(boid.position);
    ref.current.color.set(PALETTE[boid.parentId % 5]);
  }, [boid]);

  /* stagger writes so only half the instance matrices are updated per frame */
  const renderPhase = useRef(1);
  useFrame(() => {
    const isEvenId = boid.id % 2 === 0;
    if (renderPhase.current > 0 !== isEvenId) {
      ref.current.position.copy(boid.position);
    }

    renderPhase.current *= -1;
  });

  return <Instance ref={ref} name={`Boid-${boid.coumpundId}`} />;
}
