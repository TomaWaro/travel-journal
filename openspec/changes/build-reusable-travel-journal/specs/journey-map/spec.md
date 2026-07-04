## ADDED Requirements

### Requirement: Trip map shows planned and actual movement
The system SHALL render a trip map that distinguishes planned route legs from actual traveled tracks.

#### Scenario: Viewer opens a trip map
- **WHEN** a trip has both planned legs and recorded track points
- **THEN** the map displays separate visual layers for planned and actual movement

#### Scenario: Trip has no actual tracking yet
- **WHEN** a viewer opens a trip before any track session has been recorded
- **THEN** the map still displays the planned route information if available

### Requirement: Public map must enforce privacy rules
The system SHALL apply trip-level privacy rules before exposing location-derived data on quasi-public pages.

#### Scenario: Delayed live position mode
- **WHEN** a trip is configured to show delayed current position
- **THEN** the public map omits points newer than the configured delay threshold

#### Scenario: Completed segments only mode
- **WHEN** a trip is configured to show completed segments only
- **THEN** the public map exposes completed tracks but not an in-progress current position marker

### Requirement: Map can anchor moments to locations
The system SHALL allow location-aware moments to appear on the trip map when coordinates are available.

#### Scenario: Moment includes coordinates
- **WHEN** a stored moment has usable coordinates
- **THEN** the trip map exposes that moment as a map-linked item

#### Scenario: Moment has no coordinates
- **WHEN** a stored moment has no coordinates
- **THEN** the system keeps the moment in the trip timeline without requiring map placement
