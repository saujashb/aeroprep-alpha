import type { OverlayExport, ProgressState, UserOverlay } from "../types";
import { EMPTY_OVERLAY, emptyProgress, type ProgressStore } from "./progressStore";

const PROGRESS_KEY = "aeroprep:progress";
const OVERLAY_KEY = "aeroprep:overlay";

export class LocalStorageProgressStore implements ProgressStore {
  getProgress(): ProgressState {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return emptyProgress();
      const parsed = JSON.parse(raw) as ProgressState;
      return { ...emptyProgress(), ...parsed };
    } catch {
      return emptyProgress();
    }
  }

  saveProgress(state: ProgressState): void {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  }

  getOverlay(): UserOverlay {
    try {
      const raw = localStorage.getItem(OVERLAY_KEY);
      if (!raw) return { ...EMPTY_OVERLAY };
      const parsed = JSON.parse(raw) as UserOverlay;
      return { ...EMPTY_OVERLAY, ...parsed };
    } catch {
      return { ...EMPTY_OVERLAY };
    }
  }

  saveOverlay(overlay: UserOverlay): void {
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlay));
  }

  exportAll(): OverlayExport {
    return {
      app: "aeroprep-alpha",
      version: 1,
      exportedAt: new Date().toISOString(),
      overlay: this.getOverlay(),
      progress: this.getProgress(),
    };
  }

  importAll(data: OverlayExport): void {
    if (data.app !== "aeroprep-alpha") {
      throw new Error("Invalid export file: not an AeroPrep Alpha backup.");
    }
    this.saveOverlay(data.overlay);
    this.saveProgress(data.progress);
  }

  resetAll(): void {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(OVERLAY_KEY);
  }
}

export const defaultStore = new LocalStorageProgressStore();
