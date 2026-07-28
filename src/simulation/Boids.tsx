import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Instances } from "@react-three/drei";
import BoidEntity from "../behavior/Boid";
import {
  BOID_EMISSIVE,
  BOID_FACETS,
  BOID_LENGTH_RATIO,
  BOID_PLUME_FALLOFF,
  BOID_PLUME_INTENSITY,
  BOID_PLUME_LENGTH_RATIO,
  BOID_PLUME_RADIUS_RATIO,
  BOID_RADIUS_RATIO,
} from "../theme";
import Boid from "./Boid";

export const GROUP_NAME = "Boids";

/** Which group of the merged geometry each material draws. */
const HULL = 0;
const PLUME = 1;

/**
 * A dart standing on +Y, which Boid.tsx rotates onto the boid's velocity, with
 * a plume trailing off its blunt end down -Y.
 *
 * The two are merged into one geometry with one group each so a boid stays a
 * single instance: they need different blending, which one material cannot do,
 * but splitting them into two meshes would mean two instance matrices to write
 * per boid per frame instead of one.
 *
 * `aPlumeGlow` runs 1 where the plume leaves the hull to 0 at its tip, and is 0
 * across the hull, which never reads it.
 */
function createDartGeometry(size: number): THREE.BufferGeometry {
  const height = size * BOID_LENGTH_RATIO;
  const radius = size * BOID_RADIUS_RATIO;
  const plumeLength = size * BOID_PLUME_LENGTH_RATIO;

  const hull = new THREE.ConeGeometry(radius, height, BOID_FACETS);
  const plume = new THREE.ConeGeometry(
    radius * BOID_PLUME_RADIUS_RATIO,
    plumeLength,
    BOID_FACETS,
  );
  // turn the plume around so it tapers away from the hull, then seat its base
  // on the hull's
  plume.rotateX(Math.PI);
  plume.translate(0, -(height + plumeLength) / 2, 0);

  hull.setAttribute(
    "aPlumeGlow",
    new THREE.BufferAttribute(
      new Float32Array(hull.getAttribute("position").count),
      1,
    ),
  );

  const plumePosition = plume.getAttribute("position");
  const plumeGlow = new Float32Array(plumePosition.count);
  const plumeBase = -height / 2;
  for (let index = 0; index < plumePosition.count; index++) {
    plumeGlow[index] =
      1 - (plumeBase - plumePosition.getY(index)) / plumeLength;
  }
  plume.setAttribute("aPlumeGlow", new THREE.BufferAttribute(plumeGlow, 1));

  const merged = mergeGeometries([hull, plume], true);
  hull.dispose();
  plume.dispose();

  return merged;
}

/**
 * Lights alone leave a dart facing away from the sun as a silhouette, so the
 * hull carries a floor of its own flock colour.
 *
 * Injecting into the standard material rather than writing a ShaderMaterial
 * keeps three's own instancing, fog and tone-mapping chunks. `vColor` carries
 * the per-instance colour drei writes, so the emissive matches the flock.
 */
function createHullMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.4,
    metalness: 0.15,
    flatShading: true,
  });

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      #ifdef USE_COLOR
        totalEmissiveRadiance += vColor.rgb * ${BOID_EMISSIVE.toFixed(2)};
      #endif`,
    );
  };

  return material;
}

/**
 * The thrust the boid is under, read off the back of it. Additive and unlit, so
 * it brightens whatever it is drawn over rather than lighting like a surface,
 * and writes no depth so a flock's plumes pile up instead of occluding.
 */
function createPlumeMaterial(): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aPlumeGlow;
        varying float vPlumeGlow;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vPlumeGlow = aPlumeGlow;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vPlumeGlow;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb *= pow(clamp(vPlumeGlow, 0.0, 1.0), ${BOID_PLUME_FALLOFF.toFixed(2)}) * ${BOID_PLUME_INTENSITY.toFixed(2)};`,
      );
  };

  return material;
}

export interface BoidProps {
  boidSize: number;
  boids: BoidEntity[];
}

export default function Boids({ boidSize, boids }: BoidProps): ReactNode {
  const geometry = useMemo(() => createDartGeometry(boidSize), [boidSize]);
  const [materials] = useState(() => {
    const both = [];
    both[HULL] = createHullMaterial();
    both[PLUME] = createPlumeMaterial();

    return both as THREE.Material[];
  });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );

  // receive but never cast: a boid is a few texels across in the sun's shadow
  // map, so its own shadow would only ever shimmer
  return (
    <Instances
      limit={boids.length}
      name={GROUP_NAME}
      material={materials}
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      {boids.map((boid, i) => (
        <Boid key={i} boid={boid} />
      ))}
    </Instances>
  );
}
