import { Html } from "@react-three/drei";
import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";

/**
 * Crude error window to surface any errors in the simulation
 */
export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  return (
    <Html center role="alert" className="alert">
      <h1>Something went wrong:</h1>
      <pre>{error.message}</pre>
    </Html>
  );
}
