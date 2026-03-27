# MicroLearning Coach - Project TODO

## Database & Schema
- [x] Organizations table (multi-tenant)
- [x] Extended users table with roles and org membership
- [x] Shifts table for schedule management
- [x] Lessons table with content schema
- [x] Lesson assignments table
- [x] Lesson attempts/progress table
- [x] Certificates table
- [x] Audit logs table
- [x] Notifications table
- [x] Content authoring drafts table

## Authentication & Roles
- [x] Role-based access control (learner, employer_admin, content_author)
- [x] Multi-tenant organization support
- [x] Organization membership management
- [x] Admin user promotion flow

## Shift Management
- [x] Shift CRUD operations
- [x] Shift calendar view
- [x] WFM webhook sync endpoint
- [x] Shift-aware scheduling logic

## Lesson Engine & Assignment
- [x] Schedule-aware lesson assignment engine
- [x] 3-10 minute micro-lesson delivery timing
- [x] Avoid active shifts and breaks
- [x] Bulk assignment scheduling
- [x] Assignment status tracking

## Lesson Player & Content
- [x] Interactive lesson content player
- [x] Video content support
- [x] Quiz/assessment support
- [x] Scenario branching support
- [x] Progress tracking and completion
- [x] Lesson timer and duration tracking

## Content Authoring Studio
- [x] WYSIWYG lesson editor
- [x] Branching scenario builder
- [x] SME review queue
- [x] Draft/publish workflow
- [x] Content preview

## Employer Dashboard
- [x] Learner analytics overview
- [x] Completion tracking charts
- [x] Assignment scheduling interface
- [x] Roster management
- [x] Organization settings

## AI Integration
- [x] AI-powered lesson content generation
- [x] Content translation
- [x] Adaptive lesson recommendations
- [x] Personalization engine

## Compliance & Export
- [x] SCORM/xAPI compliance data export
- [x] Audit logging system
- [x] Certificate generation

## PWA & Offline
- [x] Service worker registration
- [x] Offline lesson caching (IndexedDB)
- [x] Web push notifications
- [x] Offline sync with conflict resolution
- [x] PWA manifest and installability

## UI & Design
- [x] Global design system and theming
- [x] Responsive mobile-first layout
- [x] Dashboard layout with sidebar navigation
- [x] Landing page for unauthenticated users
- [x] Self-hosting documentation

## Testing
- [x] Auth router tests (me, logout)
- [x] Organization router RBAC tests
- [x] Lesson router permission tests
- [x] Shift router tests
- [x] Assignment router tests
- [x] Notification router tests
- [x] Certificate router tests
- [x] Audit router RBAC tests
- [x] Input validation tests
