import * as THREE from "three";
import { Random } from "../helpers/math";

export const SEED = 123321;

export function seededRandom(seed: number = SEED): Random {
  THREE.MathUtils.seededRandom(seed);

  return () => THREE.MathUtils.seededRandom();
}
