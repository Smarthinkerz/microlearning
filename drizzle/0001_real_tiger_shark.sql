CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`orgId` int,
	`action` varchar(128) NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` int,
	`details` json,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`orgId` int NOT NULL,
	`attemptId` int,
	`certificateNumber` varchar(128) NOT NULL,
	`issuedAt` bigint NOT NULL,
	`expiresAt` bigint,
	`pdfUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNumber_unique` UNIQUE(`certificateNumber`)
);
--> statement-breakpoint
CREATE TABLE `lesson_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`userId` int NOT NULL,
	`orgId` int NOT NULL,
	`assignedBy` int,
	`status` enum('pending','available','in_progress','completed','expired','skipped') DEFAULT 'pending',
	`priority` enum('low','normal','high','urgent') DEFAULT 'normal',
	`scheduledStartTime` bigint,
	`scheduledEndTime` bigint,
	`dueDate` bigint,
	`completedAt` bigint,
	`isScheduleAware` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`orgId` int NOT NULL,
	`startedAt` bigint NOT NULL,
	`completedAt` bigint,
	`timeSpentSeconds` int DEFAULT 0,
	`score` int,
	`maxScore` int,
	`passed` boolean,
	`responses` json,
	`progress` int DEFAULT 0,
	`currentStep` int DEFAULT 0,
	`status` enum('in_progress','completed','abandoned') DEFAULT 'in_progress',
	`syncStatus` enum('synced','pending','conflict') DEFAULT 'synced',
	`clientTimestamp` bigint,
	`serverTimestamp` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`content` json,
	`contentType` enum('video','quiz','scenario','assessment','mixed','article') DEFAULT 'mixed',
	`durationMinutes` int DEFAULT 5,
	`difficulty` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
	`category` varchar(128),
	`tags` json,
	`thumbnailUrl` text,
	`authorId` int NOT NULL,
	`status` enum('draft','in_review','published','archived') DEFAULT 'draft',
	`reviewerId` int,
	`reviewNotes` text,
	`publishedAt` timestamp,
	`contentSchemaVersion` int DEFAULT 1,
	`language` varchar(10) DEFAULT 'en',
	`xapiActivityId` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orgId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('lesson_available','lesson_reminder','shift_change','assignment','achievement','system') DEFAULT 'system',
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`industry` varchar(128),
	`logoUrl` text,
	`settings` json,
	`maxUsers` int DEFAULT 100,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orgId` int NOT NULL,
	`title` varchar(255),
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`breakStartTime` bigint,
	`breakEndTime` bigint,
	`shiftType` enum('morning','afternoon','night','split','custom') DEFAULT 'custom',
	`location` varchar(255),
	`externalId` varchar(255),
	`source` enum('manual','webhook','import') DEFAULT 'manual',
	`isRecurring` boolean DEFAULT false,
	`recurrenceRule` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`provider` varchar(128) NOT NULL,
	`webhookUrl` text,
	`secretKey` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `appRole` enum('learner','employer_admin','content_author','super_admin') DEFAULT 'learner' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `orgId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64) DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `notificationPreferences` json;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActiveAt` timestamp;