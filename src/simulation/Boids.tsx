import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  ReactNode,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
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
  FLOCK_COLORS,
} from "../theme";

export const GROUP_NAME = "Boids";

/* the dart geometry stands on +Y, so that is the axis swung onto velocity */
const DART_AXIS = new THREE.Vector3(0, 1, 0);

/* one flock, one thread, one frame: every boid is written through these */
const tempObject = new THREE.Object3D();
const tempHeading = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

/** Which group of the merged geometry each material draws. */
const HULL = 0;
const PLUME = 1;

/**
 * A dart standing on +Y, which the frame loop below rotates onto the boid's
 * velocity, with a plume trailing off its blunt end down -Y.
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
 * and writes no depth, so a flock's plumes pile up without occluding one
 * another.
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
  boids: readonly BoidEntity[];
}

function Boids({ boidSize, boids }: BoidProps): ReactNode {
  const meshRef = useRef<THREE.InstancedMesh>(null);
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

  /* a boid never changes flock, so this is a one-off rather than frame work */
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    /* the matrices are rewritten every frame, and three's default hint says the
       opposite. It cannot be changed once the buffer has been used, so it is
       set here rather than alongside the writes. */
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    boids.forEach((boid, index) => {
      mesh.setColorAt(
        index,
        tempColor.set(FLOCK_COLORS[boid.parentId % FLOCK_COLORS.length]),
      );
    });
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [boids]);

  /**
   * One subscription writing every instance, rather than a component each.
   *
   * A <Boid> apiece is four lines of copying behind a fiber, a ref and a
   * useFrame subscription, ten thousand times over: r3f re-sorts its subscriber
   * list on every subscription, so mounting the flock that way is quadratic
   * before a single frame is drawn.
   */
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    boids.forEach((boid, index) => {
      tempObject.position.copy(boid.position);

      if (boid.velocity.lengthSq() > 0) {
        tempHeading.copy(boid.velocity).normalize();
        tempObject.quaternion.setFromUnitVectors(DART_AXIS, tempHeading);
      } else {
        /* nothing to point along, so hold the heading this instance was last
           drawn with rather than the one the previous boid left behind */
        mesh.getMatrixAt(index, tempMatrix);
        tempObject.quaternion.setFromRotationMatrix(tempMatrix);
      }

      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  /* Receive but never cast: a boid is a few texels across in the sun's shadow
     map, so its own shadow would only ever shimmer.

     Culling is off because an InstancedMesh computes its bounding sphere once
     and nothing writing the instance matrices invalidates it, so the flock
     would be tested against wherever it happened to be on frame one and
     eventually dropped all at once. There is nothing to save either way: this
     is one draw call spanning the whole world. */
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, boids.length]}
      name={GROUP_NAME}
      material={materials}
      receiveShadow
      frustumCulled={false}
    >
      <primitive object={geometry} attach="geometry" />
    </instancedMesh>
  );
}

/**
 * Every leva control lives above this, so without it nudging a slider rebuilds
 * the geometry and re-runs the colour pass on each of the frames a drag lasts.
 */
export default memo(Boids);
