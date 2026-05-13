CREATE TABLE `reminder_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orgId` int NOT NULL,
	`enableReminders` boolean NOT NULL DEFAULT true,
	`reminderFrequency` enum('immediate','daily','weekly','never') NOT NULL DEFAULT 'daily',
	`quietHoursEnabled` boolean NOT NULL DEFAULT false,
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`enablePushNotifications` boolean NOT NULL DEFAULT true,
	`enableEmailNotifications` boolean NOT NULL DEFAULT false,
	`enableInAppNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminder_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `reminder_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `review_reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`orgId` int NOT NULL,
	`reminderTime` bigint NOT NULL,
	`reminderType` enum('due_now','due_tomorrow','due_this_week','custom') NOT NULL DEFAULT 'due_now',
	`sent` boolean NOT NULL DEFAULT false,
	`sentAt` bigint,
	`clicked` boolean NOT NULL DEFAULT false,
	`clickedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_reminders_id` PRIMARY KEY(`id`)
);
