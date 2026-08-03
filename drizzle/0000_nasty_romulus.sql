CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`host_token` text NOT NULL,
	`guest_token` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`artist_id` text,
	`artist_name` text,
	`artist_url` text,
	`stage_name` text,
	`observation` text,
	`senses_json` text,
	`photo_key` text,
	`photo_type` text,
	`postcard_json` text,
	`ai_mode` text,
	`pulse_color` text,
	`pulse_at` integer,
	`pulse_ends_at` integer,
	`demo` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_code_unique` ON `sessions` (`code`);