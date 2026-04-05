import type { DVEGraph, Changelog } from "../types";

export async function loadGraph(): Promise<DVEGraph> {
  const res = await fetch("./graph.json");
  if (!res.ok) throw new Error(`Failed to load graph.json: ${res.status}`);
  return res.json();
}

export async function loadChangelog(): Promise<Changelog | null> {
  try {
    const res = await fetch("./changelog.json");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
