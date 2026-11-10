## 1. System bar insets and back button

- [x] 1.1 Apply the safe-area insets to `#root` and to scrolling screens (design D1); verify on the phone that the title clears the status bar and Save and Cancel are visible above the navigation bar at the end of the form ("Content stays clear of the system bars")
- [x] 1.2 Handle the hardware back button in `App.tsx` (design D2); verify on the phone that back from the add form shows the list and back from the list closes the app ("Hardware back button goes up one screen")
- [x] 1.3 Add a Vitest test that mocks `@capacitor/app` and checks back from the add form, back from the edit form and back from the list; verify it passes and fails when the handler is removed

## 2. Required fields

- [x] 2.1 Write the failing test first: an empty add form labels exactly player, year, set and card number as required, and a refused save shows a message naming the missing fields next to Save and focuses the first one; verify it fails before the change
- [x] 2.2 Add the `required` marking to `Field` and derive it from the schema's required list (design D3); verify the marking half of the test passes
- [x] 2.3 Render the blocked-save summary next to Save and focus the first invalid field; verify the rest of the test passes and the message clears after the fields are fixed
- [ ] 2.4 On the phone, tap Save on an empty add form and verify the message is visible without scrolling and the first field is focused

## 3. Spec corrections

- [ ] 3.1 Reword the foundation's `card-photos` scenario "Camera permission denied" to the cancel-from-camera case that can occur (design D4) and note the change on its task 3.2; verify `openspec validate add-collection-foundation` passes
- [ ] 3.2 Run `openspec validate fix-android-shell`, then, once 1.3 and 2.4 are ticked and merged, archive the change with `/opsx:archive`; verify the two new capabilities appear under `openspec/specs/`
