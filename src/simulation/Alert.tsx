import { PropsWithChildren, ReactNode, useEffect } from "react";
import { useAlertContext } from "../hooks/alertContext";

export default function Alert({ children }: PropsWithChildren): ReactNode {
  const { setAlertContents } = useAlertContext();

  useEffect(() => {
    setAlertContents(children);

    return () => setAlertContents(undefined);
  }, [children, setAlertContents]);

  return null;
}
