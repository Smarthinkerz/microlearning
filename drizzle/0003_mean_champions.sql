CREATE TABLE `lesson_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`lessonIds` json,
	`category` varchar(128),
	`thumbnailUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_packs_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_packs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`subscriptionId` int,
	`amount` int NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(64),
	`externalChargeId` varchar(255),
	`description` text,
	`metadata` json,
	`paidAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`tier` enum('starter','pro','enterprise','consumer_free','consumer_premium') NOT NULL,
	`priceMonthly` int NOT NULL,
	`priceYearly` int,
	`currency` varchar(3) DEFAULT 'USD',
	`isPerUser` boolean NOT NULL DEFAULT true,
	`maxUsers` int,
	`features` json,
	`addOns` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','trial','past_due','canceled','expired') NOT NULL DEFAULT 'trial',
	`currentPeriodStart` bigint NOT NULL,
	`currentPeriodEnd` bigint NOT NULL,
	`canceledAt` bigint,
	`trialEndsAt` bigint,
	`quantity` int DEFAULT 1,
	`externalPaymentId` varchar(255),
	`externalCustomerId` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_pack_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`packId` int NOT NULL,
	`paymentId` int,
	`purchasedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_pack_purchases_id` PRIMARY KEY(`id`)
);
