import * as THREE from "three";

export interface FacingGlowOptions {
  color: number;
  power: number;
  intensity: number;
  atSilhouette?: boolean;
  fog?: boolean;
  toneMapped?: boolean;
}

export default function createFacingGlow({
  color,
  power,
  intensity,
  atSilhouette = false,
  fog = true,
  toneMapped = true,
}: FacingGlowOptions): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog,
    toneMapped,
  });

  const glow = atSilhouette
    ? "clamp(1.0 - vFacing, 0.0, 1.0)"
    : "clamp(vFacing, 0.0, 1.0)";

  material.customProgramCacheKey = () =>
    `facingGlow:${glow}:${power}:${intensity}`;

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vFacing;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vFacing = abs(dot(normalize(transformedNormal), normalize(-mvPosition.xyz)));`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vFacing;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.a *= pow(${glow}, ${power.toFixed(2)}) * ${intensity.toFixed(2)};`,
      );
  };

  return material;
}
