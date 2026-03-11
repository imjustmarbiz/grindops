-- Owner toggle for GrindOps bot sending bidding notifications to the bid war channel.
ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS bid_war_notifications_enabled boolean NOT NULL DEFAULT true;
