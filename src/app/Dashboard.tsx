import { useMemo } from "react";
import type { Card } from "../domain/card";
import { collectionStats, type Tile } from "../domain/dashboard";
import { AddCard } from "./AddCard";
import { BottomNav, type Destination } from "./BottomNav";
import { SettingsButton } from "./SettingsButton";
import { SyncIndicator } from "./SyncIndicator";
import { UpdateLink } from "./UpdateLink";
import type { UpdateInfo } from "./useUpdates";

interface Props {
  cards: Card[];
  update: UpdateInfo | null;
  onAdd: () => void;
  onNavigate: (to: Destination) => void;
  onSettings: () => void;
  onBrowse: () => void;
  onTile: (tile: Tile) => void;
}

export function Dashboard({ cards, update, onAdd, onNavigate, onSettings, onBrowse, onTile }: Props) {
  const stats = useMemo(() => collectionStats(cards), [cards]);
  return (
    <section className="dashboard">
      <header>
        <div className="title-row">
          <h1>Dashboard</h1>
          <SettingsButton onClick={onSettings} />
        </div>
        <div className="meta">
          <SyncIndicator />
        </div>
      </header>
      {update && <UpdateLink update={update} />}
      <div className="tiles">
        {stats.map((tile) => {
          const value = tile.value.toLocaleString();
          return (
            <button key={tile.label} className="tile" data-testid="tile" aria-label={`${tile.label}, ${value}`} onClick={() => onTile(tile)}>
              <span className="tile-label">{tile.label}</span>
              <span className="tile-value">{value}</span>
            </button>
          );
        })}
      </div>
      <button onClick={onBrowse}>Browse collection</button>
      <AddCard onAdd={onAdd} />
      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </section>
  );
}
