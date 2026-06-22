/**
 * HVAC Startup Report — Apps Script backend
 *
 * Receives form submissions from index.html and appends one row per submission
 * to a Google Sheet. Every form field gets its own labeled column. A final
 * "JSON Payload" column stores the full record so nothing is ever lost, even
 * if the form adds new fields before this file is updated.
 */

const SHEET_ID = '1IUnIEfqLf4Vg-rmarBeUjltxR9LOFPD3-OxmLgQ82ZQ';   // HVAC Startup Reports
const SHEET_NAME = 'Submissions';

// Ordered [internal field name, human-readable column header].
// Order here is the column order in the sheet.
const FIELDS = [
  // --- Job header ---
  ['jobName',                 'Job Name'],
  ['date',                    'Date'],
  ['tech',                    'Technician'],
  ['address1',                'Address'],

  // --- Unit data ---
  ['unitBrand',               'Unit Brand'],
  ['unitNo',                  'Unit No'],
  ['unitType',                'Unit Type'],
  ['model',                   'Model'],
  ['serial',                  'Serial'],
  ['tons',                    'Tons'],
  ['refrigerant',             'Refrigerant'],
  ['btuInput',                'BTU Input'],
  ['phaseCorrected',          'Phase Corrected'],

  // --- Voltages ---
  ['inputV_L1',               'Input V — L1'],
  ['inputV_L2',               'Input V — L2'],
  ['inputV_L3',               'Input V — L3'],
  ['opV_L1',                  'Operating V — L1'],
  ['opV_L2',                  'Operating V — L2'],
  ['opV_L3',                  'Operating V — L3'],

  // --- Compressors (4) ---
  ['comp1_a1',                'Comp 1 — L1 A'],
  ['comp1_a2',                'Comp 1 — L2 A'],
  ['comp1_a3',                'Comp 1 — L3 A'],
  ['comp1_pressure',          'Comp 1 — Suction/Liquid PSI'],
  ['comp2_a1',                'Comp 2 — L1 A'],
  ['comp2_a2',                'Comp 2 — L2 A'],
  ['comp2_a3',                'Comp 2 — L3 A'],
  ['comp2_pressure',          'Comp 2 — Suction/Liquid PSI'],
  ['comp3_a1',                'Comp 3 — L1 A'],
  ['comp3_a2',                'Comp 3 — L2 A'],
  ['comp3_a3',                'Comp 3 — L3 A'],
  ['comp3_pressure',          'Comp 3 — Suction/Liquid PSI'],
  ['comp4_a1',                'Comp 4 — L1 A'],
  ['comp4_a2',                'Comp 4 — L2 A'],
  ['comp4_a3',                'Comp 4 — L3 A'],
  ['comp4_pressure',          'Comp 4 — Suction/Liquid PSI'],

  // --- Refrigerant ---
  ['subCooling',              'Sub Cooling'],
  ['totalRefAdded',           'Total Refrigerant Added'],

  // --- Condenser fans (4) ---
  ['cfan1_a1',                'CFan 1 — L1 A'],
  ['cfan1_a2',                'CFan 1 — L2 A'],
  ['cfan1_a3',                'CFan 1 — L3 A'],
  ['cfan2_a1',                'CFan 2 — L1 A'],
  ['cfan2_a2',                'CFan 2 — L2 A'],
  ['cfan2_a3',                'CFan 2 — L3 A'],
  ['cfan3_a1',                'CFan 3 — L1 A'],
  ['cfan3_a2',                'CFan 3 — L2 A'],
  ['cfan3_a3',                'CFan 3 — L3 A'],
  ['cfan4_a1',                'CFan 4 — L1 A'],
  ['cfan4_a2',                'CFan 4 — L2 A'],
  ['cfan4_a3',                'CFan 4 — L3 A'],

  // --- Indoor Fan Motor ---
  ['ifm_rated_a1',            'IFM Rated — L1 A'],
  ['ifm_rated_a2',            'IFM Rated — L2 A'],
  ['ifm_rated_a3',            'IFM Rated — L3 A'],
  ['ifm_actual_a1',           'IFM Actual — L1 A'],
  ['ifm_actual_a2',           'IFM Actual — L2 A'],
  ['ifm_actual_a3',           'IFM Actual — L3 A'],
  ['vfd',                     'VFD'],
  ['motorHp',                 'Motor HP'],
  ['filterSize',              'Filter Size'],
  ['beltSize',                'Belt Size'],

  // --- Gas ---
  ['inputGasPres',            'Input Gas Pressure'],
  ['outputGasPres',           'Output Gas Pressure'],
  ['gasLeakInitial',          'Gas Leak Initial'],

  // --- Temperatures ---
  ['ambTemp',                 'Ambient Temp'],
  ['retAirTemp',              'Return Air Temp'],
  ['coolingTemp',             'Cooling Temp'],
  ['heatingTemp',             'Heating Temp'],

  // --- Checklist (Y/N/NA) ---
  ['unitLevel',               'Unit level'],
  ['txvVerified',             'Verify correct TXV'],
  ['filtersInstalled',        'Filters installed'],
  ['filterAccessible',        'Filter accessible'],
  ['condensateDrainInstalled','Condensate drain installed'],
  ['condensatePumpedPowered', 'Condensate pump powered'],
  ['pumpSafetyInterlocked',   'Pump safety interlocked'],
  ['smokeDetectorInterlocked','Smoke detector interlocked'],
  ['condensatePTrapped',      'Condensate P-trapped'],
  ['condensatePrimed',        'Condensate primed'],
  ['economizerTested',        'Economizer tested'],
  ['outsideAirDamperAdjusted','OA damper adjusted'],
  ['powerExhaustTested',      'Power exhaust tested'],
  ['thermostatsProgrammed',   'Thermostats programmed'],
  ['fireDampersOpen',         'Fire dampers open'],
  ['coilFinsRepaired',        'Coil fins repaired'],
  ['unitDoorsSecured',        'Unit doors secured'],
  ['areaCleanedUp',           'Area cleaned up'],

  // --- Sign-off ---
  ['comments',                'Comments'],
  ['techSignature',           'Tech Signature'],
  ['techSignatureDate',       'Tech Signature Date'],
  ['reportVerified',          'Verified By'],
  ['reportVerifiedDate',      'Verified Date'],
];

// Two metadata columns at the very front, one safety column at the very end.
const META_HEADERS_FRONT = ['Received At', 'Submitted At'];
const META_HEADERS_BACK  = ['User Agent', 'JSON Payload'];

const ALL_HEADERS = []
  .concat(META_HEADERS_FRONT)
  .concat(FIELDS.map(function (p) { return p[1]; }))
  .concat(META_HEADERS_BACK);

function doPost(e) {
  try {
    if (!SHEET_ID) throw new Error('SHEET_ID is not set in Code.gs');
    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet_();

    const row = [];
    row.push(new Date());
    row.push(payload._submittedAt || '');
    for (var i = 0; i < FIELDS.length; i++) {
      var key = FIELDS[i][0];
      var v = payload[key];
      row.push(v === undefined || v === null ? '' : v);
    }
    row.push(payload._userAgent || '');
    row.push(JSON.stringify(payload));

    sheet.appendRow(row);

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

  const lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    // Fresh sheet — write the full header.
    writeHeader_(sheet);
  } else {
    // Existing sheet — check if headers match. If not, rewrite ONLY the header
    // row. (Will not touch existing data rows.)
    const width = sheet.getLastColumn();
    const current = sheet.getRange(1, 1, 1, width).getValues()[0];
    const matches = current.length === ALL_HEADERS.length &&
      ALL_HEADERS.every(function (h, idx) { return current[idx] === h; });
    if (!matches) writeHeader_(sheet);
  }
  return sheet;
}

function writeHeader_(sheet) {
  sheet.getRange(1, 1, 1, ALL_HEADERS.length).setValues([ALL_HEADERS]);
  sheet.getRange(1, 1, 1, ALL_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#f1f5f9');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
}
