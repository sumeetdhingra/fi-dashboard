/**
 * FI Dashboard — Google Apps Script backend
 * --------------------------------------------------------------
 * 1. Open your Google Sheet → Extensions → Apps Script.
 * 2. Replace the default code with this entire file.
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployed Web App URL (ends in /exec) and paste
 *    it into the dashboard's Settings tab.
 *
 * Two sheets are auto-created in the bound spreadsheet:
 *   "Common"      → key/value pairs of common inputs
 *   "Investments" → one row per investment
 */

const SHEET_COMMON = 'Common';
const SHEET_INV    = 'Investments';

const COMMON_KEYS = ['currentAge', 'needsUSA', 'needsIndia', 'dollarToInr', 'inflationUSA', 'inflationIndia'];
const INV_HEADERS = ['account', 'amount', 'yearlyContribution', 'yearlyReturn', 'type'];

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'read';
    if (action === 'read') return jsonResponse({ ok: true, data: readAll_() });
    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action === 'write') {
      writeAll_(body.data || {});
      return jsonResponse({ ok: true, data: readAll_() });
    }
    if (body.action === 'read') {
      return jsonResponse({ ok: true, data: readAll_() });
    }
    return jsonResponse({ ok: false, error: 'Unknown action: ' + body.action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message || err) });
  }
}

/* ---------- Sheet helpers ---------- */

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function readAll_() {
  const commonSheet = getOrCreateSheet_(SHEET_COMMON, ['key', 'value']);
  const invSheet    = getOrCreateSheet_(SHEET_INV, INV_HEADERS);

  // Common
  const common = {};
  const cVals = commonSheet.getDataRange().getValues();
  for (let i = 1; i < cVals.length; i++) {
    const [k, v] = cVals[i];
    if (k) common[k] = v === '' ? '' : v;
  }

  // Investments
  const investments = [];
  const iVals = invSheet.getDataRange().getValues();
  if (iVals.length > 1) {
    const headers = iVals[0];
    for (let r = 1; r < iVals.length; r++) {
      const row = iVals[r];
      if (row.every(c => c === '' || c === null)) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx]; });
      // Coerce numerics
      ['amount', 'yearlyContribution', 'yearlyReturn'].forEach(k => {
        if (obj[k] === '' || obj[k] == null) obj[k] = 0;
        else obj[k] = Number(obj[k]);
      });
      investments.push(obj);
    }
  }

  return { common, investments };
}

function writeAll_(payload) {
  const common = payload.common || {};
  const investments = Array.isArray(payload.investments) ? payload.investments : [];

  // Common
  const commonSheet = getOrCreateSheet_(SHEET_COMMON, ['key', 'value']);
  commonSheet.clear();
  commonSheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]).setFontWeight('bold');
  const rows = COMMON_KEYS.map(k => [k, common[k] === undefined ? '' : common[k]]);
  if (rows.length) commonSheet.getRange(2, 1, rows.length, 2).setValues(rows);

  // Investments
  const invSheet = getOrCreateSheet_(SHEET_INV, INV_HEADERS);
  invSheet.clear();
  invSheet.getRange(1, 1, 1, INV_HEADERS.length).setValues([INV_HEADERS]).setFontWeight('bold');
  if (investments.length) {
    const data = investments.map(inv => INV_HEADERS.map(h => inv[h] === undefined ? '' : inv[h]));
    invSheet.getRange(2, 1, data.length, INV_HEADERS.length).setValues(data);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
