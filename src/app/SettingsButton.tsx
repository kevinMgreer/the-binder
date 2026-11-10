import { Icon } from "./Icon";

/** The header's icon-only gear. */
export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-button" aria-label="Settings" onClick={onClick}>
      <Icon name="gear" />
    </button>
  );
}
