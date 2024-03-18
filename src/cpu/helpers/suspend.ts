// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tuple<T = any> = [T] | T[];

let result: unknown | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let error: any | undefined;
let promise: Promise<unknown> | undefined;

export type SuspendFn = typeof suspend;

/**
 * Make a function work with React's <Suspense>
 * *NB*: this can only be used in one place, which is fine, because that is my intent
 *
 * Heavily influenced by https://github.com/pmndrs/suspend-react
 * @param fn function to call
 * @param keys arguments to pass to the function
 * @returns the result, if available
 * @throws an error if one occurred, otherwise the promise
 */
export default function suspend<
  T,
  Keys extends Tuple,
  Fn extends (...keys: Keys) => Promise<T>,
>(fn: Fn, keys: Keys) {
  if (result) {
    return result as T;
  }

  if (error) {
    throw error;
  }

  if (!promise) {
    promise = fn(...keys)
      .then((res) => {
        result = res;
      })
      .catch((err) => {
        error = err;
      });
  }

  throw promise;
}
