CREATE TABLE `lesson_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`attemptId` int,
	`rating` int NOT NULL,
	`comment` text,
	`difficulty` enum('too_easy','just_right','too_hard'),
	`wouldRecommend` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uptime_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceName` varchar(128) NOT NULL,
	`status` enum('operational','degraded','down','unknown') NOT NULL,
	`latencyMs` int,
	`message` text,
	`checkedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uptime_history_id` PRIMARY KEY(`id`)
);
