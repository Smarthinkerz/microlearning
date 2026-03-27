CREATE TABLE `platform_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` json,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_settings_settingKey_unique` UNIQUE(`settingKey`)
);
