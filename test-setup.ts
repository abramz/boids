import "vitest-canvas-mock";

// this must not be set up in r3f test renderer because I am getting a warning without it
// https://react.dev/blog/2022/03/08/react-18-upgrade-guide#configuring-your-testing-environment
if (!globalThis.IS_REACT_ACT_ENVIRONMENT) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}
