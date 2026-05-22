CREATE TABLE `ab_test_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`userId` int NOT NULL,
	`variantId` int NOT NULL,
	`assignedAt` bigint NOT NULL,
	CONSTRAINT `ab_test_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_test_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`variantId` int NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`value` decimal(10,2),
	`count` int DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_test_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_test_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`weight` int DEFAULT 50,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_test_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('pricing','feature','ui','messaging') NOT NULL,
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`startDate` bigint,
	`endDate` bigint,
	`targetAudience` varchar(255),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
