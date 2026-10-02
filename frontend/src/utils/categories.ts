/**
 * Shared category store for the dashboard.
 *
 * CategoriesCard (counts, add) and InboxCard (the per-email categorize
 * picker) used to fetch and hold their own copies, so creating a category
 * or labeling an email in one never showed up in the other until a page
 * refresh. Both now read this single store via useCategories(), and any
 * change goes through refreshCategories()/addCategory(), which re-render
 * every subscriber.
 */
import { useEffect, useSyncExternalStore } from "react";
import { apiFetch } from "./api.ts";

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  /** Labeled examples the classifier has for this category. */
  count: number;
  autoClassifyEnabled: boolean;
  examplesNeeded: number;
}

interface State {
  categories: Category[];
  loading: boolean;
  loaded: boolean;
  error: string;
}

let state: State = { categories: [], loading: false, loaded: false, error: "" };
const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-fetch categories (with fresh example counts) and notify every subscriber. */
export function refreshCategories(): Promise<void> {
  if (inFlight) return inFlight;
  setState({ loading: true });
  inFlight = (async () => {
    try {
      const res = await apiFetch("/categories");
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setState({ categories: json.categories ?? [], loaded: true, error: "" });
    } catch {
      setState({ error: "Unable to load categories." });
    } finally {
      setState({ loading: false });
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Create a category; it appears immediately everywhere the store is used. */
export async function addCategory(name: string): Promise<void> {
  const res = await apiFetch("/categories", { method: "POST", body: JSON.stringify({ name }) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Could not add category");
  // Optimistic insert so the picker updates instantly, then reconcile counts.
  setState({ categories: [{ ...json.category, count: 0, autoClassifyEnabled: false, examplesNeeded: 15 }, ...state.categories] });
  void refreshCategories();
}

export function useCategories() {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  // First subscriber triggers the initial load.
  useEffect(() => {
    if (!state.loaded && !state.loading) void refreshCategories();
  }, []);
  return snapshot;
}
