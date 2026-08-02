import { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AlertContext, useAlertContext } from "../alertContext";

it("refuses a caller with no provider above it", () => {
  /* the context defaults to undefined, so without this the caller reads the
     default and the alert it raises goes nowhere */
  expect(() => renderHook(() => useAlertContext())).toThrow(/provider/);
});

it("hands back the provider's own setter", () => {
  const setAlertContents = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AlertContext.Provider value={{ setAlertContents }}>
      {children}
    </AlertContext.Provider>
  );

  const { result } = renderHook(() => useAlertContext(), { wrapper });

  expect(result.current.setAlertContents).toBe(setAlertContents);
});
