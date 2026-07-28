import { ReactNode, useState } from "react";
import { button, useControls } from "leva";
import Alert from "./Alert";

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
      <div className="panel">
        <h1>{"Instructions"}</h1>
        <p>{"Move the camera with the mouse."}</p>
        <dl className="panel-keys">
          <dt>{"Drag"}</dt>
          <dd>{"Rotate"}</dd>
          <dt>{"Right drag"}</dt>
          <dd>{"Pan"}</dd>
          <dt>{"Scroll"}</dt>
          <dd>{"Zoom"}</dd>
        </dl>
        <p>
          {
            "Use the panel on the right to retune the flock. Changes take effect on the next frame."
          }
        </p>
        <button onClick={() => setIsOpen(false)}>{"Close"}</button>
      </div>
    </Alert>
  ) : null;
}
