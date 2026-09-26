CREATE TABLE `scoring_job` (
	`id` text PRIMARY KEY NOT NULL,
	`battle_id` text NOT NULL,
	`room_code` text NOT NULL,
	`workflow_version` text NOT NULL,
	`inputs` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`worker_id` text,
	`lease_until` integer,
	`created_at` integer NOT NULL,
	`claimed_at` integer,
	`finished_at` integer,
	`raw_result` text,
	`error` text,
	FOREIGN KEY (`worker_id`) REFERENCES `scoring_worker`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `scoring_job_state_created_at_idx` ON `scoring_job` (`state`,`created_at`);--> statement-breakpoint
CREATE TABLE `scoring_link_code` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scoring_result` (
	`job_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`total` real NOT NULL,
	PRIMARY KEY(`job_id`, `participant_id`),
	FOREIGN KEY (`job_id`) REFERENCES `scoring_job`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scoring_worker` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`secret_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer,
	`status` text,
	`revoked_at` integer
);
