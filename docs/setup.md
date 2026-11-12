# Setup

One-time setup for The Binder. Everything here is free; the only money you can ever spend is on **Identify with Claude** calls, which you trigger yourself.

## How to read this page

- **Shell:** every command is for **PowerShell** unless a step says otherwise. Open it in VS Code with Terminal > New Terminal.
- **Folder:** each step says where to run it. "Repo root" is the folder that holds `package.json` (here `c:\repos\the-binder`).
- **Secrets:** a secret is typed into the tool that asks for it. Never paste one into a file, a commit, a chat or a command line that is saved in history. Nothing in this repository may contain your email address, API keys, passwords or the signing keystore.
- **Public values:** the Google web client ID and the Worker URL are not secret. They are baked into the app, so they live in two places: a GitHub variable (for release builds) and `.env.local` (for your own builds).
- **One-time:** run `npm install` once in the repo root before step 3. Wrangler, the Cloudflare tool, comes with it.

## Where each value goes

| Value | Made in | Used by |
|---|---|---|
| Release keystore (`release.jks`) and its passwords | step 1 | GitHub secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Keep a backup offline. |
| Release key SHA-256 | step 1 | GitHub variable `RELEASE_CERT_SHA256` |
| Release and debug key SHA-1 | step 1 | the two Android OAuth clients in step 2 |
| Google web client ID | step 2 | GitHub variable `GOOGLE_WEB_CLIENT_ID`, `VITE_GOOGLE_WEB_CLIENT_ID` in `.env.local`, Worker secret `GOOGLE_WEB_CLIENT_ID` |
| Worker URL | step 3 | GitHub variable `IDENTIFY_URL`, `VITE_IDENTIFY_URL` in `.env.local` |
| Anthropic API key | step 4 | Worker secret `ANTHROPIC_API_KEY` only. Never the app, GitHub or `.env.local`. |
| Your Google account email | you | Worker secret `OWNER_EMAIL` |

`gh` below is the GitHub command line tool. Check it with `gh auth status`. If you would rather click, the same names go in the repository under **Settings > Secrets and variables > Actions**.

## 0. Repository (already done)

The repository `kevinMgreer/the-binder` is public, with **Secret scanning** and **Push protection** on (Settings > Code security). The old .NET repository was renamed `the-binder-legacy` and is private. All commits use your GitHub noreply address (`git config user.email` shows it). If you ever set this up again from scratch, do those three things first.

## 1. Signing key

Android only installs an update if it is signed with the same key as the installed app. If you lose this key you must uninstall the app (deleting local data) and start over, so back it up first.

1. Create the key. Run this in any folder you will remember; it asks for a password and some details:
   ```
   keytool -genkeypair -v -keystore release.jks -alias thebinder -keyalg RSA -keysize 2048 -validity 10000
   ```
   If `keytool` is not recognized, it is in the JDK: `& "$env:JAVA_HOME\bin\keytool.exe" ...`.
2. Store `release.jks` and its passwords in your password manager or an offline backup. Never commit them (`*.jks` and `*.keystore` are git-ignored).
3. Print the fingerprints and keep the **SHA-1** (for step 2) and the **SHA-256**:
   ```
   keytool -list -v -keystore release.jks -alias thebinder
   ```
4. Put the key into GitHub. Run these in the folder that holds `release.jks`; the secret commands ask you to type the value:
   ```
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("release.jks")) | gh secret set ANDROID_KEYSTORE_BASE64 -R kevinMgreer/the-binder
   gh secret set ANDROID_KEYSTORE_PASSWORD -R kevinMgreer/the-binder
   gh secret set ANDROID_KEY_ALIAS -R kevinMgreer/the-binder
   gh secret set ANDROID_KEY_PASSWORD -R kevinMgreer/the-binder
   gh variable set RELEASE_CERT_SHA256 -R kevinMgreer/the-binder --body "<the SHA-256 from step 3>"
   ```
   The alias is `thebinder`. `RELEASE_CERT_SHA256` is optional but recommended: a release build then fails if it is signed with any other key.

Check: `gh secret list -R kevinMgreer/the-binder` shows the four secrets.

## 2. Google Cloud (sign-in and Drive)

No billing account is needed or wanted; do not add one.

1. Create a project at https://console.cloud.google.com and **enable the Google Drive API** (APIs and services > Library).
2. **OAuth consent screen**: user type External. Scopes (the Data Access page names them this way): `.../auth/drive.file`, `openid` and `.../auth/userinfo.email` only. Remove any other scope, such as `gmail.readonly`, which is restricted and would force Google's verification. Then **publish the app to "In production"**. These scopes are non-sensitive, so no Google review is needed and sign-in does not expire after 7 days.
3. **Credentials > Create credentials > OAuth client ID**. Make three clients:
   - **Web application** (no origins needed). Its client ID is the `GOOGLE_WEB_CLIENT_ID` used everywhere. Copy it.
   - **Android** for package `io.github.kevinmgreer.thebinder` with the **release** key's SHA-1 (step 1).
   - **Android** for package `io.github.kevinmgreer.thebinder.debug` with the **debug** key's SHA-1. The debug keystore appears after the first debug build (step 5):
     ```
     keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
     ```
4. Save the web client ID where the build reads it. From the repo root:
   ```
   gh variable set GOOGLE_WEB_CLIENT_ID -R kevinMgreer/the-binder --body "<web client ID>"
   Copy-Item .env.example .env.local
   ```
   Then open `.env.local` and fill in `VITE_GOOGLE_WEB_CLIENT_ID`. `.env.local` is git-ignored.

Check: sign-in works in the debug build (step 5). If Google says "developer error", the package name or the SHA-1 of the matching Android client is wrong.

## 3. Cloudflare Worker (Claude proxy)

Free plan only. Start from the repo root and run `npm install` there once.

1. Create a free account at https://dash.cloudflare.com, then log in:
   ```
   npx wrangler login
   npx wrangler whoami
   ```
   `whoami` should show your account. If the browser step fails (a VPN or firewall blocks the callback on port 8976), use an API token instead: Cloudflare dashboard > My Profile > API Tokens > Create Token > the "Edit Cloudflare Workers" template. Then `$env:CLOUDFLARE_API_TOKEN = "<token>"` in that terminal and run `whoami` again. The token lasts for that terminal only; never save it in a file.
2. Go to the worker folder: `cd worker`. Every remaining command in this step runs there.
3. Create the counter store and note the `id` it prints:
   ```
   npx wrangler kv namespace create COUNTER
   ```
   Open `wrangler.toml` and put that id in place of `REPLACE_WITH_KV_NAMESPACE_ID`. The id is not secret. Commit the change.
4. Set the three secrets. Each command asks you to type the value, so it never lands in shell history or files:
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put OWNER_EMAIL
   npx wrangler secret put GOOGLE_WEB_CLIENT_ID
   ```
   - `ANTHROPIC_API_KEY`: the key from step 4 below. Do that part first if you have no key yet.
   - `OWNER_EMAIL`: your Google account address. Any other account is rejected before Claude is called.
   - `GOOGLE_WEB_CLIENT_ID`: the web client ID from step 2.
5. Deploy:
   ```
   npx wrangler deploy
   ```
   It prints `https://the-binder-identify.<your-subdomain>.workers.dev`. That URL is public by design and protected by the owner check.
6. Save the URL where the build reads it. Back in the repo root:
   ```
   gh variable set IDENTIFY_URL -R kevinMgreer/the-binder --body "<the Worker URL>"
   ```
   and fill in `VITE_IDENTIFY_URL` in `.env.local` (no trailing slash).

The model and daily limit are plain variables in `wrangler.toml` (`MODEL`, `DAILY_LIMIT`, default 50 a day). Redeploy with `npx wrangler deploy` after changing them.

Check: build and install the app (step 5), open **Add card**, attach a front photo and tap **Identify with Claude**. Names should fill in. To watch what the Worker does, run `npx wrangler tail` in `worker/` while you try it.

**If `npx wrangler` says "'wrangler' is not recognized":** run `npm install` in the repo root and try again. As a last resort call it through node, from `worker/`: `node ..\node_modules\wrangler\bin\wrangler.js <command>` in place of `npx wrangler <command>`.

## 4. Anthropic spend limit

1. Create an API key at https://console.anthropic.com. This is the key you give the Worker in step 3; it never goes in the app.
2. In the Console, **set a monthly spend limit** as a second guard behind the Worker's daily cap. A card identification costs a cent or two.

## 5. Build and install on your phone

One-time Windows setup: install a JDK 21 and the Android SDK (platform 36, build-tools 36.0.0, platform-tools), then set the paths for the terminal you build in (example paths; use yours):

```
$env:JAVA_HOME = "C:\Users\<you>\AppData\Local\Programs\Temurin21\jdk-21.0.13+9"
$env:ANDROID_HOME = "C:\Users\<you>\AppData\Local\Android\Sdk"
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
```

1. Phone: **Settings > About phone**, tap **Build number** seven times, then **Developer options > USB debugging** on. Plug in and accept the "Allow USB debugging?" prompt. `& $adb devices` should list the phone as `device`, not `unauthorized`.
2. From the repo root (the build reads `.env.local`, so fill it in first):
   ```
   npm run build
   npx cap sync android
   cd android
   .\gradlew.bat assembleDebug
   & $adb install -r app\build\outputs\apk\debug\app-debug.apk
   ```
   With more than one device attached add `-s <serial>` after `adb`.
3. **The Binder (dev)** appears on the phone. It uses its own Drive folder, so testing never touches your real collection.

`npx cap sync android` can mark two Gradle files as changed (`android/app/capacitor.build.gradle`, `android/capacitor.settings.gradle`). Only line endings differ; discard them with `git checkout -- <file>`.

## 6. First release

```
git tag v0.1.0
git push origin v0.1.0
```

The workflow in `.github/workflows/release.yml` runs the tests, builds, signs with your key, verifies the signature and attaches `the-binder-0.1.0.apk` to a GitHub Release. Download it on the phone (or `adb install`) and install it; it sits next to the dev app. Tags must look like `v1.2.3`; the version code is `major*10000 + minor*100 + patch`, so each release must have a higher number than the last.

It needs the four signing secrets and the variables `GOOGLE_WEB_CLIENT_ID` and `IDENTIFY_URL`. Check them first with `gh secret list` and `gh variable list` (add `-R kevinMgreer/the-binder` outside the repo folder).

Then work through [device-checklist.md](device-checklist.md).

## 7. Later: Android developer verification

Google is rolling out a requirement that apps on certified Android devices come from verified developers (global rollout 2027). ADB installs keep working. Before the rollout, register a free limited-distribution account with this package name and your release key so normal sideloading of the downloaded APK keeps working.
