ALTER TABLE leads
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);


ALTER TABLE leads
ADD CONSTRAINT leads_session_unique
UNIQUE(session_id);

