import "./style.css";
import "./threeElements";
import { createRoot as createDOMRoot } from "react-dom/client";
import Canvas from "./dom/Canvas";

createDOMRoot(document.getElementById("root")!).render(<Canvas />);
