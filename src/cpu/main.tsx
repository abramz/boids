import "../style.css";
import * as THREE from "three";
import { createRoot } from "react-dom/client";
import Simulation from "./simulation";
import UI from "./ui";

THREE.ColorManagement.enabled = true;

createRoot(document.getElementById("simulation-root")!).render(<Simulation />);
createRoot(document.getElementById("ui-root")!).render(<UI />);
