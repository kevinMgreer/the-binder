## Purpose

Defines how the app captures a card photo: through a rear-camera scanner that finds the card's edges and crops to it, with a safe fallback to the system camera when the scanner cannot run.

## ADDED Requirements

### Requirement: Scan a card with the rear camera
The system SHALL open an in-app scanner on the rear camera when the user taps "Scan card", and SHALL detect the card's edges and save the photo straightened and cropped to the card.

#### Scenario: Scanner opens on the rear camera
- **WHEN** the user taps "Scan card" on a phone that has Google Play services
- **THEN** the scanner opens showing the rear camera, not the front camera

#### Scenario: Photo cropped to the card
- **WHEN** the user captures a card lying on a table
- **THEN** the saved photo shows only the card, straightened, with the surrounding table cropped away

#### Scenario: Front then back
- **WHEN** the user finishes the front scan
- **THEN** the app offers to scan the back, with an option to skip it

#### Scenario: Retake
- **WHEN** the user is not happy with a scan and retakes it before accepting
- **THEN** the retaken photo replaces the earlier one and only one photo is saved for that side

#### Scenario: Retake from the card form
- **WHEN** the user taps "Retake front" or "Retake back" on the card form
- **THEN** the same rear-camera scanner opens and the new photo replaces that side's photo

### Requirement: Scanner failure never blocks capture
The system SHALL add nothing when the user cancels the scanner, and SHALL fall back to the system camera when the scanner cannot run.

#### Scenario: User cancels the scanner
- **WHEN** the user closes the scanner without accepting a photo
- **THEN** the app returns to where the user started and no photo or card is added

#### Scenario: Scanner unavailable
- **WHEN** the user taps "Scan card" on a phone without Google Play services, or where the scanner's module cannot be fetched because the phone is offline
- **THEN** the system camera opens instead and capture continues as before, with no error shown

#### Scenario: Pick from photos is unaffected
- **WHEN** the user taps "Pick from photos"
- **THEN** the system image picker opens and the scanner is not involved

### Requirement: Scanned photos use the normal photo pipeline
The system SHALL pass a scanned photo through the same compression as any other card photo.

#### Scenario: Scanned photo stays within the size budget
- **WHEN** a card is scanned
- **THEN** the stored full photo is at most 500 KB and a serial-number stamp on the card is still readable when zoomed in
