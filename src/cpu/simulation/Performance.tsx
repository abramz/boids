import {
  AdaptiveDpr,
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
      <AdaptiveDpr />
      {children}
      <StatsGl />
    </PerformanceMonitor>
  );
}
