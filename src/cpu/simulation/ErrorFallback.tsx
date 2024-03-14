import { Html } from "@react-three/drei";
import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";

export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  return (
    <Html center fullscreen role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </Html>
  );
}
