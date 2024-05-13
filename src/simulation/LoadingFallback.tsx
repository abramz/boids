import { ReactNode } from "react";
import Alert from "./Alert";

/**
 * Crude loading state
 */
export default function LoadingFallback(): ReactNode {
  return (
    <Alert>
      <h1>Loading...</h1>
    </Alert>
  );
}
