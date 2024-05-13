import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { MutableRefObject, useEffect, useRef } from "react";
import { WORLD_SIZE } from "../config";

export enum MouseTrackingState {
  none,
  seek,
  avoid,
}

const raycaster = new THREE.Raycaster();

export default function useMouseTracking(): {
  trackingStateRef: MutableRefObject<MouseTrackingState>;
  trackingTargetRef: MutableRefObject<THREE.Vector3>;
} {
  const trackMouse = useRef<MouseTrackingState>(MouseTrackingState.none);
  const mouse2D = useRef<THREE.Vector2>(new THREE.Vector2());
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    const setMousePosition = (event: MouseEvent) => {
      // Convert the mouse position to normalized device coordinates (NDC)
      mouse2D.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse2D.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const track = (event: KeyboardEvent) => {
      if (trackMouse.current !== MouseTrackingState.none) {
        return;
      }

      window.addEventListener("pointermove", setMousePosition);
      if (event.shiftKey) {
        trackMouse.current = MouseTrackingState.seek;
      } else if (event.ctrlKey) {
        trackMouse.current = MouseTrackingState.avoid;
      }
    };

    const ignore = () => {
      window.removeEventListener("pointermove", setMousePosition);
      trackMouse.current = MouseTrackingState.none;
    };

    window.addEventListener("keydown", track);
    window.addEventListener("keyup", ignore);

    return () => {
      window.removeEventListener("keydown", track);
      window.removeEventListener("keyup", ignore);
      window.removeEventListener("pointermove", setMousePosition);
    };
  }, []);

  useFrame(({ camera }) => {
    if (trackMouse.current !== MouseTrackingState.none) {
      raycaster.setFromCamera(mouse2D.current, camera);
      targetRef.current
        .copy(raycaster.ray.direction)
        .multiplyScalar(WORLD_SIZE / 4)
        .add(raycaster.ray.origin);
    }
  });

  return { trackingStateRef: trackMouse, trackingTargetRef: targetRef };
}
