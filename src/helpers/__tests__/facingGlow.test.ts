import * as THREE from "three";
import { describe, expect, it } from "vitest";
import createFacingGlow from "../facingGlow";

/**
 * The glow is injected by string replacement against three's own shader chunk
 * names, so a rename in a three upgrade makes every replacement a no-op and
 * hands back the stock shader: nothing throws, the obstacle rims and the sun's
 * corona simply stop being drawn. Run against the real ShaderLib, which is the
 * thing that can move.
 */
const GLOW = { color: 0xffffff, power: 2, intensity: 3 };

const VERTEX_ANCHORS = [
  "#include <common>",
  "#include <begin_vertex>",
  "#include <project_vertex>",
];
const FRAGMENT_ANCHORS = ["#include <common>", "#include <color_fragment>"];

function inject(material: THREE.MeshBasicMaterial) {
  const shader = {
    vertexShader: THREE.ShaderLib.basic.vertexShader,
    fragmentShader: THREE.ShaderLib.basic.fragmentShader,
  };

  material.onBeforeCompile(
    shader as Parameters<THREE.Material["onBeforeCompile"]>[0],
    null as unknown as THREE.WebGLRenderer,
  );

  return shader;
}

describe("createFacingGlow", () => {
  it("injects against chunks three's basic shader still has", () => {
    VERTEX_ANCHORS.forEach((anchor) =>
      expect(THREE.ShaderLib.basic.vertexShader, anchor).toContain(anchor),
    );
    FRAGMENT_ANCHORS.forEach((anchor) =>
      expect(THREE.ShaderLib.basic.fragmentShader, anchor).toContain(anchor),
    );
  });

  it("carries the facing term from the vertex stage into the fragment stage", () => {
    const shader = inject(createFacingGlow(GLOW));

    /* the normal is not transformed by default in the basic material, so the
       glow has to pull those chunks in ahead of reading it */
    expect(shader.vertexShader).toContain("#include <defaultnormal_vertex>");
    expect(shader.vertexShader).toContain("varying float vFacing;");
    expect(shader.vertexShader).toContain(
      "vFacing = abs(dot(normalize(transformedNormal), normalize(-mvPosition.xyz)));",
    );

    expect(shader.fragmentShader).toContain("varying float vFacing;");
    /* clamped, since a dot of two normalized vectors can land a hair over one
       in fp32 and GLSL leaves pow() of a negative base undefined */
    expect(shader.fragmentShader).toContain(
      "diffuseColor.a *= pow(clamp(vFacing, 0.0, 1.0), 2.00) * 3.00;",
    );
  });

  it("rims the silhouette when asked and haloes the centre otherwise", () => {
    expect(
      inject(createFacingGlow({ ...GLOW, atSilhouette: true })).fragmentShader,
    ).toContain("pow(clamp(1.0 - vFacing, 0.0, 1.0), 2.00)");
  });

  it("keeps two differently tuned glows out of each other's compiled shader", () => {
    /* three keys its program cache on onBeforeCompile's source text, which is
       identical here however the glow is tuned, so the knobs have to reach the
       key some other way or the second material draws with the first's shader */
    const rim = createFacingGlow({ ...GLOW, atSilhouette: true });
    const halo = createFacingGlow(GLOW);
    const brighter = createFacingGlow({ ...GLOW, intensity: 9 });

    expect(rim.customProgramCacheKey()).not.toBe(halo.customProgramCacheKey());
    expect(brighter.customProgramCacheKey()).not.toBe(
      halo.customProgramCacheKey(),
    );
  });

  it("draws additively over whatever is behind it", () => {
    const material = createFacingGlow({
      ...GLOW,
      fog: false,
      toneMapped: false,
    });

    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    expect(material.transparent).toBe(true);
    expect(material.fog).toBe(false);
    expect(material.toneMapped).toBe(false);
  });
});
