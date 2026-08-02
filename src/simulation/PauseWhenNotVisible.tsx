import { useThree } from "@react-three/fiber";
import { ReactNode, useEffect } from "react";
import usePageVisibility from "../hooks/usePageVisibility";

export default function PauseWhenNotVisible(): ReactNode {
  const isVisible = usePageVisibility();
  const clock = useThree((state) => state.clock);

  useEffect(() => {
    if (isVisible && !clock.running) {
      const elapsed = clock.elapsedTime;
      clock.start();
      clock.elapsedTime = elapsed;
    }

    if (!isVisible && clock.running) {
      clock.stop();
    }
  }, [isVisible, clock]);

  return null;
}
