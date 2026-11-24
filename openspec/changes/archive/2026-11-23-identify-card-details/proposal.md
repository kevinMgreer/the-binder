## Why

"Identify with Claude" never ticks Rookie, Autograph or Relic and never fills Subset or Insert. The Worker's `report_card` tool schema has no field for them, so Claude cannot return them, and `Suggestion` and `suggestionPatch` would drop them anyway. The prompt also never says how a set, a subset, an insert and a parallel differ, so Claude puts insert names in Set or Parallel.

## What Changes

- The `report_card` tool schema gains `subset` and `insert` strings and a `flags` object with `rookie`, `autograph` and `relic` booleans, each covered by `confidence`.
- The prompt says in one sentence each what counts as a rookie card, an autograph, a relic, and how set, subset, insert and parallel differ.
- The Worker keeps the new fields when it cleans Claude's answer (flags only as real booleans).
- The app passes them through and fills Subset and Insert and ticks Rookie, Autograph and Relic as suggestions. A suggestion only ever ticks a flag, never unticks one.
- A doubtful flag is flagged for review like any other field, so the three checkboxes show the "Suggested" hint too.

## Capabilities

### Modified Capabilities

- `card-identification`: "Claude Vision on demand" lists the new fields and how Claude tells set, subset, insert and parallel apart.

## Impact

- Worker: `worker/src/claude.ts` (tool schema, prompt, `clean`). Needs a Worker deploy by the owner.
- App: `src/domain/card.ts` (`Suggestion`), `src/app/suggestions.ts` (`DraftKey`, `suggestionPatch`, `flaggedKeys`), `src/app/CardForm.tsx` (hint on the checkboxes).
- Cost: a slightly longer prompt per tap; still one request per tap, so $0 recurring holds.

## Out of scope

- Changing the model (ruling T-34: prompt and schema only).
- Any request to Claude without the user tapping "Identify with Claude".
- The spend-limit logic (daily cap, image size limit).
- On-device recognition (ML Kit): it does not read flags, subsets or inserts.
- The card schema, the Drive file version and how the list shows these fields.
