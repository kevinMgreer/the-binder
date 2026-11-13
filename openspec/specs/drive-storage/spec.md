# drive-storage Specification

## Purpose
Keeps the collection's data and photos in the owner's Google Drive as the system of record, with a local copy on each device for offline use and sync between devices.

## Requirements

### Requirement: Older data files keep working
The system SHALL write the Drive data file with schema version 2, and SHALL read data files with schema version 1 or 2. Cards stored without a subset or insert, in Drive or on the device, SHALL load, display, edit and sync as cards with no subset and no insert, and SHALL NOT be rewritten only because the version changed.

#### Scenario: Version 1 file from an earlier install
- **GIVEN** the Drive data file has schema version 1 and its cards have no subset or insert
- **WHEN** the app syncs
- **THEN** every card is shown, and the file in Drive afterwards has schema version 2 and the same cards with no field lost

#### Scenario: Old local card edited after the update
- **GIVEN** a card saved on the device before this change
- **WHEN** the user opens it, adds insert "Stars of MLB" and saves
- **THEN** the card is saved with that insert and the change syncs to Drive like any other edit

#### Scenario: Merge with a card from an older install
- **GIVEN** a card without subset or insert in Drive, and the same card edited later on this device with subset "Future Stars"
- **WHEN** both are merged
- **THEN** the later edit wins and keeps subset "Future Stars"

### Requirement: Collection folder in Drive
The system SHALL store all collection data and photos inside a single app-created folder in the user's Drive, creating it on first sign-in if it does not exist.

#### Scenario: First sign-in on any device
- **WHEN** the user signs in and no collection folder exists in their Drive
- **THEN** the system creates the folder with an empty collection data file and a photos subfolder

#### Scenario: Reinstall or second Android device
- **GIVEN** the collection folder already exists from an earlier install
- **WHEN** the user signs in after reinstalling the app, or on a second Android device
- **THEN** the system uses the existing folder and shows the existing collection, without creating a duplicate folder

### Requirement: Human-readable data file
The system SHALL keep the collection data as one human-readable file in the folder, including a schema version, so the user can open, copy or back it up outside the app.

#### Scenario: Inspect the data outside the app
- **WHEN** the user opens the collection data file from Google Drive
- **THEN** each card's details are readable as text and photos are referenced by name

### Requirement: Local working copy
The system SHALL keep a local copy of the collection and photo thumbnails on the device, and SHALL show the collection from that copy without waiting for Drive or Google.

#### Scenario: Open the app offline
- **GIVEN** the user has signed in on this device before
- **WHEN** the user opens the app with no network connection
- **THEN** the collection is shown and cards can be browsed, searched, added, edited and deleted

#### Scenario: Offline start keeps queued changes
- **GIVEN** the user opened the app offline and added a card
- **WHEN** the device comes back online and Google gives a token
- **THEN** the card is saved to Drive without the user signing in again

### Requirement: Sync to Drive
The system SHALL save local changes to Drive automatically when online, and SHALL queue changes made offline until a connection returns.

#### Scenario: Change while online
- **WHEN** the user saves a card while online
- **THEN** the change is in the Drive data file within 10 seconds

#### Scenario: Changes made offline
- **GIVEN** the user added or edited cards while offline
- **WHEN** the device comes back online
- **THEN** the queued changes and any new photos are saved to Drive without user action

#### Scenario: Sync status is visible
- **WHEN** there are changes not yet saved to Drive
- **THEN** the system shows an unsynced indicator with the count of pending changes, which clears once they are saved

### Requirement: Merge changes from other devices
The system SHALL pick up changes saved to Drive by another Android device and merge them per card, keeping the most recently edited version of each card.

#### Scenario: Different cards edited on two devices
- **GIVEN** card A was edited on the phone and card B on a second Android device while both were offline
- **WHEN** both devices sync
- **THEN** Drive and both devices contain both edits

#### Scenario: Same card edited on two devices
- **GIVEN** the same card was edited on both devices
- **WHEN** both devices sync
- **THEN** the version with the later edit time is kept on both devices

#### Scenario: Deleted on one device, untouched on another
- **GIVEN** a card was deleted on the phone and not edited on the second Android device since
- **WHEN** both devices sync
- **THEN** the card is gone from both devices and from Drive

### Requirement: Drive failure handling
The system SHALL keep local changes when a Drive request fails and SHALL retry with backoff, without losing or duplicating data.

#### Scenario: Drive rate limit or outage
- **WHEN** Drive returns an error or rate-limit response during sync
- **THEN** pending changes stay queued, the sync indicator shows the problem, and sync retries automatically

#### Scenario: Data file deleted in Drive
- **WHEN** the user deleted the collection data file in Drive and the device still has a local copy
- **THEN** the system asks whether to restore Drive from this device or start an empty collection, and does nothing until the user chooses

### Requirement: Free storage footprint
The system SHALL keep its Drive usage small enough that a collection of 5,000 cards with front and back photos fits within 5 GB.

#### Scenario: Photo size budget
- **WHEN** a card with front and back photos is saved
- **THEN** the photos added to Drive for that card total no more than 1 MB
