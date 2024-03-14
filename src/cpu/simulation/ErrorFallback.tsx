import { Html } from "@react-three/drei";
import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";

export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  return (
    <Html
      center
      role="alert"
      style={{
        width: "30vw",
        border: "2px solid red",
        padding: "16px",
        backgroundColor: "#193c3c",
      }}
    >
      <p style={{ fontSize: "24px" }}>Something went wrong:</p>
      <pre style={{ color: "red", fontSize: "18px" }}>{error.message}</pre>
    </Html>
  );
}
