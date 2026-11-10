# google-sign-in Specification

## Purpose
Lets the owner sign in with their Google account so the app can read and write its own files in their Google Drive, and nothing else.

## Requirements

### Requirement: Sign in with Google
The system SHALL require the user to sign in with a Google account before any Drive data is read or written.

#### Scenario: First launch
- **WHEN** the user opens the app with no previous sign-in
- **THEN** the system shows a "Sign in with Google" screen and no collection data

#### Scenario: Successful sign-in
- **WHEN** the user completes Google sign-in and grants access
- **THEN** the system shows the dashboard

#### Scenario: User declines access
- **WHEN** the user cancels the Google consent screen or denies Drive access
- **THEN** the system stays on the sign-in screen and explains that Drive access is required to store the collection

### Requirement: Least-privilege Drive access
The system SHALL request access only to Drive files the app itself creates or the user opens with it, and SHALL NOT request access to the user's whole Drive.

#### Scenario: Consent screen scope
- **WHEN** the Google consent screen is shown
- **THEN** it lists access to only the files the app uses, not "See, edit, create and delete all of your Google Drive files"

### Requirement: Session renewal
The system SHALL renew Drive access silently when it expires while the user's Google session is still active, and SHALL prompt the user only when silent renewal fails.

#### Scenario: Access expires during use
- **GIVEN** the user has been using the app longer than the access lifetime
- **WHEN** the app next needs Drive
- **THEN** access is renewed without a prompt and the pending Drive operation completes

#### Scenario: Silent renewal fails
- **WHEN** silent renewal is refused by Google
- **THEN** the system keeps local changes, marks sync as paused, and shows a "Sign in again" action

### Requirement: Sign out
The system SHALL let the user sign out, which revokes the app's access token and removes the local copy of the collection from the device.

#### Scenario: Sign out with unsynced changes
- **GIVEN** there are local changes not yet saved to Drive
- **WHEN** the user chooses Sign out
- **THEN** the system warns that unsynced changes will be lost and signs out only after the user confirms

#### Scenario: Sign out clears device
- **WHEN** the user confirms Sign out
- **THEN** no card data or photos remain in the app's local storage on the device and the sign-in screen is shown
