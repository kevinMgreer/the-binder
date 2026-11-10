import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useState } from "react";
import type { Card } from "../domain/card";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
import { emptyFilters, type Filters } from "../domain/query";
import { CollectionScreen } from "./CollectionScreen";
import { Dashboard } from "./Dashboard";
import { openSheets } from "./Sheet";
import { SettingsScreen } from "./SettingsScreen";
import { useCards } from "./useCards";
import { useUpdates } from "./useUpdates";

type View =
  | { name: Screen }
  | { name: "form"; card?: Card; from: Screen }
  | { name: "detail"; id: string }
  | { name: "settings"; from: Screen };

/** The screens a flow can start from and returns to. */
type Screen = "dashboard" | "list";

export function App() {
  const { cards, save, remove } = useCards();
  const updates = useUpdates();
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  // Android back: one screen up, and leave the app only from the dashboard.
  useEffect(() => {
    const goBack = () => {
      const sheet = openSheets.at(-1);
      if (sheet) sheet();
      else if (view.name === "dashboard") void CapacitorApp.exitApp();
      else if (view.name === "list") setView({ name: "dashboard" });
      else if (view.name === "detail") setView({ name: "list" });
      else if (view.name === "form" && view.card) setView({ name: "detail", id: view.card.id });
      else if ("from" in view) setView({ name: view.from });
    };
    const handle = CapacitorApp.addListener("backButton", goBack);
    // A browser has no back button; test builds fire this event so e2e tests reach the same handler.
    const testHooks = import.meta.env.DEV || import.meta.env.MODE === "e2e";
    if (testHooks) window.addEventListener("hardware-back", goBack);
    return () => {
      void handle.then((h) => h.remove());
      window.removeEventListener("hardware-back", goBack);
    };
  }, [view]);

  if (view.name === "settings") {
    return (
      <SettingsScreen
        update={updates.available}
        onCheckForUpdates={updates.check}
      />
    );
  }

  if (view.name === "form") {
    const { card } = view;
    return (
      <CardForm
        card={card}
        cards={cards}
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
    onNavigate: (to: Screen) => setView({ name: to }),
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
      onOpen={(card) => setView({ name: "detail", id: card.id })}
    />
  );
}
