import { ReconcilerRoot, createRoot, events } from "@react-three/fiber";
import { ReactNode, lazy, useEffect, useRef, useState } from "react";
import { CAMERA_DISTANCE_SCALE, WORLD_SIZE } from "../config";

const Simulation = lazy(() => import("../simulation"));
const UI = lazy(() => import("./UI"));

export default function Canvas(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // React 19 requires useRef to be given an initial value
  const rootRef = useRef<ReconcilerRoot<HTMLCanvasElement> | undefined>(
    undefined,
  );
  const [alertContents, setAlertContents] = useState<ReactNode | undefined>();

  useEffect(() => {
    const listener = () => {
      // the canvas will be resized for us as long as we call configure
      rootRef.current!.configure({});
    };

    if (canvasRef.current && !rootRef.current) {
      rootRef.current = createRoot(canvasRef.current);
      rootRef.current.configure({
        events,
        camera: {
          near: 0.0001,
          position: [0, 0, WORLD_SIZE * CAMERA_DISTANCE_SCALE],
        },
      });

      window.addEventListener("resize", listener);
      window.dispatchEvent(new Event("resize"));

      rootRef.current.render(
        <Simulation setAlertContents={setAlertContents} />,
      );
    }

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef}>
        {"Canvas is not supported by this browser"}
      </canvas>
      {/* the role belongs to whatever is showing: loading is a status, an error
          is an alert, and the instructions are neither */}
      {alertContents ? <div className="alert">{alertContents}</div> : <></>}
      <UI />
    </>
  );
}
