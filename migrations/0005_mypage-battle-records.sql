CREATE TABLE `battle_record` (
	`battle_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`difficulty` text NOT NULL,
	`participant_count` integer NOT NULL,
	`rank` integer,
	`total` real,
	`image_url` text,
	PRIMARY KEY(`battle_id`, `participant_id`)
);
--> statement-breakpoint
CREATE INDEX `battle_record_participant_started_at_idx` ON `battle_record` (`participant_id`,`started_at`);--> statement-breakpoint
ALTER TABLE `user` ADD `icon` text;--> statement-breakpoint
CREATE INDEX `scoring_job_battle_id_idx` ON `scoring_job` (`battle_id`);