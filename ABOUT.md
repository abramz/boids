---
layout: default
---

# About

## What is this?

I am going to make a series of toys to mess around with [three.js](https://threejs.org) and the concept of [boids](https://www.red3d.com/cwr/boids).

While I expect these to be toys, I want to make sure I can write automated tests to verify behavior.

I am going to do this in a few stages

## (WIP) Stage 1

[Source](https://github.com/abramz/boids/tree/main/src/gpu) • [Demo](http://andrewshapro.com/boids/gpu)

Having not done 3d programming in over a decade, I am starting off by refamiliarizing myself with the math and getting to know three.js and the other tools.
While I will try to do things efficiently, I will also try to stay way form using things like shaders/GPU computations myself.

Going into this, I have the following goals:

1. Freshen up on the math.
2. Learn how to work with three.js, how to think about testing in the space, etc.
3. (NYI) Somehow adjust the number of objects in the system based on the system performance.
4. Implement some patterns/flight paths that I might like to see.
5. Implement multiple flocks, potentially with different behaviors/flight paths.

## (NYI) Stage 2

[Source](https://github.com/abramz/boids/tree/main/src/cpu) • [Demo](http://andrewshapro.com/boids/cpu)

In this stage, I am going to see if I can use the GPU to make a lot more boids.
The idea here will be to produce something very similar in behavior to the first stage.

I have the following goals for this stage:

1. Learn how to work in shaders, how to think about testing in the space, etc.
2. Produce something with similar behavior to the first stage.
3. Get more objects/better performance.

### Tools

#### Development:

- [three.js](https://github.com/mrdoob/three.js) - all of the examples are super helpful and it is a pretty mature project with a lot of usage
- [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) - the [ecosystem](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction#eco-system) seems to have a lot of tools that could be useful for implementation & automated testing
- [@react-three/drei](https://github.com/pmndrs/drei) - using some helpful components
- [leva](https://github.com/pmndrs/leva) - UI controls
- [nice-color-palettes](https://www.npmjs.com/package/nice-color-palettes) - saw it in some three.js demos and it has some...nice...color palettes
- [react-page-visibility](https://www.npmjs.com/package/react-page-visibility) - I was lazy and didn't want to implement this hook myself

#### Testing

- [vitest](https://vitest.dev) - I am already using vite and it has an experimental feature to run in the browser which may come in handy later.

For the 2nd stage, since behavior and math should largely live in shader files, testing things will get more complicated, though, if I have the tests running in the browser, I could get the results from the shaders and check their data buffers.

#### Build:

- [vite](https://github.com/vitejs/vite) - haven't used it before but seems to be pretty easy to use. I know there is a plugin for glsl files which will come in handy for the shader code.
- The usual super helpful tools: eslint, prettier, husky, and lint-staged

#### Deploy

- Deploying to github pages using an action
