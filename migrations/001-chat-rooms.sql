BEGIN;
CREATE TABLE IF NOT EXISTS tbl_chat_room (
 id SERIAL PRIMARY KEY, type VARCHAR(10) NOT NULL CHECK (type IN ('general','group','direct')),
 name VARCHAR(100), direct_key VARCHAR(80) UNIQUE, created_by INTEGER REFERENCES tbl_user(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO tbl_chat_room (type,name,direct_key) VALUES ('general','General','general') ON CONFLICT (direct_key) DO NOTHING;
CREATE TABLE IF NOT EXISTS tbl_chat_member (
 room_id INTEGER NOT NULL REFERENCES tbl_chat_room(id), user_id INTEGER NOT NULL REFERENCES tbl_user(id),
 PRIMARY KEY(room_id,user_id)
);
CREATE TABLE IF NOT EXISTS tbl_chat_message (
 id SERIAL PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES tbl_chat_room(id),
 sender_id INTEGER NOT NULL REFERENCES tbl_user(id), client_id VARCHAR(80) NOT NULL,
 text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 4000), date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS chat_message_sender_client ON tbl_chat_message(sender_id,client_id);
CREATE INDEX IF NOT EXISTS chat_message_room_cursor ON tbl_chat_message(room_id,id);
CREATE INDEX IF NOT EXISTS chat_member_user ON tbl_chat_member(user_id,room_id);
INSERT INTO tbl_chat_message(room_id,sender_id,client_id,text,date)
 SELECT (SELECT id FROM tbl_chat_room WHERE direct_key='general' AND type='general'),sender_id,'legacy-' || id,LEFT(text,4000),date FROM tbl_chat
 WHERE deleted IS NOT TRUE AND text IS NOT NULL AND length(text)>0
 ON CONFLICT(sender_id,client_id) DO NOTHING;
COMMIT;


