# NEXUS

## Final Product Specification, Product Decisions, Architecture, Requirements, Roadmap & Implementation Directive

You are receiving this document as the **final product and technical source of truth** for NEXUS.

The product strategy, scope, architecture direction, MVP boundaries, user journeys, domain model, mobile strategy and major technology decisions have already been worked through.

Your job is now to **implement the product faithfully**.

Do not delegate product discovery back to me.

Do not ask me to choose between competing frameworks, databases, architectures, UI approaches, entity models or workflow designs unless you discover a genuine contradiction that makes implementation impossible.

Do not restart the product-definition process.

Do not turn this back into a high-level proposal.

Treat this document as the locked specification.

Where an implementation detail is not explicitly specified, choose the simplest production-quality implementation consistent with this specification.

Where an implementation decision is expensive or architectural but not explicitly specified, record it as an ADR and continue.

---

# 0. EXECUTIVE PRODUCT DECISION

## What NEXUS is

NEXUS is a **spatial-first inspection-to-action and operational-evidence platform for distributed physical assets**.

It helps organizations that operate or maintain physical infrastructure across multiple locations answer:

* What assets do we have?
* Where are they?
* Which inspections are due?
* What has actually been inspected?
* What was found?
* Which findings require action?
* Who is responsible for the action?
* Has the issue actually been resolved?
* What evidence proves the work happened?
* What is the current operational picture across all sites?

The central product loop is:

**Asset → Inspection → Finding → Corrective Action → Evidence → Verification → History**

The product is not primarily about asset CRUD.

It is not primarily about maps.

It is not primarily about work orders.

Its central value is the **continuous, spatially-linked chain of operational evidence from field observation through resolution**.

---

# 1. FINAL PRODUCT THESIS

## Product thesis

Distributed physical assets are often managed through a fragmented combination of:

* spreadsheets
* WhatsApp/messages
* paper checklists
* PDFs
* photos on individual phones
* email
* disconnected asset registers
* generic task tools
* disconnected maintenance systems

The resulting problem is not merely lack of visibility.

The deeper problem is that organizations often cannot reliably connect:

**what asset existed → what condition it was in → who inspected it → what they found → what action followed → what evidence supports closure.**

NEXUS creates one operational chain around that lifecycle.

## Core value proposition

> **NEXUS turns field inspections into a traceable operational record.**

Or:

> **Know what was inspected. Know what was found. Know what was fixed. Prove it.**

---

# 2. IMPORTANT PRODUCT CORRECTION FROM THE ORIGINAL WEBSITE

The existing marketing website presents NEXUS as an extremely broad infrastructure command center.

That broad positioning is intentionally NOT the MVP product scope.

The website currently includes concepts such as:

* every physical asset
* real-time operational signals
* predictive maintenance
* field coordination
* energy
* telecom
* water
* industrial infrastructure
* 50k+ assets
* sub-8-second signal latency

These should NOT be interpreted as current product capabilities.

The marketing site is a visual/product-storytelling layer.

The real product is narrower.

## Remove from the MVP product thesis

Do not build NEXUS as:

* an enterprise EAM
* a full CMMS
* a generic FSM
* an IoT platform
* a SCADA platform
* a telemetry platform
* a predictive-maintenance platform
* a route optimization system
* an ERP
* a CRM
* a billing system
* a GIS replacement
* a digital-twin platform
* an AI operations platform

Those may be future integration directions.

They are not the product core.

---

# 3. WHY THE PRODUCT WAS NARROWED

The broader concept overlaps substantially with existing categories.

Current products already cover significant portions of generic asset/work-order/field-service workflows.

Examples include:

* MaintainX: asset-centric work orders, inspections and maintenance workflows.
* Zoho FSM: asset management, recurring maintenance, mobile field workflows, maps and offline field access.
* Oracle: utility work and asset management, condition assessment, maintenance history and spatial/visual operational views.
* Raptor Maps: map-based solar asset management, digital twins, inspections and field remediation.
* Power Factors: renewable asset performance, field service and portfolio intelligence.

Therefore NEXUS must not attempt to beat established platforms by simply implementing fewer features.

Its differentiation hypothesis is:

> **NEXUS is the inspection/evidence layer rather than the entire operational stack.**

The focus is:

**inspect → document → find → assign → prove closure**

rather than:

**sell → schedule → dispatch → bill → maintain the entire company.**

This distinction is important and must remain intact.

---

# 4. TARGET CUSTOMER

## Initial ICP

The first target is:

### Small-to-mid-sized distributed power / energy operations and maintenance companies

Examples:

* solar O&M firms
* solar EPCs with recurring maintenance operations
* distributed power-service companies
* generator maintenance providers
* battery/inverter service companies
* organizations maintaining distributed backup-power infrastructure

Typical characteristics:

* approximately 10–250 sites
* approximately 50–10,000 tracked physical assets
* approximately 5–100 field/operations users
* recurring inspections
* recurring maintenance
* geographically distributed sites
* technicians regularly working away from the office
* operational data currently fragmented across spreadsheets, messaging and files
* weak or intermittent connectivity may occur in field environments

These ranges are **working product-segmentation assumptions**, not market-size claims.

Do not present them as researched facts.

---

# 5. FUTURE EXPANSION

The underlying data model must remain sufficiently generic to support later expansion into:

* telecom infrastructure
* water systems
* facility infrastructure
* industrial equipment
* utilities
* other distributed physical infrastructure

However:

**Do not optimize the MVP UX for every industry.**

The initial terminology, seeded examples and primary workflows should be understandable for distributed power operations.

---

# 6. USERS

## 6.1 Organization Owner

Responsibilities:

* organization setup
* team management
* organization settings
* high-level access
* data administration

---

## 6.2 Operations Manager

Primary office-side power user.

Responsibilities:

* assets
* sites
* inspection templates
* inspection plans
* assignments
* findings
* corrective actions
* reporting
* dashboard
* operational review

This is the primary economic/product champion.

---

## 6.3 Field Technician / Inspector

Primary mobile user.

Responsibilities:

* view assigned inspections
* inspect assets
* answer checklists
* record readings
* capture notes
* capture photos
* create findings
* complete assigned corrective actions
* submit inspection results

This user must be able to operate in weak-connectivity environments.

---

## 6.4 Supervisor / Reviewer

Responsibilities:

* review submitted inspections where required
* review high-severity findings
* verify corrective actions
* approve/close findings

---

## 6.5 Viewer

Read-only access to operational records and dashboards.

---

# 7. PRIMARY JOB TO BE DONE

The core user job is:

> “I need to know whether my distributed assets were actually inspected, what the field team found, what requires attention, whether the corrective work happened, and have evidence to support that conclusion.”

Everything in the MVP should support this job.

---

# 8. PRODUCT DIFFERENTIATION HYPOTHESIS

The following is a **product hypothesis**, not a validated market fact:

Existing enterprise and field-service platforms often attempt to own the entire operational workflow.

NEXUS instead focuses tightly on:

### Inspection coverage

Which assets/sites were inspected, when and by whom?

### Structured condition capture

What did the field team actually observe?

### Spatial context

Where did the observation occur?

### Evidence continuity

What photos, notes and records support the finding?

### Corrective-action continuity

What happened after the finding?

### Verification

Who confirmed that the corrective action was actually resolved?

### Historical traceability

Can the organization reconstruct what happened later?

This combination defines the NEXUS MVP.

Do not claim that no competitor provides these capabilities.

The product's commercial differentiation remains a hypothesis requiring future customer validation.

---

# 9. CORE PRODUCT LOOP

The primary domain lifecycle is:

```text
SITE
  ↓
ASSET
  ↓
INSPECTION PLAN
  ↓
INSPECTION RUN
  ↓
OBSERVATION / RESPONSE
  ↓
FINDING
  ↓
CORRECTIVE ACTION
  ↓
FIELD EVIDENCE
  ↓
VERIFICATION
  ↓
CLOSED HISTORY
```

The product should make this lifecycle visually and structurally obvious.

---

# 10. MVP SCOPE

The MVP includes the following.

## 10.1 Authentication

* sign up
* sign in
* sign out
* email verification
* password reset
* session management
* secure cookies
* organization membership

Future authentication options such as:

* SSO
* SAML
* SCIM
* passkeys

are deferred.

---

# 11. ORGANIZATIONS AND MEMBERSHIPS

Users belong to organizations.

A user may eventually belong to multiple organizations.

MVP should support:

* create organization
* organization profile
* members
* invitations
* role assignment
* deactivate member
* remove member

All organization-owned records must be tenant isolated.

---

# 12. SITE MANAGEMENT

A Site is a physical operational location.

Examples:

* solar installation
* generator site
* telecom site
* facility
* pump station

Each Site supports:

* name
* reference/code
* address
* coordinates
* optional boundary polygon
* site type
* status
* notes
* metadata
* associated assets
* inspection plans
* findings
* corrective actions
* activity history
* attachments

Site lifecycle:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

Archived sites remain historically visible but cannot receive new operational activity.

---

# 13. ASSET MANAGEMENT

An Asset is a physical object that can be inspected.

Examples:

* inverter
* solar panel/string
* generator
* battery
* ATS
* transformer
* control panel
* pump
* meter
* switchgear

Each asset supports:

* asset identifier
* asset name
* asset type
* manufacturer
* model
* serial number
* installation date
* status
* condition
* site
* geographic position
* parent asset
* optional child assets
* notes
* attachments
* inspection history
* findings
* corrective actions
* activity history

Asset statuses:

```text
OPERATIONAL
ATTENTION
OUT_OF_SERVICE
DECOMMISSIONED
ARCHIVED
```

Do not build full lifecycle/capital planning.

---

# 14. ASSET HIERARCHY

Support parent/child relationships.

Example:

```text
Site
 └── Solar Installation
      ├── Inverter 01
      │    ├── String A
      │    └── String B
      └── Battery Bank
```

Do not allow arbitrary cyclic relationships.

The database/domain layer must reject cycles.

An asset can have at most one immediate parent in MVP.

---

# 15. INSPECTION TEMPLATES

Inspection templates define structured inspections.

MVP question types:

* pass/fail
* yes/no
* single choice
* numeric
* short text
* long text
* photo
* date/time where needed

Each question supports:

* stable ID
* label
* help text
* response type
* required/optional
* ordering
* optional unit
* optional minimum/maximum
* optional severity trigger
* optional evidence requirement

Avoid building a general-purpose form builder.

Templates are a controlled operational feature.

---

# 16. TEMPLATE VERSIONING

Templates must be versioned.

Once an inspection run begins, it is permanently associated with the exact template version used.

Changing a template creates a new version.

Never silently mutate a template version after it has been used for a submitted inspection.

Example:

```text
Daily Generator Inspection
  v1
  v2
  v3
```

Historical inspections always preserve the version that produced them.

---

# 17. INSPECTION PLANS

An Inspection Plan defines:

* target sites/assets
* template
* frequency
* start date
* optional end date
* responsible team/user
* due window
* severity rules
* active/inactive state

MVP recurrence options:

* daily
* weekly
* monthly
* quarterly
* custom number of days

Do not implement a full calendar recurrence language.

---

# 18. INSPECTION RUN

An Inspection Run is an actual instance of an inspection.

States:

```text
ASSIGNED
READY
IN_PROGRESS
SUBMITTED
REVIEW_REQUIRED
APPROVED
CLOSED
CANCELLED
```

Not every run needs every state.

The minimum valid path:

```text
ASSIGNED
→ IN_PROGRESS
→ SUBMITTED
→ CLOSED
```

Supervisor workflows may insert:

```text
SUBMITTED
→ REVIEW_REQUIRED
→ APPROVED
→ CLOSED
```

---

# 19. INSPECTION EXECUTION

A technician should be able to:

1. open assigned inspection
2. see site
3. see asset(s)
4. see inspection instructions
5. answer checklist
6. capture readings
7. add notes
8. capture photos
9. create findings
10. save progress
11. submit
12. receive synchronization confirmation

An inspection must be usable without constant network connectivity.

---

# 20. OFFLINE FIELD MODE

This is a core MVP requirement.

The product must be a mobile-first PWA.

Offline support is limited to field execution.

## Available offline

The technician can:

* open previously synchronized assigned inspections
* open required site information
* open required asset information
* view the inspection template
* answer questions
* record notes
* create findings
* capture photos
* mark the inspection submitted locally
* continue working while offline

## Not required offline

These remain online-only:

* organization administration
* member management
* creating inspection templates
* changing inspection plans
* asset master-data administration
* complex reporting
* imports
* dashboard analytics
* billing

---

# 21. OFFLINE DATA MODEL

Use client-side IndexedDB.

Preferred implementation:

* Dexie
* service worker/PWA support
* local mutation queue

Dexie provides TypeScript-friendly IndexedDB persistence and is appropriate for the field-mode local store.

Use Serwist or an equivalent maintained PWA/service-worker solution for Next.js. Next.js documentation explicitly identifies Serwist as an option for offline support.

---

# 22. OFFLINE SYNC PRINCIPLE

Do NOT build a general-purpose CRDT synchronization engine.

That would be unnecessary.

Instead:

### Design assumption

A field inspection run has one assigned active executor at a time.

Therefore offline writes can be modeled as ordered, idempotent commands.

Example:

```text
START_INSPECTION
SAVE_RESPONSE
SAVE_NOTE
ADD_FINDING
ADD_EVIDENCE
SUBMIT_INSPECTION
```

Each command receives:

* command ID
* inspection ID
* user ID
* client timestamp
* sequence number
* payload
* idempotency key

The server records processed command IDs.

Repeated commands must be safe.

---

# 23. OFFLINE CONFLICT RULES

### Inspection execution

Only one device may own an active inspection run.

If another device attempts to begin the same run:

* reject the attempt
* tell the user who owns the run
* do not merge competing active sessions

### Submitted inspections

Once submitted:

* responses become immutable
* later corrections use amendment/correction events
* original submission remains preserved

### Asset metadata

General asset metadata editing is online-first and does not require offline mutation.

This keeps conflict complexity low.

---

# 24. OFFLINE PHOTOS

Technicians must be able to take photos while offline.

Photos are:

1. compressed locally where practical
2. stored temporarily in local browser storage
3. associated with a pending evidence record
4. uploaded when connectivity returns
5. associated server-side with the final evidence record

The UI must show:

* pending upload
* uploading
* uploaded
* failed
* retry

Never silently lose an attachment.

---

# 25. FINDINGS

A Finding represents an operational problem discovered during an inspection.

Fields:

* title
* description
* severity
* category
* asset
* site
* inspection
* detected_at
* detected_by
* evidence
* status
* assigned_to
* resolution
* resolved_at
* verified_by
* verified_at

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 26. FINDING STATE MACHINE

Use:

```text
OPEN
→ ACKNOWLEDGED
→ ACTION_REQUIRED
→ IN_PROGRESS
→ READY_FOR_VERIFICATION
→ VERIFIED
→ CLOSED
```

Alternative terminal state:

```text
DISMISSED
```

A finding may be dismissed only by an authorized role and must require a reason.

---

# 27. CORRECTIVE ACTIONS

A Finding may generate one corrective action.

Multiple corrective actions may be supported later.

For MVP, use:

```text
Finding
  ↓
Corrective Action
```

Action fields:

* title
* description
* assigned user
* priority
* due date
* status
* completion notes
* completion evidence
* verification

Status:

```text
OPEN
IN_PROGRESS
BLOCKED
COMPLETED
VERIFICATION_REQUIRED
VERIFIED
CANCELLED
```

---

# 28. DO NOT BUILD A GENERAL WORK-ORDER SYSTEM

This distinction is important.

NEXUS is NOT becoming MaintainX.

Do not implement:

* parts inventory
* labor costing
* invoicing
* estimates
* full scheduling
* route optimization
* timesheets
* procurement
* customer billing
* preventive-maintenance scheduling engine
* technician utilization dashboards
* dispatch optimization

Corrective actions exist only to close findings.

A future full FSM module can be added later if validated.

---

# 29. EVIDENCE

Evidence is first-class.

Supported MVP types:

* photo
* PDF
* short text note

Each evidence record stores:

* owner organization
* related entity
* uploader
* captured timestamp
* uploaded timestamp
* original filename
* MIME type
* size
* storage key
* checksum
* optional GPS
* optional device metadata
* evidence type

The system must preserve evidence provenance.

---

# 30. EVIDENCE RULES

Evidence can belong to:

* inspection
* inspection response
* finding
* corrective action

A deleted evidence record must not cause an orphaned physical file.

Physical object deletion and DB metadata deletion must remain coordinated.

Do not permit clients to access arbitrary storage keys.

Use short-lived signed URLs.

---

# 31. REPORTS

MVP includes inspection reports.

A report must be generated from actual data.

It should include:

* organization
* site
* asset
* inspection name
* template version
* inspection date/time
* inspector
* status
* checklist results
* findings
* severity
* evidence thumbnails where appropriate
* corrective actions
* verification status
* timestamps
* optional captured location
* report generation timestamp

Do not include invented performance metrics.

---

# 32. REPORT FORMAT

MVP:

* PDF
* CSV summary export

Future:

* branded report builder
* scheduled reports
* external client portals
* public share links

---

# 33. OPERATIONAL MAP

The map is a primary product surface.

It must show:

* sites
* assets
* asset status
* inspection status
* finding status
* selected item details

Map filters:

* site
* asset type
* asset status
* condition
* inspection due
* overdue inspection
* finding severity
* finding status

---

# 34. GEOSPATIAL MODEL

Use PostgreSQL + PostGIS.

PostGIS is appropriate because it provides spatial storage, indexing and spatial querying within PostgreSQL.

Use:

* `geometry(Point, 4326)` for assets/sites
* `geometry(Polygon, 4326)` for optional site boundaries
* GiST spatial indexes

Normalize coordinates consistently.

Do not store geographic position only as textual latitude/longitude fields.

---

# 35. GEOSPATIAL QUERIES

Support:

* map viewport/bounding-box queries
* nearby assets
* point-in-site queries where needed
* site boundary display
* optional distance queries
* filtered map queries

The API must only return fields necessary for map rendering.

Do not send full asset records to the map.

---

# 36. MAP TECHNOLOGY

Use:

### Renderer

**MapLibre GL JS**

MapLibre GL JS is a WebGL-based TypeScript mapping library designed for interactive vector-tile maps and current v6 releases use ESM.

### Initial map/geocoding provider

**MapTiler Cloud**, behind an internal provider abstraction.

MapTiler currently provides vector maps, geocoding and 2D/3D data support, with commercial usage available through paid plans.

Do not hardcode MapTiler deep into the domain layer.

Create:

```text
MapProvider
GeocodingProvider
```

interfaces so the provider can later change.

---

# 37. MAP PERFORMANCE STRATEGY

MVP target:

* up to approximately 10,000 assets in the system
* viewport-based fetching
* clustering at low zoom
* limited properties in map payload
* no DOM marker per asset
* vector-rendered layers
* pagination outside the viewport

Do not attempt to prove support for 50k assets merely because the marketing website says “50k+”.

That number is currently illustrative.

---

# 38. 3D DECISION

3D remains part of the NEXUS brand.

However:

## Marketing site

May remain highly 3D and cinematic.

## Authenticated product

3D is NOT a core MVP dependency.

Do not make technicians wait for a 3D scene.

Do not create a spinning globe just for visual effect.

The operational product should primarily use a high-performance 2D spatial map.

A future “Site 3D” or “Spatial Twin” mode can be added later if real customer workflows justify it.

---

# 39. DASHBOARD

The dashboard answers:

> What needs attention?

It should show:

* inspections due
* overdue inspections
* inspections completed recently
* open findings
* high/critical findings
* corrective actions due
* overdue corrective actions
* inspection coverage by site
* recent activity
* site map summary

Do not create generic vanity analytics.

---

# 40. INSPECTION COVERAGE

Inspection coverage is one of the most important MVP metrics.

For each site:

* required inspections
* completed inspections
* overdue inspections
* completion rate

For each period:

```text
Due
Completed
Overdue
Skipped
```

Define exact calculation rules.

Do not count a draft or abandoned inspection as completed.

---

# 41. OPERATIONAL ATTENTION MODEL

Create a unified “Attention” concept for dashboard and map.

Priority sources:

1. critical findings
2. high findings
3. overdue corrective actions
4. overdue inspections
5. assets marked attention

The ordering is operational, not an AI prediction.

Do not call this “risk intelligence” unless a real risk model is later implemented.

---

# 42. SEARCH

Global search must support:

* site
* site reference
* asset
* serial number
* asset identifier
* finding title
* corrective-action title

Tenant scoped.

Use PostgreSQL search capabilities first.

Do not add Elasticsearch/OpenSearch.

---

# 43. IMPORTS

MVP must support CSV import of:

* sites
* assets

Import workflow:

```text
UPLOAD
→ PARSE
→ PREVIEW
→ COLUMN MAPPING
→ VALIDATE
→ CONFIRM
→ PROCESS
→ REPORT
```

Validation includes:

* missing required fields
* invalid coordinates
* invalid asset type
* duplicate identifier
* unknown site
* malformed values

Provide row-level errors.

Do not partially import silently.

---

# 44. IMPORT IDEMPOTENCY

An import must have:

* import ID
* organization
* file checksum
* uploader
* timestamp
* row count
* created count
* updated count
* rejected count

Duplicate submissions of the same file should be detectable.

---

# 45. NOTIFICATIONS

MVP channels:

### Email

Use email for:

* inspection assignment
* inspection due reminder
* overdue inspection
* finding assignment
* corrective action assignment
* corrective action overdue
* invitation

Do not build SMS in MVP.

Do not build WhatsApp integration in MVP.

Do not build push notifications in MVP unless they fall out of the PWA architecture with minimal complexity.

---

# 46. NOTIFICATION ENGINE

Use asynchronous jobs.

Requirements:

* deduplicate reminders
* timezone-aware due calculations
* retry failed delivery
* record delivery state
* avoid duplicate reminder emails
* support cancellation when the underlying record is resolved

Notification delivery must never determine whether the underlying domain action succeeded.

---

# 47. AUDIT TRAIL

Important actions must produce immutable activity events.

Examples:

* organization created
* member invited
* member removed
* role changed
* site created
* asset created
* asset archived
* inspection plan created
* inspection started
* inspection submitted
* finding created
* finding resolved
* corrective action created
* corrective action completed
* verification completed
* evidence added
* import completed

Audit records include:

* actor
* organization
* timestamp
* action
* resource type
* resource ID
* relevant metadata
* request/correlation ID

Do not allow ordinary users to edit audit events.

---

# 48. DOMAIN DATA MODEL

The conceptual model is:

```text
User
Organization
Membership

Site
AssetType
Asset
AssetRelationship

InspectionTemplate
InspectionTemplateVersion
InspectionPlan
InspectionRun
InspectionResponse

Finding
CorrectiveAction

Evidence
Attachment

ActivityEvent
Notification

ImportJob
ImportRowError
```

Additional supporting tables may be created when required.

Do not create an entity merely because the entity sounds architecturally sophisticated.

---

# 49. USER / ORGANIZATION MODEL

## User

* id
* email
* name
* avatar
* active
* createdAt
* updatedAt

## Organization

* id
* name
* slug
* logo
* timezone
* default locale
* createdAt
* updatedAt

## Membership

* id
* userId
* organizationId
* role
* status
* createdAt
* updatedAt

Roles:

```text
OWNER
OPERATIONS_MANAGER
SUPERVISOR
TECHNICIAN
VIEWER
```

Do not implement a custom role editor in MVP.

---

# 50. SITE MODEL

Site fields:

* id
* organizationId
* name
* reference
* type
* status
* address
* location
* boundary
* notes
* createdBy
* createdAt
* updatedAt
* archivedAt

Uniqueness:

```text
organizationId + reference
```

where reference is present.

---

# 51. ASSET MODEL

Asset fields:

* id
* organizationId
* siteId
* parentAssetId
* assetTypeId
* identifier
* name
* serialNumber
* manufacturer
* model
* installationDate
* status
* condition
* location
* metadata
* createdAt
* updatedAt
* archivedAt

Unique asset identifier should be organization-scoped.

---

# 52. ASSET TYPE

AssetType:

* id
* organizationId nullable for system defaults
* name
* category
* description
* metadataSchema
* active

System templates may include:

* solar inverter
* solar panel/string
* generator
* battery
* ATS
* transformer
* meter
* switchgear

Organization-specific types can be created.

Do not build a fully dynamic schema builder.

---

# 53. INSPECTION TEMPLATE MODEL

Template:

* id
* organizationId
* name
* description
* category
* status

TemplateVersion:

* id
* templateId
* versionNumber
* schema
* publishedAt
* createdBy
* checksum

Once published, a version is immutable.

---

# 54. INSPECTION PLAN MODEL

Fields:

* id
* organizationId
* templateVersionId
* name
* target type
* site/asset association
* recurrence
* startDate
* endDate
* assigned role/user
* active
* nextDueAt
* createdAt
* updatedAt

Do not create thousands of future inspection rows.

Generate upcoming runs using controlled scheduling logic.

---

# 55. INSPECTION RUN MODEL

Fields:

* id
* organizationId
* inspectionPlanId
* templateVersionId
* siteId
* assetId nullable
* assignedTo
* status
* scheduledFor
* startedAt
* submittedAt
* closedAt
* startedOffline
* submittedOffline
* clientDeviceId nullable
* createdAt
* updatedAt

---

# 56. INSPECTION RESPONSE

Each response records:

* inspectionRunId
* questionId
* value
* numericValue where applicable
* textValue where applicable
* selectedOption where applicable
* capturedAt
* capturedBy
* evidence requirement state

Responses for submitted inspections are immutable.

---

# 57. FINDING MODEL

Fields:

* id
* organizationId
* inspectionRunId
* siteId
* assetId nullable
* category
* title
* description
* severity
* status
* detectedAt
* detectedBy
* assignedTo
* dueAt
* resolutionNotes
* resolvedAt
* verifiedBy
* verifiedAt

---

# 58. CORRECTIVE ACTION MODEL

Fields:

* id
* organizationId
* findingId
* title
* description
* assignedTo
* priority
* dueAt
* status
* completionNotes
* completedAt
* verifiedBy
* verifiedAt

---

# 59. EVIDENCE MODEL

Evidence should be separated logically from storage.

Evidence record:

* id
* organizationId
* relatedType
* relatedId
* uploadedBy
* capturedAt
* uploadedAt
* storageObjectId
* type
* checksum
* latitude nullable
* longitude nullable
* note nullable

Storage object:

* id
* bucket
* objectKey
* originalName
* contentType
* size
* checksum
* status
* createdAt

---

# 60. ID STRATEGY

Use UUIDv7.

PostgreSQL 18 provides native UUIDv7 generation and UUIDv7 is time ordered, making it appropriate for this system.

Use UUIDv7 for domain identifiers.

Do not expose sequential numeric database IDs.

---

# 61. TIME STRATEGY

Store timestamps as UTC.

Use `timestamptz`.

Organization timezone is used for:

* due dates
* recurring inspections
* reminder timing
* reporting display

Never store ambiguous local timestamps.

---

# 62. TENANT ISOLATION

This is non-negotiable.

Every tenant-owned entity must be organization scoped.

Every request must establish:

```text
authenticated user
→ organization membership
→ role/permission
→ resource ownership
```

Do not trust `organizationId` supplied by the browser.

Never authorize based solely on frontend state.

Test cross-tenant attacks explicitly.

---

# 63. SECURITY MODEL

At minimum protect against:

* broken object-level authorization
* broken function-level authorization
* broken object-property authorization
* session theft
* CSRF
* XSS
* SQL injection
* malicious file uploads
* path traversal
* ID enumeration
* brute-force login
* rate abuse
* insecure redirects
* sensitive data leakage
* cross-tenant attachment access

OWASP specifically identifies broken object-level authorization and object-property/function authorization as major API risks; this must be tested directly rather than assumed.

---

# 64. AUTHENTICATION DECISION

Use a maintained TypeScript-native authentication solution rather than inventing an authentication system from scratch.

Preferred:

**Better Auth**

Reasons:

* credentials
* sessions
* organization support
* membership
* invitations
* access control
* password reset
* email verification
* extensibility

Better Auth provides organization/membership/access-control functionality and is designed to work across TypeScript frameworks.

Use the current stable release at implementation time.

Do not use a release candidate merely because it contains a newer feature.

If the existing codebase already has an auth system that is clean and secure, preserve it rather than rewriting it unnecessarily.

---

# 65. PASSWORD SECURITY

If email/password is used:

* Argon2id
* secure password policy
* rate limiting
* email verification
* password reset tokens
* session revocation
* secure cookies

Never store plaintext passwords.

Never log credentials.

---

# 66. OBJECT STORAGE

Use S3-compatible object storage.

Production:

* AWS S3 or equivalent

Local:

* MinIO or equivalent S3-compatible emulator

Access:

* direct client upload via presigned URL where appropriate
* backend authorizes the upload request
* backend controls download authorization
* short-lived signed URLs

---

# 67. FILE SECURITY

Allow MVP:

* JPEG
* PNG
* WebP
* PDF

Validate:

* file size
* extension
* MIME type
* object ownership
* checksum

Images should be processed into safe application derivatives where appropriate.

Do not serve arbitrary user-uploaded files from the application domain without proper content handling.

---

# 68. DATABASE

Use:

### PostgreSQL 18

Current PostgreSQL 18 is production-ready and PostgreSQL 18.6 is a current maintenance release.

### PostGIS 3.6.x stable line

Use the current stable PostGIS 3.6 patch version compatible with PostgreSQL 18.

Do not use the 3.7 release candidate line in production merely because it is newer. The PostGIS project currently identifies the 3.7 line as prerelease while the 3.6 line remains maintained.

---

# 69. ORM / DATA ACCESS

Use:

## Drizzle ORM

Reason:

PostGIS is fundamental to the product and Drizzle provides first-class geometry support and spatial indexes for PostgreSQL/PostGIS.

Do not introduce Prisma merely because it is familiar.

Use SQL directly for:

* advanced PostGIS queries
* performance-critical spatial operations
* database functions
* migrations requiring extension-specific SQL

Keep raw SQL isolated and documented.

---

# 70. BACKEND FRAMEWORK

Use:

## NestJS 11 + Fastify

Reason:

* modular architecture
* dependency injection
* controllers
* guards
* background modules
* OpenAPI support
* validation pipeline
* clear domain boundaries

Use Fastify for the HTTP runtime.

Do not split the application into microservices.

---

# 71. ARCHITECTURE STYLE

Use a:

# Modular monolith + worker

Structure:

```text
apps/
  web/
  api/
  worker/

packages/
  contracts/
  ui/
  config/
  validation/
  domain/
  database/
  storage/
  maps/
```

Potential additional packages:

```text
packages/
  auth/
  offline/
  email/
  observability/
```

Only create packages when they have a real boundary.

Do not create packages for every tiny utility.

---

# 72. BACKEND DOMAIN MODULES

The API should be organized around domain modules:

```text
auth
organizations
memberships
sites
assets
asset-types
inspections
inspection-templates
inspection-plans
inspection-runs
findings
corrective-actions
evidence
imports
map
notifications
audit
reports
```

Each module should have appropriate:

* controller
* application/service layer
* domain logic
* repository/data access
* validation
* tests

Do not put the whole business logic into controllers.

---

# 73. FRONTEND

Use:

* Next.js 16.3
* React 19.3
* TypeScript
* Tailwind CSS 4.x
* Framer Motion

Next.js 16.3 is current in the 16.x line, React 19.3 is current, and Tailwind 4.x is the current modern line.

Use the existing NEXUS marketing site's visual language as the foundation.

---

# 74. FRONTEND ARCHITECTURE

Separate:

```text
Marketing
Authenticated Application
Field Mode
Shared UI
Map/Spatial
Offline
```

Suggested:

```text
app/
  (marketing)/
  (auth)/
  app/
    dashboard/
    map/
    sites/
    assets/
    inspections/
    findings/
    actions/
    reports/
    team/
    imports/
    settings/
```

Avoid mixing marketing components with authenticated operational components.

---

# 75. SERVER STATE

Use a robust query/mutation library such as TanStack Query for remote state.

Do not place all API state into a global client store.

Use local component state for:

* open dialogs
* temporary forms
* UI filters

Use URL state where deep-linkable.

---

# 76. PWA

The authenticated application should be installable as a PWA.

Requirements:

* manifest
* service worker
* installability
* caching strategy
* offline field route
* local data store
* sync status
* retry behavior

Do not attempt to make the entire application offline.

Only field execution needs offline support in MVP.

---

# 77. LOCAL STORAGE

Use Dexie/IndexedDB for:

* cached assignments
* cached assets needed by active inspection
* cached template versions
* pending mutations
* offline evidence metadata
* local photo blobs

Never use localStorage as the primary data store for field state.

---

# 78. API

Use REST.

Prefix:

```text
/v1
```

Use resource-oriented APIs.

---

# 79. CORE API BOUNDARIES

## Auth

```text
/v1/auth/*
```

---

## Organization

```text
GET    /v1/organization
PATCH  /v1/organization
```

---

## Members

```text
GET    /v1/members
POST   /v1/members/invitations
PATCH  /v1/members/:id
DELETE /v1/members/:id
```

---

## Sites

```text
GET    /v1/sites
POST   /v1/sites
GET    /v1/sites/:id
PATCH  /v1/sites/:id
POST   /v1/sites/:id/archive
```

---

## Assets

```text
GET    /v1/assets
POST   /v1/assets
GET    /v1/assets/:id
PATCH  /v1/assets/:id
POST   /v1/assets/:id/archive
GET    /v1/assets/:id/history
```

---

## Map

```text
GET /v1/map/sites
GET /v1/map/assets
GET /v1/map/attention
```

Parameters may include:

* bbox
* zoom
* status
* type
* site
* inspectionState
* findingSeverity

---

# 80. INSPECTION API

```text
GET    /v1/inspection-templates
POST   /v1/inspection-templates
GET    /v1/inspection-templates/:id
POST   /v1/inspection-templates/:id/versions

GET    /v1/inspection-plans
POST   /v1/inspection-plans
PATCH  /v1/inspection-plans/:id
POST   /v1/inspection-plans/:id/pause
POST   /v1/inspection-plans/:id/resume

GET    /v1/inspection-runs
GET    /v1/inspection-runs/:id
POST   /v1/inspection-runs/:id/start
PUT    /v1/inspection-runs/:id/responses
POST   /v1/inspection-runs/:id/findings
POST   /v1/inspection-runs/:id/submit
POST   /v1/inspection-runs/:id/review
POST   /v1/inspection-runs/:id/close
```

The exact route naming may be refined for REST consistency, but the domain boundaries must remain.

---

# 81. FINDINGS API

```text
GET    /v1/findings
POST   /v1/findings
GET    /v1/findings/:id
PATCH  /v1/findings/:id
POST   /v1/findings/:id/acknowledge
POST   /v1/findings/:id/close
POST   /v1/findings/:id/dismiss
```

---

# 82. CORRECTIVE ACTION API

```text
GET    /v1/actions
POST   /v1/findings/:id/actions
GET    /v1/actions/:id
PATCH  /v1/actions/:id
POST   /v1/actions/:id/start
POST   /v1/actions/:id/complete
POST   /v1/actions/:id/verify
```

---

# 83. EVIDENCE API

Use a two-step upload:

```text
POST /v1/uploads/presign
```

then direct upload to storage.

Then:

```text
POST /v1/evidence
```

to finalize the metadata association.

The server verifies that:

* uploader has access
* target entity belongs to same organization
* object key was issued by the server
* object exists
* checksum/content metadata matches expected state

---

# 84. OFFLINE SYNC API

Provide an idempotent field synchronization endpoint.

Example:

```text
POST /v1/field/sync
```

Request contains a batch of commands:

```text
{
  deviceId,
  clientSessionId,
  commands: [
    {
      commandId,
      sequence,
      type,
      occurredAt,
      inspectionRunId,
      payload
    }
  ]
}
```

Response:

```text
{
  accepted: [],
  rejected: [],
  conflicts: [],
  serverCursor: ...
}
```

Do not require a distributed event bus for MVP.

---

# 85. IMPORT API

```text
POST /v1/imports
GET  /v1/imports/:id
POST /v1/imports/:id/validate
POST /v1/imports/:id/confirm
GET  /v1/imports/:id/errors
```

Large imports run asynchronously.

---

# 86. REPORT API

```text
POST /v1/inspection-runs/:id/report
GET  /v1/reports/:id
GET  /v1/reports/:id/download
```

Report generation may run in the worker.

---

# 87. API DESIGN RULES

All mutating APIs must use:

* authentication
* authorization
* validation
* consistent error format
* request ID
* idempotency where appropriate

Use:

```text
Idempotency-Key
```

for operations vulnerable to retry duplication.

Examples:

* create inspection
* submit inspection
* upload finalization
* sync commands
* create corrective action

---

# 88. ERROR CONTRACT

Use one standard error envelope.

Example:

```json
{
  "error": {
    "code": "INSPECTION_ALREADY_SUBMITTED",
    "message": "This inspection has already been submitted.",
    "details": {},
    "requestId": "..."
  }
}
```

Do not expose internal stack traces.

Do not leak database errors.

---

# 89. VALIDATION

Validate on the server.

Validate:

* request body
* query parameters
* IDs
* organization ownership
* state transitions
* coordinates
* file metadata
* template responses

The frontend may repeat validation for UX but is never authoritative.

---

# 90. STATE TRANSITION ENFORCEMENT

State transitions must be represented as domain operations.

Do not allow clients to simply send:

```text
status = "CLOSED"
```

without authorization and valid transition rules.

Use explicit transition services/functions.

---

# 91. IDEMPOTENCY

The server must safely handle:

* double taps
* network retries
* mobile reconnection
* browser resubmits
* duplicate sync attempts

Use unique idempotency keys.

Persist processed keys with enough information to return the same logical result.

---

# 92. BACKGROUND JOBS

Use a worker process.

Responsibilities:

* inspection-run generation
* reminder scheduling
* email delivery
* CSV import processing
* report generation
* image processing
* notification retries

Use BullMQ + Redis unless the final repository already contains a suitable production-ready queue solution.

Do not create a separate microservice for every job type.

---

# 93. REDIS

Redis is a supporting infrastructure component, not the system of record.

Do not put core domain state exclusively in Redis.

PostgreSQL remains authoritative.

---

# 94. SEARCH / INDEXING

Create indexes for:

* organizationId
* siteId
* asset identifier
* asset serialNumber
* inspection due date
* inspection status
* finding severity
* finding status
* action due date
* action status
* createdAt

Spatial:

* GIST indexes on PostGIS geometry

Potential text:

* trigram/unaccent extension when required

---

# 95. TRANSACTIONS

Use database transactions for operations such as:

### Inspection submission

Must atomically:

* finalize responses
* finalize findings
* update inspection status
* write activity events
* enqueue derived work

### Corrective-action completion

Must atomically:

* change action status
* store completion data
* create evidence associations
* write activity event

### Finding verification

Must atomically:

* verify finding/action
* update status
* write audit event

---

# 96. AUDIT DATA

Audit history should be append-only.

Do not update audit events.

Do not delete audit events through normal user-facing workflows.

Use the actor identity and organization context from the authenticated request.

Never allow the client to define the actor.

---

# 97. REPORT DATA IMMUTABILITY

A submitted inspection must represent what was actually submitted.

If corrections are needed later:

* preserve original
* record amendment
* do not silently alter history

This is crucial to the evidence/traceability value proposition.

---

# 98. PRODUCT UI

The visual language should inherit from the current NEXUS website:

* dark, sophisticated visual identity
* strong typography
* restrained accent color
* spatial metaphors
* precise micro-interactions
* premium motion

But the operational UI must be:

* calmer
* denser
* faster
* information-oriented
* field-friendly

Do not turn the application into a marketing animation.

---

# 99. NAVIGATION

Primary authenticated navigation:

```text
Overview
Map
Sites
Assets
Inspections
Findings
Actions
Reports
Team
Imports
Settings
```

On mobile, simplify the navigation.

Suggested mobile priority:

```text
Home
Assigned
Inspect
Findings
More
```

---

# 100. MOBILE FIELD UX

The technician experience should prioritize:

1. assigned inspections
2. start/resume
3. checklist
4. camera/evidence
5. findings
6. submit
7. sync state

Large touch targets.

Minimal typing.

Use camera capture wherever possible.

Avoid multi-column desktop tables on mobile.

---

# 101. OFFLINE UX

Always make connection state visible.

States:

```text
ONLINE
SYNCING
OFFLINE
PENDING SYNC
SYNC ERROR
SYNCED
```

When offline:

show:

> Working offline. Changes will sync automatically when connection returns.

Never imply that data is safely on the server if it is only stored locally.

---

# 102. INSPECTION UX

The primary inspection interface should feel like a guided workflow.

Possible structure:

```text
Inspection
Site / Asset
Progress
Checklist
Findings
Evidence
Review
Submit
```

Progress indicator:

```text
12 / 18 completed
```

Required questions must block submission.

Failed/attention responses may automatically suggest a finding.

Do not automatically create findings without clear user confirmation unless the rule is explicit in the template.

---

# 103. FIELD PHOTOS

The photo capture interface should support:

* camera
* gallery
* preview
* retake
* caption
* upload status

Where feasible, compress large images before upload.

---

# 104. FINDING UX

Creating a finding during an inspection should take seconds.

Required:

* title
* severity
* description

Optional:

* category
* photo
* immediate action
* assignment

Do not require a technician to navigate through five pages to report an issue.

---

# 105. MAP UX

Desktop map:

* large canvas
* left filter rail
* right contextual detail panel
* layer toggles
* search

Mobile map:

* full-screen map
* filter drawer
* bottom-sheet item detail

Selecting an asset from the map should reveal useful operational context without requiring a complete route change.

---

# 106. SITE DETAIL

Site detail should combine:

* overview
* map
* assets
* inspections
* open findings
* corrective actions
* activity

Show:

```text
Site condition
Inspection coverage
Open findings
Overdue actions
Recent activity
```

---

# 107. ASSET DETAIL

Asset detail:

```text
Overview
Location
Condition
Inspection history
Open findings
Corrective actions
Evidence
Activity
```

No generic “dashboard clutter”.

---

# 108. REPORTING UX

Allow the user to:

* generate report
* download report
* export CSV
* view report status

Reports should reflect actual system state.

---

# 109. DESIGN SYSTEM

Build reusable components for:

* buttons
* inputs
* selects
* dialogs
* sheets
* tables
* tabs
* badges
* status indicators
* cards
* metric blocks
* timeline
* activity log
* map panels
* inspection steps
* evidence uploader
* offline indicator
* sync indicator
* empty states
* error states

Use a coherent design-token system.

Do not duplicate ad hoc styles.

---

# 110. ACCESSIBILITY

Target WCAG 2.2 AA where practical.

Support:

* keyboard navigation
* focus states
* semantic elements
* accessible labels
* contrast
* reduced motion
* screen-reader-friendly forms
* error announcements

Respect:

```text
prefers-reduced-motion
```

Animations must never communicate essential information alone.

---

# 111. MARKETING SITE

Keep the existing marketing site.

Do not destroy its 3D visual experience.

Integrate the real application into it.

Buttons:

```text
Explore NEXUS
Sign In
Request Access
Open Platform
```

Once authenticated, users enter:

```text
/app
```

---

# 112. MARKETING CLAIMS

Do not make unsupported claims.

Remove or clearly treat as illustrative:

* “50k+ assets / deployment”
* “<8s signal latency”
* “98.7% operational”
* “24/7 operational context”

unless those values later come from real measured evidence.

The website can use fictional demo content in artistic visualizations, but product claims must be truthful.

---

# 113. WHAT MVP DOES NOT INCLUDE

Explicitly out of scope:

### Infrastructure / integrations

* live telemetry
* SCADA
* IoT ingestion
* smart sensors
* device gateways
* digital twins
* satellite imagery processing
* drone processing
* GIS data synchronization
* OGC service federation
* ArcGIS integration

### AI

* predictive maintenance
* anomaly prediction
* AI copilots
* LLM assistant
* automated diagnosis
* computer vision
* automatic defect recognition

### Field service

* route optimization
* dispatch optimization
* workforce scheduling
* technician utilization
* timesheets
* labor costing
* inventory
* spare parts
* procurement
* invoicing
* customer billing

### Commercial

* payments
* subscriptions
* billing portal
* advanced pricing engine

### Enterprise

* SAML
* SCIM
* custom RBAC
* enterprise hierarchy
* multi-region residency
* private networking

### Mobile

* native iOS
* native Android

### Analytics

* advanced BI
* predictive analytics
* benchmarking between organizations

Do not allow these features to creep into the MVP.

---

# 114. MOBILE APP DECISION

## Final decision

### No native mobile app in MVP.

### Yes to a mobile-first PWA.

Reasons:

* one codebase
* immediate distribution
* no app-store dependency
* sufficient for the required inspection workflow
* supports offline capability
* lower development and deployment complexity

A native application should only be introduced later if real customers demonstrate requirements that browsers cannot reliably satisfy, such as:

* prolonged offline operation
* background location
* advanced hardware access
* device-level integrations
* stronger background sync requirements

Do not build native applications merely because this is a field product.

---

# 115. 3D PRODUCT DECISION

### Marketing:

3D remains a first-class visual experience.

### Product:

2D spatial operations first.

### Future:

Optional 3D site visualization if customers demonstrate genuine use.

Do not use 3D as a substitute for product functionality.

---

# 116. NO TELEMETRY MVP

The marketing narrative may mention “signals”.

The MVP does not implement live telemetry.

Instead, “signal” at MVP means:

* inspection observation
* finding
* corrective action
* evidence
* activity

A future telemetry event can later become another source of operational signals.

---

# 117. NO PREDICTIVE MAINTENANCE MVP

Do not pretend to provide prediction.

The foundation for future prediction is:

* asset history
* inspection history
* condition
* findings
* corrective actions
* evidence
* timestamps

This historical foundation is valuable by itself.

---

# 118. PRODUCT METRICS

Track these internally.

## Activation

* organization created
* first site created
* first asset created/imported
* first inspection template created
* first inspection completed

## Operational usage

* inspections due
* inspections completed
* inspection completion rate
* overdue inspections
* findings created
* corrective actions created
* corrective actions completed
* corrective actions verified

## Evidence quality

* inspections with evidence
* findings with evidence
* corrective actions with closure evidence

## Mobile/offline

* offline inspection sessions
* sync success rate
* sync failure rate
* average time to sync after reconnect
* failed attachment uploads

These are measurement definitions, not claims of successful market performance.

---

# 119. SUCCESS CRITERIA FOR MVP

The MVP should demonstrate that a real operator can:

1. create an organization
2. create sites
3. import assets
4. define an inspection template
5. create recurring inspection plans
6. assign field staff
7. perform inspection on desktop/mobile
8. continue inspection without connectivity
9. capture photos
10. create findings
11. create corrective actions
12. complete corrective actions
13. verify closure
14. view full history
15. view everything spatially
16. generate an inspection report
17. operate safely across organizations

This is the actual MVP.

---

# 120. NON-FUNCTIONAL REQUIREMENTS

## Performance

Target:

### API

* normal CRUD p95 under 400ms under expected MVP load
* complex spatial query p95 under 700ms
* error rate below 1% in normal conditions

### Frontend

* fast first render
* route transitions feel immediate
* no blocking 3D assets in application pages
* map initialized lazily where useful

### Field mode

* cached inspection opens without network
* offline input response should feel local
* sync should begin promptly after reconnect

Targets are engineering baselines and should be measured rather than assumed.

---

# 121. SCALABILITY

MVP target:

* hundreds of organizations
* thousands of users
* approximately 10k assets per organization
* hundreds of sites per organization
* large inspection histories

Architecture should permit later scaling beyond this.

Do not pre-build distributed sharding.

---

# 122. RELIABILITY

Implement:

* automated DB backups
* migration safety
* retryable jobs
* idempotent operations
* graceful failure
* evidence upload retry
* offline sync recovery
* notification retry
* job dead-letter handling

---

# 123. OBSERVABILITY

Use structured logs.

Log:

* request ID
* operation
* organization ID
* user ID where appropriate
* latency
* status
* job ID where applicable

Never log:

* passwords
* session secrets
* API keys
* raw signed URLs
* sensitive uploaded file contents

---

# 124. DISTRIBUTED TRACING

Use OpenTelemetry where practical.

OpenTelemetry JavaScript provides stable tracing/metrics support for Node.js, while browser instrumentation remains more experimental. Therefore prioritize backend observability first.

At minimum instrument:

* API requests
* DB calls where meaningful
* queue jobs
* imports
* report generation
* notification delivery
* offline-sync endpoints

---

# 125. ERROR MONITORING

Use an error-monitoring platform such as Sentry or an equivalent.

Track:

* unhandled errors
* frontend exceptions
* API 5xx
* worker failures
* sync failures
* upload failures

Do not rely solely on console logging.

---

# 126. RATE LIMITING

Rate-limit:

* login
* password reset
* invitations
* uploads
* report generation
* imports
* mutation-heavy endpoints

Normal authenticated CRUD must not become unusably restrictive.

---

# 127. DATABASE BACKUPS

Production must have:

* automated backups
* backup retention
* tested restore procedure

A backup that has never been restored is not considered verified.

Document the restore procedure.

---

# 128. DEPLOYMENT

Use a simple production topology:

```text
Internet
   ↓
Next.js Web
   ↓
NestJS API
   ↓
PostgreSQL + PostGIS

NestJS API
   ↓
Redis
   ↓
Worker

API
   ↓
S3-compatible Object Storage

API / Worker
   ↓
Email Provider

All services
   ↓
Observability
```

Avoid Kubernetes.

Avoid service meshes.

Avoid microservice infrastructure.

---

# 129. LOCAL DEVELOPMENT

Provide:

```text
docker compose up
```

with:

* PostgreSQL + PostGIS
* Redis
* MinIO
* mail catcher if useful

Then:

```text
pnpm install
pnpm dev
```

should bring up:

* web
* API
* worker

Document all commands.

---

# 130. MONOREPO

Use:

```text
pnpm
Turborepo
```

Suggested structure:

```text
/apps
  /web
  /api
  /worker

/packages
  /contracts
  /ui
  /database
  /domain
  /validation
  /storage
  /maps
  /auth
  /offline
  /config
```

Do not create an unnecessary package for every abstraction.

---

# 131. API CONTRACT

OpenAPI must represent the actual API.

The contract should define:

* requests
* responses
* errors
* pagination
* filters
* authentication
* role requirements

Frontend types should derive from or remain synchronized with the actual API contract.

Do not maintain divergent hand-written frontend/backend models.

---

# 132. PAGINATION

Use cursor pagination for large collections where appropriate.

Use offset pagination only for small/admin-facing lists where simpler behavior is acceptable.

Do not return thousands of records by default.

---

# 133. FILTERING

Support server-side filtering for:

* organization
* site
* asset type
* status
* inspection due
* finding severity
* finding state
* assigned technician
* dates

---

# 134. SORTING

Allow predictable sorting:

* created date
* due date
* severity
* asset identifier
* site name
* updated date

Validate sort fields against an allowlist.

Do not accept arbitrary SQL order expressions.

---

# 135. DATABASE CONSTRAINTS

Enforce important invariants at the database level where practical.

Examples:

* unique organization slug
* unique organization-scoped asset identifier
* valid foreign keys
* no invalid ownership
* valid enum/state values
* unique idempotency key
* unique membership

Do not rely solely on TypeScript validation.

---

# 136. BUSINESS RULES

## Site archive

Cannot create new inspection runs for an archived site.

Existing historical inspections remain visible.

---

## Asset archive

Cannot create new inspections for archived assets.

Historical records remain.

---

## Submitted inspection

Cannot be edited directly.

Corrections require amendment metadata.

---

## Finding closure

Cannot close a finding with unresolved mandatory corrective action.

---

## Critical finding

Critical findings require verification before closure.

---

## Corrective action

Only authorized users can verify an action.

Technician completion is different from supervisor verification.

---

## Inspection submission

Required checklist responses must exist.

---

## Template version

Published template versions are immutable.

---

# 137. EDGE CASES

Explicitly handle:

* duplicate asset identifiers
* assets without coordinates
* sites with no assets
* sites with many assets
* archived asset with open finding
* archived site with open action
* technician deactivated while holding assigned work
* deleted invitation
* duplicate invitation
* inspection assigned to inactive technician
* inspection started on two devices
* offline inspection submitted after plan was changed
* template version replaced while inspection is offline
* attachment upload interrupted
* sync partially succeeds
* same command submitted multiple times
* client clock is incorrect
* device goes offline during submission
* evidence exists but file upload failed
* finding resolved without corrective action
* finding dismissed
* supervisor unavailable
* due date timezone mismatch
* recurring schedule skips due to inactivity
* imported asset refers to unknown site
* malformed CSV
* duplicate CSV row
* CSV with 100k+ records
* map viewport returning too many features
* user removed from organization while using app
* session expires while offline
* organization deleted with historical data

Define explicit behavior for each.

---

# 138. DATE / RECURRENCE RULES

Recurring inspections are generated relative to organization timezone.

Store canonical timestamps in UTC.

Display using organization/user timezone.

Avoid naïve local-date arithmetic.

For monthly recurrence:

If an organization chooses the 31st and the month has no 31st:

Use the last valid day of the month.

Document this rule.

---

# 139. INSPECTION DEADLINES

An inspection may have:

* scheduledFor
* dueAt

A run becomes:

```text
OVERDUE
```

when `now > dueAt` and it is not submitted.

Do not change historical inspection status simply because a new due date exists.

---

# 140. ACTION DEADLINES

Corrective action becomes overdue when:

```text
now > dueAt
```

and status is not terminal.

Terminal states:

```text
VERIFIED
CANCELLED
```

---

# 141. DATA DELETION

Do not immediately hard-delete historical operational records through the normal product UI.

Use archive/deactivate semantics.

Permanent deletion can be an organization-level administrative workflow later.

---

# 142. API SECURITY TESTING

Explicitly test:

### User A organization A

cannot:

* fetch organization B sites
* fetch organization B assets
* fetch organization B findings
* fetch organization B inspections
* download organization B evidence
* submit commands against organization B
* access organization B reports

Also test role restrictions.

---

# 143. TESTING STRATEGY

Use:

### Unit tests

For:

* state machines
* recurrence
* authorization
* validation
* domain rules
* CSV parsers
* sync logic
* idempotency

### Integration tests

For:

* database
* PostGIS
* API
* auth
* tenant isolation
* uploads
* queue jobs

### End-to-end

Use Playwright.

Playwright supports Chromium, Firefox and WebKit plus mobile/tablet emulation, making it appropriate for the web/PWA flows.

---

# 144. REQUIRED END-TO-END TESTS

At minimum:

## Auth

* signup
* verification
* login
* logout
* password reset

## Organization

* create org
* invite member
* assign role
* revoke member

## Assets

* create site
* create asset
* import assets
* archive asset

## Inspection

* create template
* publish version
* create plan
* assign inspection
* execute inspection
* submit inspection

## Findings

* create finding
* assign action
* complete action
* verify action
* close finding

## Offline

* open assigned inspection
* disable network
* complete inspection
* create evidence
* re-enable network
* sync
* verify server state

## Security

* cross-tenant attacks
* unauthorized role access
* attachment authorization

---

# 145. OFFLINE E2E TEST

This deserves special attention.

Build an automated browser test that:

1. logs in
2. downloads/opens a field inspection
3. goes offline
4. completes checklist
5. captures test evidence
6. submits locally
7. closes/reloads the page where safe
8. restores network
9. waits for synchronization
10. verifies server-side state

This test must pass before MVP release.

---

# 146. LOAD TESTING

Create synthetic data for:

* 250 sites
* 10,000 assets
* large inspection history
* thousands of findings
* thousands of corrective actions

Measure:

* map queries
* asset lists
* search
* dashboard
* inspection retrieval
* reporting

Do not optimize blindly.

Measure first.

---

# 147. IMPORT LOAD TEST

Test:

* 1,000 rows
* 10,000 rows
* 100,000 rows

The application should process large imports asynchronously rather than blocking the HTTP request.

---

# 148. REPORT GENERATION

Report generation must not block API workers for large files.

Use the worker.

Store generated report objects in object storage.

Report metadata records:

* status
* requestedBy
* createdAt
* completedAt
* storageKey
* error state

---

# 149. TECHNICAL ADRs

Create ADRs for:

```text
ADR-0001 Product boundary: inspection-to-action evidence platform
ADR-0002 Modular monolith architecture
ADR-0003 PostgreSQL + PostGIS
ADR-0004 Drizzle ORM
ADR-0005 MapLibre + provider abstraction
ADR-0006 MapTiler initial map provider
ADR-0007 PWA instead of native mobile app
ADR-0008 Offline sync command model
ADR-0009 Better Auth / authentication strategy
ADR-0010 S3-compatible object storage
ADR-0011 Background jobs with BullMQ + Redis
ADR-0012 UUIDv7 identifiers
ADR-0013 Inspection template versioning
ADR-0014 Immutable submitted inspection records
ADR-0015 3D outside operational MVP
```

Create additional ADRs only where needed.

---

# 150. ADR RULE

An ADR should explain:

* context
* problem
* considered alternatives
* decision
* consequences
* reversal conditions

Do not write ADRs that simply restate the implementation.

---

# 151. DOCUMENTATION STRUCTURE

Create:

```text
docs/
  product/
    executive-summary.md
    problem.md
    target-users.md
    product-thesis.md
    value-proposition.md
    competitive-context.md
    mvp.md
    out-of-scope.md
    user-journeys.md
    requirements.md
    domain-rules.md
    edge-cases.md
    mobile-strategy.md
    product-metrics.md
    validation-assumptions.md

  architecture/
    overview.md
    technology-stack.md
    system-components.md
    data-model.md
    geospatial.md
    offline-sync.md
    api.md
    auth.md
    security.md
    storage.md
    background-jobs.md
    observability.md
    deployment.md

  roadmap/
    roadmap.md
    phase-0.md
    phase-1.md
    phase-2.md
    phase-3.md
    phase-4.md
    phase-5.md

  decisions/
    README.md
```

---

# 152. PRODUCT VALIDATION ASSUMPTIONS

The architecture is locked.

The commercial hypothesis is not magically validated.

Explicit remaining uncertainties:

### U1

Will small/mid-size distributed power operators pay for an inspection-to-action platform rather than continuing with spreadsheets/WhatsApp or using a broader FSM?

### U2

Is inspection/evidence the pain that causes enough recurring urgency to justify a dedicated product?

### U3

Is the strongest initial market Africa specifically, or should the first paying ICP be global?

### U4

How much offline functionality is genuinely necessary in customers' real environments?

### U5

What report/evidence format do customers actually need for clients, regulators, owners or internal QA?

### U6

Will existing FSM platforms be “good enough” for target users?

These are **commercial/product validation uncertainties**.

They do not require architectural paralysis.

Build the MVP around them.

---

# 153. PRODUCT VALIDATION PRINCIPLE

Do not create fake customer evidence.

Do not claim:

* customer adoption
* market share
* cost savings
* inspection improvement
* reduced downtime
* increased compliance
* ROI

until real data exists.

The seeded demo is for demonstration only.

---

# 154. BUSINESS MODEL HYPOTHESIS

The product is expected to become a B2B SaaS.

Initial commercial hypothesis:

* organization-based subscription
* pricing primarily associated with active sites/assets rather than per-technician seat
* generous field user access to avoid discouraging adoption
* higher tiers based on operational scale, reports, retention and integrations

Do not implement billing in MVP.

Do not build Stripe.

Do not build subscription management.

The pricing model is a commercial hypothesis to validate later.

---

# 155. DISTRIBUTION HYPOTHESIS

The initial go-to-market hypothesis is:

* direct outreach to distributed power O&M companies
* demonstrations using realistic operational scenarios
* pilot with one organization
* import existing asset register
* configure real inspection templates
* measure inspection/completion workflow
* convert pilot into recurring use

The product must make a pilot easy.

This is more important than a sophisticated marketing funnel.

---

# 156. DEMO DATA

Create a fictional distributed-power organization.

Example:

```text
NEXUS Demo Energy Operations
```

Include:

* 20 sites
* multiple regions
* generators
* solar inverters
* batteries
* ATS systems
* meters
* recurring inspection plans
* active inspections
* overdue inspections
* findings
* corrective actions
* evidence
* historical activity

Use entirely fictional data.

---

# 157. DEMO PERSONAS

Provide seeded users:

```text
owner@nexus.demo
ops@nexus.demo
supervisor@nexus.demo
technician@nexus.demo
viewer@nexus.demo
```

Use a documented development-only password strategy.

Never include production credentials.

---

# 158. DEMO EXPERIENCE

A new user should be able to understand the system quickly.

The dashboard should immediately show:

* sites
* assets
* due inspections
* overdue inspections
* findings
* actions
* map

The demo must use the actual backend.

No fake front-end-only dashboard.

---

# 159. PRODUCT TRUTH RULE

Every value in the authenticated application must come from actual data.

Do NOT hardcode:

```text
1,284 assets
17 attention
98.7% operational
```

unless those values are produced by seeded data and actual calculations.

---

# 160. ROADMAP

## Phase 0 — Foundation

Deliver:

* monorepo
* development environment
* database
* PostGIS
* authentication
* organization model
* design system
* CI
* documentation skeleton
* ADR framework

### Definition of Done

* local setup works from documentation
* database migrations work
* auth works
* tests run
* CI passes

---

# 161. PHASE 1 — SITES AND ASSETS

Deliver:

* organizations
* memberships
* sites
* asset types
* assets
* relationships
* map foundation
* CSV import
* basic activity

### Definition of Done

A user can import a real-looking asset register and view the assets spatially.

---

# 162. PHASE 2 — INSPECTIONS

Deliver:

* templates
* template versions
* plans
* runs
* assignments
* checklist execution
* due/overdue logic
* inspection dashboard

### Definition of Done

An operations manager can configure a recurring inspection and a technician can complete it end-to-end.

---

# 163. PHASE 3 — FINDINGS AND ACTIONS

Deliver:

* findings
* severities
* corrective actions
* assignment
* due dates
* completion
* verification
* activity history

### Definition of Done

A failed inspection item can become a finding, become an action, get completed and be verified by another authorized user.

---

# 164. PHASE 4 — FIELD MODE / OFFLINE

Deliver:

* PWA
* service worker
* IndexedDB
* offline inspection cache
* offline checklist
* offline evidence
* sync queue
* retry
* idempotency
* sync-state UI

### Definition of Done

A technician can complete and submit an inspection without network access and the complete state safely reaches the backend after reconnection.

---

# 165. PHASE 5 — REPORTING / HARDENING

Deliver:

* PDF reports
* CSV export
* dashboard refinement
* accessibility
* security testing
* performance testing
* observability
* backups
* deployment
* seeded demo

### Definition of Done

The system is deployable and usable as an actual MVP by a real organization.

---

# 166. PHASE 6 — RELEASE CANDIDATE

Perform:

* complete E2E
* security
* tenant-isolation
* offline
* load
* mobile-browser
* upload
* report
* database-restore testing

Fix all blocking issues.

---

# 167. NO PHASE SKIPPING

Do not skip directly to visual polish while domain foundations are unstable.

Do not build advanced UI for nonexistent backend capabilities.

Every frontend capability must connect to the actual backend.

---

# 168. NO FAKE BACKEND

This is a strict requirement.

No:

* local arrays as production data
* fake API responses
* hardcoded dashboard numbers
* simulated state transitions
* mocked data in the actual product
* local-only work orders pretending to persist
* client-side authorization

Mocks may exist only in isolated automated tests.

---

# 169. NO AI MVP

Do not use an LLM simply because the marketing site mentions intelligence.

The MVP must work without AI.

AI may later assist with:

* inspection summaries
* anomaly explanation
* finding categorization
* report drafting

but those are future capabilities.

---

# 170. NO PREDICTIVE CLAIMS

Do not label simple heuristics:

* AI risk
* predictive failure
* machine intelligence
* anomaly detection

unless those systems genuinely exist.

---

# 171. DESIGN IMPLEMENTATION PRINCIPLE

The current marketing site establishes the brand.

The product should feel like entering the machine behind that visual story.

Marketing:

```text
cinematic
spatial
immersive
3D
dramatic
```

Product:

```text
precise
spatial
operational
fast
mobile
evidence-driven
```

They should feel like the same product.

---

# 172. ANIMATION IN PRODUCT

Use Framer Motion selectively.

Appropriate:

* panel transitions
* status changes
* route transitions
* inspection progression
* finding creation feedback
* map side-panel animation
* modal/sheet transitions
* upload progress
* sync status

Do not animate every table row.

Do not create heavy 3D scenes in the field interface.

---

# 173. DESIGN QUALITY BAR

This is not a CRUD dashboard.

The product should look capable of becoming a real commercial application.

But:

**functionality outranks visual effects.**

The best NEXUS screen should be:

* elegant
* spatial
* readable
* operationally useful

rather than merely beautiful.

---

# 174. SECURITY REVIEW CHECKLIST

Before MVP approval verify:

* tenant boundaries
* role access
* session security
* upload authorization
* signed URL expiration
* SQL injection prevention
* XSS protections
* CSRF strategy
* rate limiting
* brute-force protection
* secrets management
* secure headers
* no sensitive logs
* backup strategy
* restore test

---

# 175. PRIVACY PRINCIPLES

Collect the minimum personal information necessary.

Do not implement:

* continuous technician tracking
* surveillance
* background location
* hidden telemetry

Location capture in MVP is:

* optional
* contextual
* tied to inspection/evidence when explicitly enabled

Do not store precise location continuously.

---

# 176. TECHNICIAN LOCATION

For an inspection:

The application may capture:

* start location
* optional evidence location
* optional submit location

It must NOT continuously track the technician throughout the day.

---

# 177. FUTURE INTEGRATION MODEL

Future adapters may include:

```text
IoT
SCADA
ERP
GIS
CRM
Accounting
Identity/SSO
Messaging
Telemetry
```

Do not implement them now.

The domain layer should not assume NEXUS is the only system in the customer's architecture.

---

# 178. EXTENSION BOUNDARIES

Keep these interfaces clear:

```text
MapProvider
GeocodingProvider
StorageProvider
EmailProvider
NotificationProvider
AuthProvider
ExternalIntegration
```

Do not hardwire every external service into business logic.

---

# 179. TECHNOLOGY LOCK SUMMARY

Use:

```text
Frontend
  Next.js 16.x
  React 19.x
  TypeScript
  Tailwind CSS 4.x
  Framer Motion

Backend
  NestJS 11
  Fastify

Database
  PostgreSQL 18
  PostGIS 3.6.x

ORM
  Drizzle ORM

Authentication
  Better Auth stable release

Maps
  MapLibre GL JS
  MapTiler Cloud initially

Offline
  PWA
  Serwist
  Dexie / IndexedDB

Background processing
  BullMQ
  Redis

Storage
  S3-compatible object storage

Testing
  Vitest or equivalent unit/integration framework
  Playwright E2E

Observability
  OpenTelemetry
  Sentry or equivalent

Architecture
  Modular monolith
  Worker
```

Current documentation supports the major technical choices above: Next.js 16.3, React 19.3, Tailwind 4.x, PostgreSQL 18, MapLibre 6, PostGIS 3.6 and current TypeScript-native authentication options are all available in the current ecosystem.

---

# 180. WHY DRIZZLE IS LOCKED INSTEAD OF PRISMA

Do not reopen this unless implementation proves it impossible.

The reason is not familiarity.

Spatial data is a first-class domain requirement.

Drizzle has direct PostGIS geometry/index support. Prisma's documentation still describes PostGIS as requiring unsupported fields and raw SQL workarounds.

Therefore:

**Drizzle + PostGIS is the default data-access architecture.**

---

# 181. WHY POSTGRESQL 18

Use PostgreSQL 18 rather than an older major version.

Important advantages include:

* mature relational system
* PostGIS integration
* UUIDv7
* current supported line
* strong indexing/query capabilities
* reliable transaction semantics

PostgreSQL 18 provides native UUIDv7 generation.

---

# 182. WHY MAPLIBRE

Map rendering must not lock domain logic to a proprietary SDK.

MapLibre provides:

* WebGL rendering
* vector maps
* styling
* interactivity
* current browser support
* future mobile/native ecosystem through MapLibre Native

MapTiler is only the initial data/geocoding provider.

The provider abstraction must make replacement practical.

---

# 183. WHY PWA INSTEAD OF NATIVE

NEXUS needs mobile because field execution is central.

But native mobile is not yet justified.

Therefore:

```text
Mobile requirement = YES
Native app = NO
PWA = YES
Offline inspection = YES
Offline administration = NO
```

This is the locked decision.

---

# 184. PRODUCT RISKS

## R1 — Existing FSM products may already be good enough

Mitigation:

Keep MVP narrow.

Measure whether inspection/evidence workflow provides enough specific value.

---

## R2 — ICP too narrow

Mitigation:

Keep domain model industry-neutral.

Start with distributed power.

Expand only after validation.

---

## R3 — Offline complexity

Mitigation:

Offline only for field inspection.

Single active executor.

Command-based sync.

No CRDT.

---

## R4 — Scope creep

Mitigation:

Reject CRM, billing, scheduling, inventory, telemetry and AI until after MVP.

---

## R5 — 3D distraction

Mitigation:

Keep 3D primarily in marketing.

---

## R6 — Fake sophistication

Mitigation:

Prefer actual evidence chain over impressive terminology.

---

# 185. PRODUCT ASSUMPTION HIERARCHY

### High-confidence engineering decisions

* Postgres/PostGIS
* spatial assets
* inspection records
* evidence
* backend authorization
* offline field requirement
* mobile-first field UX

### Medium-confidence product decisions

* distributed power as first ICP
* inspection-to-action as initial wedge
* evidence/verification as primary differentiator

### Low-confidence commercial assumptions

* willingness to pay
* exact pricing
* geographic expansion strategy
* competitor switching behavior
* customer acquisition channel

Do not confuse these.

---

# 186. MVP ACCEPTANCE TEST

The system passes MVP acceptance only when an evaluator can perform:

```text
1. Sign up
2. Create organization
3. Create/import site
4. Create/import assets
5. Create inspection template
6. Publish template
7. Create inspection plan
8. Assign inspection
9. Open as technician
10. Complete inspection online
11. Create finding
12. Create corrective action
13. Capture photo
14. Submit
15. Verify action
16. Generate report
17. View history
18. Repeat entire inspection while offline
19. Reconnect and sync
20. Verify server state
21. Attempt cross-tenant attack
22. Verify attack is rejected
```

All must pass.

---

# 187. RELEASE GATE

Do not call MVP complete until:

### Build

* production build passes

### Types

* typecheck passes

### Lint

* lint passes

### Tests

* unit passes
* integration passes
* E2E passes

### Security

* tenant isolation passes
* role authorization passes
* attachment access passes

### Offline

* offline E2E passes

### Database

* migrations pass
* seed works
* backup/restore verified

### Deployment

* production deployment succeeds
* environment configuration documented

### Observability

* errors visible
* logs structured
* health checks implemented

---

# 188. HEALTH ENDPOINTS

Provide:

```text
GET /health
GET /ready
```

`/health` means process alive.

`/ready` means required infrastructure is available.

Do not make health checks perform expensive application logic.

---

# 189. GRACEFUL SHUTDOWN

API and worker processes must support graceful shutdown.

Do not terminate jobs halfway without cleanup.

Worker must safely release/requeue jobs on shutdown.

---

# 190. MIGRATIONS

Migrations are versioned.

Never modify production schema manually.

Every schema change goes through migration.

PostGIS extension creation belongs in migration infrastructure.

---

# 191. ENVIRONMENT MANAGEMENT

Provide:

```text
.env.example
```

Document:

```text
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
BETTER_AUTH_SECRET
BETTER_AUTH_URL
MAPTILER_API_KEY
EMAIL_PROVIDER_KEY
SENTRY_DSN
```

Actual names may be refined.

Never commit secrets.

---

# 192. SECRETS

Use environment/configuration systems.

Never:

* hardcode keys
* log secrets
* commit `.env`
* expose server credentials to browser

Frontend only receives public-safe configuration.

---

# 193. DATA EXPORT

At minimum support:

* asset CSV export
* findings CSV export
* inspection CSV export

PDF inspection report is also required.

---

# 194. FUTURE API CONSUMERS

Design API so that future consumers could include:

* native mobile apps
* partner integrations
* customer portals
* external GIS
* telemetry systems

But do not build SDKs in MVP.

---

# 195. FINAL PRODUCT LANGUAGE

Use the following language consistently.

### Preferred

* asset
* site
* inspection
* finding
* corrective action
* evidence
* verification
* condition
* operational history
* inspection coverage

### Avoid overusing

* intelligence
* AI
* predictive
* autonomous
* digital twin
* real-time

unless technically true.

---

# 196. FINAL UX LANGUAGE

Examples:

Instead of:

> “Your infrastructure is intelligently optimized.”

Use:

> “17 inspections are overdue.”

Instead of:

> “AI detected risk.”

Use:

> “High-severity finding.”

Instead of:

> “Predictive maintenance recommended.”

Use:

> “Inspection found abnormal battery temperature.”

NEXUS should communicate evidence, not hype.

---

# 197. FINAL PRODUCT COPY

Core product statement:

> **Know what was inspected. Know what was found. Know what was fixed. Prove it.**

Supporting statement:

> **NEXUS connects physical assets, field inspections, findings, corrective actions and evidence into one spatial operational record.**

Use this language in the authenticated application where appropriate.

---

# 198. FINAL ARCHITECTURAL PRINCIPLE

The system should be:

```text
spatial
modular
auditable
offline-capable
evidence-driven
tenant-safe
API-first
mobile-first for field execution
```

It should NOT be:

```text
microservice-heavy
AI-dependent
3D-dependent
telemetry-dependent
billing-heavy
ERP-like
over-configurable
over-engineered
```

---

# 199. WHAT SHOULD EXIST AFTER IMPLEMENTATION

The repository must contain a real working product with:

```text
Authentication
Organizations
Roles
Sites
Assets
Asset hierarchy
Map
CSV import
Inspection templates
Template versions
Inspection plans
Inspection runs
Offline field mode
Findings
Corrective actions
Evidence
Verification
Reports
Dashboard
Audit history
Notifications
Background jobs
Observability
Tests
Deployment configuration
Documentation
```

Everything above must be real.

---

# 200. FINAL DEFINITION OF DONE

NEXUS MVP is complete when:

## Product

The inspection-to-action workflow is fully implemented.

## Backend

All core domain behavior is server-authoritative.

## Database

PostgreSQL/PostGIS correctly stores and queries operational and spatial data.

## Frontend

The application is production-quality and responsive.

## Mobile

The PWA provides usable offline inspection workflows.

## Evidence

Photos and evidence survive interrupted connectivity and sync correctly.

## Security

Cross-tenant access is prevented.

## Auditability

Submitted inspections and important operational events are traceable.

## Reporting

The system can produce a real inspection report.

## Testing

Critical product flows and security boundaries have automated coverage.

## Documentation

Another engineer can understand and run the project without rediscovering the architecture.

## Truthfulness

No fake product functionality remains.

No marketing metric is masquerading as operational data.

No unsupported product claim is embedded in the authenticated experience.

---

# 201. FINAL IMPLEMENTATION DIRECTIVE

This document is the product and architecture source of truth.

Do NOT:

* redesign the product strategy
* broaden the MVP
* turn it into a general FSM
* turn it into a CMMS
* add an AI layer
* add telemetry because it sounds impressive
* add native mobile apps
* introduce microservices unnecessarily
* replace PostGIS with generic coordinates
* replace the inspection workflow with generic tasks
* hardcode fake operational data
* stop after scaffolding
* stop after building the frontend
* stop after building APIs
* stop after producing documentation

The required outcome is a **working full-stack NEXUS MVP**.

The implementation must proceed until the complete MVP Definition of Done is satisfied.

When implementation is complete, provide a final engineering report containing:

1. implemented capabilities
2. architecture actually used
3. database/schema summary
4. API summary
5. offline-sync summary
6. security controls
7. tests completed
8. deployment status
9. known defects
10. explicitly deferred features

Do not report something as implemented until it actually works end-to-end.

The repository and working application are the primary deliverables.

**Build NEXUS.**




# NEXUS — PHASE 0

## Project Initialization, Engineering Documentation, Architecture Control & Development Preparation

You are receiving this prompt together with the **complete NEXUS Product Specification and Architecture Directive**.

Do NOT begin full product implementation yet.

Your responsibility in this phase is to prepare the repository so that the product can subsequently be developed **phase by phase, safely, efficiently, and without rediscovering product decisions or architecture later**.

This is the project's **foundation/setup phase**.

The outcome of this task is a repository that another engineer—or you in a later session—can use as a reliable development source of truth.

---

# 1. PRIMARY OBJECTIVE

Transform the NEXUS product specification into a complete, structured engineering workspace.

You must:

1. inspect the existing repository
2. inspect the existing NEXUS website implementation
3. preserve useful existing work
4. establish the final repository architecture
5. install and configure the necessary development/design skills
6. create the complete `/docs` documentation system
7. create `AGENTS.md`
8. create `CHANGELOG.md`
9. create `roadmap.md`
10. create all relevant ADRs
11. break the product into independently deliverable phases
12. define Definition of Done for every phase
13. create requirement traceability
14. create technical decision records
15. create development rules
16. define testing strategy
17. define local development workflow
18. define CI/CD foundations
19. define coding conventions
20. prepare the repository for Phase 1 implementation

Do NOT implement the actual NEXUS product features yet, except for the minimal repository/configuration changes required to prepare the project.

---

# 2. READ THE PRODUCT SPECIFICATION FIRST

Before modifying anything:

Read the complete NEXUS product specification supplied with this prompt.

Treat that document as the authoritative product source.

Extract and formalize:

* product thesis
* target ICP
* users
* domain model
* MVP scope
* out-of-scope items
* user journeys
* functional requirements
* non-functional requirements
* domain rules
* edge cases
* mobile decision
* offline strategy
* architecture
* stack
* APIs
* security
* observability
* deployment
* roadmap
* MVP Definition of Done

Do not reinterpret major product decisions.

Where implementation details were intentionally left flexible, document the final engineering decision through ADRs.

---

# 3. INSPECT THE CURRENT REPOSITORY

Before creating anything, inspect:

* existing package structure
* existing Next.js application
* existing routes
* existing components
* existing animation system
* existing 3D implementation
* Tailwind configuration
* TypeScript configuration
* package manager
* linting
* formatting
* testing
* deployment configuration
* environment files
* existing documentation
* Git configuration
* CI configuration

Determine whether the current codebase already has a good foundation.

Do NOT rewrite the existing marketing website merely for organizational aesthetics.

Preserve valuable work.

Document anything that must be migrated later.

---

# 4. INSPECT THE CURRENT NEXUS WEBSITE

Inspect:

https://nexus-phi-lyart-48.vercel.app/

Understand:

* visual language
* typography
* colors
* spacing
* navigation
* motion
* 3D
* components
* responsive behavior
* marketing information architecture

Create a short documentation section explaining:

### What is being preserved

### What will remain marketing-only

### What will eventually connect to the real product

### What must not leak into the operational application's architecture

Do NOT duplicate the marketing site inside the product architecture.

---

# 5. INSTALL / CONFIGURE REQUIRED DESIGN SKILLS

The project must use:

## UI/UX Pro Max

Install and configure:

https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Follow the repository's current installation instructions.

Verify that the agent can actually use the installed skill afterward.

Document:

```text
docs/development/skills.md
```

containing:

* installed skills
* purpose
* installation method
* how agents should invoke/use them
* when they are mandatory

---

# 6. 21ST.DEV

Use:

https://21st.dev/

as a UI/component research source during implementation.

Do not blindly copy components.

Do not introduce unnecessary dependencies simply because a component exists there.

Document this under:

```text
docs/development/design-resources.md
```

Record:

* 21st.dev
* UI/UX Pro Max
* existing NEXUS design system
* any additional approved design references

---

# 7. IDENTIFY OTHER NECESSARY DEVELOPMENT SKILLS

Before writing the project documentation, identify any additional skills/resources that are genuinely useful for NEXUS.

Consider categories such as:

* Next.js architecture
* advanced React
* accessibility
* PWA
* offline-first web applications
* IndexedDB/Dexie
* MapLibre
* PostGIS
* PostgreSQL
* NestJS
* REST/OpenAPI
* security
* Playwright
* testing
* observability
* performance
* Docker
* CI/CD

Do NOT blindly install dozens of skills.

Only install skills that materially improve the project.

Document the chosen skills and why they are relevant.

---

# 8. CREATE ROOT ENGINEERING GOVERNANCE FILES

Create/update these root-level files.

```text
AGENTS.md
CHANGELOG.md
README.md
CONTRIBUTING.md
SECURITY.md
```

Where an existing file already serves the purpose, improve it instead of creating duplicates.

---

# 9. AGENTS.MD

`AGENTS.md` is critical.

It must become the primary instruction manual for future coding agents working on NEXUS.

Include:

## Project identity

NEXUS product summary.

## Product principle

> Know what was inspected. Know what was found. Know what was fixed. Prove it.

## Source-of-truth hierarchy

Define precedence:

1. Product specification
2. ADRs
3. Domain rules
4. API contract
5. Roadmap
6. Existing implementation
7. Agent assumptions

Explain what happens when sources conflict.

---

## Scope discipline

Agents must not:

* expand MVP scope without changing the product specification
* introduce AI without explicit approval
* introduce telemetry without explicit scope
* add a native mobile app during MVP
* introduce microservices
* create unnecessary abstractions
* replace architectural decisions casually
* add dependencies without justification

---

## Architecture rules

Document:

* modular monolith
* PostgreSQL/PostGIS
* Drizzle
* NestJS/Fastify
* Next.js
* PWA
* Redis/BullMQ
* S3-compatible storage
* MapLibre
* API versioning
* tenant isolation

---

## Security rules

Explicitly state that:

* frontend authorization is never authoritative
* organization isolation is mandatory
* server-side validation is mandatory
* files are never directly exposed without authorization
* secrets must never be committed
* audit events are immutable

---

## Development workflow

Require agents to:

1. inspect relevant documentation
2. inspect ADRs
3. inspect roadmap phase
4. identify affected requirements
5. implement minimally
6. add/update tests
7. update docs when behavior changes
8. update CHANGELOG
9. verify Definition of Done
10. avoid unrelated refactors

---

## Database rules

Require:

* migrations
* no manual production schema edits
* transaction safety
* explicit indexes
* PostGIS-aware queries
* UTC/timestamptz
* UUIDv7

---

## API rules

Require:

* `/v1`
* validation
* authorization
* consistent error envelope
* pagination
* idempotency where necessary
* OpenAPI synchronization

---

## Offline rules

Require:

* IndexedDB/Dexie
* command-based synchronization
* idempotency
* explicit sync states
* no silent data loss
* no fake offline capability

---

# 10. CHANGELOG.MD

Initialize a professional changelog.

Use a structure such as:

```text
# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added
- Project foundation documentation
- Architecture decision records
- Development roadmap
- Agent instructions
- Engineering governance

### Changed

### Fixed

### Security

### Deprecated
```

Future agents must update this file as meaningful changes are introduced.

---

# 11. CREATE /DOCS STRUCTURE

Create the following structure:

```text
docs/
├── README.md
│
├── product/
│   ├── executive-summary.md
│   ├── problem.md
│   ├── target-users.md
│   ├── product-thesis.md
│   ├── value-proposition.md
│   ├── competitive-context.md
│   ├── scope.md
│   ├── mvp.md
│   ├── out-of-scope.md
│   ├── user-journeys.md
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   ├── domain-rules.md
│   ├── edge-cases.md
│   ├── product-metrics.md
│   ├── validation-assumptions.md
│   └── mobile-strategy.md
│
├── architecture/
│   ├── overview.md
│   ├── system-context.md
│   ├── component-architecture.md
│   ├── technology-stack.md
│   ├── data-model.md
│   ├── geospatial-architecture.md
│   ├── api-architecture.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── offline-sync.md
│   ├── storage.md
│   ├── background-jobs.md
│   ├── notifications.md
│   ├── reporting.md
│   ├── observability.md
│   ├── security.md
│   ├── deployment.md
│   └── disaster-recovery.md
│
├── api/
│   ├── README.md
│   ├── conventions.md
│   ├── errors.md
│   ├── pagination.md
│   ├── idempotency.md
│   └── authorization.md
│
├── database/
│   ├── README.md
│   ├── schema-conventions.md
│   ├── migrations.md
│   ├── indexing.md
│   └── spatial-queries.md
│
├── security/
│   ├── threat-model.md
│   ├── security-requirements.md
│   ├── file-security.md
│   ├── tenant-isolation.md
│   └── incident-response.md
│
├── development/
│   ├── setup.md
│   ├── workflow.md
│   ├── coding-standards.md
│   ├── git-workflow.md
│   ├── testing.md
│   ├── skills.md
│   ├── design-resources.md
│   ├── local-services.md
│   └── troubleshooting.md
│
├── roadmap/
│   ├── roadmap.md
│   ├── phase-0-foundation.md
│   ├── phase-1-sites-assets.md
│   ├── phase-2-inspections.md
│   ├── phase-3-findings-actions.md
│   ├── phase-4-offline-field.md
│   ├── phase-5-reporting-hardening.md
│   └── phase-6-release.md
│
├── decisions/
│   ├── README.md
│   ├── ADR-0001-product-boundary.md
│   ├── ADR-0002-modular-monolith.md
│   ├── ADR-0003-postgresql-postgis.md
│   ├── ADR-0004-drizzle.md
│   ├── ADR-0005-maplibre.md
│   ├── ADR-0006-map-provider.md
│   ├── ADR-0007-pwa-over-native.md
│   ├── ADR-0008-offline-sync-model.md
│   ├── ADR-0009-authentication.md
│   ├── ADR-0010-object-storage.md
│   ├── ADR-0011-background-jobs.md
│   ├── ADR-0012-uuidv7.md
│   ├── ADR-0013-inspection-template-versioning.md
│   ├── ADR-0014-immutable-submitted-inspections.md
│   └── ADR-0015-3d-product-boundary.md
│
└── traceability/
    ├── README.md
    ├── requirements-matrix.md
    ├── requirements-to-roadmap.md
    ├── requirements-to-tests.md
    └── definition-of-done.md
```

Adjust the structure where genuinely necessary, but do not simplify it into one giant document.

---

# 12. DOCS/README.MD

Create a documentation index.

Explain:

* where product decisions live
* where architecture decisions live
* where implementation phases live
* where APIs are specified
* where security rules live
* how agents should navigate the docs

Provide links between documents.

The docs should behave like a small internal engineering handbook.

---

# 13. PRODUCT DOCUMENTS

Populate every file in:

```text
docs/product/
```

using the final NEXUS specification.

Do NOT merely copy the original prompt verbatim.

Turn it into clean documentation.

Each document should have:

* purpose
* authoritative decisions
* assumptions where relevant
* references to other docs

---

# 14. FUNCTIONAL REQUIREMENTS

Create a complete numbered requirements catalog.

Use stable IDs.

Example:

```text
AUTH-001
AUTH-002

ORG-001
ORG-002

SITE-001
SITE-002

ASSET-001
ASSET-002

INSP-001
INSP-002

FIND-001

ACT-001

EVID-001

OFFLINE-001

MAP-001

IMPORT-001

REPORT-001

AUDIT-001
```

Every requirement should contain:

* ID
* requirement
* actor
* preconditions
* behavior
* validation
* failure behavior
* priority
* acceptance criteria

Do NOT allow later phases to implement vague features.

---

# 15. NON-FUNCTIONAL REQUIREMENTS

Assign IDs:

```text
NFR-SEC-*
NFR-PERF-*
NFR-REL-*
NFR-SCALE-*
NFR-A11Y-*
NFR-OBS-*
NFR-DATA-*
NFR-OFFLINE-*
```

Define measurable expectations wherever reasonably possible.

---

# 16. DOMAIN RULE DOCUMENT

Create a single authoritative domain-rules document.

Every domain invariant must live there.

Examples:

* site lifecycle
* asset lifecycle
* asset hierarchy
* inspection transitions
* finding transitions
* action transitions
* template immutability
* inspection immutability
* organization isolation
* evidence ownership
* assignment rules
* verification rules
* recurrence rules
* timezone rules

Future implementation decisions must refer back to this document.

---

# 17. EDGE CASE DOCUMENT

Create a structured edge-case catalogue.

Each edge case should contain:

* ID
* scenario
* expected behavior
* affected subsystem
* test requirement
* phase

Example:

```text
EDGE-INSP-001
Two devices begin the same inspection.

Expected:
Second device is rejected.
Existing active executor remains authoritative.
```

---

# 18. ARCHITECTURE DOCUMENTATION

Document the final architecture as an implementation-ready architecture.

Include diagrams using Mermaid where useful.

At minimum create:

### System context diagram

```text
User
 ↓
Web/PWA
 ↓
API
 ↓
Domain/Data
 ↓
PostgreSQL/PostGIS
```

and supporting:

```text
API → Redis/BullMQ → Worker
API → Object Storage
API → Email Provider
Web → Map Provider
```

---

# 19. COMPONENT RESPONSIBILITY MATRIX

Create:

```text
docs/architecture/component-architecture.md
```

with a table:

| Component | Responsibility | Owns State? | Depends On |
| --------- | -------------- | ----------- | ---------- |

Cover:

* Web
* API
* Worker
* PostgreSQL
* PostGIS
* Redis
* object storage
* email
* map provider
* observability

This prevents later architectural drift.

---

# 20. DATA MODEL DOCUMENT

Create conceptual and logical data-model documentation.

Include:

* entities
* fields
* relationships
* constraints
* indexes
* tenancy
* lifecycle
* archival behavior

Include an ER diagram.

---

# 21. API DOCUMENTATION

Create:

```text
docs/api/
```

Include:

* REST conventions
* resource conventions
* request validation
* authentication
* authorization
* error envelope
* pagination
* filtering
* idempotency
* versioning

Do not duplicate every endpoint in five different places.

The actual generated OpenAPI specification will later become the endpoint-level source.

---

# 22. DATABASE DOCUMENTATION

Document:

* migration strategy
* naming conventions
* indexes
* constraints
* transaction rules
* PostGIS conventions
* timestamps
* UUIDv7
* archive vs hard delete

---

# 23. SECURITY DOCUMENTATION

Create a threat model.

Use STRIDE or another structured methodology.

At minimum analyze:

* spoofing
* tampering
* repudiation
* information disclosure
* denial of service
* privilege escalation

Cover:

* browser
* API
* database
* storage
* workers
* offline client
* email links

---

# 24. TENANT ISOLATION DOCUMENT

Create a dedicated document explaining exactly how multi-tenancy works.

Include:

```text
Request
 ↓
Authentication
 ↓
Membership
 ↓
Organization context
 ↓
Authorization
 ↓
Repository/query scope
 ↓
Database
```

Document where tenant isolation is enforced.

Do not rely on developers remembering to add `organizationId`.

---

# 25. OFFLINE ARCHITECTURE DOCUMENT

Document:

* local database
* cached data
* mutation queue
* command format
* idempotency
* retry
* conflict handling
* submission
* attachment uploads
* sync states
* failure recovery

Include a sequence diagram.

---

# 26. REPORTING ARCHITECTURE

Define:

* report request
* queue
* generation
* object storage
* status
* download
* expiration/retention

Do not make PDF generation a synchronous HTTP bottleneck.

---

# 27. OBSERVABILITY DOCUMENT

Document:

* logs
* metrics
* tracing
* error monitoring
* health checks
* readiness
* alerts

Define what constitutes a production incident.

---

# 28. DEVELOPMENT WORKFLOW

Create:

```text
docs/development/workflow.md
```

Define:

### Before coding

* read AGENTS.md
* read roadmap phase
* read relevant requirements
* read relevant ADRs
* inspect existing code

### During coding

* change only required scope
* write tests
* preserve contracts
* update docs

### Before completion

* tests
* typecheck
* lint
* build
* security checks
* Definition of Done
* changelog

---

# 29. CODING STANDARDS

Document:

* naming
* imports
* file organization
* TypeScript strictness
* error handling
* async behavior
* transactions
* API conventions
* React conventions
* accessibility
* testing conventions
* comments
* TODO policy

Avoid excessive comments.

Comment non-obvious reasoning, not obvious code.

---

# 30. GIT WORKFLOW

Recommend a lightweight workflow.

Suggested:

```text
main
  ↓
feature/*
```

or equivalent.

Define:

* commit conventions
* PR expectations
* changelog updates
* migration review
* ADR requirements for architectural changes

Do NOT impose a heavyweight Git-flow model.

---

# 31. ROADMAP

Create a master:

```text
docs/roadmap/roadmap.md
```

It must clearly show:

```text
Phase 0 — Foundation
Phase 1 — Sites & Assets
Phase 2 — Inspections
Phase 3 — Findings & Actions
Phase 4 — Offline Field
Phase 5 — Reporting & Hardening
Phase 6 — Release
```

For each phase list:

* goal
* scope
* dependencies
* requirements
* deliverables
* tests
* risks
* Definition of Done

---

# 32. PHASE 0

This current task is Phase 0.

Phase 0 includes only:

* docs
* governance
* repository setup
* development environment
* architecture skeleton
* dependency setup
* CI foundation
* testing foundation
* database/bootstrap configuration where necessary
* linting
* formatting
* TypeScript
* monorepo structure
* skill installation
* seed/configuration scaffolding

Do not implement business features.

---

# 33. PHASE 1

Focus:

* authentication
* organizations
* memberships
* roles
* sites
* assets
* asset types
* hierarchy
* imports
* spatial foundation

Definition of Done must say a user can:

* create organization
* invite member
* create/import sites
* create/import assets
* see assets on map
* enforce tenant isolation

---

# 34. PHASE 2

Focus:

* inspection templates
* template versioning
* plans
* runs
* assignments
* execution
* dashboard
* due/overdue

Definition of Done must demonstrate the complete inspection lifecycle.

---

# 35. PHASE 3

Focus:

* findings
* corrective actions
* evidence
* assignment
* verification
* activity history
* notifications

Definition of Done must demonstrate:

```text
inspection
→ finding
→ action
→ evidence
→ completion
→ verification
```

---

# 36. PHASE 4

Focus:

* PWA
* IndexedDB
* offline inspection
* local evidence
* sync queue
* retries
* conflict rules

Definition of Done must include the automated offline E2E scenario.

---

# 37. PHASE 5

Focus:

* reports
* exports
* observability
* security hardening
* accessibility
* load testing
* performance
* backup/restore
* deployment hardening

---

# 38. PHASE 6

Focus:

* release candidate
* production deployment
* monitoring
* demo environment
* final docs
* release checklist

---

# 39. REQUIREMENT TRACEABILITY

This is mandatory.

Create:

```text
docs/traceability/requirements-matrix.md
```

Table:

| Requirement | Description | Phase | Component | API | Test | Status |
| ----------- | ----------- | ----- | --------- | --- | ---- | ------ |

Every functional requirement must map to:

* implementation phase
* subsystem
* eventual test

---

# 40. REQUIREMENT-TO-ROADMAP MATRIX

Create:

```text
docs/traceability/requirements-to-roadmap.md
```

No requirement should exist without a planned implementation phase.

No phase should claim scope that has no requirement.

This prevents scope drift.

---

# 41. REQUIREMENT-TO-TEST MATRIX

Create:

```text
docs/traceability/requirements-to-tests.md
```

For every critical requirement define how it will be verified:

* unit
* integration
* E2E
* security
* performance
* manual

---

# 42. DEFINITION-OF-DONE FRAMEWORK

Create:

```text
docs/traceability/definition-of-done.md
```

Define:

## Requirement DoD

* implemented
* validated
* tested
* documented

## Phase DoD

* all requirements complete
* all tests passing
* no blocking defects
* docs updated
* changelog updated
* architecture remains consistent

## MVP DoD

Use the final MVP Definition of Done from the product specification.

---

# 43. ADR FORMAT

Every ADR must use:

```text
# ADR-XXXX: Decision Title

## Status

Accepted

## Context

## Decision

## Alternatives Considered

## Consequences

### Positive

### Negative

## Revisit Conditions

## References
```

Do not create “Accepted” ADRs for undecided issues.

---

# 44. LOCK MAJOR DECISIONS

Create ADRs for:

* product boundary
* modular monolith
* PostgreSQL/PostGIS
* Drizzle
* MapLibre
* map provider abstraction
* PWA
* offline sync
* authentication
* object storage
* worker/queue
* UUIDv7
* template versioning
* inspection immutability
* 3D product boundary

These decisions are already established by the supplied product specification.

---

# 45. DO NOT REOPEN ARCHITECTURE UNNECESSARILY

The purpose of ADRs is to prevent future agents from repeatedly debating the same decisions.

Future agents should only propose changing an accepted ADR when:

* implementation proves it infeasible
* a security problem is found
* a major dependency becomes unavailable
* production evidence invalidates the decision
* requirements materially change

Otherwise, use the existing decision.

---

# 46. CI FOUNDATION

Set up CI for:

* install
* lint
* typecheck
* tests
* build

Do not create complicated deployment pipelines yet.

CI should fail on:

* TypeScript errors
* lint errors
* failing tests
* build failure

---

# 47. CODE QUALITY TOOLS

Set up appropriate:

* ESLint
* Prettier
* TypeScript strict mode
* import sorting if justified
* editor configuration
* `.gitignore`
* `.editorconfig`

Do not introduce 20 overlapping style tools.

Choose a clean minimal set.

---

# 48. TESTING FOUNDATION

Set up the testing architecture now even though product features are not yet implemented.

Create:

```text
tests/
  unit/
  integration/
  e2e/
  security/
  fixtures/
```

Or an equivalent structure consistent with the monorepo.

Configure:

* unit runner
* integration environment
* Playwright
* test database strategy

Do not wait until Phase 5 to establish testing.

---

# 49. TEST DATABASE

Create a clear strategy for isolated tests.

Tests must not depend on manually configured developer databases.

Prefer:

* disposable PostgreSQL/PostGIS container
* deterministic migrations
* deterministic seed/fixtures

Document it.

---

# 50. LOCAL INFRASTRUCTURE

Prepare Docker Compose for:

```text
PostgreSQL + PostGIS
Redis
MinIO
Mailpit/MailHog equivalent
```

Do not add infrastructure that the application does not require.

---

# 51. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

and:

```text
docs/development/setup.md
```

Document:

* required variables
* local defaults
* production-only variables
* secrets
* service startup

Never commit actual secrets.

---

# 52. DOCKER

Create:

* development compose
* API Dockerfile if appropriate
* worker Dockerfile if appropriate
* production build strategy

Do not over-optimize images yet.

The goal is reproducible development.

---

# 53. HEALTH / READINESS FOUNDATION

Create the architectural foundation for:

```text
GET /health
GET /ready
```

They may initially be basic.

---

# 54. API CONTRACT FOUNDATION

Set up OpenAPI generation from the backend.

Do not manually maintain a disconnected YAML file if the chosen framework can generate it.

Provide a documented location for the generated contract.

---

# 55. SHARED CONTRACTS

Establish a shared location/package for:

* API schemas where appropriate
* enums
* error codes
* domain-independent contracts

Do not put business logic into shared frontend/backend types.

---

# 56. DESIGN SYSTEM FOUNDATION

Extract/organize the reusable visual system from the current NEXUS website.

Document:

* typography
* colors
* spacing
* radii
* surfaces
* shadows
* motion principles

Do not rebuild the entire authenticated UI in Phase 0.

Only establish the foundation.

---

# 57. MARKETING SITE PRESERVATION

Before any refactoring, create an inventory of:

* current pages
* reusable components
* 3D scenes
* animation utilities
* assets
* fonts
* dependencies

Document this under:

```text
docs/development/current-website-inventory.md
```

This prevents accidental destruction of the existing website.

---

# 58. DEPENDENCY POLICY

Create:

```text
docs/development/dependency-policy.md
```

New dependencies should require:

* clear purpose
* maintenance/activity check
* license compatibility
* bundle/runtime implications
* security considerations
* architecture impact

Do not install libraries for trivial functionality.

---

# 59. SECURITY DEPENDENCY CHECKING

Configure dependency security checks where practical.

At minimum:

* package manager audit
* lockfile
* Dependabot/Renovate or equivalent if appropriate
* CI security check

Do not allow vulnerabilities to accumulate unnoticed.

---

# 60. DOCUMENT CHANGE POLICY

Every significant architectural or behavioral change later must update:

* relevant requirement
* relevant ADR if needed
* roadmap status
* test coverage
* CHANGELOG where user-visible
* API docs where applicable

---

# 61. TODO POLICY

Do not leave arbitrary TODOs in production code.

Use:

```text
TODO(<issue/reference>)
```

for intentional deferred work.

Do not use TODOs as a substitute for roadmap management.

---

# 62. TECHNICAL DEBT REGISTER

Create:

```text
docs/development/technical-debt.md
```

Include:

* debt item
* reason
* impact
* priority
* planned phase
* status

Do not let technical debt disappear into random comments.

---

# 63. OPEN QUESTIONS

Create:

```text
docs/product/open-questions.md
```

Only include genuine unanswered product questions.

Do NOT put already-settled architectural decisions there.

At this stage the key open questions should remain commercial/user-validation questions, not engineering fundamentals.

---

# 64. CHANGE MANAGEMENT

Create:

```text
docs/development/change-management.md
```

Explain:

### Small changes

Normal implementation.

### Requirement change

Update requirement + roadmap + tests.

### Architecture change

Create/update ADR.

### Scope change

Update product scope and roadmap before implementation.

This prevents silent scope changes.

---

# 65. RELEASE MANAGEMENT

Create:

```text
docs/development/release-process.md
```

Cover:

* versioning
* migrations
* changelog
* release candidate
* deployment
* rollback
* smoke tests

Do not build elaborate release automation yet.

---

# 66. SOURCE-OF-TRUTH MAP

Create a table showing:

| Information                  | Source of Truth                           |
| ---------------------------- | ----------------------------------------- |
| Product scope                | `docs/product/scope.md`                   |
| Requirements                 | `docs/product/functional-requirements.md` |
| Domain rules                 | `docs/product/domain-rules.md`            |
| Architecture                 | `docs/architecture/overview.md`           |
| Technology decisions         | ADRs                                      |
| Current implementation phase | `docs/roadmap/roadmap.md`                 |
| API contract                 | Generated OpenAPI                         |
| Database schema              | Migrations                                |
| Agent behavior               | `AGENTS.md`                               |
| History                      | `CHANGELOG.md`                            |

This should remove ambiguity for future agents.

---

# 67. PHASE TRACKING

At the top of:

```text
docs/roadmap/roadmap.md
```

include:

```text
Current Phase: 0
Status: Foundation / Setup
Next Phase: 1
```

Future agents must update this deliberately after completing phases.

Do not automatically advance phases without satisfying Definition of Done.

---

# 68. PHASE CHECKLISTS

Each phase document should have a checklist.

Example:

```text
## Requirements

- [ ] SITE-001
- [ ] SITE-002
- [ ] ASSET-001

## Implementation

- [ ] Database
- [ ] API
- [ ] Frontend
- [ ] Tests

## Validation

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

## Documentation

- [ ] API updated
- [ ] ADR updated if necessary
- [ ] Changelog updated

## Definition of Done

- [ ] ...
```

This makes future agent sessions much more reliable.

---

# 69. ENGINEERING CHECKLIST FOR EACH FUTURE PHASE

Every later implementation prompt should begin by telling the agent:

1. Read `AGENTS.md`
2. Read `docs/roadmap/roadmap.md`
3. Read the current phase document
4. Read affected ADRs
5. Read affected requirements
6. Inspect existing implementation
7. Implement only that phase
8. Write/update tests
9. Verify Definition of Done
10. Update roadmap
11. Update CHANGELOG
12. Commit only complete work

This process should be documented in `AGENTS.md`.

---

# 70. DO NOT BUILD PRODUCT FEATURES IN PHASE 0

Explicitly do NOT implement:

* auth UI
* real site CRUD
* real asset CRUD
* inspection execution
* findings
* corrective actions
* offline sync
* report generation
* operational dashboard
* real map workflows

unless the existing repository already contains them and they are merely being reorganized.

Phase 0 is preparation.

---

# 71. WHAT PHASE 0 MAY IMPLEMENT

It is acceptable to create:

* monorepo structure
* app shells
* configuration
* shared packages
* DB connection scaffolding
* migration scaffolding
* Docker Compose
* test setup
* CI
* linting
* formatting
* auth package placeholder/configuration
* API shell
* worker shell
* design-token foundation
* documentation

These should be foundations, not fake product implementations.

---

# 72. REQUIRED PHASE 0 DELIVERABLES

At the end of this task, the repository must contain at least:

```text
AGENTS.md
CHANGELOG.md
README.md
CONTRIBUTING.md
SECURITY.md

/docs
  /product
  /architecture
  /api
  /database
  /security
  /development
  /roadmap
  /decisions
  /traceability

CI configuration
Docker Compose
Environment example
Test foundation
Linting
Formatting
TypeScript configuration
Monorepo structure
Skill configuration
```

---

# 73. PHASE 0 DEFINITION OF DONE

Phase 0 is complete only when:

### Documentation

* all core product docs exist
* all architecture docs exist
* all roadmap phases exist
* all agreed ADRs exist
* traceability matrix exists
* source-of-truth hierarchy is documented

### Repository

* structure is clean
* existing website still runs
* no important existing work was accidentally removed

### Tooling

* install works
* dev environment works
* lint works
* typecheck works
* tests can run
* CI works

### Infrastructure

* PostgreSQL/PostGIS local setup works
* Redis works
* object storage emulator works
* email development service works

### Governance

* AGENTS.md exists
* CHANGELOG exists
* development workflow documented
* dependency policy documented
* security policy documented

### Skills

* required skill(s) installed
* skill usage documented

### Roadmap

* Phase 1–6 fully documented
* each phase has scope and DoD
* current phase is clearly marked as Phase 0

---

# 74. FINAL PHASE 0 REPORT

At the end, provide a concise summary containing:

### Repository

What was added/changed.

### Documentation

All major files created.

### Architecture

Final architecture summary.

### Skills

What was installed and configured.

### Tooling

What now works.

### Decisions

Which ADRs were created.

### Phase status

Confirm:

```text
Phase 0 — COMPLETE
Phase 1 — READY TO START
```

### Important warnings

List anything that requires attention before Phase 1.

---

# 75. FINAL INSTRUCTION

This task is a **project initialization and engineering preparation task**.

Do NOT attempt to complete NEXUS itself during this phase.

The purpose is to create a project that can be developed incrementally without:

* rediscovering requirements
* repeatedly debating architecture
* losing product context
* forgetting decisions
* introducing scope creep
* creating inconsistent implementations
* breaking the existing website
* losing test traceability

When you are finished, the next engineer/agent should be able to open the repository and immediately know:

**what NEXUS is, what NEXUS is not, what phase the project is in, what has been decided, what must be built next, how it should be built, how it should be tested, and what “done” means.**

Only after this Phase 0 is complete should Phase 1 development begin.


