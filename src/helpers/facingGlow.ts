import * as THREE from "three";

export interface FacingGlowOptions {
  color: number;
  /** Higher powers tighten the glow. */
  power: number;
  intensity: number;
  /**
   * Glow where the surface turns away from the camera, which rims a silhouette,
   * rather than where it faces the camera, which haloes a centre.
   */
  atSilhouette?: boolean;
  fog?: boolean;
  toneMapped?: boolean;
}

/**
 * An additive glow driven by how squarely a surface faces the camera.
 *
 * Injecting into the basic material rather than writing a ShaderMaterial keeps
 * three's own instancing, fog and tone-mapping chunks. `project_vertex` leaves
 * the instanced view-space position in `mvPosition` and `defaultnormal_vertex`
 * leaves the matching normal in `transformedNormal`, so the facing term is just
 * the dot of the two.
 */
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

  const glow = atSilhouette ? "1.0 - vFacing" : "vFacing";

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
