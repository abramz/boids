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

const DART_AXIS = new THREE.Vector3(0, 1, 0);

const tempObject = new THREE.Object3D();
const tempHeading = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

const HULL = 0;
const PLUME = 1;

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

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

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
        mesh.getMatrixAt(index, tempMatrix);
        tempObject.quaternion.setFromRotationMatrix(tempMatrix);
      }

      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

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

export default memo(Boids);
