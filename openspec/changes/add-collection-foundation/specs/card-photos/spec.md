# Spec Delta

## Purpose

Lets the owner photograph the front and back of each card with the phone camera, and keeps those photos compact, stored in Drive and viewable in the app.

## ADDED Requirements

### Requirement: Capture front and back
The system SHALL let the user take a photo of a card's front and back with the device camera, or choose existing images from the device.

#### Scenario: Camera capture on Android
- **WHEN** the user taps "Scan card" on an Android phone
- **THEN** the card scanner opens on the rear camera (see the `card-scanner` capability), takes the front photo, then prompts for the back photo, with an option to skip the back

#### Scenario: Camera closed without a photo
- **WHEN** the user backs out of the camera without taking a photo
- **THEN** the app returns to where the user started, nothing is added, and "Pick from photos" remains available

#### Scenario: Choose existing image
- **WHEN** the user chooses "Pick from photos" and selects an image
- **THEN** that image is used as the card photo

### Requirement: Compress photos
The system SHALL resize and compress each photo on the device before storing it, keeping enough detail to read the card number and serial number, and producing a separate small thumbnail.

#### Scenario: Large phone photo
- **WHEN** the user captures a 12-megapixel photo
- **THEN** the stored full photo is no more than 500 KB and the serial number stamp is still legible when zoomed in

### Requirement: Retake and replace
The system SHALL let the user retake or replace a card's front or back photo, and SHALL remove the replaced photo from Drive.

#### Scenario: Replace front photo
- **WHEN** the user replaces a card's front photo and saves
- **THEN** the card shows the new photo and the old photo is no longer in the Drive photos folder

### Requirement: View photos
The system SHALL show thumbnails in the collection list and thumbnails of the front and back photos on the card detail screen, and SHALL open a full-size, zoomable view of a photo when its thumbnail is tapped, fetching and caching the full photo when it is not on the device.

#### Scenario: View full photo offline
- **GIVEN** the device is offline and the full photo was not opened on this device before
- **WHEN** the user taps a photo thumbnail on the card detail
- **THEN** the thumbnail is shown with a note that the full photo will load when online

#### Scenario: Zoom to read serial
- **WHEN** the user pinches to zoom on a full photo
- **THEN** the photo zooms and pans smoothly

### Requirement: Photos stored as named files
The system SHALL save each photo in the Drive photos folder under a name that identifies the card and side, so photos are recognizable when browsed in Google Drive.

#### Scenario: Browse photos in Google Drive
- **WHEN** the user opens the photos folder in Google Drive
- **THEN** each file name includes the year, player, card number and "front" or "back"
