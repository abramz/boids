import { ReactNode } from "react";

export interface ErrorPanelProps {
  error: unknown;
}

export default function ErrorPanel({ error }: ErrorPanelProps): ReactNode {
  return (
    <div className="panel panel--error" role="alert">
      <h1>{"Something went wrong"}</h1>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
    </div>
  );
}
