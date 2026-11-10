import type { UpdateInfo } from "./useUpdates";

export function UpdateLink({ update }: { update: UpdateInfo }) {
  return (
    <p className="banner" data-testid="update-banner">
      Update available: {update.version}{" "}
      <a href={update.apkUrl} target="_blank" rel="noopener noreferrer">
        Download {update.version}
      </a>
    </p>
  );
}
