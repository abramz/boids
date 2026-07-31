import * as THREE from "three";
import { beforeEach, describe, expect, it } from "vitest";
import Obstacle from "../../obstacle/Obstacle";
import {
  avoidEdges,
  avoidObstacles,
  drawToCenter,
  seekPosition,
  seekVelocity,
} from "../steering";

const MAX_SPEED = 5;
const MAX_FORCE = 0.5;
const PERCEPTION_RADIUS = 10;
const SEPARATION = 5;
const EDGE_MARGIN = 1;

const WALL = 15;
const BOUNDARY = new THREE.Box3(
  new THREE.Vector3(-WALL, -WALL, -WALL),
  new THREE.Vector3(WALL, WALL, WALL),
);

/* a boid's worth of state, without a boid: these steer on nothing else */
let position: THREE.Vector3;
let velocity: THREE.Vector3;
let out: THREE.Vector3;

beforeEach(() => {
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  out = new THREE.Vector3();
});

describe("seekVelocity", () => {
  it("should steer towards flying along the target at full speed", () => {
    velocity.set(3, 3, 3).normalize().multiplyScalar(MAX_SPEED);
    const expected = new THREE.Vector3(0, -3, -3).normalize().divideScalar(2);

    seekVelocity(
      velocity,
      new THREE.Vector3(3, -3, -3),
      MAX_SPEED,
      MAX_FORCE,
      out,
    );

    expect(out.toArray()).toEqual(expected.toArray());
  });

  it("should read a zero target as no preference rather than as a stop", () => {
    velocity.set(3, 3, 3).normalize().multiplyScalar(MAX_SPEED);

    seekVelocity(velocity, new THREE.Vector3(), MAX_SPEED, MAX_FORCE, out);

    // normalising nowhere gives a direction of nowhere, and steering towards
    // that is a full-strength brake: a symmetric flock would stop dead
    expect(out.toArray()).toEqual([0, 0, 0]);
  });
});

describe("seekPosition", () => {
  it("should steer towards the target", () => {
    velocity.set(3, 3, 3).normalize().multiplyScalar(MAX_SPEED);
    const expected = new THREE.Vector3(-3, 0, -3).normalize().divideScalar(2);

    seekPosition(
      position,
      velocity,
      new THREE.Vector3(-3, 3, -3),
      SEPARATION,
      MAX_SPEED,
      MAX_FORCE,
      out,
    );

    expect(out.toArray()).toEqual(expected.toArray());
  });

  it("should not steer towards a target it is already close to", () => {
    velocity.set(3, 3, 3).normalize().multiplyScalar(MAX_SPEED);

    seekPosition(
      position,
      velocity,
      new THREE.Vector3(2, 2, 2),
      SEPARATION,
      MAX_SPEED,
      MAX_FORCE,
      out,
    );

    expect(out.toArray()).toEqual([0, 0, 0]);
  });
});

describe("avoidEdges", () => {
  function steer(boundary = BOUNDARY, margin = EDGE_MARGIN): number[] {
    avoidEdges(position, velocity, boundary, margin, MAX_SPEED, MAX_FORCE, out);

    return out.toArray();
  }

  it("should avoid the min boundary of the world", () => {
    position.set(-WALL, 0, 0);

    expect(steer()).toEqual([0.5, 0, 0]);
  });

  it("should avoid the max boundary of the world", () => {
    position.set(0, WALL, 0);

    expect(steer()).toEqual([0, -0.5, 0]);
  });

  it("should not consider a wall it is not within the margin of", () => {
    expect(steer()).toEqual([0, 0, 0]);
  });

  it("should steer away from every wall it is up against, not just the last", () => {
    // into the corner where three walls meet at once
    position.set(-WALL, WALL, -WALL);

    // each axis contributes its own full-strength push, inwards on all three.
    // Keeping only the wall checked last would leave the two zeros.
    expect(steer()).toEqual([0.5, -0.5, 0.5]);
  });

  it("should steer away from two walls when it is in an edge rather than a corner", () => {
    position.set(WALL, 0, WALL);

    expect(steer()).toEqual([-0.5, 0, -0.5]);
  });

  it("should steer off the nearer wall when both are within the margin", () => {
    /* edgeMargin is a braking distance, so a low enough maxForce derives one
       wider than the world it is applied to and puts every boid inside both
       walls at once. Tested in order rather than by distance, the whole flock
       is then steered into the far one. */
    const narrow = new THREE.Box3(
      new THREE.Vector3(-1, -1, -1),
      new THREE.Vector3(1, 1, 1),
    );
    position.set(0.5, -0.5, 0);

    expect(steer(narrow, 10)).toEqual([-0.5, 0.5, 0.5]);
  });
});

describe("drawToCenter", () => {
  function steer(boundary = BOUNDARY): THREE.Vector3 {
    return drawToCenter(
      position,
      velocity,
      boundary,
      MAX_SPEED,
      MAX_FORCE,
      out,
    ).clone();
  }

  it("should draw nothing at all while the boid is inside", () => {
    /* zero inside is what keeps this out of the flocking balance entirely,
       rather than quietly biasing every boid towards the middle */
    position.set(WALL - 1, 0, 0);

    expect(steer().toArray()).toEqual([0, 0, 0]);
  });

  it("should draw nothing from a boid exactly on the wall", () => {
    position.set(WALL, WALL, WALL);

    expect(steer().toArray()).toEqual([0, 0, 0]);
  });

  it("should draw a strayed boid back towards the middle", () => {
    position.set(WALL * 2, 0, 0);
    velocity.set(MAX_SPEED, 0, 0); // flying further out

    const force = steer();

    expect(force.x).toBeLessThan(0);
    expect(force.y).toBe(0);
    expect(force.z).toBe(0);
  });

  it("should draw harder the further out the boid has got", () => {
    /* it never has to beat maxForce, only to take over the direction of what
       is summed, and growing without bound is what guarantees it eventually
       does whatever else is pulling the other way */
    velocity.set(MAX_SPEED, 0, 0);

    position.set(WALL * 2, 0, 0);
    const near = steer().length();

    position.set(WALL * 20, 0, 0);
    const far = steer().length();

    expect(far).toBeGreaterThan(near);
  });

  it("should draw towards the boundary's own middle, not the origin", () => {
    // nothing here assumes the world is centred on zero
    const offset = new THREE.Box3(
      new THREE.Vector3(100, -1, -1),
      new THREE.Vector3(102, 1, 1),
    );
    position.set(110, 0, 0);
    velocity.set(MAX_SPEED, 0, 0);

    expect(steer(offset).x).toBeLessThan(0);
  });
});

describe("avoidObstacles", () => {
  function steer(obstacles: Obstacle[]): THREE.Vector3 {
    avoidObstacles(
      position,
      velocity,
      obstacles,
      PERCEPTION_RADIUS,
      MAX_SPEED,
      MAX_FORCE,
      out,
    );

    return out.clone();
  }

  it("should ignore an obstacle further off than it can perceive", () => {
    velocity.set(MAX_SPEED, 0, 0);
    const far = new Obstacle(new THREE.Vector3(PERCEPTION_RADIUS + 5, 0, 0), 1);

    expect(steer([far]).toArray()).toEqual([0, 0, 0]);
  });

  it("should ignore an obstacle it is flying away from", () => {
    velocity.set(MAX_SPEED, 0, 0);

    expect(
      steer([new Obstacle(new THREE.Vector3(-3, 0, 0), 1)]).toArray(),
    ).toEqual([0, 0, 0]);
  });

  it("should never steer towards an obstacle, from any bearing", () => {
    // a pure tangent carries -velocity.toObstacle into the force, which points
    // back at an obstacle the boid is receding from; sweep the whole circle
    for (let degrees = 0; degrees < 360; degrees += 5) {
      const radians = degrees * THREE.MathUtils.DEG2RAD;
      const toObstacle = new THREE.Vector3(
        Math.cos(radians),
        0,
        Math.sin(radians),
      );

      velocity.set(MAX_SPEED, 0, 0);
      const force = steer([
        new Obstacle(toObstacle.clone().multiplyScalar(5), 1),
      ]);

      expect(force.dot(toObstacle)).toBeLessThanOrEqual(0);
    }
  });

  it("should push straight out once it is on the surface", () => {
    velocity.set(MAX_SPEED, 0, 0);

    const force = steer([new Obstacle(new THREE.Vector3(2, 0, 0), 2)]);

    // at the surface the turn is entirely away from the obstacle, where the
    // tangent it uses further out has no outward component at all
    expect(force.x).toBeLessThan(0);
    expect(force.z).toBeCloseTo(0, 12);
  });

  it("should steer around every obstacle in range, not just the last", () => {
    velocity.set(MAX_SPEED, 0, 0);
    const left = new Obstacle(new THREE.Vector3(3, 0, 1), 1);
    const right = new Obstacle(new THREE.Vector3(3, 1, -1), 1);

    const both = steer([left, right]);
    const justLeft = steer([left]);
    const justRight = steer([right]);

    // the two contributions add up; keeping only the one checked last would
    // land on justRight
    expect(both.x).toBeCloseTo(justLeft.x + justRight.x, 12);
    expect(both.y).toBeCloseTo(justLeft.y + justRight.y, 12);
    expect(both.z).toBeCloseTo(justLeft.z + justRight.z, 12);
    expect(both.distanceTo(justRight)).toBeGreaterThan(0.1);
  });

  it("should turn the way the boid is already heading", () => {
    const ahead = [new Obstacle(new THREE.Vector3(5, 0, 0), 1)];

    velocity.set(MAX_SPEED, 0, 3);
    const driftingPositive = steer(ahead);

    velocity.set(MAX_SPEED, 0, -3);
    const driftingNegative = steer(ahead);

    // the tangent has two directions and the boid takes the one it is already
    // going, so the same obstacle turns these two opposite ways
    expect(driftingPositive.z).toBeGreaterThan(0);
    expect(driftingNegative.z).toBeLessThan(0);
  });

  it("should still pick a turn for an obstacle straight along its turning axis", () => {
    // flying straight up at an obstacle directly overhead, where every
    // horizontal turn is equivalent and the usual cross product is degenerate
    velocity.set(0, MAX_SPEED, 0);

    const turn = steer([new Obstacle(new THREE.Vector3(0, 3, 0), 1)]);

    // a turn was taken off the fallback axis rather than collapsing to a pure
    // deceleration back down the boid's own heading
    expect(turn.z).toBeGreaterThan(0);
  });
});
