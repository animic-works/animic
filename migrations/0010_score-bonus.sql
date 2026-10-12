ALTER TABLE `battle_record` ADD `similarity` real;--> statement-breakpoint
ALTER TABLE `scoring_weight` ADD `speed_bonus` integer;--> statement-breakpoint
ALTER TABLE `scoring_weight` ADD `generation_bonus` integer;--> statement-breakpoint
ALTER TABLE `scoring_weight` ADD `bonus_min_similarity` integer;--> statement-breakpoint
-- ボーナスを加える前の戦績は、最終スコアが再現度と同じ。
UPDATE `battle_record` SET `similarity` = `total` WHERE `total` IS NOT NULL;
