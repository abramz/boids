import { useFrame } from "@react-three/fiber";
import { MutableRefObject, ReactNode, useRef } from "react";
import * as THREE from "three";
import { MouseTrackingState } from "../../hooks/useMouseTracking";

export interface MouseVisualizerProps {
  show?: boolean;
  trackingStateRef: MutableRefObject<MouseTrackingState>;
  trackingTargetRef: MutableRefObject<THREE.Vector3>;
}

const tempColor = new THREE.Color();

export default function MouseVisualizer({
  show = false,
  trackingStateRef,
  trackingTargetRef,
}: MouseVisualizerProps): ReactNode {
  const meshRef = useRef<THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshStandardMaterial
  > | null>(null);

  useFrame(() => {
    if (show && trackingStateRef.current !== MouseTrackingState.none) {
      meshRef.current!.visible = true;
      tempColor.set(
        trackingStateRef.current === MouseTrackingState.seek
          ? "royalblue"
          : "hotpink",
      );
      meshRef.current!.material.color = tempColor;
      meshRef.current!.position.copy(trackingTargetRef.current);
    } else {
      meshRef.current!.visible = false;
    }
  });

  return (
    <mesh
      ref={meshRef}
      visible={show && trackingStateRef.current !== MouseTrackingState.none}
      name="MouseVisualizer"
    >
      <sphereGeometry args={[0.2, 64, 64]} />
      <meshStandardMaterial />
    </mesh>
  );
}
