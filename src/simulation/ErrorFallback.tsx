import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";
import Alert from "./Alert";

/**
 * Crude error window to surface any errors in the simulation
 */
export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  return (
    <Alert>
      <h1>Something went wrong:</h1>
      <pre>{error.message}</pre>
    </Alert>
  );
}
