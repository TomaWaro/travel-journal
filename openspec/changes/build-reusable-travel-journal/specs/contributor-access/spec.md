## ADDED Requirements

### Requirement: Owner can invite multiple contributors
The system SHALL allow a trip owner to grant capture access to multiple contributors without granting publication control.

#### Scenario: Owner invites a contributor
- **WHEN** the owner creates an invite for a trip contributor
- **THEN** the system issues a contributor access path scoped to the workspace or trip

#### Scenario: Contributor opens invite
- **WHEN** an invited contributor follows a valid access path
- **THEN** the system grants capture permissions appropriate to that contributor role

### Requirement: Contributor permissions must be role-limited
The system SHALL distinguish owner permissions from contributor permissions.

#### Scenario: Contributor attempts to publish
- **WHEN** a contributor without owner role attempts to publish a story
- **THEN** the system rejects the action

#### Scenario: Owner manages trip settings
- **WHEN** the owner updates visibility or publication settings
- **THEN** the system accepts the change because the owner role has editorial control

### Requirement: Contributor activity must remain attributable
The system SHALL associate uploaded moments and track sessions with the contributor who created them.

#### Scenario: Two contributors upload content
- **WHEN** two contributors submit moments to the same trip
- **THEN** the system stores authorship for each moment separately

#### Scenario: Contributor records a track session
- **WHEN** a contributor starts and stops a tracking session
- **THEN** the resulting track session remains attributable to that contributor for editorial review
