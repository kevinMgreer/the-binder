import { useMemo } from "react";
import type { Card } from "../domain/card";
import { collectionStats, type Tile } from "../domain/dashboard";
import { AddCard } from "./AddCard";
import { BottomNav, type Destination } from "./BottomNav";
import { SettingsButton } from "./SettingsButton";
import { SyncActions, SyncIndicator } from "./SyncIndicator";
import { Thumb } from "./Thumb";
import { UpdateLink } from "./UpdateLink";
import type { UpdateInfo } from "./useUpdates";

interface Props {
  cards: Card[];
  update: UpdateInfo | null;
  onAdd: () => void;
  onNavigate: (to: Destination) => void;
  onSettings: () => void;
  onTile: (tile: Tile) => void;
  onOpenCard: (card: Card) => void;
}

export function Dashboard({ cards, update, onAdd, onNavigate, onSettings, onTile, onOpenCard }: Props) {
  const { tiles, recent, teams } = useMemo(() => collectionStats(cards), [cards]);
  return (
    <section className="dashboard">
      <header>
        <div className="title-row">
          <h1>Dashboard</h1>
          <SyncIndicator />
          <SettingsButton onClick={onSettings} />
        </div>
        <SyncActions />
      </header>
      {update && <UpdateLink update={update} />}
      <div className="tiles">
        {tiles.map((tile) => {
          const value = tile.value.toLocaleString();
          return (
            <button key={tile.label} className="tile" data-testid="tile" aria-label={`${tile.label}, ${value}`} onClick={() => onTile(tile)}>
              <span className="tile-label">{tile.label}</span>
              <span className="tile-value">{value}</span>
            </button>
          );
        })}
      </div>
      {recent.length > 0 && (
        <div className="group">
          <h2>Recently added</h2>
          <div className="recent">
            {recent.map((card) => (
              <button
                key={card.id}
                className="recent-card"
                data-testid="recent"
                aria-label={`${card.player}, ${card.year} ${card.set}${card.cardNumber && ` #${card.cardNumber}`}`}
                onClick={() => onOpenCard(card)}
              >
                <Thumb card={card} />
                <span className="recent-name">{card.player}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {teams.length > 0 && (
        <div className="group">
          <h2>Top teams</h2>
          <div className="teams">
            {teams.map((team) => (
              <button
                key={team.name}
                className="team"
                data-testid="team"
                aria-label={`${team.name}, ${team.count}`}
                onClick={() => onTile({ label: team.name, filters: { team: team.name }, count: "match" })}
              >
                <span className="team-name">{team.name}</span>
                <span className="team-count">{team.count.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <AddCard onAdd={onAdd} />
      <BottomNav active="dashboard" onNavigate={onNavigate} />
    </section>
  );
}
