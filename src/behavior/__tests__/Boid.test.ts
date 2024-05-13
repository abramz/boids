import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import Boid, { BoidProperties, ForceFactors } from "../Boid";

const TEST_ID = 0;
const TEST_PARENT_ID = 5;
const EXPECTED_COMPOUND_ID = "5-0";

const TEST_PERCEPTION_RADIUS = 10;
const TEST_FIELD_OF_VIEW_DEG = 170;
const TEST_FIELD_OF_VIEW_RAD = TEST_FIELD_OF_VIEW_DEG * THREE.MathUtils.DEG2RAD;
const TEST_SEPARATION = 5;
const TEST_MAX_SPEED = 5;
const TEST_MAX_FORCE = 0.5;

const TEST_WORLD_BOUNDARY = 15;
const TEST_BOUNDARY = new THREE.Box3(
  new THREE.Vector3(
    -TEST_WORLD_BOUNDARY,
    -TEST_WORLD_BOUNDARY,
    -TEST_WORLD_BOUNDARY,
  ),
  new THREE.Vector3(
    TEST_WORLD_BOUNDARY,
    TEST_WORLD_BOUNDARY,
    TEST_WORLD_BOUNDARY,
  ),
);

const TEST_FORCE_FACTORS: ForceFactors = {
  alignmentFactor: 3,
  cohesionFactor: 3,
  separationFactor: 3,
  avoidanceFactor: 3,
  seekFactor: 3,
  avoidEdgesFactor: 3,
};

const TEST_BOID_PROPERTIES: BoidProperties = {
  perceptionRadius: TEST_PERCEPTION_RADIUS,
  fieldOfViewDeg: TEST_FIELD_OF_VIEW_DEG,
  desiredSeparation: TEST_SEPARATION,
  maxSpeed: TEST_MAX_SPEED,
  maxForce: TEST_MAX_FORCE,
  boidSize: 1,
};

let TEST_BOID: Boid;

beforeEach(() => {
  TEST_BOID = new Boid({
    id: TEST_ID,
    parentId: TEST_PARENT_ID,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  });
});

describe("compountId", () => {
  it("should return the compount id for a boid", () => {
    expect(TEST_BOID.coumpundId).toEqual(EXPECTED_COMPOUND_ID);
  });
});

describe("determineFlockingTargets", () => {
  const outAveragePosition = new THREE.Vector3();
  const outAverageVelocity = new THREE.Vector3();
  const outSeparationVelocity = new THREE.Vector3();

  beforeEach(() => {
    outAveragePosition.set(0, 0, 0);
    outAverageVelocity.set(0, 0, 0);
    outSeparationVelocity.set(0, 0, 0);
  });

  it("should average the position of neighboring flock mates", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      TEST_BOID.determineFlockingTargets(
        [
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(TEST_SEPARATION, 0, 1),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, TEST_SEPARATION, 1),
            velocity: new THREE.Vector3(),
          }),
        ],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([2, 0]);

    expect(outAveragePosition.toArray()).toEqual([
      TEST_SEPARATION / 2,
      TEST_SEPARATION / 2,
      1,
    ]);
  });

  it("should average the velocity of neighboring flock mates", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      TEST_BOID.determineFlockingTargets(
        [
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(TEST_SEPARATION, 0, 1),
            velocity: new THREE.Vector3(2, 0, -1),
          }),
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, TEST_SEPARATION, 1),
            velocity: new THREE.Vector3(0, 2, -1),
          }),
        ],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([2, 0]);

    expect(outAverageVelocity.toArray()).toEqual([1, 1, -1]);
  });

  it("should average the separation velocity for neighboring flock mates", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      TEST_BOID.determineFlockingTargets(
        [
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(2),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, 1, 1).normalize().multiplyScalar(4),
            velocity: new THREE.Vector3(),
          }),
        ],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([2, 2]);

    /* 
      The angle away is PI / 4, so "-1 * cos(PI/4)" is the numerator
      The distance is 2, so we divide by 2^2 to get the target velocity sum
      The count is 2, so we divide  by to to get the average
        2^2 * 2 = 2^3 = 8
    */
    expect(Math.fround(outSeparationVelocity.x)).toEqual(
      Math.fround((-1 * Math.cos(Math.PI / 4)) / 8),
    );

    /* 
      The angle away is PI / 4, so "-1 * cos(PI/4)" is the numerator
      The distance is 4, so we divide by 4^2 to get the target velocity sum
      The count is 2, so we divide  by to to get the average
        4^2 * 2 = 16 * 2 = 32
    */
    expect(Math.fround(outSeparationVelocity.y)).toEqual(
      Math.fround((-1 * Math.cos(Math.PI / 4)) / 32),
    );
    /* 
      For neighbor 1,
      The angle away is PI / 4, so "-1 * cos(PI/4)" is the numerator
      The distance is 2, so we divide by 2^2 to get this component of the target velocity sum

      For neighbor 2,
      The angle away is PI / 4, so "-1 * cos(PI/4)" is the numerator
      The distance is 4, so we divide by 4^2 to get this component of the target velocity sum

      We sum the two components and divide by 2 to get the average
    */
    expect(Math.fround(outSeparationVelocity.z)).toEqual(
      Math.fround(
        ((-1 * Math.cos(Math.PI / 4)) / 4 + (-1 * Math.cos(Math.PI / 4)) / 16) /
          2,
      ),
    );
  });

  it("should not modify targets if there are no neighbors", () => {
    expect(
      TEST_BOID.determineFlockingTargets(
        [],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([0, 0]);
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });

  it("should not consider neighbors out of range", () => {
    expect(
      TEST_BOID.determineFlockingTargets(
        [
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(TEST_PERCEPTION_RADIUS + 1, 0, 0),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 101,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, TEST_PERCEPTION_RADIUS + 1, 0),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 102,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, 0, TEST_PERCEPTION_RADIUS + 1),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 103,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(1, 1, 1)
              .normalize()
              .multiplyScalar(TEST_PERCEPTION_RADIUS + 1),
            velocity: new THREE.Vector3(),
          }),
        ],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([0, 0]);
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });

  it("should not consider neighbors outside the field of view", () => {
    expect(
      TEST_BOID.determineFlockingTargets(
        [
          new Boid({
            id: 100,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(-1, 0, 0),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 101,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(1, 0, 0),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 102,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, 1, 0),
            velocity: new THREE.Vector3(),
          }),
          new Boid({
            id: 103,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(0, 0, -1),
            velocity: new THREE.Vector3(),
          }),
        ],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([0, 0]);
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });

  it("should not consider itself", () => {
    expect(
      TEST_BOID.determineFlockingTargets(
        [TEST_BOID],
        TEST_PERCEPTION_RADIUS,
        TEST_FIELD_OF_VIEW_RAD,
        TEST_SEPARATION,
        outAveragePosition,
        outAverageVelocity,
        outSeparationVelocity,
      ),
    ).toEqual([0, 0]);
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });
});

describe("indiviudal forces", () => {
  const outAccelerationVector = new THREE.Vector3();

  beforeEach(() => {
    outAccelerationVector.set(0, 0, 0);
  });

  it("should align with nearby flock mates' velocities", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const targetVelocity = new THREE.Vector3(-3, -3, -3);
    const expected = new THREE.Vector3(-3, -3, -3).normalize().divideScalar(2);

    TEST_BOID.alignment(
      targetVelocity,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });

  it("should seek the average position of nearby flock mates", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const targetPosition = new THREE.Vector3(-3, -3, -3);
    const expected = new THREE.Vector3(-3, -3, -3).normalize().divideScalar(2);

    TEST_BOID.cohesion(
      targetPosition,
      1,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });

  it("should separate from all nearby entities", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const targetVelocity = new THREE.Vector3(-3, 3, -3);
    const expected = new THREE.Vector3(-3, 0, -3).normalize().divideScalar(2);

    TEST_BOID.separation(
      targetVelocity,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });

  it("should avoid the avoidance target", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const avoidPosition = new THREE.Vector3(-3, -3, -3);
    const expected = new THREE.Vector3(0, 0, 0);

    TEST_BOID.avoid(
      avoidPosition,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });

  it("should seek the seeking target", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const targetPosition = new THREE.Vector3(-3, 3, -3);
    const expected = new THREE.Vector3(-3, 0, -3).normalize().divideScalar(2);

    TEST_BOID.seekPosition(
      targetPosition,
      TEST_SEPARATION,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });

  it("should not seek the seeking target if it is too close", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const targetPosition = new THREE.Vector3(2, 2, 2);
    const expected = new THREE.Vector3(0, 0, 0);

    TEST_BOID.seekPosition(
      targetPosition,
      TEST_SEPARATION,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });

  it("should seek a target velocity", () => {
    TEST_BOID.velocity.set(3, 3, 3).normalize().multiplyScalar(TEST_MAX_SPEED);
    const targetVelocity = new THREE.Vector3(3, -3, -3);
    const expected = new THREE.Vector3(0, -3, -3).normalize().divideScalar(2);

    TEST_BOID.seekVelocity(
      targetVelocity,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual(expected.toArray());
  });
});

describe("avoidEdges", () => {
  const outAccelerationVector = new THREE.Vector3();

  beforeEach(() => {
    outAccelerationVector.set(0, 0, 0);
  });

  it("should avoid the min boundary of the world", () => {
    TEST_BOID.position.set(-TEST_WORLD_BOUNDARY, 0, 0);

    TEST_BOID.avoidEdges(
      TEST_BOUNDARY,
      1,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual([0.5, 0, 0]);
  });

  it("should avoid the max boundary of the world", () => {
    TEST_BOID.position.set(0, TEST_WORLD_BOUNDARY, 0);

    TEST_BOID.avoidEdges(
      TEST_BOUNDARY,
      1,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual([0, -0.5, 0]);
  });

  it("should not consider the boundary when within the offset", () => {
    const boundary = new THREE.Box3(
      new THREE.Vector3(-5, -5, -5),
      new THREE.Vector3(5, 5, 5),
    );

    TEST_BOID.avoidEdges(
      boundary,
      1,
      TEST_MAX_SPEED,
      TEST_MAX_FORCE,
      outAccelerationVector,
    );

    expect(outAccelerationVector.toArray()).toEqual([0, 0, 0]);
  });
});

describe("applyForces", () => {
  it(
    "should apply all of the forces scaled by their force factors",
    { todo: true } /* too much math */,
    () => {
      TEST_BOID.position.set(TEST_WORLD_BOUNDARY, 0, 0);
      TEST_BOID.velocity.set(TEST_MAX_SPEED, 0, 0);

      TEST_BOID.applyForces({
        neighbors: [
          new Boid({
            id: 923,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(TEST_WORLD_BOUNDARY, 6, 0),
            velocity: new THREE.Vector3(0, 0, -TEST_MAX_SPEED),
          }),
          new Boid({
            id: 734,
            parentId: TEST_PARENT_ID,
            position: new THREE.Vector3(TEST_WORLD_BOUNDARY, 0, 3),
            velocity: new THREE.Vector3(0, TEST_MAX_SPEED, 0),
          }),
        ],
        boundary: TEST_BOUNDARY,
        seekTarget: new THREE.Vector3(
          TEST_WORLD_BOUNDARY,
          TEST_WORLD_BOUNDARY,
          0,
        ),
        avoidTarget: new THREE.Vector3(
          TEST_WORLD_BOUNDARY,
          0,
          -TEST_WORLD_BOUNDARY,
        ),
        properties: TEST_BOID_PROPERTIES,
        forceFactors: TEST_FORCE_FACTORS,
      });

      expect(TEST_BOID.acceleration.toArray()).toEqual([0, 0, 0]);

      expect(TEST_BOID.forces.alignment).toEqual([0, 0, 0]);
      expect(TEST_BOID.forces.cohesion).toEqual([0, 0, 0]);
      expect(TEST_BOID.forces.separation).toEqual([0, 0, 0]);
      expect(TEST_BOID.forces.avoidance).toEqual([0, 0, 0]);
      expect(TEST_BOID.forces.seek).toEqual([0, 0, 0]);
      expect(TEST_BOID.forces.avoidEdges).toEqual([-1.5, 0, 0]); // going opposite direction w/ max force (0.5) * force factor (3)
    },
  );

  it("should not have an alignment factor if there are no valid neighbors", () => {
    TEST_BOID.applyForces({
      neighbors: [],
      boundary: TEST_BOUNDARY,
      seekTarget: undefined,
      avoidTarget: undefined,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.alignment).toEqual([0, 0, 0]);
  });

  it("should not have an cohesion factor if there are no valid neighbors", () => {
    TEST_BOID.applyForces({
      neighbors: [],
      boundary: TEST_BOUNDARY,
      seekTarget: undefined,
      avoidTarget: undefined,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.cohesion).toEqual([0, 0, 0]);
  });

  it("should not have an separation factor if there are no valid neighbors", () => {
    TEST_BOID.applyForces({
      neighbors: [],
      boundary: TEST_BOUNDARY,
      seekTarget: undefined,
      avoidTarget: undefined,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.separation).toEqual([0, 0, 0]);
  });

  it("should not avoid a target if there is not one", () => {
    TEST_BOID.applyForces({
      neighbors: [],
      boundary: TEST_BOUNDARY,
      seekTarget: undefined,
      avoidTarget: undefined,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.avoidance).toEqual([0, 0, 0]);
  });

  it("should not seek a target if there is not one", () => {
    TEST_BOID.applyForces({
      neighbors: [],
      boundary: TEST_BOUNDARY,
      seekTarget: undefined,
      avoidTarget: undefined,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.seek).toEqual([0, 0, 0]);
  });
});

describe("applyAccleration", () => {
  it("should apply the acceleration limiting it to the max speed", () => {
    TEST_BOID.acceleration.set(15, 0, 0);
    expect(TEST_BOID.applyAccleration(TEST_MAX_SPEED));
    expect(TEST_BOID.velocity.toArray()).toEqual([TEST_MAX_SPEED, 0, 0]);
  });
});

describe("applyVelocity", () => {
  it("should apply the velocity multiplied by the delta", () => {
    const x = 15;
    const delta = 0.012;
    const expected = x * delta;
    TEST_BOID.velocity.set(x, 0, 0);

    expect(TEST_BOID.applyVelocity(0.012));
    expect(TEST_BOID.position.toArray()).toEqual([expected, 0, 0]);
  });
});
