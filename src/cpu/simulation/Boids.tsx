import * as THREE from "three";
import {
  MutableRefObject,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Object3DNode, extend, useFrame } from "@react-three/fiber";
import niceColors from "nice-color-palettes/500.json";
import BoidGeometry from "../geometries/BoidGeometry";
import BoidMaterial from "../materials/BoidMaterial";
import BoidStore from "../storage/BoidStore";

extend({ BoidGeometry, BoidMaterial });
declare module "@react-three/fiber" {
  interface ThreeElements {
    boidGeometry: Object3DNode<BoidGeometry, typeof BoidGeometry>;
    boidMaterial: Object3DNode<BoidMaterial, typeof BoidMaterial>;
  }
}

export interface BoidProps {
  boidRadius: number;
  storageRef: MutableRefObject<BoidStore>;
}

const tempColor = new THREE.Color();
const tempObject = new THREE.Object3D();
const tempMatrix = new THREE.Matrix4();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3();

export default function Boids({
  boidRadius,
  storageRef,
}: BoidProps): ReactNode {
  const groupRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const colors = useMemo(() => {
    const allBoids = storageRef.current.boids;
    const c = new Float32Array(allBoids.length * 3);
    allBoids.forEach((boid) => {
      c.set(
        tempColor.set(niceColors[84][boid.parentId % 5]).toArray(),
        boid.id * 3,
      );
    });
    return c;
  }, [storageRef]);

  useLayoutEffect(() => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    storageRef.current.boids.forEach((boid) => {
      tempObject.clear();
      tempObject.position.copy(boid.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(boid.id, tempObject.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [storageRef]);

  useFrame(() => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    storageRef.current.boids.forEach((boid) => {
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
        args={[undefined, undefined, storageRef.current.boids.length]}
      >
        <boidGeometry args={[boidRadius]}>
          <instancedBufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </boidGeometry>
        <boidMaterial />
      </instancedMesh>
    </group>
  );
}
