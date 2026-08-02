import "vitest-canvas-mock";

declare global {
  /* React reads this off the global to decide whether act() is required */
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

/* https://react.dev/blog/2022/03/08/react-18-upgrade-guide#configuring-your-testing-environment */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
