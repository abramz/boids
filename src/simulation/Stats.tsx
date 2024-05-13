import { StatsGl } from "@react-three/drei";
import { button, useControls } from "leva";
import { useState } from "react";

export default function Stats() {
  const [isOpen, setIsOpen] = useState(false);
  useControls(
    {
      "Toggle performance graphs": button(() =>
        setIsOpen((prevState) => !prevState),
      ),
    },
    { order: 500 },
  );

  return isOpen ? <StatsGl horizontal={false} /> : null;
}
