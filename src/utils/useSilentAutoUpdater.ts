import { useEffect, useRef } from 'react';
import { GameScreen } from '../types/game';

interface VersionInfo {
  version: string;
  commit?: string;
  buildTime?: number;
}

const STORAGE_VERSION_KEY = 'aether_app_version';
const CHECK_INTERVAL_MS = 60_000; // Exact 1-minute interval

/**
 * Silent Background Auto-Updater
 * Checks GitHub / version endpoint every 1 minute.
 * Never displays UI, popups, or intrusive prompts ("jangan tampilkan").
 */
export function useSilentAutoUpdater(currentScreen: GameScreen) {
  const currentScreenRef = useRef<GameScreen>(currentScreen);
  const pendingUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    currentScreenRef.current = currentScreen;

    // If there is a pending update and player returns to lobby, apply update silently
    if (pendingUpdateRef.current && currentScreen === 'lobby') {
      silentApplyUpdate();
    }
  }, [currentScreen]);

  useEffect(() => {
    // Initial fetch to record current running version
    const initVersion = async () => {
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data: VersionInfo = await res.json();
          if (data && data.version && !localStorage.getItem(STORAGE_VERSION_KEY)) {
            localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(data));
          }
        }
      } catch {
        // Silent catch: Do not display any UI
      }
    };

    initVersion();

    // Check every 1 minute
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const remoteVersion: VersionInfo = await res.json();
        if (!remoteVersion || !remoteVersion.version) return;

        const localRaw = localStorage.getItem(STORAGE_VERSION_KEY);
        if (!localRaw) {
          localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(remoteVersion));
          return;
        }

        const localVersion: VersionInfo = JSON.parse(localRaw);

        // Check if remote version is newer
        const isNewer =
          remoteVersion.version !== localVersion.version ||
          (remoteVersion.buildTime &&
            localVersion.buildTime &&
            remoteVersion.buildTime > localVersion.buildTime) ||
          (remoteVersion.commit &&
            localVersion.commit &&
            remoteVersion.commit !== localVersion.commit);

        if (isNewer) {
          localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(remoteVersion));

          // If currently in lobby (safe, not inside a live match), apply immediately.
          // Otherwise, mark as pending to apply when returning to lobby.
          if (currentScreenRef.current === 'lobby') {
            silentApplyUpdate();
          } else {
            pendingUpdateRef.current = true;
          }
        }
      } catch {
        // Silent catch: Do not display any UI ("jangan tampilkan")
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
}

function silentApplyUpdate() {
  try {
    // If service worker is present, update registration silently
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.update());
      });
    }

    // Refresh window smoothly to load latest assets without popup
    window.location.reload();
  } catch {
    // Silent catch
  }
}
