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

## Admin CRM Separation
- [x] Remove Admin CRM from DashboardLayout sidebar navigation
- [x] Move Admin CRM to standalone /admin-crm route with own layout
- [x] Admin CRM accessible only via direct URL with auth guard
- [x] Learners never see or access Admin CRM
- [x] Back-to-dashboard link in CRM header

## Lesson Media Generation
- [x] Generated 15 original images across all 6 categories
- [x] Uploaded images to CDN and integrated into seed lesson content
- [x] Lessons display thumbnail images in library cards (with hover zoom)
- [x] Image blocks embedded in lesson content for inline display in player
- [x] 30 lessons seeded, 15 with thumbnails and image blocks
- [x] All 46 tests passing

## App Rename & Theme Update
- [x] Rename app to "Smarthinkerz LearnShift" across all UI (sidebar, landing page, PWA manifest, etc.)
- [x] Lighten the dark background to a softer, less intense dark tone (oklch 0.145 → 0.21)
- [x] Updated all references: DashboardLayout, Home, AdminCRM, manifest.json, index.html, offline.html, autoSeed, routers, tests
- [x] All 46 tests passing with zero MicroLearn references remaining

## Theme Lightening & Video Integration
- [x] Lighten the dark theme further (background oklch 0.21 → 0.27, cards/sidebar proportionally lighter)
- [x] Upload SmarthinkerzMainAdvrt.mp4 to CDN as featured front video
- [x] Upload Smarthinkerz-MicroLearneradv.mp4 to CDN as background video
- [x] Update hero section: background video plays behind with overlay, main advert video featured prominently on right
- [x] Video player with play/pause, mute/unmute controls and hover overlay
- [x] All 46 tests passing

## Bug Fixes
- [x] Fix: Lessons created via Content Studio/Editor don't appear after saving (auto-assign org, query by author when no orgId)
- [x] Fix: No way to navigate from dashboard back to home/front page (added Home Page link in user dropdown, removed auto-redirect on Home)

## Logo Replacement
- [x] Upload Smarthinkerz LearnShift logo to CDN
- [x] Replace graduation cap icon with logo in sidebar/DashboardLayout (sign-in page + sidebar header)
- [x] Replace logo in Home.tsx landing page nav and footer
- [x] AdminCRM uses dynamic branding (already supports custom logo URL)
- [x] Updated service worker brand name and IndexedDB name
- [x] Removed all GraduationCap icon references from codebase
- [x] All 46 tests passing

## Logo Size Fix
- [x] Make logo bigger in nav bar (h-16), sidebar (h-16), sign-in (h-20), and footer (h-14)

## Subscription Tier System
- [x] Add subscriptions/tiers table to database schema
- [x] Build pricing page with 5 tiers: Starter ($3.95), Pro ($8.95), Enterprise ($12), Consumer Free, Consumer Premium ($2.99)
- [x] Feature comparison table on pricing page
- [x] Available add-ons section
- [x] FAQ section
- [x] Pricing link in nav bar (both auth and unauth states)
- [x] View Pricing CTA on home page
- [x] Auto-seed plans on server startup
- [ ] Feature gating based on subscription tier
- [ ] Tier management in Admin CRM

## Payment Integration (Tap Gateway)
- [x] Tap payment gateway service module (server/tapPayment.ts)
- [x] ENV vars prepared for TAP_SECRET_KEY, TAP_PUBLIC_KEY, TAP_WEBHOOK_SECRET
- [x] createCheckout tRPC endpoint (creates Tap charge + redirect)
- [x] verifyPayment tRPC endpoint (verifies charge status after redirect)
- [x] isPaymentConfigured public endpoint (frontend checks if Tap is ready)
- [x] DB helpers: updateSubscriptionExternalIds, getSubscriptionById, getPaymentByExternalChargeId
- [x] Subscription tests (22 tests) + Tap module tests (5 tests) — all 68 tests passing
- [ ] Connect Tap API keys when provided by user
- [ ] Payment flow: select tier → checkout → activate subscription (end-to-end with live keys)
- [ ] Subscription status tracking and renewal management
- [ ] Tap webhook handler for async charge updates
