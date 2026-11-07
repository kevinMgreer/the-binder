import { useCallback, useEffect, useState } from "react";
import { isNewer } from "../updates/version";
import { usePorts } from "./ports-context";

export interface UpdateInfo {
  version: string;
  apkUrl: string;
}

export type CheckResult = "newer" | "current" | "failed";

export function useUpdates() {
  const { appInfo, releaseFeed } = usePorts();
  const [available, setAvailable] = useState<UpdateInfo | null>(null);

  const check = useCallback(async (): Promise<CheckResult> => {
    try {
      const [{ versionName }, latest] = await Promise.all([appInfo.getVersion(), releaseFeed.latest()]);
      if (isNewer(latest.version, versionName)) {
        setAvailable(latest);
        return "newer";
      }
      setAvailable(null);
      return "current";
    } catch {
      return "failed";
    }
  }, [appInfo, releaseFeed]);

  // Checks when the app starts online, and again when the connection returns. Failures stay silent.
  useEffect(() => {
    const automatic = () => {
      if (navigator.onLine) void check();
    };
    automatic();
    window.addEventListener("online", automatic);
    return () => window.removeEventListener("online", automatic);
  }, [check]);

  return { available, check };
}
