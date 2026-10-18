CREATE TABLE `notebooks` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`owner_hash` text NOT NULL,
	`recipient_hash` text,
	`recipient_name` text,
	`recipient_expires` integer,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotas` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires` integer NOT NULL
);
