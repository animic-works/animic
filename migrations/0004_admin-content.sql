CREATE TABLE `prompt_group` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prompt_phrase` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`label` text NOT NULL,
	`tag` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `prompt_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `prompt_phrase_group_sort_idx` ON `prompt_phrase` (`group_id`,`sort_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `prompt_phrase_group_tag_idx` ON `prompt_phrase` (`group_id`,`tag`);--> statement-breakpoint
CREATE TABLE `battle_option` (
	`kind` text NOT NULL,
	`seconds` integer NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`kind`, `seconds`)
);
--> statement-breakpoint
DROP INDEX `topic_difficulty_idx`;--> statement-breakpoint
ALTER TABLE `topic` ADD `image_key` text;--> statement-breakpoint
ALTER TABLE `topic` ADD `title` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `topic` ADD `note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `topic` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `topic` ADD `created_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `topic` ADD `updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `topic_status_difficulty_idx` ON `topic` (`status`,`difficulty`);--> statement-breakpoint
CREATE INDEX `topic_updated_at_idx` ON `topic` (`updated_at`);