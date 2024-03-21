import { useThree } from "@react-three/fiber";
import { ReactNode, useEffect } from "react";
import { usePageVisibility } from "react-page-visibility";

export default function PauseWhenNotVisibile(): ReactNode {
  const isVisible = usePageVisibility();
  const { clock } = useThree();

  useEffect(() => {
    if (isVisible && !clock.running) {
      clock.start();
    }

    if (!isVisible && clock.running) {
      clock.stop();
    }
  }, [isVisible, clock]);

  return null;
}
