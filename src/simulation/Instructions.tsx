import { ReactNode, useState } from "react";
import { button, useControls } from "leva";
import Alert from "./Alert";

/**
 * Crude instructions window
 */
export default function Instructions(): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  useControls(
    {
      "Show instructions": button(() => setIsOpen(true)),
    },
    { order: 50 },
  );

  return isOpen ? (
    <Alert>
      <h1>Instructions</h1>
      <p>Control the camera with the mouse</p>
      <ul>
        <li>
          Click & drag to <b>rotate</b> the camera
        </li>
        <li>
          Right click & drag to <b>pan</b> the camera
        </li>
        <li>
          Mousewheel up & down to <b>zoom</b> the camera
        </li>
      </ul>
      <p>
        Use the panel to the right to configure various aspects of the
        simulation. Changes will begin taking effect in future frames.
      </p>
      <button onClick={() => setIsOpen(false)}>{"Close"}</button>
    </Alert>
  ) : null;
}
