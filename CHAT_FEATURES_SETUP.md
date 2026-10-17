# Reply, seen, pins, and private attachments

Implemented in the backend and Vue/Android client. No remote database migration or code deployment was performed for this feature update.

## Activation

Run `npm run migrate:chat:features` (only migrations/003-chat-features.sql) against the configured database after approval, or deploy the backend with its existing non-destructive sync({ force: false }) to create the three new tables. Existing messages and tables are preserved. Do not use force:true or alter:true. The existing migration runner also contains earlier legacy-chat steps; use the dedicated SQL file for this update when those steps should remain untouched.

Deploy the backend before publishing the updated frontend/installing the feature APK. The new backend expects tbl_chat_attachment, tbl_chat_message_detail, and tbl_chat_read. No new environment variables or external storage account are required. Existing Firebase configuration remains in use.

## Behavior

- Reply snapshots belong to messages in the same authorized conversation. Offline replies persist in the device queue.
- Seen uses a monotonic per-account/per-room message cursor, shared across devices. The UI marks read only when the conversation is visible, the app is active, and the message list is at the bottom. Background notification delivery and history downloading do not mark seen.
- Conversation members can pin/unpin messages; changes sync across devices. The conversation header lists up to 50 recent pins.
- Photo/File uploads allow JPG/JPEG, PNG, GIF, WebP, PDF, TXT/CSV, ZIP, DOCX/XLSX/PPTX with matching file signatures where applicable. Maximum 10 MB/file and 100 MB stored/account. These are application limits; database-provider storage quotas still apply.
- Binary attachments are stored durably in PostgreSQL BYTEA rather than Render's ephemeral local filesystem. Upload IDs are deterministic per account/room/client message ID so transport retries do not duplicate storage. Filenames are normalized and downloads require current room access, are non-cacheable at the HTTP layer, and carry nosniff/attachment headers. This is file-type/size validation, not antivirus scanning.
- Received photos/files opened on a device have a separate account-scoped local cache, capped at 50 MB. Photos are loaded lazily. Android uses official Capacitor Filesystem/Share with the existing cache FileProvider; browser users download files. Offline outgoing files and their reply target survive app restarts. Files require an eventual connection to upload.
- No notification is emitted when a pin changes. Attachment-only new messages use a filename notification preview. Existing typing behavior is retained.

## Verification

Backend tests cover membership gates, room-scoped replies, idempotent reply/upload retries, file validation, private downloads, monotonic seen cursors, and pin/unpin events. Frontend tests cover offline attachment queues/retries, read-visibility guards, and structured-clone-safe reactive reply/attachment previews. Sample-data browser checks exercised reply sending, seen-reader lists, and pin/unpin controls. Android/device file picking, photo rendering, and native Share should additionally be tested on Samsung/Redmi after deployment.
