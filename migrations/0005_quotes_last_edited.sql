-- Last edited by user at time for saved quotes.
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_by_id varchar;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_by_name text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_at timestamp;
