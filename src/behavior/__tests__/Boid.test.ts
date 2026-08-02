import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import Boid, {
  DerivedBoidProperties,
  FlockingCounts,
  ForceFactors,
} from "../Boid";
import QueryResults from "../../storage/QueryResults";
import Obstacle from "../../obstacle/Obstacle";

function found(boids: Boid[]): QueryResults<Boid> {
  const filled = new QueryResults<Boid>();
  boids.forEach((boid) => filled.push(boid));

  return filled;
}

const TEST_ID = 0;
const TEST_PARENT_ID = 5;
const EXPECTED_COMPOUND_ID = "5-0";

const TEST_PERCEPTION_RADIUS = 10;
const TEST_FIELD_OF_VIEW_DEG = 170;
const TEST_COS_HALF_FOV = Math.cos(
  (TEST_FIELD_OF_VIEW_DEG * THREE.MathUtils.DEG2RAD) / 2,
);
const TEST_SEPARATION = 5;
const TEST_NEIGHBOR_LIMIT = 8;
const TEST_MAX_SPEED = 5;
const TEST_MAX_FORCE = 0.5;
const TEST_EDGE_MARGIN = 1;

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
  avoidEdgesFactor: 3,
  avoidObstaclesFactor: 3,
  drawToCenterFactor: 3,
};

const TEST_BOID_PROPERTIES: DerivedBoidProperties = {
  perceptionRadius: TEST_PERCEPTION_RADIUS,
  fieldOfViewDeg: TEST_FIELD_OF_VIEW_DEG,
  desiredSeparation: TEST_SEPARATION,
  neighborLimit: TEST_NEIGHBOR_LIMIT,
  minSpeed: 0,
  maxSpeed: TEST_MAX_SPEED,
  maxForce: TEST_MAX_FORCE,
  boidSize: 1,
  edgeMargin: TEST_EDGE_MARGIN,
  cosHalfFieldOfView: TEST_COS_HALF_FOV,
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

describe("compoundId", () => {
  it("returns the compound id for a boid", () => {
    expect(TEST_BOID.compoundId).toEqual(EXPECTED_COMPOUND_ID);
  });
});

describe("determineFlockingTargets", () => {
  const outAveragePosition = new THREE.Vector3();
  const outAverageVelocity = new THREE.Vector3();
  const outSeparationVelocity = new THREE.Vector3();

  beforeEach(() => {
    outAveragePosition.set(9, 9, 9);
    outAverageVelocity.set(9, 9, 9);
    outSeparationVelocity.set(9, 9, 9);
  });

  const outCounts: FlockingCounts = { flockmates: 0, separation: 0 };

  function determine(neighbors: Boid[]): FlockingCounts {
    TEST_BOID.determineFlockingTargets(
      found(neighbors),
      TEST_PERCEPTION_RADIUS,
      TEST_COS_HALF_FOV,
      TEST_SEPARATION,
      TEST_NEIGHBOR_LIMIT,
      outAveragePosition,
      outAverageVelocity,
      outSeparationVelocity,
      outCounts,
    );

    return outCounts;
  }

  function neighbor(
    id: number,
    position: THREE.Vector3,
    velocity = new THREE.Vector3(),
    parentId = TEST_PARENT_ID,
  ): Boid {
    return new Boid({ id, parentId, position, velocity });
  }

  it("averages the position of neighboring flock mates", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      determine([
        neighbor(100, new THREE.Vector3(TEST_SEPARATION, 0, 1)),
        neighbor(101, new THREE.Vector3(0, TEST_SEPARATION, 1)),
      ]),
    ).toEqual({ flockmates: 2, separation: 0 });

    expect(outAveragePosition.toArray()).toEqual([
      TEST_SEPARATION / 2,
      TEST_SEPARATION / 2,
      1,
    ]);
  });

  it("averages the velocity of neighboring flock mates", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      determine([
        neighbor(
          100,
          new THREE.Vector3(TEST_SEPARATION, 0, 1),
          new THREE.Vector3(2, 0, -1),
        ),
        neighbor(
          101,
          new THREE.Vector3(0, TEST_SEPARATION, 1),
          new THREE.Vector3(0, 2, -1),
        ),
      ]),
    ).toEqual({ flockmates: 2, separation: 0 });

    expect(outAverageVelocity.toArray()).toEqual([1, 1, -1]);
  });

  it("weights separation towards the nearer of two neighbors", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      determine([
        neighbor(100, new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(2)),
        neighbor(101, new THREE.Vector3(0, 1, 1).normalize().multiplyScalar(4)),
      ]),
    ).toEqual({ flockmates: 2, separation: 2 });

    const near = Math.cos(Math.PI / 4) / 4;
    const far = Math.cos(Math.PI / 4) / 16;

    expect(outSeparationVelocity.x).toBeCloseTo(-near, 12);
    expect(outSeparationVelocity.y).toBeCloseTo(-far, 12);
    expect(outSeparationVelocity.z).toBeCloseTo(-(near + far), 12);
  });

  it("does not consider neighbors out of range", () => {
    TEST_BOID.velocity.set(0, 0, 1);

    expect(
      determine([
        neighbor(100, new THREE.Vector3(0, 0, TEST_PERCEPTION_RADIUS + 1)),
        neighbor(
          101,
          new THREE.Vector3(1, 1, 1)
            .normalize()
            .multiplyScalar(TEST_PERCEPTION_RADIUS + 1),
        ),
      ]),
    ).toEqual({ flockmates: 0, separation: 0 });
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });

  const outOfView = [
    neighbor(100, new THREE.Vector3(1, 0, 0)),
    neighbor(101, new THREE.Vector3(-1, 0, 0)),
    neighbor(102, new THREE.Vector3(0, 1, 0)),
    neighbor(103, new THREE.Vector3(0, 0, -1)),
  ];

  it("does not consider neighbors outside the field of view", () => {
    TEST_BOID.velocity.set(0, 0, TEST_MAX_SPEED);

    expect(determine(outOfView)).toEqual({ flockmates: 0, separation: 0 });
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });

  it("reads a boid with no heading as having no preference", () => {
    const narrowFieldOfView = Math.cos((120 * THREE.MathUtils.DEG2RAD) / 2);

    TEST_BOID.determineFlockingTargets(
      found([neighbor(100, new THREE.Vector3(0, 0, 2))]),
      TEST_PERCEPTION_RADIUS,
      narrowFieldOfView,
      TEST_SEPARATION,
      TEST_NEIGHBOR_LIMIT,
      outAveragePosition,
      outAverageVelocity,
      outSeparationVelocity,
      outCounts,
    );

    expect(outCounts).toEqual({ flockmates: 1, separation: 1 });
  });

  it("still counts a neighbor sitting exactly on top of it", () => {
    TEST_BOID.velocity.set(0, 0, TEST_MAX_SPEED);

    expect(
      determine([
        neighbor(100, new THREE.Vector3()),
        neighbor(101, new THREE.Vector3(0, 0, 2)),
      ]),
    ).toEqual({ flockmates: 2, separation: 2 });

    expect(outSeparationVelocity.toArray().every(Number.isFinite)).toBe(true);
    expect(outSeparationVelocity.length()).toBeGreaterThan(0);
  });

  it("flocks with the nearest few rather than everything in range", () => {
    TEST_BOID.velocity.set(0, 0, TEST_MAX_SPEED);

    const strungOut = [12, 7, 9, 3, 1, 11, 5, 2, 8, 4, 10, 6].map(
      (distance, index) =>
        neighbor(
          index,
          new THREE.Vector3(0, 0, distance),
          new THREE.Vector3(0, 0, distance),
        ),
    );

    TEST_BOID.determineFlockingTargets(
      found(strungOut),
      TEST_PERCEPTION_RADIUS,
      TEST_COS_HALF_FOV,
      TEST_SEPARATION,
      3,
      outAveragePosition,
      outAverageVelocity,
      outSeparationVelocity,
      outCounts,
    );

    expect(outCounts).toEqual({ flockmates: 3, separation: 3 });

    expect(outAveragePosition.toArray()).toEqual([0, 0, 2]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 2]);
  });

  it("keeps a flock neighborhood separate from the crowd around it", () => {
    TEST_BOID.velocity.set(0, 0, TEST_MAX_SPEED);

    const crowd = Array.from({ length: 8 }, (_, index) =>
      neighbor(
        index,
        new THREE.Vector3(0, 0, index * 0.1 + 0.5),
        undefined,
        99,
      ),
    );
    const flockmates = [
      neighbor(100, new THREE.Vector3(0, 0, 6)),
      neighbor(101, new THREE.Vector3(0, 0, 8)),
    ];

    TEST_BOID.determineFlockingTargets(
      found([...crowd, ...flockmates]),
      TEST_PERCEPTION_RADIUS,
      TEST_COS_HALF_FOV,
      TEST_SEPARATION,
      4,
      outAveragePosition,
      outAverageVelocity,
      outSeparationVelocity,
      outCounts,
    );

    expect(outCounts).toEqual({ flockmates: 2, separation: 4 });

    expect(outAveragePosition.toArray()).toEqual([0, 0, 7]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.length()).toBeGreaterThan(0);
  });

  it("does not consider itself", () => {
    TEST_BOID.velocity.set(0, 0, TEST_MAX_SPEED);

    expect(determine([TEST_BOID])).toEqual({ flockmates: 0, separation: 0 });
    expect(outAveragePosition.toArray()).toEqual([0, 0, 0]);
    expect(outAverageVelocity.toArray()).toEqual([0, 0, 0]);
    expect(outSeparationVelocity.toArray()).toEqual([0, 0, 0]);
  });
});

describe("applyForces", () => {
  function flockmate(id: number, position: THREE.Vector3): Boid {
    return new Boid({
      id,
      parentId: TEST_PARENT_ID,
      position,
      velocity: new THREE.Vector3(0, TEST_MAX_SPEED, 0),
    });
  }

  it("applies all of the forces scaled by their force factors", () => {
    TEST_BOID.position.set(TEST_WORLD_BOUNDARY, 0, 0);
    TEST_BOID.velocity.set(TEST_MAX_SPEED, 0, 0);

    TEST_BOID.applyForces({
      neighbors: found([
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
      ]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.alignment).toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.cohesion).toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.separation).toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.avoidObstacles).toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.avoidEdges).toEqual([-1.5, 0, 0]);

    expect(TEST_BOID.acceleration.toArray()).toEqual([-TEST_MAX_FORCE, 0, 0]);
  });

  it("scales obstacle avoidance by its own factor, not the edges'", () => {
    TEST_BOID.velocity.set(TEST_MAX_SPEED, 0, 0);

    TEST_BOID.applyForces({
      neighbors: found([]),
      obstacles: [new Obstacle(new THREE.Vector3(5, 0, 0), 1)],
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: {
        ...TEST_FORCE_FACTORS,
        avoidEdgesFactor: 0,
        avoidObstaclesFactor: 2,
      },
    });

    const scaled = new THREE.Vector3(...TEST_BOID.forces.avoidObstacles);
    expect(scaled.length()).toBeCloseTo(TEST_MAX_FORCE * 2, 12);

    TEST_BOID.applyForces({
      neighbors: found([]),
      obstacles: [new Obstacle(new THREE.Vector3(5, 0, 0), 1)],
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: {
        ...TEST_FORCE_FACTORS,
        avoidEdgesFactor: 9,
        avoidObstaclesFactor: 0,
      },
    });

    expect(new THREE.Vector3(...TEST_BOID.forces.avoidObstacles).length()).toBe(
      0,
    );
  });

  it("scales the draw to center by its own factor, not the edges'", () => {
    TEST_BOID.position.set(TEST_WORLD_BOUNDARY * 3, 0, 0);
    TEST_BOID.velocity.set(TEST_MAX_SPEED, 0, 0);

    TEST_BOID.applyForces({
      neighbors: found([]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: {
        ...TEST_FORCE_FACTORS,
        avoidEdgesFactor: 9,
        drawToCenterFactor: 0,
      },
    });

    expect(new THREE.Vector3(...TEST_BOID.forces.drawToCenter).length()).toBe(
      0,
    );

    TEST_BOID.applyForces({
      neighbors: found([]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: {
        ...TEST_FORCE_FACTORS,
        avoidEdgesFactor: 0,
        drawToCenterFactor: 2,
      },
    });

    expect(
      new THREE.Vector3(...TEST_BOID.forces.drawToCenter).length(),
    ).toBeCloseTo(TEST_MAX_FORCE * 2, 12);
  });

  it("forgets the flocking forces once the last flockmate is out of range", () => {
    TEST_BOID.velocity.set(0, 0, TEST_MAX_SPEED);

    TEST_BOID.applyForces({
      neighbors: found([
        flockmate(1, new THREE.Vector3(3, 0, 9)),
        flockmate(2, new THREE.Vector3(0, 0, 2)),
      ]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.alignment).not.toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.cohesion).not.toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.separation).not.toEqual([0, 0, 0]);

    TEST_BOID.applyForces({
      neighbors: found([]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.alignment).toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.cohesion).toEqual([0, 0, 0]);
    expect(TEST_BOID.forces.separation).toEqual([0, 0, 0]);
  });

  it("forgets edge avoidance once its factor is wound to nothing", () => {
    TEST_BOID.position.set(TEST_WORLD_BOUNDARY, 0, 3);
    TEST_BOID.velocity.set(TEST_MAX_SPEED, 0, 0);

    TEST_BOID.applyForces({
      neighbors: found([]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: TEST_FORCE_FACTORS,
    });

    expect(TEST_BOID.forces.avoidEdges).not.toEqual([0, 0, 0]);

    TEST_BOID.applyForces({
      neighbors: found([]),
      boundary: TEST_BOUNDARY,
      properties: TEST_BOID_PROPERTIES,
      forceFactors: { ...TEST_FORCE_FACTORS, avoidEdgesFactor: 0 },
    });

    expect(TEST_BOID.forces.avoidEdges).toEqual([0, 0, 0]);
  });
});

describe("applyAcceleration", () => {
  const TEST_MIN_SPEED = 2;

  it("applies the acceleration limiting it to the max speed", () => {
    TEST_BOID.acceleration.set(15, 0, 0);

    TEST_BOID.applyAcceleration(1, 0, TEST_MAX_SPEED);

    expect(TEST_BOID.velocity.toArray()).toEqual([TEST_MAX_SPEED, 0, 0]);
  });

  it("scales the acceleration by the delta", () => {
    TEST_BOID.acceleration.set(2, 0, 0);

    TEST_BOID.applyAcceleration(0.5, 0, TEST_MAX_SPEED);

    expect(TEST_BOID.velocity.toArray()).toEqual([1, 0, 0]);
  });

  it("does not let a boid be left flying below the minimum speed", () => {
    TEST_BOID.velocity.set(0.25, 0, 0);

    TEST_BOID.applyAcceleration(1, TEST_MIN_SPEED, TEST_MAX_SPEED);

    expect(TEST_BOID.velocity.toArray()).toEqual([TEST_MIN_SPEED, 0, 0]);
  });

  it("sets off instead of staying frozen with no velocity and no forces", () => {
    TEST_BOID.applyAcceleration(1, TEST_MIN_SPEED, TEST_MAX_SPEED);

    expect(TEST_BOID.velocity.length()).toBeCloseTo(TEST_MIN_SPEED, 12);
  });
});

describe("applyVelocity", () => {
  it("applies the velocity multiplied by the delta", () => {
    const x = 15;
    const delta = 0.012;
    const expected = x * delta;
    TEST_BOID.velocity.set(x, 0, 0);

    TEST_BOID.applyVelocity(delta);

    expect(TEST_BOID.position.toArray()).toEqual([expected, 0, 0]);
  });
});
