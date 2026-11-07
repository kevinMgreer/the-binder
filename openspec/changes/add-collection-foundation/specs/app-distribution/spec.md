# Spec Delta

## Purpose

Gets The Binder onto the owner's Android phone without the Play Store, keeps updates installing over the previous version without losing local data, and tells the owner which version is installed and when a newer one is available.

## ADDED Requirements

### Requirement: Install from a signed APK
The system SHALL be delivered as a release APK signed with the project's release key that installs on an Android phone without the Play Store, either over ADB or through Android's sideload flow from a downloaded file.

#### Scenario: Install over ADB
- **WHEN** the user installs the release APK on a connected phone with `adb install`
- **THEN** the install succeeds and The Binder opens to the sign-in screen

#### Scenario: Install from a downloaded APK
- **WHEN** the user downloads the release APK on the phone and opens it, allowing installs from that source when Android asks
- **THEN** The Binder installs and opens without any Play Store involvement

#### Scenario: Release APK is signed with the release key
- **WHEN** the signature of a release APK is verified
- **THEN** it is signed with the release key, not a debug key

### Requirement: Update in place without losing data
The system SHALL install each new release over the previous one when both are signed with the same release key, keeping the local collection, pending unsynced changes and sign-in, and each release SHALL carry a higher version code than the one before.

#### Scenario: Update with the same signing key
- **GIVEN** an earlier release is installed, signed in, with cards and changes not yet synced to Drive
- **WHEN** the user installs a newer release APK signed with the same key
- **THEN** the app updates without being uninstalled, the local cards and pending changes are still there, and no sign-in prompt is shown

#### Scenario: APK signed with a different key
- **GIVEN** a release is installed
- **WHEN** the user tries to install an APK of The Binder signed with a different key
- **THEN** Android refuses the update and the installed app and its local data are unchanged

#### Scenario: Version code increases
- **WHEN** a new release is built
- **THEN** its version code is higher than the previous release's version code

### Requirement: Show the app version
The system SHALL show the installed version name and version code on the settings screen.

#### Scenario: Version in settings
- **WHEN** the user opens settings
- **THEN** the installed version name and version code are shown, matching the GitHub Release the APK came from

### Requirement: Check for a newer release
The system SHALL check GitHub Releases for a newer published release when the app starts while online and when the user taps "Check for updates" in settings, and SHALL tell the user when one exists without installing anything itself.

#### Scenario: Newer release available
- **GIVEN** the latest published release has a higher version than the installed app
- **WHEN** the update check runs
- **THEN** the app shows the new version number and a link that opens that release's APK download

#### Scenario: Already up to date
- **GIVEN** the installed version is the latest published release
- **WHEN** the user taps "Check for updates"
- **THEN** the app says it is up to date

#### Scenario: Check fails or device is offline
- **WHEN** the update check cannot reach GitHub
- **THEN** the automatic check stays silent, a manual check says it could not check, and the app keeps working normally

#### Scenario: No collection data sent
- **WHEN** the update check runs
- **THEN** the request carries no card data, photos or Google credentials
