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
