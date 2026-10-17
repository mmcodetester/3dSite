# Group, individual, and offline chat

## Database setup

From this backend directory run `npm run migrate:chat` using the intended environment's `DB_URL`.
This is an explicit database change; it is not run automatically by the chat feature.

The transactional migration adds room, membership, and message tables and creates General.
Existing non-deleted messages from `tbl_chat` are copied into General. The original table is retained.
The migration can be rerun safely: legacy messages and General are not duplicated.
A unique sender/client-message index makes sending after a lost connection safe to retry.

Deploy/restart the backend and deploy the frontend together after migration. Existing clients use the
previous chat API contract and should refresh/update. Build Android assets with the existing
`sync:android` script when preparing a new Android release.

## Using chat

- General is shared with all active signed-in accounts.
- Use the group button to name a group and select its members. The creator is included.
- Use People to open an individual chat. Reopening the same pair reuses the conversation.
- All / Online / Offline filters show current availability while connected.
- Presence stays online while at least one signed-in app tab/device is connected. Disconnects may
  take the Socket.IO heartbeat timeout to appear offline. Availability is unknown while your own
  connection is offline.
- Messages to offline recipients are stored on the server and fetched when they return.
- When your own connection is offline, cached chats remain available. Messages queue locally and
  retry when connected. Queued and Sent indicate local queue/server acceptance, not delivery/read receipts.
- Offline group creation or starting a new individual conversation requires reconnecting first.
- The queue and history are scoped to the signed-in account on the current device. Clearing browser
  storage removes unsent local messages. Group membership is selected at creation; member editing is
  outside this change.

## Access and deployment

REST endpoints require an active authenticated user. Private history, sending, and typing require
conversation membership. A separate authenticated `/chat` socket namespace delivers only to each
user's room. Anonymous sockets in the existing application namespace do not receive chat messages.

Presence and room delivery currently assume one backend process, matching the existing application.
Multiple backend instances require a shared Socket.IO adapter and shared presence state before scaling.

## Verification

Backend: `node --test tests/*.test.js`
Frontend: `node --test tests/*.test.mjs` and `npm run build`
Tests use isolated database/socket boundaries and do not change `DB_URL` data.
