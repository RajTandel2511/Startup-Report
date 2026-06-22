/**
 * HVAC Startup Report — Apps Script backend
 *
 * Receives form submissions from index.html and appends one row per submission
 * to a Google Sheet. The "JSON Payload" column stores the full record so you
 * can re-parse it later or rebuild the full report.
 *
 * Setup (one time):
 *   1. Create a Google Sheet. Copy its ID from the URL
 *      (https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit).
 *   2. Paste the ID into SHEET_ID below.
 *   3. Deploy > New deployment > Type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *      - Authorize when prompted.
 *   4. Copy the /exec URL Apps Script gives you and paste it into
 *      index.html BACKEND_URL.
 */

const SHEET_ID = '1IUnIEfqLf4Vg-rmarBeUjltxR9LOFPD3-OxmLgQ82ZQ';   // HVAC Startup Reports
const SHEET_NAME = 'Submissions';

const COLUMNS = [
  'Received At',
  'Submitted At',
  'Job Name',
  'Date',
  'Technician',
  'Address',
  'Unit Brand',
  'Unit No',
  'Model',
  'Serial',
  'Tons',
  'Refrigerant',
  'Tech Signature',
  'Verified By',
  'User Agent',
  'JSON Payload',
];

function doPost(e) {
  try {
    if (!SHEET_ID) throw new Error('SHEET_ID is not set in Code.gs');
    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet_();

    sheet.appendRow([
      new Date(),
      payload._submittedAt || '',
      payload.jobName || '',
      payload.date || '',
      payload.tech || '',
      payload.address1 || '',
      payload.unitBrand || '',
      payload.unitNo || '',
      payload.model || '',
      payload.serial || '',
      payload.tons || '',
      payload.refrigerant || '',
      payload.techSignature || '',
      payload.reportVerified || '',
      payload._userAgent || '',
      JSON.stringify(payload),
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('HVAC Startup Report endpoint is live. POST JSON to submit a report.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}
