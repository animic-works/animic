CREATE TABLE `scoring_weight` (
	`id` text PRIMARY KEY NOT NULL,
	`weights` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `scoring_weight_created_at_idx` ON `scoring_weight` (`created_at`);--> statement-breakpoint
ALTER TABLE `scoring_job` ADD `weights` text;