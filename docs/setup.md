# Setup

One-time setup for The Binder. Everything here is free; the only money you can ever spend is on **Identify with Claude** calls, which you trigger yourself. Nothing in this repository may contain your email address, API keys, passwords or the signing keystore: those live only in the places named below.

Do the steps in order. Steps 2 to 4 give you three public values used by the build (marked **keep**).

## 0. Repository

1. Rename the old GitHub repository to `the-binder-legacy` and keep it private.
2. Create a new public repository named `the-binder` and push this project to it. All commits must use your GitHub noreply address (`git config user.email` shows it).
3. In the new repository: **Settings > Code security** and turn on **Secret scanning** and **Push protection**.
4. Before pushing, delete the untracked leftover `src/api/` folder from the old .NET app.

## 1. Signing key

Android only installs an update if it is signed with the same key as the installed app. If you lose this key you must uninstall the app (deleting local data) and start over, so back it up first.

```
keytool -genkeypair -v -keystore release.jks -alias thebinder -keyalg RSA -keysize 2048 -validity 10000
```

- Pick a strong password. Store `release.jks` and the passwords in your password manager or an offline backup. Never commit them (`*.jks` and `*.keystore` are git-ignored).
- Print its fingerprints: `keytool -list -v -keystore release.jks -alias thebinder`. You need the **SHA-1** for step 2 and the **SHA-256** below.
- In the GitHub repository: **Settings > Secrets and variables > Actions**.
  - Secrets: `ANDROID_KEYSTORE_BASE64` (output of `base64 -w0 release.jks` in Git Bash), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`thebinder`), `ANDROID_KEY_PASSWORD`.
  - Variable (optional but recommended): `RELEASE_CERT_SHA256`, the SHA-256 fingerprint above. A release build then fails if it is signed with any other key.

## 2. Google Cloud (sign-in and Drive)

No billing account is needed or wanted; do not add one.

1. Create a project at https://console.cloud.google.com and **enable the Google Drive API**.
2. **OAuth consent screen**: user type External. Scopes (the Data Access page names them this way): `.../auth/drive.file`, `openid` and `.../auth/userinfo.email` only; remove any other scope, such as `gmail.readonly`, which is restricted and would force Google's verification. Then **publish the app to "In production"** (these scopes are non-sensitive, so no Google review is needed and tokens do not expire after 7 days).
3. **Credentials > Create credentials > OAuth client ID**:
   - **Web application** (no origins needed). Its client ID is `GOOGLE_WEB_CLIENT_ID` (**keep**). It is the app's `serverClientId` and the audience the proxy checks.
   - **Android** for package `io.github.kevinmgreer.thebinder` with the **release** key's SHA-1 (step 1).
   - **Android** for package `io.github.kevinmgreer.thebinder.debug` with the **debug** key's SHA-1: `keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android`. (The file appears after the first debug build.)
4. In the GitHub repository add the variable `GOOGLE_WEB_CLIENT_ID`. For local builds copy `.env.example` to `.env.local` and fill in `VITE_GOOGLE_WEB_CLIENT_ID`.

## 3. Cloudflare Worker (Claude proxy)

Free plan only. Run `npm install` once at the repo root (wrangler is a dev dependency there), then run these from the `worker/` folder.

If `npx wrangler` answers "'wrangler' is not recognized", the launcher files are missing from `node_modules/.bin`. Run `npm install` again, or call wrangler through node: from `worker/` use `node ..\node_modules\wrangler\bin\wrangler.js` in place of `npx wrangler` in every command below.

1. Create a free account at https://dash.cloudflare.com, then `npx wrangler login`. If the browser step fails (a VPN or firewall blocks the localhost callback on port 8976), create an API token instead: Cloudflare dashboard, My Profile, API Tokens, Create Token, the "Edit Cloudflare Workers" template. Set it for the terminal session with `$env:CLOUDFLARE_API_TOKEN = "<token>"` (PowerShell) and check it with `npx wrangler whoami`. Never put the token in a file or the repo.
2. `npx wrangler kv namespace create COUNTER` and paste the printed `id` into `wrangler.toml` (this id is not secret).
3. Set the three secrets (each command asks you to type the value, so it never lands in shell history or files):
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put OWNER_EMAIL
   npx wrangler secret put GOOGLE_WEB_CLIENT_ID
   ```
   `OWNER_EMAIL` is the Google account that may use the proxy. Requests from any other account are rejected before Claude is called.
4. `npx wrangler deploy`. Note the `https://the-binder-identify.<your-subdomain>.workers.dev` URL (**keep**; it is public by design and protected by the owner check).
5. Add it as the GitHub variable `IDENTIFY_URL` and as `VITE_IDENTIFY_URL` in `.env.local`.

The model and daily limit are plain variables in `wrangler.toml` (`MODEL`, `DAILY_LIMIT`, default 50 a day).

## 4. Anthropic spend limit

1. Create an API key at https://console.anthropic.com (this is the key you give the Worker in step 3; it never goes in the app).
2. In the Console, **set a monthly spend limit** as a second guard behind the Worker's daily cap. A card identification costs a cent or two.

## 5. Build and install on your phone

One-time Windows setup is already done on this machine if you used the assistant; otherwise install a JDK 21 and the Android SDK (platform 36, build-tools 36.0.0, platform-tools) and set `JAVA_HOME` and `ANDROID_HOME`.

1. Phone: **Settings > About phone**, tap **Build number** seven times; then **Developer options > USB debugging** on. Plug in and accept the "Allow USB debugging?" prompt.
2. From the repository root:
   ```
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
3. **The Binder (dev)** appears on the phone. It uses its own Drive folder, so testing never touches your real collection.

## 6. First release

```
git tag v0.1.0
git push origin v0.1.0
```

The workflow in `.github/workflows/release.yml` runs the tests, builds, signs with your key, verifies the signature, and attaches `the-binder-0.1.0.apk` to a GitHub Release. Download it on the phone (or `adb install`) and install it; it sits next to the dev app. Tags must look like `v1.2.3`; the version code is `major*10000 + minor*100 + patch`, so each release must have a higher number than the last.

Then work through [device-checklist.md](device-checklist.md).

## 7. Later: Android developer verification

Google is rolling out a requirement that apps on certified Android devices come from verified developers (global rollout 2027). ADB installs keep working. Before the rollout, register a free limited-distribution account with this package name and your release key so normal sideloading of the downloaded APK keeps working.
