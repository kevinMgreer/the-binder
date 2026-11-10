import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useState } from "react";
import type { Card } from "../domain/card";
import type { Photos } from "../ports";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
import { emptyFilters, type Filters } from "../domain/query";
import { CollectionScreen } from "./CollectionScreen";
import { Dashboard } from "./Dashboard";
import { ScanFlow } from "./ScanFlow";
import { openSheets } from "./Sheet";
import { SettingsScreen } from "./SettingsScreen";
import { useCards } from "./useCards";
import { useUpdates } from "./useUpdates";

type View =
  | { name: Screen }
  | { name: "scan"; mode: "camera" | "pick"; from: Screen }
  | { name: "form"; card?: Card; photos?: Photos; from: Screen }
  | { name: "detail"; id: string }
  | { name: "settings"; from: Screen };

/** The screens a flow can start from and returns to. */
type Screen = "dashboard" | "list";

export function App() {
  const { cards, save, remove } = useCards();
  const updates = useUpdates();
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  // Android back: one screen up, and leave the app only from the list.
  useEffect(() => {
    const handle = CapacitorApp.addListener("backButton", () => {
      const sheet = openSheets.at(-1);
      if (sheet) sheet();
      else if (view.name === "list") void CapacitorApp.exitApp();
      else if (view.name === "form" && view.card) setView({ name: "detail", id: view.card.id });
      else setView({ name: "list" });
    });
    return () => void handle.then((h) => h.remove());
  }, [view]);

  if (view.name === "settings") {
    return (
      <SettingsScreen
        update={updates.available}
        onCheckForUpdates={updates.check}
      />
    );
  }

  if (view.name === "scan") {
    return (
      <ScanFlow
        mode={view.mode}
        onDone={(photos) => setView({ name: "form", photos, from: view.from })}
        onCancel={() => setView({ name: view.from })}
      />
    );
  }

  if (view.name === "form") {
    const { card } = view;
    return (
      <CardForm
        card={card}
        cards={cards}
        initialPhotos={view.photos}
        onSave={async (saved, photos) => {
          await save(saved, photos);
          setView(card ? { name: "detail", id: saved.id } : { name: view.from });
        }}
        onCancel={() => setView(card ? { name: "detail", id: card.id } : { name: view.from })}
      />
    );
  }

  if (view.name === "detail") {
    const card = cards.find((c) => c.id === view.id);
    if (card) {
      return (
        <CardDetail
          card={card}
          onEdit={() => setView({ name: "form", card, from: "list" })}
          onDelete={async () => {
            await remove(card);
            setView({ name: "list" });
          }}
        />
      );
    }
  }

  const shared = (from: Screen) => ({
    cards,
    update: updates.available,
    onAdd: () => setView({ name: "form", from }),
    onScan: (mode: "camera" | "pick") => setView({ name: "scan", mode, from }),
    onSettings: () => setView({ name: "settings", from }),
  });

  if (view.name === "dashboard") {
    return (
      <Dashboard
        {...shared("dashboard")}
        onBrowse={() => {
          setFilters(emptyFilters);
          setView({ name: "list" });
        }}
        onTile={(tile) => {
          setFilters({ ...emptyFilters, ...tile.filters });
          setView({ name: "list" });
        }}
      />
    );
  }

  return (
    <CollectionScreen
      {...shared("list")}
      filters={filters}
      onFiltersChange={setFilters}
      onBack={() => setView({ name: "dashboard" })}
      onOpen={(card) => setView({ name: "detail", id: card.id })}
    />
  );
}
