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
- [x] Feature gating based on subscription tier
- [x] Tier management in Admin CRM

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

## Logo Fix
- [x] Investigate and fix broken logo across all pages (nav, sidebar, sign-in, footer)
- [x] Ensure logo renders correctly at all sizes (re-uploaded to CDN, replaced all 5 references)

## Admin CRM Subscription Management
- [x] Subscription plans CRUD in Admin CRM (view, edit, create, deactivate plans)
- [x] Active subscriptions overview (list all org subscriptions with status)
- [x] Manual upgrade/downgrade subscriptions for orgs
- [x] Payment history view in Admin CRM
- [x] Subscription stats dashboard (active, trial, canceled, revenue)al count)

## Feature Gating
- [x] Create shared feature gating utility (shared/featureGating.ts)
- [x] Create useEntitlements React hook (client/src/hooks/useEntitlements.ts)
- [x] Create FeatureGate + TierBadge components (client/src/components/FeatureGate.tsx)
- [x] Add getMyEntitlements tRPC endpoint
- [x] Gate full analytics behind Pro+ plan (Analytics.tsx)
- [x] Gate content authoring behind Pro+ plan (LessonEditor.tsx)
- [x] Add lesson limit banner to LessonLibrary (shows usage + upgrade CTA)
- [ ] Gate analytics dashboard to Pro+ tiers
- [ ] Gate content authoring studio to Pro+ tiers
- [ ] Gate AI recommendations to Pro+ tiers
- [ ] Gate SCORM/xAPI export to Pro+ and Enterprise
- [ ] Show upgrade prompts when users hit gated features
- [ ] Feature gating tests

## ElevenLabs Voice Integration
- [x] Add ElevenLabs API key as env secret (ELEVENLABS_API_KEY)
- [x] Create server-side ElevenLabs TTS service module (server/elevenLabs.ts)
- [x] Add text-to-speech endpoints (voice.synthesize + voice.synthesizeLesson)
- [x] Add voice playback UI to lesson player (full lesson + per-block compact)
- [x] Support 9 curated voices with settings (stability, clarity, style)
- [x] VoicePlayer component with play/pause/seek/volume/regenerate
- [x] Voice generation tests (5 tests passing)

## Voice Tier Restriction
- [x] Add voiceNarration feature flag to shared featureGating (false for Free/Starter, true for Pro/Premium/Enterprise)
- [x] Gate VoicePlayer component behind voiceNarration entitlement
- [x] Add voice narration as a feature line in employer pricing cards (purple Mic icon for included, X for not)
- [x] Add voice narration as a feature line in consumer pricing cards
- [x] Add AI Voice Narration row to feature comparison table
- [x] Show upgrade prompt when Free/Starter users try to use voice (compact + full modes)
- [x] Update existing DB plans with voiceNarration flag
- [x] Update autoSeed with voiceNarration in all plan features
- [x] Update tests with voiceNarration assertions (all 89 tests passing)

## Voice Audio Caching
- [x] Add voice_audio_cache table to schema (textHash, voiceId, stability, similarityBoost, style, lessonId, audioUrl, fileKey, sizeBytes, charCount, hitCount, timestamps)
- [x] Create DB helpers: computeVoiceCacheKey, getVoiceCacheEntry, getVoiceCacheByLesson, insertVoiceCacheEntry, getVoiceCacheStats, deleteVoiceCacheEntry, getAllVoiceCacheEntries
- [x] Update voice.synthesize to check cache before calling ElevenLabs (SHA-256 hash of text+voice+settings)
- [x] Update voice.synthesizeLesson to check cache by lessonId+voice+settings
- [x] Add admin endpoints: cacheStats, cacheEntries, clearCacheEntry
- [x] Update VoicePlayer UI: Zap icon + "Cached" badge for cache hits, "Regenerate" button bypasses cache (skipCache=true)
- [x] Cache invalidation via skipCache param and admin clearCacheEntry
- [x] 14 voice-cache tests passing (hash determinism, admin endpoints, RBAC, skipCache input validation)

## Voice Cache Admin Panel
- [x] Add Voice Cache tab/section to Admin CRM (6th tab with Volume2 icon)
- [x] Display cache stats (total entries, total hits, hit rate %, total storage size)
- [x] List cached entries with details (text hash, voice, lesson, size, hits, created, last accessed)
- [x] Clear individual cache entries from the admin panel (trash button per entry)
- [x] Format file sizes (B/KB/MB/GB) and timestamps for readability
- [x] Refresh button to reload cache data

## Server-Side Voice Tier Enforcement
- [x] Add subscription check in voice.synthesize endpoint (block Free/Starter users at API level)
- [x] Add subscription check in voice.synthesizeLesson endpoint
- [x] Return clear FORBIDDEN error with upgrade prompt for unauthorized users
- [x] Admin users bypass subscription check
- [x] Write tests for server-side enforcement (4 new tests: free-tier blocked, admin allowed)
- [x] All 18 voice-cache tests passing

## Logo Size Fix
- [x] Increase logo size in all navigation areas: Home nav (h-28), Home footer (h-20), Dashboard sign-in (h-28), Dashboard sidebar (h-24), Pricing nav (h-24), Pricing footer (h-16)

## Logo Replacement (New Image)
- [x] Process new logo (removed beige background via flood-fill, cropped dark border, converted to transparent PNG)
- [x] Upload to CDN and replaced all 5 old logo URLs across Home, Pricing, DashboardLayout

## Platform Upgrade to 10/10 A+ Production Grade

### Immediate Fixes
- [x] API rate limiting on all endpoints (express-rate-limit, stricter on AI/voice)
- [x] Database index optimization (userId, orgId, textHash, etc.)
- [x] JSON column runtime validation with Zod on reads
- [x] IndexedDB-backed offline sync queue for lesson attempts
- [x] Offline lesson completion with automatic sync on reconnection
- [x] Push notification delivery via Web Push VAPID integration
- [x] Automated "lesson before shift" push reminders
- [x] Data-driven AI recommendation engine (collaborative filtering + content gap + schedule + performance signals)
- [x] Calibrated confidence scoring for AI recommendations
- [x] Transparent explainability for AI recommendations (signal-based + LLM-enhanced)
- [x] Mobile-first lesson player redesign (swipe gestures, step dots, slide animations)
- [x] Simplified mobile navigation for quick lesson access

### Medium-Term Enhancements
- [x] HRIS/WFM connectors (Workday, SAP SuccessFactors, BambooHR, CSV import)
- [x] Automated roster sync from HRIS systems
- [x] i18n framework with 10 languages (en, es, fr, de, ar, zh, ja, pt, hi, ko) + RTL support
- [x] WCAG 2.1 accessibility (ARIA labels, keyboard navigation, focus management)
- [x] Runtime white-label theming (colors, logos, fonts, border-radius, custom CSS per org)
- [x] Actionable analytics insights (engagement alerts, overdue assignment alerts, content gap analysis)
- [x] Industry benchmark comparisons in analytics (completion rate, scores, active rate)
- [ ] Subscription lifecycle management improvements

### Security & Compliance Hardening
- [x] Multi-factor authentication (MFA) with TOTP + backup codes
- [ ] IP allowlisting for API endpoints
- [x] Field-level AES-256-GCM encryption for PII
- [ ] Data residency controls (region selection)
- [ ] Audit log expansion to include read operations
- [x] SIEM-ready structured audit logging with event types
- [x] GDPR data export (Right to Access) and deletion (Right to Erasure)

### Long-Term Moat
- [x] Expand content library to 125+ lessons across 15 industries (Healthcare, Retail, Manufacturing, Construction, Transportation, Food Service, Security, Energy, Education, Cleaning, General)
- [ ] Cohort-level AI personalization with fairness controls
- [ ] A/B testing framework for recommendations
- [ ] Full offline mode for lessons, analytics, and notifications
- [x] Consumer lesson packs marketplace (8 packs across industries)
- [x] Gamified challenges (daily/weekly/monthly) and achievement system (20 badges across 5 tiers)
- [x] Background job processing (in-process priority queue with retry, backoff, concurrency limits)
- [x] Performance optimization (LRU query cache with TTL tiers: hot 30s, warm 5min, cold 30min)

### Final Audit
- [x] Conduct new comprehensive 14-section audit (v2.0)
- [x] Comprehensive audit completed: 7.9/10 B+ (up from 5.6/10 B-)
