CREATE TABLE `event_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('editor','viewer') NOT NULL DEFAULT 'editor',
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`invitedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `event_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_invites_event_email_unique` UNIQUE(`eventId`,`email`)
);
