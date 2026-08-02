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

let position: THREE.Vector3;
let velocity: THREE.Vector3;
let out: THREE.Vector3;

beforeEach(() => {
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  out = new THREE.Vector3();
});

describe("seekVelocity", () => {
  it("steers towards flying along the target at full speed", () => {
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

  it("reads a zero target as no preference rather than as a stop", () => {
    velocity.set(3, 3, 3).normalize().multiplyScalar(MAX_SPEED);

    seekVelocity(velocity, new THREE.Vector3(), MAX_SPEED, MAX_FORCE, out);

    expect(out.toArray()).toEqual([0, 0, 0]);
  });
});

describe("seekPosition", () => {
  it("steers towards the target", () => {
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

  it("eases off over the last of the distance to the target", () => {
    const steerAt = (distance: number): number => {
      seekPosition(
        position,
        velocity,
        new THREE.Vector3(distance, 0, 0),
        SEPARATION,
        MAX_SPEED,
        MAX_FORCE,
        out,
      );

      return out.length();
    };

    expect(steerAt(2 * SEPARATION)).toBeCloseTo(MAX_FORCE, 12);
    expect(steerAt(SEPARATION)).toBeCloseTo(MAX_FORCE, 12);
    expect(steerAt(SEPARATION / 2)).toBeCloseTo(MAX_FORCE / 2, 12);
    expect(steerAt(SEPARATION / 4)).toBeCloseTo(MAX_FORCE / 4, 12);
  });

  it("steers nowhere from on top of the target", () => {
    velocity.set(3, 3, 3).normalize().multiplyScalar(MAX_SPEED);

    seekPosition(
      position,
      velocity,
      position.clone(),
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

  it("does not consider a wall it is not within the margin of", () => {
    expect(steer()).toEqual([0, 0, 0]);
  });

  it("steers away from every wall it is up against, not just the last", () => {
    position.set(-WALL, WALL, -WALL);

    expect(steer()).toEqual([0.5, -0.5, 0.5]);
  });

  it("steers off the nearer wall when both are within the margin", () => {
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

  it("draws nothing at all while the boid is inside", () => {
    position.set(WALL - 1, 0, 0);

    expect(steer().toArray()).toEqual([0, 0, 0]);
  });

  it("draws nothing from a boid exactly on the wall", () => {
    position.set(WALL, WALL, WALL);

    expect(steer().toArray()).toEqual([0, 0, 0]);
  });

  it("draws a strayed boid back towards the middle", () => {
    position.set(WALL * 2, 0, 0);
    velocity.set(MAX_SPEED, 0, 0);

    const force = steer();

    expect(force.x).toBeLessThan(0);
    expect(force.y).toBe(0);
    expect(force.z).toBe(0);
  });

  it("draws harder the further out the boid has got", () => {
    velocity.set(MAX_SPEED, 0, 0);

    position.set(WALL * 2, 0, 0);
    const near = steer().length();

    position.set(WALL * 20, 0, 0);
    const far = steer().length();

    expect(far).toBeGreaterThan(near);
  });

  it("draws towards the boundary's own middle, not the origin", () => {
    const offset = new THREE.Box3(
      new THREE.Vector3(100, -1, -1),
      new THREE.Vector3(102, 1, 1),
    );
    position.set(50, 0, 0);
    velocity.set(0, MAX_SPEED, 0);

    expect(steer(offset).x).toBeGreaterThan(0);
  });
});

describe("avoidObstacles", () => {
  const UNCLIPPED_FORCE = 1000;

  function steer(obstacles: Obstacle[], maxForce = MAX_FORCE): THREE.Vector3 {
    avoidObstacles(
      position,
      velocity,
      obstacles,
      PERCEPTION_RADIUS,
      MAX_SPEED,
      maxForce,
      out,
    );

    return out.clone();
  }

  it("ignores an obstacle further off than it can perceive", () => {
    velocity.set(MAX_SPEED, 0, 0);
    const far = new Obstacle(new THREE.Vector3(PERCEPTION_RADIUS + 5, 0, 0), 1);

    expect(steer([far]).toArray()).toEqual([0, 0, 0]);
  });

  it("never steers towards an obstacle, from any bearing", () => {
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

  it("pushes straight out once it is on the surface", () => {
    velocity.set(MAX_SPEED, 0, 0);

    const force = steer([new Obstacle(new THREE.Vector3(2, 0, 0), 2)]);

    expect(force.x).toBeLessThan(0);
    expect(force.z).toBeCloseTo(0, 12);
  });

  it("carries around an obstacle rather than back off it at half the approach", () => {
    velocity.set(MAX_SPEED, 0, 0);
    const radius = 1;
    const halfway = radius + PERCEPTION_RADIUS / 2;

    const force = steer(
      [new Obstacle(new THREE.Vector3(halfway, 0, 0), radius)],
      UNCLIPPED_FORCE,
    );
    const desiredVelocity = force.add(velocity);

    expect(Math.abs(desiredVelocity.z)).toBeGreaterThan(
      2 * Math.abs(desiredVelocity.x),
    );
  });

  it("steers around every obstacle in range, not just the last", () => {
    velocity.set(MAX_SPEED, 0, 0);
    const left = new Obstacle(new THREE.Vector3(3, 0, 1), 1);
    const right = new Obstacle(new THREE.Vector3(3, 1, -1), 1);

    const both = steer([left, right]);
    const justLeft = steer([left]);
    const justRight = steer([right]);

    expect(both.x).toBeCloseTo(justLeft.x + justRight.x, 12);
    expect(both.y).toBeCloseTo(justLeft.y + justRight.y, 12);
    expect(both.z).toBeCloseTo(justLeft.z + justRight.z, 12);
    expect(both.distanceTo(justRight)).toBeGreaterThan(0.1);
  });

  it("turns the way the boid is already heading", () => {
    const ahead = [new Obstacle(new THREE.Vector3(5, 0, 0), 1)];

    velocity.set(MAX_SPEED, 0, 3);
    const driftingPositive = steer(ahead);

    velocity.set(MAX_SPEED, 0, -3);
    const driftingNegative = steer(ahead);

    expect(driftingPositive.z).toBeGreaterThan(0);
    expect(driftingNegative.z).toBeLessThan(0);
  });

  it("still picks a turn for an obstacle straight along its turning axis", () => {
    velocity.set(0, MAX_SPEED, 0);

    const turn = steer([new Obstacle(new THREE.Vector3(0, 3, 0), 1)]);

    expect(turn.z).toBeGreaterThan(0);
  });
});
