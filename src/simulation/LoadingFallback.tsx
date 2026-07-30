import { ReactNode } from "react";
import Alert from "./Alert";

/**
 * Shown while GPU detection runs, which is a fetch and the slow half of
 * starting up. Building the flock behind it is a few milliseconds.
 */
export default function LoadingFallback(): ReactNode {
  return (
    <Alert>
      <div className="panel" role="status">
        <div className="panel-loading">
          <div className="panel-spinner" aria-hidden="true" />
          <p>{"Building the flock…"}</p>
        </div>
      </div>
    </Alert>
  );
}
