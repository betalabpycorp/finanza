/**
 * MisFinanzas - backend en Google Apps Script.
 * Guarda los movimientos (ventas, compras, gastos) en una hoja de esta
 * misma planilla, llamada "Movimientos" (se crea sola si no existe).
 */

const SHEET_NAME = 'Movimientos';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('MisFinanzas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Fecha', 'Tipo', 'Descripcion', 'Monto']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value;
}

/** Devuelve todos los movimientos guardados, como lista de objetos. */
function listEntries() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    rows.push({
      id: String(r[0]),
      date: formatDate_(r[1]),
      type: r[2],
      desc: r[3],
      amount: Number(r[4])
    });
  }
  return rows;
}

/** Agrega un movimiento nuevo. entry: {type, desc, amount, date} */
function addEntry(entry) {
  const sheet = getSheet_();
  const id = new Date().getTime().toString();
  sheet.appendRow([id, entry.date, entry.type, entry.desc, entry.amount]);
  return id;
}

/** Elimina un movimiento por su id. */
function deleteEntry(id) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return true;
}
