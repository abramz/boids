import * as THREE from "three";
import { Random } from "../helpers/math";

/** The seed the goldens were recorded on. */
export const SEED = 123321;

/**
 * A deterministic source of randomness for the suites.
 *
 * three seeds a single module-level generator, so this is one sequence per
 * process: calling it again restarts the sequence that every generator already
 * handed out is drawing from.
 *
 * Kept apart from the worlds in this directory so a suite that only wants
 * repeatable numbers - a storage or helpers unit test - does not pull the
 * behaviour layer's types in behind them.
 */
export function seededRandom(seed: number = SEED): Random {
  THREE.MathUtils.seededRandom(seed);

  return () => THREE.MathUtils.seededRandom();
}
