import { Icon } from "./Icon";

export type Destination = "dashboard" | "list";

const ITEMS = [
  { to: "dashboard", label: "Dashboard" },
  { to: "list", label: "Cards" },
] as const;

interface Props {
  active: Destination;
  onNavigate: (to: Destination) => void;
}

export function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map(({ to, label }) => (
        <button key={to} aria-current={to === active ? "page" : undefined} onClick={() => to !== active && onNavigate(to)}>
          <span className="nav-indicator">
            <Icon name={to === "list" ? "cards" : "dashboard"} />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
