BEGIN;
CREATE TABLE IF NOT EXISTS tbl_chat_attachment (
 id UUID PRIMARY KEY,room_id INTEGER NOT NULL,owner_id INTEGER NOT NULL,name VARCHAR(180) NOT NULL,
 mime VARCHAR(100) NOT NULL,size INTEGER NOT NULL,content BYTEA NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_attachment_owner ON tbl_chat_attachment(owner_id);
CREATE TABLE IF NOT EXISTS tbl_chat_message_detail (
 message_id INTEGER PRIMARY KEY,reply_to_id INTEGER,attachment_id UUID UNIQUE,pinned BOOLEAN DEFAULT FALSE,pinned_by INTEGER,pinned_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS chat_message_pinned ON tbl_chat_message_detail(pinned) WHERE pinned=TRUE;
CREATE TABLE IF NOT EXISTS tbl_chat_read (room_id INTEGER NOT NULL,user_id INTEGER NOT NULL,message_id INTEGER NOT NULL,read_at TIMESTAMPTZ NOT NULL,PRIMARY KEY(room_id,user_id));
COMMIT;
