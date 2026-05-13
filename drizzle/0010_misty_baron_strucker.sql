CREATE TABLE `lesson_review_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`orgId` int NOT NULL,
	`interval` int NOT NULL DEFAULT 1,
	`easeFactor` decimal(3,2) NOT NULL DEFAULT '2.5',
	`repetitions` int NOT NULL DEFAULT 0,
	`nextReviewDate` bigint NOT NULL,
	`lastReviewDate` bigint,
	`status` enum('new','learning','review','mastered') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_review_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`orgId` int NOT NULL,
	`score` int NOT NULL,
	`difficulty` enum('easy','medium','hard','very_hard') NOT NULL,
	`timeSpentSeconds` int,
	`quality` int NOT NULL,
	`reviewedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_history_id` PRIMARY KEY(`id`)
);
