import * as THREE from "three";
import { Instance, PositionMesh } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ReactNode, useLayoutEffect, useRef } from "react";
import BoidEntity from "../behavior/Boid";
import { FLOCK_COLORS } from "../theme";

/* the dart geometry stands on +Y, so that is the axis we swing onto velocity */
const DART_AXIS = new THREE.Vector3(0, 1, 0);

/* this is all single threaded so every boid can share one scratch vector */
const tempHeading = new THREE.Vector3();

/**
 * Put the instance where the boid is and point it where the boid is going. A
 * stalled boid keeps its last heading rather than snapping to the dart axis.
 */
function aim(instance: PositionMesh, boid: BoidEntity): void {
  instance.position.copy(boid.position);

  if (boid.velocity.lengthSq() > 0) {
    tempHeading.copy(boid.velocity).normalize();
    instance.quaternion.setFromUnitVectors(DART_AXIS, tempHeading);
  }
}

export interface BoidProps {
  boid: BoidEntity;
}

export default function Boid({ boid }: BoidProps): ReactNode {
  const ref = useRef<PositionMesh>(null!);

  useLayoutEffect(() => {
    aim(ref.current, boid);
    ref.current.color.set(FLOCK_COLORS[boid.parentId % FLOCK_COLORS.length]);
  }, [boid]);

  /* stagger writes so only half the instance matrices are updated per frame */
  const renderPhase = useRef(1);
  useFrame(() => {
    const isEvenId = boid.id % 2 === 0;
    if (renderPhase.current > 0 !== isEvenId) {
      aim(ref.current, boid);
    }

    renderPhase.current *= -1;
  });

  return <Instance ref={ref} name={`Boid-${boid.coumpundId}`} />;
}
