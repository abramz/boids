export default async function determineFlockSize(
  initialSize: number,
): Promise<number> {
  // TODO: figure out how to adjust the flock size based on some kind of benchmark thing, idk
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return initialSize;
}
