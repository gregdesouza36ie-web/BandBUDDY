CREATE TABLE `activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(80) NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `band_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bandId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `band_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `band_members_band_user_unique` UNIQUE(`bandId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `bands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('editor','viewer') NOT NULL DEFAULT 'editor',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `event_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_members_event_user_unique` UNIQUE(`eventId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bandId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`venue` varchar(160),
	`eventDate` timestamp,
	`status` enum('draft','ready','archived') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`title` varchar(180) NOT NULL,
	`artist` varchar(160),
	`videoUrl` text,
	`sourceKey` varchar(12),
	`singerKey` varchar(12),
	`keyStatus` enum('pending','detected','unavailable') NOT NULL DEFAULT 'pending',
	`durationSeconds` int,
	`createdBy` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `songs_id` PRIMARY KEY(`id`)
);
