# HVAC Startup Report — Cloud Submit Setup

The PWA at https://rajtandel2511.github.io/Startup-Report/ already saves a draft
to each device's `localStorage`. To also collect every submitted report into one
central Google Sheet, do the **one-time setup below**. It takes about 5 minutes
and costs nothing (uses your normal Google account).

## Architecture

```
Field tech taps "Submit"
        │
        ▼
index.html  ──POST JSON──►  Apps Script web app  ──appendRow──►  Google Sheet
                                                                  (one row per submission)
```

Every submitted report becomes one row. The full form payload is stored
verbatim in the last column (`JSON Payload`) so nothing is ever lost — even if
new form fields are added later.

## Step 1 — Create the Google Sheet

1. Go to https://sheets.new — this creates a blank sheet.
2. Rename it something like **HVAC Startup Reports**.
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<THIS_IS_THE_ID>`**`/edit`

## Step 2 — Create the Apps Script web app

1. Go to https://script.google.com → **New project**.
2. Delete the default `Code.gs` content.
3. Paste in the contents of **`apps-script/Code.gs`** from this repo.
4. Replace `const SHEET_ID = '';` with your Sheet ID from Step 1.
5. **File → Save** (give the project any name, e.g. `Startup-Report-Backend`).

## Step 3 — Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon (top-right of the dialog) and pick **Web app**.
3. Fill in:
   - **Description**: `Startup Report v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`  *(this is REQUIRED so the public form can POST)*
4. Click **Deploy**.
5. Google will prompt for authorization the first time — click **Authorize access**,
   pick your account, click **Advanced → Go to (unsafe) → Allow**.
   (It says "unsafe" only because the script is unverified — you wrote it.)
6. Google gives you a **Web app URL** ending in `/exec`. **Copy it.**

## Step 4 — Wire the URL into the form

1. Open `index.html` in this repo.
2. Find this line (near "CLOUD SUBMIT"):
   ```js
   const BACKEND_URL = '';
   ```
3. Paste the `/exec` URL from Step 3 between the quotes:
   ```js
   const BACKEND_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Commit and push:
   ```
   git add index.html
   git commit -m "Wire BACKEND_URL for cloud submit"
   git push
   ```
5. Wait ~1 minute for GitHub Pages to rebuild.

## Step 5 — Test

1. Open https://rajtandel2511.github.io/Startup-Report/ on any device.
2. Fill out a few fields (or click **Sample** to load demo data).
3. Tap **Submit** — you should see a green "Report submitted" toast.
4. Open your Google Sheet — a new row should be there.

## Re-deploying after editing Code.gs

Apps Script keeps the same `/exec` URL only if you **manage the existing
deployment**:

- **Deploy → Manage deployments → pencil icon → Version: New → Deploy**.

If you click **New deployment** again, you'll get a brand-new URL and have to
update `BACKEND_URL` again.

## Troubleshooting

- **Toast says "Cloud submit not configured"** → `BACKEND_URL` is still empty in
  `index.html`. Do Step 4.
- **Toast says "Submit failed"** → check the Apps Script execution log
  (Apps Script editor → **Executions** in the left sidebar) for the error.
- **No row appears** → make sure `SHEET_ID` in `Code.gs` matches the Sheet's URL
  and that you re-deployed after editing.
- **Want to see submissions in real time** → in the Sheet, **Tools →
  Notification rules** can email you when any change happens.
