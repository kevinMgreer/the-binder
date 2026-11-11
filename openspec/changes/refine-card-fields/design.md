## Context

`cardNumber` is a required string (`REQUIRED_FIELDS`, `cardSchema`). Serial-numbered is derived: `isSerialNumbered` is true when the parallel has a serial or a print run, and `serialLabel` shows "n/run" or "?/run" from the same test. So a print run alone always makes a card serial-numbered, and there is no stored "marked" state to ask about.

## Goals / Non-Goals

**Goals:**
- Save and list a card with no number.
- Enter a print run without marking the card serial-numbered.

**Non-Goals:**
- No migration, no new filter, no change to Search, no change to suggestions.

## Decisions

- **Card number optional, stored as an empty string.** `cardNumber` stays `string`; the schema drops `required` for it and `REQUIRED_FIELDS` loses it. Old cards are unaffected.
  Alternatives: `cardNumber?: string` (every reader must handle undefined; the empty string already works with sort and display); a "no number" flag (a second field for the same fact). $0: no dependency.
- **Missing number in the duplicate match is just an empty part of the key.** Two cards with the same player, year, set, parallel and grade and no number hit the existing duplicate prompt. That prompt only warns: Increase quantity, Add as separate card or Back to form, so nothing merges silently, and the owner can keep two numberless cards apart.
  Alternatives: never match when the number is empty (a true repeat of a numberless card would never be offered a quantity bump); block the save (contradicts the decision that numberless cards are normal). $0: no code beyond keeping `identity` as is.
- **Default sort treats a missing number as empty.** `collator.compare("", "27")` already puts it first within a set, so `sortCards` is unchanged and a test pins it.
  Alternatives: sort numberless cards last (extra comparator for no stated need). $0: none.
- **Row and detail leave out the "#" part when the number is empty**, rather than showing "· #". The Dashboard aria label does the same.
  Alternatives: show "#—" (noise on every numberless card). $0: none.
- **A stored `parallel.serialNumbered?: boolean` is the mark.** `isSerialNumbered` and `serialLabel` read it through one helper; when the field is absent (cards saved before this change) it falls back to "has a serial or a print run", so old cards behave exactly as before. The form always writes it. When it is false the form saves serial null and legible true.
  Alternatives: derive the mark from `serial !== null || !serialLegible` (a card marked serial-numbered with the number not entered yet could not be told from an unmarked one, so "?/99" could not appear); a top-level `Card.serialNumbered` (splits one fact from the parallel it describes); migrating old cards on load (rewrites every card for nothing). $0: no dependency.
- **`schemaVersion` stays 2.** The shape gains an optional field that readers default, so a version 2 file from before and after this change both parse, and the sync engine's rewrite-on-version-1 rule is not triggered. A bump would force a rewrite of an unchanged collection.
  Alternatives: bump to 3 (rewrite on first sync with no data to convert). $0: none.
- **Form: a Serial-numbered checkbox before Serial.** Serial and "Serial unreadable" render only when it is checked; Print run always renders. Unchecking keeps the typed serial in the draft but it is dropped on save.
  Alternatives: show Serial whenever a print run is typed (guesses the user's intent, hides the field on first open). $0: none.
- **Dashboard tile and filters need no code change**: both call `isSerialNumbered`. The Print run filter reads `parallel.printRun` and is untouched.

## Risks / Trade-offs

- A card saved by the new form with a print run only has `serialNumbered: false`; an older build reading it would call it serial-numbered. Single owner, one app version in use; accepted.
- An existing card with a print run only stays serial-numbered until the owner unchecks it on edit. Accepted: no silent change to saved data.
