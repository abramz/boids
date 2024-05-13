import { beforeEach, vi, Mock, it, expect } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import { useAlertContext } from "../../hooks/alertContext";
import Alert from "../Alert";

vi.mock("../../hooks/alertContext", () => ({ useAlertContext: vi.fn() }));

let setAlertContents: Mock;

beforeEach(() => {
  setAlertContents = vi.fn();
  (useAlertContext as Mock).mockReturnValue({ setAlertContents });
});

const children = <div>{"foo"}</div>;

it("should set the alert contents on mount", async () => {
  await ReactThreeTestRenderer.create(<Alert>{children}</Alert>);

  expect(setAlertContents).toHaveBeenCalledOnce();
  expect(setAlertContents).toHaveBeenCalledWith(children);
});

it("should clear the alert contents on unmount", async () => {
  const renderer = await ReactThreeTestRenderer.create(
    <Alert>{children}</Alert>,
  );

  await renderer.unmount();

  expect(setAlertContents).toHaveBeenCalledTimes(2);
  expect(setAlertContents).toHaveBeenLastCalledWith(undefined);
});
