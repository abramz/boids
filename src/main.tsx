import "./style.css";
// must come before anything renders three JSX elements - see the file for why
import "./threeElements";
import { createRoot as createDOMRoot } from "react-dom/client";
import Canvas from "./dom/Canvas";

createDOMRoot(document.getElementById("root")!).render(<Canvas />);
