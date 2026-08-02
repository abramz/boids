import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";
import Alert from "./Alert";
import ErrorPanel from "./ErrorPanel";

export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  return (
    <Alert>
      <ErrorPanel error={error} />
    </Alert>
  );
}
