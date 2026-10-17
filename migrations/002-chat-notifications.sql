BEGIN;
CREATE TABLE IF NOT EXISTS tbl_chat_device (
 id SERIAL PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES tbl_user(id),
 installation_id VARCHAR(80) NOT NULL UNIQUE,
 token TEXT NOT NULL UNIQUE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_device_user ON tbl_chat_device(user_id);
COMMIT;
