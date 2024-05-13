import { ReactNode, createContext, useContext } from "react";

export interface Context {
  setAlertContents: (content: ReactNode) => void;
}

export const AlertContext = createContext<Context | undefined>(undefined);

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error(
      "useAlertContext should be used in an AlertContext provider",
    );
  }

  return context;
}
