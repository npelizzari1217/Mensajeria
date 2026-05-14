-- Create GIN index for full-text search on messages
-- Uses Spanish text search configuration for stemming and stop words
CREATE INDEX IF NOT EXISTS idx_messages_search 
ON messages 
USING gin(to_tsvector('spanish', coalesce(subject, '') || ' ' || coalesce(body, '')));
