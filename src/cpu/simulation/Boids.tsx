import * as THREE from "three";
import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import niceColors from "nice-color-palettes/500.json";
import Boid from "../behavior/Boid";

export interface BoidProps {
  boidSize: number;
  boids: Boid[];
}

const tempColor = new THREE.Color();
const tempObject = new THREE.Object3D();

export default function Boids({ boidSize, boids }: BoidProps): ReactNode {
  const groupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const colors = useMemo(() => {
    const c = new Float32Array(boids.length * 3);
    boids.forEach((boid) => {
      c.set(
        tempColor.set(niceColors[84][boid.parentId % 5]).toArray(),
        boid.id * 3,
      );
    });
    return c;
  }, [boids]);

  useLayoutEffect(() => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    boids.forEach((boid) => {
      tempObject.clear();
      tempObject.position.copy(boid.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(boid.id, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [boids]);

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    boids.forEach((boid) => {
      tempObject.clear();
      tempObject.position.copy(boid.position);
      tempObject.updateMatrix();

      meshRef.current!.setMatrixAt(boid.id, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, boids.length]}>
        <boxGeometry args={[boidSize, boidSize, boidSize]}>
          <instancedBufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </boxGeometry>
        <meshStandardMaterial vertexColors={true} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
