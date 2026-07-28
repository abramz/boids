import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";
import Alert from "./Alert";

/**
 * Crude error window to surface any errors in the simulation
 */
export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  // react-error-boundary v6 types `error` as unknown - anything can be thrown,
  // so narrow rather than assume a message
  const message = error instanceof Error ? error.message : String(error);

  return (
    <Alert>
      <div className="panel panel--error" role="alert">
        <h1>{"Something went wrong"}</h1>
        <pre>{message}</pre>
      </div>
    </Alert>
  );
}
