import { ReactNode } from "react";
import Alert from "./Alert";

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
