-- Quote Generator: per-creator discount % (used when creator code is selected on a quote).
-- Owners can edit this in Admin > Creators. Null = use default from code (CREATORS_DISCOUNTS).
ALTER TABLE creators ADD COLUMN IF NOT EXISTS quote_discount_percent numeric(5,2);
