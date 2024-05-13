import { ReconcilerRoot, createRoot, events } from "@react-three/fiber";
import { ReactNode, lazy, useEffect, useRef, useState } from "react";
import { WORLD_SIZE } from "../config";

const Simulation = lazy(() => import("../simulation"));
const UI = lazy(() => import("./UI"));

export default function Canvas(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<ReconcilerRoot<HTMLCanvasElement>>();
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
          position: [0, 0, WORLD_SIZE / 2],
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
      {alertContents ? (
        <div className="alert" role="alert">
          {alertContents}
        </div>
      ) : (
        <></>
      )}
      <UI />
    </>
  );
}
