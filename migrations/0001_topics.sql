CREATE TABLE `topic` (
	`id` text PRIMARY KEY NOT NULL,
	`difficulty` text NOT NULL,
	`image_url` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `topic_difficulty_idx` ON `topic` (`difficulty`);