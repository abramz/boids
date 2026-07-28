import * as THREE from "three";
import { extend } from "@react-three/fiber";

/**
 * Register three.js classes so r3f can resolve JSX elements by name.
 *
 * Nothing imports these as values, so a bundler is free to tree-shake them and
 * r3f then fails at runtime with "not part of the THREE namespace". The whole
 * namespace goes in rather than a list because drei renders elements of its own
 * - `instancedBufferAttribute` inside `Instances`, for one.
 */
extend(THREE as unknown as Parameters<typeof extend>[0]);
