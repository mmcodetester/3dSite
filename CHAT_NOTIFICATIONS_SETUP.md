# Chat notifications: activation and Firebase setup

The code includes Android local notifications, browser notifications, and Firebase Cloud Messaging (FCM)
for Android messages received while the app is backgrounded or normally closed. Typing behavior is unchanged.
Firebase delivery has not been activated or tested against a real Firebase project: project configuration
and the notification-device database migration are still required.

## 1. Create the Firebase project and Android configuration

Firebase project **3DMaster Chat** (`dmaster-chat`) has been created after explicit user approval.
Project console: https://console.firebase.google.com/project/dmaster-chat/overview
The project uses the Spark plan, with optional Gemini and Analytics disabled. The user approved Firebase
setup only; the remote database migrations remain unapplied.

1. Sign in to https://console.firebase.google.com/ and create/select a project for this app.
2. Add an Android app with the exact package name **com.threedmaster.og**.
3. Download **google-services.json** and save it to:
   `2d_3d_frontend/android/app/google-services.json`
4. Use the same Firebase project for the backend below.

The existing Android build already applies Google's services plugin when this file exists. The web build
also detects the file and enables native push registration only when present, so local notifications can
work without calling an unconfigured Firebase SDK. Rebuild after adding it. No placeholder credentials
have been added.

Official Android setup: https://firebase.google.com/docs/cloud-messaging/android/client
Capacitor integration: https://capacitorjs.com/docs/apis/push-notifications

## 2. Configure the backend securely

Use Application Default Credentials on a supported Google-hosted environment. Otherwise, in Firebase
Project settings > Service accounts > Firebase Admin SDK, generate/download a service-account key and
provide it to the backend as a private deployment secret file. Keep the key outside both repositories;
do not paste its contents into chat or bundle it into the Android/web app.

Backend environment variables:

```dotenv
CHAT_PUSH_ENABLED=true
FIREBASE_PROJECT_ID=dmaster-chat
# Required for a private key file; omit when using a configured cloud Application Default Credential.
GOOGLE_APPLICATION_CREDENTIALS=/absolute/server/path/to/firebase-service-account.json
```

The server initializes Firebase lazily and sends only when `CHAT_PUSH_ENABLED=true`.
It excludes the sender and inactive/deleted/non-member accounts, uses the notification-plus-data payload
needed for closed-app Android display, and removes tokens rejected as unregistered. A message retry
with the same client ID does not send another push. FCM failures do not undo an already saved chat message.
Firebase requests are best effort; a durable push retry queue is not included.

Official server setup: https://firebase.google.com/docs/admin/setup
Official message delivery: https://firebase.google.com/docs/cloud-messaging/send/admin-sdk

## 3. Apply migrations and deploy

The configured database is remote. Automatic approval review previously blocked its migration because
explicit approval to change that database was missing. The migration commands have not been executed by this task.

Once approved, run from the backend directory:

```text
npm run migrate:chat
```

This applies the existing chat-room migration and the new `002-chat-notifications.sql` device table.
It preserves the original shared chat data. The runner is safe to repeat.
Restart/deploy the backend with its Firebase environment and credentials.

From the frontend directory:

```text
npm run sync:android
```

Then build/install a new Android APK through the existing Android project. Use Android Studio's bundled JDK 21; the system Java 8 cannot build this Capacitor project. The notification plugins,
Android 13 notification permission, channel, and small icon are included. Android cannot acquire these
native changes just by refreshing the existing app's webpage.

## 4. Enable and verify

- Sign in, open Chats, tap the bell, and allow the operating-system permission.
- Send a message from another account in a different chat: expect one local notification.
- While viewing that exact conversation, expect no local interruption.
- Background/close Android normally and send another message: Firebase should display it.
- Tap the notification: it must open the matching conversation for the signed-in account.
- The bell disappears after notifications are accepted. Manage operating-system permission in device/browser settings.
- Confirm retries and reconnects do not duplicate alerts; test logout/account switching.
- A force-stopped Android app must be manually reopened before delivery can resume.

The app handles local notifications when Firebase is not yet connected, but JavaScript/socket execution
can be suspended in the background. Reliable closed-app delivery requires the completed Firebase setup.

## Browser behavior

On HTTPS (or localhost), the bell requests browser notification permission. A notification service worker
shows alerts and opens the right conversation. It does not intercept normal page requests or cache the app.
Browser alerts depend on the app page receiving the message; closed-browser web push is outside this change.
Notifications for initial downloaded history, own messages, and the currently read conversation are suppressed.
Permissions are requested only when the user taps the bell; denied permissions can be changed in device settings.

## Checks

- Backend: `npm test` (uses mocked Firebase/database boundaries, no external delivery).
- Frontend: `npm test`, production build, Android asset/plugin sync.
- Real-device push verification remains pending the Firebase project, credentials, migration, and rebuilt APK.



