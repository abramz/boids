## Calling the shot

I am going to make a series of toys to mess around with [three.js](https://threejs.org) and the concept of [boids](https://www.red3d.com/cwr/boids).

While I expect these to be toys, I want to make sure I can write automated tests to verify behavior.

I am going to do this in a few stages

### Figure out a build process

I want to publish this to github pages and don't want to fuss with it later, so figure that bit out now.

### CPU Space

I haven't done 3d programming in over a decade and I am very new to three.js.
In the first stage, I am going to treat this more like a "game" with "game objects" all in CPU space.
I want to use this as an opportunity to figure out a few things

1. Freshen up on the maths and doing things in 3d.
2. Learning how to work with three.js, how to think about testing in the space, etc.
3. Adjusting the number of objects in the system based on the system performance.
4. Implement some patterns/flight paths that I might like to see.
5. Implement multiple flocks with different behaviors/flight paths.

### GPU Space

In this stage I am going to move a lot of the math to the GPU using shaders.
The idea here would be to produce something very similar in behavior to the CPU stage, but off-loading anything that makes sense to the GPU (velocity & positon calculations, etc)

The goals here would be

1. Learning how to work in shaders, how to think about testing in the space, etc.
2. Producing something with similar behavior to the CPU stage.
3. Getting better performance.

### Tools

#### Development:

- [three.js](https://github.com/mrdoob/three.js) - all of the examples are super helpful and it is a pretty mature project with a lot of usage
- [react-three-fiber](https://github.com/pmndrs/react-three-fiber) - the [ecosystem](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction#eco-system) seems to have alot of tools that could be useful for implementation & automated testing
- TBD

#### Testing

- I am not sure about this one yet. In the first stage, I can easily test the behavior/maths code since it is all in JS. If I need to I can add [@react-three/test-renderer](https://github.com/pmndrs/react-three-fiber/tree/master/packages/test-renderer) to check components if I need.

For the 2nd stage, since behavior and maths should largely live in shader files, testing things will get more complicated, though, if I have the tests running in the browser, I could get the results from the shaders and check their data buffers.

#### Build:

- [vite](https://github.com/vitejs/vite) - haven't used it before but seems to be pretty easy to use. I know there is a plugin for glsl files which will come in handy for the shader code.
- TBD
