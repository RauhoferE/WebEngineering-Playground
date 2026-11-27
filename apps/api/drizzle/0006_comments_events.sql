CREATE TABLE "comment_events" (
	"bear_id" text NOT NULL,
	"seq" integer NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_events_bear_id_seq_pk" PRIMARY KEY("bear_id","seq")
);
--> statement-breakpoint
ALTER TABLE "bears" ADD COLUMN "event_seq" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment_events" ADD CONSTRAINT "comment_events_bear_id_bears_id_fk" FOREIGN KEY ("bear_id") REFERENCES "public"."bears"("id") ON DELETE cascade ON UPDATE no action;