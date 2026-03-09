-- Quote Generator: default company/grinder split (%). Used when no grinder bid is entered.
-- Owners can edit in Admin. Default 70% company, 30% grinder.
ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS quote_generator_company_pct numeric NOT NULL DEFAULT 70;
ALTER TABLE queue_config ADD COLUMN IF NOT EXISTS quote_generator_grinder_pct numeric NOT NULL DEFAULT 30;
