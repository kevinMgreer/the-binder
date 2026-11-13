## MODIFIED Requirements

### Requirement: Sign in with Google
The system SHALL require the user to sign in with a Google account before any Drive data is read or written. Once signed in, the system SHALL remember the account's email on the device (never a token) and SHALL NOT show the sign-in screen at a later launch because Google or the network could not be reached.

#### Scenario: First launch
- **WHEN** the user opens the app with no previous sign-in
- **THEN** the system shows a "Sign in with Google" screen and no collection data

#### Scenario: Successful sign-in
- **WHEN** the user completes Google sign-in and grants access
- **THEN** the system shows the dashboard

#### Scenario: User declines access
- **WHEN** the user cancels the Google consent screen or denies Drive access
- **THEN** the system stays on the sign-in screen and explains that Drive access is required to store the collection

#### Scenario: Launch with Google unreachable
- **GIVEN** the user signed in on this device before and has not signed out
- **WHEN** the user opens the app and Google cannot be reached (offline, or the silent sign-in fails)
- **THEN** the system shows the dashboard from the local collection as that user, not the sign-in screen

### Requirement: Session renewal
The system SHALL renew Drive access silently when it expires while the user's Google session is still active, and SHALL prompt the user only when silent renewal fails. When Drive rejects an access token, the system SHALL get a fresh token and retry the request once before treating the session as expired.

#### Scenario: Access expires during use
- **GIVEN** the user has been using the app longer than the access lifetime
- **WHEN** the app next needs Drive
- **THEN** access is renewed without a prompt and the pending Drive operation completes

#### Scenario: Drive rejects an aged token
- **WHEN** Drive answers a request with 401 and Google gives a fresh token without a prompt
- **THEN** the request is repeated once with the fresh token and completes, and sync is not paused

#### Scenario: Silent renewal fails
- **WHEN** silent renewal is refused by Google, or Drive answers 401 again to the fresh token
- **THEN** the system keeps local changes, marks sync as paused, and shows a "Sign in again" action

#### Scenario: Silent renewal fails after a launch with Google unreachable
- **GIVEN** the app opened on local data because Google could not be reached
- **WHEN** sync first needs Drive and Google refuses the token
- **THEN** the system keeps local changes, marks sync as paused, and shows a "Sign in again" action

### Requirement: Sign out
The system SHALL let the user sign out, which revokes the app's access token, forgets the remembered account and removes the local copy of the collection from the device.

#### Scenario: Sign out with unsynced changes
- **GIVEN** there are local changes not yet saved to Drive
- **WHEN** the user chooses Sign out
- **THEN** the system warns that unsynced changes will be lost and signs out only after the user confirms

#### Scenario: Sign out clears device
- **WHEN** the user confirms Sign out
- **THEN** no card data or photos remain in the app's local storage on the device, the remembered account is gone and the sign-in screen is shown

## ADDED Requirements

### Requirement: Drive access for the signed-in account
The system SHALL request Drive access for the Google account that signed in, so that on a phone with several Google accounts the Drive token belongs to that account.

#### Scenario: Second Google account on the phone
- **GIVEN** the phone has two Google accounts and the user signed in with one of them
- **WHEN** the app needs Drive access
- **THEN** the token is issued for the account that signed in, and the app reads and writes that account's Drive folder
