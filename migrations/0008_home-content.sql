CREATE TABLE `gallery_item` (
	`id` text PRIMARY KEY NOT NULL,
	`difficulty` text NOT NULL,
	`score` real NOT NULL,
	`ccip` real NOT NULL,
	`pixai` real NOT NULL,
	`siglip2` real NOT NULL,
	`dinov2` real NOT NULL,
	`depth` real NOT NULL,
	`topic_src` text NOT NULL,
	`topic_alt` text NOT NULL,
	`shot_src` text NOT NULL,
	`shot_alt` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_item` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image_id` text
);
--> statement-breakpoint
CREATE TABLE `site_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

--> statement-breakpoint
INSERT INTO `gallery_item` (`id`, `difficulty`, `score`, `ccip`, `pixai`, `siglip2`, `dinov2`, `depth`, `topic_src`, `topic_alt`, `shot_src`, `shot_alt`, `sort_order`) VALUES
('initial-c12', 'easy', 59.3, 57.4, 37.8, 94.8, 54.0, 53.8, '/images/gallery-c12-topic.webp', 'お題。日傘を持ち、ロリータ服を着た金髪縦ロールの女の子', '/images/gallery-c12-shot.webp', '提出。日傘を持った金髪で青い目の女の子', 0),
('initial-librarian', 'normal', 75.0, 74.5, 58.0, 96.6, 78.0, 72.8, '/images/gallery-librarian-topic.webp', 'お題。図書館で本を持つ、眼鏡をかけた茶髪の女の子', '/images/gallery-librarian-shot.webp', '提出。図書館で本を持つ、眼鏡をかけた女の子', 1),
('initial-aquarium', 'hard', 65.3, 71.2, 41.1, 93.4, 63.2, 51.6, '/images/gallery-aquarium-topic.webp', 'お題。水族館の水槽の前で魚を見る2人の女の子', '/images/gallery-aquarium-shot.webp', '提出。水族館の水槽の前にいる2人の女の子', 2),
('initial-c93', 'easy', 76.3, 84.2, 54.8, 93.6, 79.9, 63.7, '/images/gallery-c93-topic.webp', 'お題。デニムジャケットを着た、青い髪の女の子', '/images/gallery-c93-shot.webp', '提出。デニムジャケットを着た、青い髪の女の子', 3),
('initial-picnic', 'normal', 82.5, 89.4, 61.1, 94.6, 80.8, 89.9, '/images/gallery-picnic-topic.webp', 'お題。桜の下でサンドイッチを食べる、三つ編みの女の子', '/images/gallery-picnic-shot.webp', '提出。桜の下でピクニックをする、三つ編みの女の子', 4),
('initial-snow-angel', 'hard', 72.4, 81.9, 53.3, 95.8, 80.9, 32.1, '/images/gallery-snow-angel-topic.webp', 'お題。雪原で遊ぶ2人の女の子', '/images/gallery-snow-angel-shot.webp', '提出。雪原で遊ぶ2人の女の子', 5);
