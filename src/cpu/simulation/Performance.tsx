import {
  PerformanceMonitor,
  PerformanceMonitorApi,
  StatsGl,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { PropsWithChildren, ReactNode, useEffect } from "react";
import { usePageVisibility } from "react-page-visibility";

export interface PerformanceProps {
  onIncline?: (api: PerformanceMonitorApi) => void;
  onDecline?: (api: PerformanceMonitorApi) => void;
}

/**
 * Handle performance related tasks
 * - at the moment it just pauses the clock when the page is not being viewed
 * - some day it would be nice to change aspects of the simulation based on performance
 */
export default function Performance({
  onIncline,
  onDecline,
  children,
}: PropsWithChildren<PerformanceProps>): ReactNode {
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

  return (
    <PerformanceMonitor onIncline={onIncline} onDecline={onDecline}>
      {children}
      <StatsGl />
    </PerformanceMonitor>
  );
}
