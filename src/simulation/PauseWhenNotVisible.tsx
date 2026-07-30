import { useThree } from "@react-three/fiber";
import { ReactNode, useEffect } from "react";
import usePageVisibility from "../hooks/usePageVisibility";

/**
 * Stop the clock while the tab is hidden.
 *
 * A stopped three Clock reports a delta of 0 rather than the whole time the tab
 * spent away, which the simulation would otherwise integrate in one frame.
 */
export default function PauseWhenNotVisible(): ReactNode {
  const isVisible = usePageVisibility();
  const clock = useThree((state) => state.clock);

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
