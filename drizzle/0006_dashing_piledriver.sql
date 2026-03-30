CREATE TABLE `admin_ip_allowlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`label` varchar(255),
	`addedBy` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `admin_ip_allowlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `breach_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('brute_force','bulk_data_access','unauthorized_admin_access','data_exfiltration','anomalous_pattern','manual_report') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text NOT NULL,
	`affectedUserCount` int DEFAULT 0,
	`affectedResourceType` varchar(128),
	`sourceIp` varchar(45),
	`detectedBy` enum('automated','manual') NOT NULL DEFAULT 'automated',
	`status` enum('detected','investigating','contained','resolved','false_positive') NOT NULL DEFAULT 'detected',
	`notifiedAt` bigint,
	`resolvedAt` bigint,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `breach_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` enum('terms_of_service','privacy_policy','marketing_emails','analytics_tracking','data_processing','third_party_sharing') NOT NULL,
	`granted` boolean NOT NULL DEFAULT false,
	`ipAddress` varchar(45),
	`userAgent` text,
	`version` varchar(32) DEFAULT '1.0',
	`grantedAt` bigint,
	`withdrawnAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consents_id` PRIMARY KEY(`id`)
);
