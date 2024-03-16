import * as THREE from "three";
import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import niceColors from "nice-color-palettes/500.json";
import BoidStore from "../storage/BoidStore";

export interface BoidProps {
  boidRadius: number;
  storage: BoidStore;
}

const tempColor = new THREE.Color();
const tempObject = new THREE.Object3D();
const tempMatrix = new THREE.Matrix4();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

export default function Boids({ boidRadius, storage }: BoidProps): ReactNode {
  const groupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const colors = useMemo(() => {
    const allBoids = storage.boids;
    const c = new Float32Array(allBoids.length * 3);
    allBoids.forEach((boid) => {
      c.set(
        tempColor.set(niceColors[84][boid.parentId % 5]).toArray(),
        boid.id * 3,
      );
    });
    return c;
  }, [storage]);

  useLayoutEffect(() => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    storage.boids.forEach((boid) => {
      tempObject.clear();
      tempObject.position.copy(boid.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(boid.id, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [storage]);

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    storage.boids.forEach((boid) => {
      meshRef.current!.getMatrixAt(boid.id, tempMatrix);
      tempObject.clear();
      tempMatrix.decompose(tempObject.position, tempQuaternion, tempScale);

      tempObject.position.copy(boid.position);
      tempObject.updateMatrix();

      meshRef.current!.setMatrixAt(boid.id, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, storage.boids.length]}
      >
        <boxGeometry args={[boidRadius, boidRadius, boidRadius]}>
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
