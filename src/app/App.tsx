import { App as CapacitorApp } from "@capacitor/app";
import { useEffect, useState } from "react";
import type { Card } from "../domain/card";
import type { Photos } from "../ports";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
import { CollectionScreen } from "./CollectionScreen";
import { ScanFlow } from "./ScanFlow";
import { openSheets } from "./Sheet";
import { SettingsScreen } from "./SettingsScreen";
import { useCards } from "./useCards";
import { useUpdates } from "./useUpdates";

type View =
  | { name: "list" }
  | { name: "scan"; mode: "camera" | "pick" }
  | { name: "form"; card?: Card; photos?: Photos }
  | { name: "detail"; id: string }
  | { name: "settings" };

export function App() {
  const { cards, save, remove } = useCards();
  const updates = useUpdates();
  const [view, setView] = useState<View>({ name: "list" });

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
        onDone={(photos) => setView({ name: "form", photos })}
        onCancel={() => setView({ name: "list" })}
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
          setView(card ? { name: "detail", id: saved.id } : { name: "list" });
        }}
        onCancel={() => setView(card ? { name: "detail", id: card.id } : { name: "list" })}
      />
    );
  }

  if (view.name === "detail") {
    const card = cards.find((c) => c.id === view.id);
    if (card) {
      return (
        <CardDetail
          card={card}
          onEdit={() => setView({ name: "form", card })}
          onDelete={async () => {
            await remove(card);
            setView({ name: "list" });
          }}
        />
      );
    }
  }

  return (
    <CollectionScreen
      cards={cards}
      update={updates.available}
      onAdd={() => setView({ name: "form" })}
      onScan={(mode) => setView({ name: "scan", mode })}
      onSettings={() => setView({ name: "settings" })}
      onOpen={(card) => setView({ name: "detail", id: card.id })}
    />
  );
}
