## 1. Spec

- [x] 1.1 `npx openspec validate identify-card-details --strict` passes. Verify: exit 0.

## 2. Tests first

- [ ] 2.1 `worker/src/identify.test.ts`: the tool schema sent to Claude has `subset`, `insert` and `flags.{rookie,autograph,relic}`; the prompt names rookie, autograph, relic, subset, insert and parallel; a stubbed answer with these fields comes back in `suggestion`; a non-boolean flag (`"yes"`) is dropped; `confidence.flags: "low"` puts `flags` in `lowConfidence`. Verify: the new tests fail on today's code.
- [ ] 2.2 `src/app/suggestions.test.ts`: `suggestionPatch` sets `subset`, `insert` and each `true` flag and never emits a `false` flag; `flaggedKeys` maps `"flags"` to `rookie`, `autograph`, `relic`. Verify: fail on today's code.
- [ ] 2.3 `src/adapters/claude-recognizer.test.ts`: `subset`, `insert` and `flags` from the proxy reach the returned `Suggestion`. Verify: fail on today's code (type error or missing fields).
- [ ] 2.4 `src/app/card-form-actions.test.tsx` (next to the existing `ports.claude.recognize` spy): scenarios "Identify a rookie card", "Identify an on-card autograph", "Identify a relic or patch card", "Identify an insert", "Identify a parallel of the base set", "Identify a subset card", "A suggestion never unticks a flag" and "Doubtful flag" (checkbox shows "Suggested · Check this"). Verify: fail on today's code.

## 3. Implement

- [ ] 3.1 `worker/src/claude.ts`: `CardSuggestion`, `TOOL.input_schema` (`subset`, `insert`, `flags`), `PROMPT` (one sentence each per the spec), `clean()` (keep `subset`/`insert` via `text()`, flags only as real booleans, drop empty `flags`). Model, `max_tokens` and `worker/src/index.ts` untouched. Verify: 2.1 passes.
- [ ] 3.2 `src/domain/card.ts`: `Suggestion` gains `subset`, `insert`, `flags?: Partial<Card["flags"]>`. Verify: typecheck.
- [ ] 3.3 `src/app/suggestions.ts`: `DraftKey` gains `subset`, `insert`, `rookie`, `autograph`, `relic`; `suggestionPatch` sets them (flags only when `true`); `flaggedKeys` maps `"flags"`. Verify: 2.2 and 2.3 pass.
- [ ] 3.4 `src/app/CardForm.tsx`: `check()` shows `hintFor(key)`; confirm `applySuggestion` needs no change for booleans. Verify: 2.4 passes and `npm run check` is green.
- [ ] 3.5 `docs/device-checklist.md`, section "Identification (card-identification)": add the task 4.2 line. Verify: the line is there.

## 4. Owner (on the phone)

- [ ] 4.1 Deploy the Worker (`worker/`). Verify: ticked by the owner after the deploy.
- [ ] 4.2 After the deploy, run "Identify with Claude" on 5 real cards: one with an RC logo (Rookie ticked), one with an on-card autograph (Autograph ticked), one relic or patch (Relic ticked), one insert (Insert filled, Set is the product, Parallel empty) and one numbered parallel (Parallel, serial and print run filled, Insert empty). Verify: ticked by the owner after the phone check.
