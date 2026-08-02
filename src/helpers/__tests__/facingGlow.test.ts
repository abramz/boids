import * as THREE from "three";
import { describe, expect, it } from "vitest";
import createFacingGlow from "../facingGlow";

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

    expect(shader.vertexShader).toContain("#include <defaultnormal_vertex>");
    expect(shader.vertexShader).toContain("varying float vFacing;");
    expect(shader.vertexShader).toContain(
      "vFacing = abs(dot(normalize(transformedNormal), normalize(-mvPosition.xyz)));",
    );

    expect(shader.fragmentShader).toContain("varying float vFacing;");
    expect(shader.fragmentShader).toContain(
      "diffuseColor.a *= pow(clamp(vFacing, 0.0, 1.0), 2.00) * 3.00;",
    );
  });

  it("rims the silhouette when asked and haloes the center otherwise", () => {
    expect(
      inject(createFacingGlow({ ...GLOW, atSilhouette: true })).fragmentShader,
    ).toContain("pow(clamp(1.0 - vFacing, 0.0, 1.0), 2.00)");
  });

  it("keeps two differently tuned glows out of each other's compiled shader", () => {
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
