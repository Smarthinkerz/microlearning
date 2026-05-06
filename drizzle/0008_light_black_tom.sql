ALTER TABLE `users` ADD `approvalStatus` enum('pending','approved','disapproved','blocked','removed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `disapprovalReason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `blockReason` text;