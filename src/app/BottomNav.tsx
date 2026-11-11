import { Icon } from "./Icon";

export type Destination = "dashboard" | "list";

interface Props {
  active: Destination;
  onNavigate: (to: Destination) => void;
  onAdd: () => void;
}

/** Dashboard and Cards are destinations; Add sits between them as an action and is never the current tab. */
export function BottomNav({ active, onNavigate, onAdd }: Props) {
  const destination = (to: Destination, label: string) => (
    <button aria-current={to === active ? "page" : undefined} onClick={() => to !== active && onNavigate(to)}>
      <Icon name={to === "list" ? "cards" : "dashboard"} />
      {label}
    </button>
  );
  return (
    <nav className="bottom-nav" aria-label="Main">
      {destination("dashboard", "Dashboard")}
      <button className="nav-action" aria-label="Add card" onClick={onAdd}>
        <span className="nav-add">
          <Icon name="plus" />
        </span>
        Add
      </button>
      {destination("list", "Cards")}
    </nav>
  );
}
