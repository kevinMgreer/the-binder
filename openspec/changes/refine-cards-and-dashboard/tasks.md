## 1. Tests first (each fails on the current code)

- [ ] 1.1 `src/domain/dashboard.test.ts`: tile order is Cards, Distinct, Autos, Relics, Serial-numbered, Rookies; the "Counts" scenario reads 4, 3, 1, 1, 1, 1; delete "Topps Gold is exact"; add Recently added (newest four by `createdAt`, edit time ignored, fewer than four) and Top teams (merged spellings, distinct count, tie order, cap of five, no-team cards skipped, each team count equals `applyFilters` with that team). Verify: `npx vitest run src/domain/dashboard.test.ts` fails only on the new expectations.
- [ ] 1.2 `src/app/dashboard-memo.test.tsx`: a re-render with the same cards does not recompute tiles, recent or teams. `src/app/back-button.test.tsx`: switch the list anchor from `summary` to `shown`; add "back from a card opened on the dashboard shows the dashboard" and "delete from there shows the dashboard". Verify: new cases fail, old ones pass.
- [ ] 1.3 `e2e/dashboard.spec.ts`: Launch expects six tiles in order; replace the Topps Gold and Braves cases with Tap Rookies, Remove the Relic chip, Top teams tap (Team chip, count equals entry, earlier Autograph chip cleared), Recently added order and open/back; "No team or parallel tiles". Verify: run the spec, new cases fail.
- [ ] 1.4 `e2e/design.spec.ts`: no "N cards, N distinct" line; sync status on the title row left of the gear with `role="status"`; error wording whole on at most two lines at 360x800; landscape and portrait thumbnails keep their ratio within 2 percent, same row height, aligned text column, portrait placeholder without a photo; six tiles in view; Recently added and Top teams legible in both themes and at least 48 dp; Add card clears the dashboard's last item. Verify: new cases fail.
- [ ] 1.5 Move every other `getByTestId("summary")` use to `shown` or to the dashboard's Cards/Distinct tiles: `e2e/helpers.ts`, `e2e/auth.spec.ts`, `e2e/catalog.spec.ts`, `e2e/photos.spec.ts`, `e2e/sync.spec.ts`. Verify: `grep -rn '"summary"' e2e src` returns nothing.

## 2. Implementation

- [ ] 2.1 `src/domain/dashboard.ts`: remove the Topps Gold and Atlanta Braves entries from `TILES`, add Rookies; `collectionStats` returns `{ tiles, recent, teams }` in one pass (design decision 4). Verify: 1.1 and 1.2 memo test pass.
- [ ] 2.2 `src/domain/query.ts`: delete `summarize` and its test in `src/domain/query.test.ts`. Verify: `npx tsc --noEmit` clean.
- [ ] 2.3 `src/app/SyncIndicator.tsx`: split into `SyncIndicator` (status span with `role="status"`) and `SyncActions` (Sign in again, missing-file dialog). Verify: sync e2e and `smoke.test.tsx` pass.
- [ ] 2.4 `src/app/Dashboard.tsx` and `src/app/CollectionScreen.tsx`: title row `h1 + SyncIndicator + SettingsButton`, `SyncActions` beneath, `.meta` line and the summary paragraph removed. Verify: 1.4 header cases pass.
- [ ] 2.5 `src/app/CardList.tsx`: export `Thumb`, wrap it in the 67x67 slot with a contained `img` and the portrait placeholder (design decision 2); `ROW_HEIGHT` stays 100. Verify: 1.4 thumbnail cases pass, `e2e/perf.spec.ts` still passes.
- [ ] 2.6 `src/app/Dashboard.tsx`: Recently added grid (reusing `Thumb`) and Top teams ruled list; new prop `onOpenCard`; teams tap through `onTile`. Verify: 1.3 passes.
- [ ] 2.7 `src/app/App.tsx`: detail view gets `from: Screen`; list opens with `"list"`, dashboard with `"dashboard"`; back and delete go to `from`. Verify: 1.2 back-button cases pass.
- [ ] 2.8 `src/app/app.css`: title-row sync layout, thumb slot, group headings, recent grid, teams list, all from existing tokens; remove the unused `.meta` rules. Verify: `e2e/design.spec.ts` token-literal and contrast checks pass in both themes.
- [ ] 2.9 Run the repo `check` command from `desk.config.json`. Verify: exit code 0.

## 3. Docs

- [ ] 3.1 `DESIGN.md`: Layout (header row holds title, sync state, gear; no count line), List row (67 dp square slot, contained thumbnail in the photo's orientation, portrait placeholder), Stat tile (six tiles), new Dashboard groups (Recently added, Top teams), Banner and status (sync status on the title row, `role="status"`, wraps to two lines). Verify: no mention of Topps Gold, Atlanta Braves tile, "N cards, N distinct" or a cover-fit 48x67 row thumbnail remains (`grep`).

## 4. Phone checks (waiting for the owner)

- [ ] 4.1 On the phone, light and dark: dashboard shows six tiles, Recently added and Top teams look clean and read well; tapping a team opens Cards filtered to it; tapping a recent card opens it and back returns to the dashboard. Owner confirms.
- [ ] 4.2 On the phone: a card photographed landscape shows landscape in the Cards list, a portrait one portrait, nothing cropped, scroll through a long list stays smooth. Owner confirms.
- [ ] 4.3 On the phone: "Synced" sits beside the gear on both screens; with airplane mode the error wording shows whole; TalkBack reads the sync state. Owner confirms.

## 5. Archive

- [ ] 5.1 After every task above is ticked and merged, archive the change with the `openspec-archive-change` skill. Verify: `openspec/specs/dashboard/spec.md` no longer mentions Topps Gold or Atlanta Braves tiles, and `openspec validate --strict --all` passes.
