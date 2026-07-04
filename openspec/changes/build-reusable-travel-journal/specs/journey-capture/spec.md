## ADDED Requirements

### Requirement: Contributors can capture moments from phones
The system SHALL allow invited contributors to create moments from phones using photos, videos, text notes, and audio notes with minimal interaction.

#### Scenario: Contributor uploads a photo moment
- **WHEN** a contributor selects a photo and submits a caption from a phone
- **THEN** the system stores the media asset and creates a linked moment record in draft visibility

#### Scenario: Contributor adds a text-only moment
- **WHEN** a contributor submits a text note without media
- **THEN** the system stores the note as a moment attached to the current trip and day

### Requirement: System can import Google Maps itinerary links
The system SHALL accept a shared Google Maps itinerary link and use it to prefill a planned route leg.

#### Scenario: Parsable route link
- **WHEN** the owner submits a Google Maps directions URL containing route parameters
- **THEN** the system extracts available route fields and creates a draft planned route leg

#### Scenario: Incomplete route link
- **WHEN** the submitted link does not expose enough route detail to fully prefill the leg
- **THEN** the system preserves the raw link and requests manual correction for missing fields

### Requirement: Contributors can record track sessions
The system SHALL allow contributors to start and stop GPS tracking sessions that persist track points for the active trip.

#### Scenario: Tracking session starts
- **WHEN** a contributor starts tracking after granting geolocation permission
- **THEN** the system records a new active track session for that contributor and trip

#### Scenario: Position update is received
- **WHEN** the client receives a new geolocation sample during an active track session
- **THEN** the system stores the track point with timestamp and contributor context

#### Scenario: Tracking session stops
- **WHEN** the contributor stops tracking or tracking ends unexpectedly
- **THEN** the system closes the active track session without deleting collected track points
