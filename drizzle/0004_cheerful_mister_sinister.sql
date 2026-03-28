CREATE TABLE `voice_audio_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`textHash` varchar(64) NOT NULL,
	`voiceId` varchar(128) NOT NULL,
	`stability` varchar(8) NOT NULL DEFAULT '0.50',
	`similarityBoost` varchar(8) NOT NULL DEFAULT '0.75',
	`style` varchar(8) NOT NULL DEFAULT '0.00',
	`lessonId` int,
	`audioUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`sizeBytes` int NOT NULL DEFAULT 0,
	`charCount` int NOT NULL DEFAULT 0,
	`hitCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastAccessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_audio_cache_id` PRIMARY KEY(`id`)
);
