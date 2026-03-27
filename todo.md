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

## Pre-built Lesson Library
- [x] Create 30+ pre-built micro-lessons covering shift worker topics
- [x] Seed lessons into database on first run / via admin action
- [x] Lessons cover: workplace safety, communication, time management, equipment, compliance, health, leadership, customer service, etc.
- [x] Each lesson has full content blocks and quiz questions

## AI Lesson Generation Enhancement
- [x] Ensure AI generation produces complete lessons with content blocks and quizzes
- [x] AI generation accessible from Lesson Library and Content Studio for any user-chosen topic
- [x] Generated lessons are immediately available in the lesson library
- [x] Lesson Library page with grid/category views, filters, and search
- [x] Library router with public browse, categories, and admin seed endpoints
- [x] AI generateAndSave endpoint that auto-saves generated lessons
- [x] Library tests (33 total tests passing)

## Auto-Seed Fix
- [x] Auto-seed 30+ lessons into database on server startup (no manual action needed)
- [x] Ensure lessons appear immediately in Lesson Library after first load
- [x] Create default organization if none exists so lessons have an orgId

## Replace Seed Lessons with User's 30 Lessons
- [x] Replace seedLessons.ts with exact 30 lessons across 6 categories
- [x] Each lesson has 3-5 multiple-choice quiz questions
- [x] Categories: Safety & Compliance, Customer Service & Soft Skills, Productivity & Efficiency, Health & Wellbeing, Technical & Job Skills, Personal Development
- [x] Lessons auto-seed on startup

## Admin CRM Panel
- [x] Frontend customization: colors, logo, layout, content editing
- [x] Backend management: lessons CRUD, attendees/users management
- [x] Organization settings management
- [x] Theme/branding controls (color picker, logo upload, font, sidebar style)
- [x] Platform settings table for persistent branding storage
- [x] CRM stats dashboard (user count, lesson count, org count, published count)
- [x] User management: search, filter by role, edit role/org, delete
- [x] Lesson management: search, filter by status/category, edit metadata, delete
- [x] Organization management: create, edit, activate/deactivate
- [x] CRM tests (13 tests passing)
- [x] All 46 tests passing
