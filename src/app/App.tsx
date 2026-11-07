import { useState } from "react";
import type { Card } from "../domain/card";
import type { Photos } from "../ports";
import { CardDetail } from "./CardDetail";
import { CardForm } from "./CardForm";
import { CollectionScreen } from "./CollectionScreen";
import { ScanFlow } from "./ScanFlow";
import { useCards } from "./useCards";

type View =
  | { name: "list" }
  | { name: "scan"; mode: "camera" | "pick" }
  | { name: "form"; card?: Card; photos?: Photos }
  | { name: "detail"; id: string };

export function App() {
  const { cards, save, remove } = useCards();
  const [view, setView] = useState<View>({ name: "list" });

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
          onBack={() => setView({ name: "list" })}
        />
      );
    }
  }

  return (
    <CollectionScreen
      cards={cards}
      onAdd={() => setView({ name: "form" })}
      onScan={(mode) => setView({ name: "scan", mode })}
      onOpen={(card) => setView({ name: "detail", id: card.id })}
    />
  );
}
