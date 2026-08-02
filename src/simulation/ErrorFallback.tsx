import { ReactNode } from "react";
import { FallbackProps } from "react-error-boundary";
import Alert from "./Alert";
import ErrorPanel from "./ErrorPanel";

/**
 * What the boundary inside the r3f tree shows. The panel is drawn by the DOM
 * root rather than here, so this hands it up through Alert.
 */
export default function ErrorFallback({ error }: FallbackProps): ReactNode {
  return (
    <Alert>
      <ErrorPanel error={error} />
    </Alert>
  );
}
