import "../style.css";
import { createRoot } from "react-dom/client";
import Simulation from "./simulation";
import UI from "./ui";

createRoot(document.getElementById("simulation-root")!).render(<Simulation />);
createRoot(document.getElementById("ui-root")!).render(<UI />);
