ALTER TABLE `prompt_group` ADD `target` text DEFAULT 'both' NOT NULL;--> statement-breakpoint
UPDATE `prompt_group` SET `target` = 'base' WHERE `id` IN ('who', 'bg', 'scene', 'art', 'quality', 'light', 'color', 'season');--> statement-breakpoint
UPDATE `prompt_group` SET `target` = 'character' WHERE `id` IN ('hair', 'style', 'eyes', 'face', 'outfit', 'head', 'acc', 'legs', 'race', 'role', 'hold', 'gesture', 'pose', 'comp');--> statement-breakpoint
-- 「場所・天気」を「場所」と「天気」に分ける（初期データのグループがある環境だけ）。
UPDATE `prompt_group` SET `sort_order` = `sort_order` + 1 WHERE `sort_order` > (SELECT `sort_order` FROM `prompt_group` WHERE `id` = 'scene') AND NOT EXISTS (SELECT 1 FROM `prompt_group` WHERE `id` = 'weather');--> statement-breakpoint
INSERT INTO `prompt_group` (`id`, `label`, `tone`, `target`, `sort_order`) SELECT 'weather', '天気', 'orange', 'base', `sort_order` + 1 FROM `prompt_group` WHERE `id` = 'scene' AND NOT EXISTS (SELECT 1 FROM `prompt_group` WHERE `id` = 'weather');--> statement-breakpoint
UPDATE `prompt_phrase` SET `group_id` = 'weather' WHERE `group_id` = 'scene' AND `tag` IN ('night sky', 'starry sky', 'sunset', 'cloud', 'snow', 'rain') AND EXISTS (SELECT 1 FROM `prompt_group` WHERE `id` = 'weather');--> statement-breakpoint
UPDATE `prompt_group` SET `label` = '場所' WHERE `id` = 'scene' AND `label` = '場所・天気';
