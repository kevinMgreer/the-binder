## Context

`worker/src/claude.ts` forces Claude to call `report_card` and `clean()` keeps only the known fields, reporting a field as low confidence when `confidence[<top-level key>] === "low"`. The app receives `{ suggestion, lowConfidence }` (`src/adapters/claude-recognizer.ts` passes it through as a `Suggestion`), `suggestionPatch` turns it into form values, and `applySuggestion` in `CardForm.tsx` fills only fields the user has not touched that are empty (`""` or `false`) or hold an earlier suggestion. `flaggedKeys` maps low-confidence names to form keys. `Card` already has `subset`, `insert` and `flags: { rookie, autograph, relic }`, and the form already has those fields; only the identification path is missing them.

Ruling T-34: prompt and schema only, keep the model.

## Decisions

- **Schema shape.** `report_card` gains `subset` and `insert` strings and a `flags` object with `rookie`, `autograph` and `relic` booleans, mirroring `Card`. `CardSuggestion` (Worker) and `Suggestion` (app: adds `subset`, `insert` and `flags?: Partial<Card["flags"]>`) follow. Alternative: three top-level booleans, which would give each flag its own confidence key; rejected to keep one shape with `Card` and the brief. $0: no new request.
- **Confidence.** One `confidence.flags` covers all three flags, the same way `confidence.parallel` covers the parallel's fields; `flaggedKeys` maps `"flags"` to `rookie`, `autograph` and `relic`. `applySuggestion` already flags only the keys it patched, so only the ticked flags show "Check this". Alternative: per-flag confidence (`confidence.rookie`); rejected because `clean()` filters confidence by top-level suggestion key and the brief names `flags`. $0: unchanged.
- **Cleaning.** `clean()` keeps `subset` and `insert` with the existing `text()` and keeps each flag only when it is a real boolean; anything else (`"yes"`, `1`) is dropped, and the `flags` key is dropped when none survive. Alternative: accept `"true"` strings like `integer()` accepts `"1989"`; rejected per the brief (only real booleans). $0: unchanged.
- **Never untick.** `suggestionPatch` emits a flag only when it is `true`. With the existing `empty || marked` rule a suggestion can then tick an unticked box or re-confirm a suggested one, never clear one. Alternative: let `false` clear a box that holds an earlier suggestion; rejected, the brief says missing or false is no change. $0: unchanged.
- **Prompt.** One sentence each for rookie, autograph, relic, set, subset, insert and parallel, worded as in the spec, appended to the existing prompt; the existing year, set and card-number guidance stays. The card number keeps its printed prefix (HRD-5). Model and `max_tokens` unchanged. Alternative: few-shot examples with images; rejected, it would multiply the per-tap cost. $0: a few hundred more input tokens on a tap the owner makes.
- **Hint on checkboxes.** The `check()` helper in `CardForm.tsx` shows `hintFor(key)` ("Suggested" / "Suggested · Check this") after its label, so a suggested or doubtful flag is visible as the "Low-confidence field" scenario requires. Alternative: no hint on checkboxes; rejected, a doubtful flag would not be visibly flagged. $0: unchanged.

## Risks

- Prompt quality is only proven on the phone with real cards (task 4.2); unit tests can only check the schema, the prompt text and the data path.
- A later "Identify with Claude" on the same card cannot untick a flag an earlier one ticked; the user unticks it.
- Unticking a suggested flag counts as a user edit, so a later suggestion will not tick it again (existing `touched` rule).
