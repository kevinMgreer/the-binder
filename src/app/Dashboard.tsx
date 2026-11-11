import { useMemo } from "react";
import type { Card } from "../domain/card";
import { collectionStats, type TeamStat, type Tile } from "../domain/dashboard";
import type { Filters } from "../domain/query";
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
  const { tiles, recent, teams, players } = useMemo(() => collectionStats(cards), [cards]);
  /** Top teams and Top players: one ruled table, a row opens the list filtered to that name. */
  const ruled = (heading: string, testId: string, rows: TeamStat[], filters: (name: string) => Partial<Filters>) =>
    rows.length > 0 && (
      <div className="group">
        <h2>{heading}</h2>
        <div className="teams">
          {rows.map((row) => (
            <button
              key={row.name}
              className="team"
              data-testid={testId}
              aria-label={`${row.name}, ${row.count}`}
              onClick={() => onTile({ label: row.name, filters: filters(row.name), count: "match" })}
            >
              <span className="team-name">{row.name}</span>
              <span className="team-count">{row.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  return (
    <section className="dashboard">
      <header>
        <div className="title-row">
          <h1>Dashboard</h1>
          <SyncIndicator />
          <SettingsButton onClick={onSettings} />
        </div>
        <div className="title-rule" aria-hidden="true" />
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
      {ruled("Top teams", "team", teams, (name) => ({ team: name }))}
      {ruled("Top players", "player", players, (name) => ({ player: name }))}
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
      <BottomNav active="dashboard" onNavigate={onNavigate} onAdd={onAdd} />
    </section>
  );
}
