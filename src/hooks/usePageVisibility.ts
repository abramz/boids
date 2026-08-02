import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);

  return () => document.removeEventListener("visibilitychange", onChange);
}

function getSnapshot(): boolean {
  return document.visibilityState !== "hidden";
}

export default function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
