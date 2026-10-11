ALTER TABLE `prompt_group` ADD `tone` text DEFAULT 'slate' NOT NULL;--> statement-breakpoint
ALTER TABLE `prompt_phrase` ADD `suffix` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `prompt_phrase` ADD `note` text DEFAULT '' NOT NULL;