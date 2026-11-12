## 1. Spec

- [x] 1.1 `openspec validate sortname-autofill --strict` passes. Verify: exit 0.

## 2. Tests first

- [x] 2.1 `src/app/card-form-fields.test.tsx`: typing a Player fills Sort name (suffix dropped, team card whole text); editing Sort name stops following; clearing it follows again; a stored sort name is never replaced when Player changes; a derived value saves as no sort name, an overridden one saves as typed; the hint text. Verify: the new tests fail on today's code.

## 3. Implement

- [x] 3.1 `src/app/CardForm.tsx`: follow flag, derived initial draft, save rule, hint. Verify: the new tests pass and `npm run check` is green.

## 4. On the phone

- [ ] 4.1 Run the new line of `docs/device-checklist.md` on the phone. Verify: ticked after the phone check.
