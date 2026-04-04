/**
 * Google Apps Script — alinhado a PainelCoordenador.html
 *
 * Planilha:
 *   Aba "Extras":  A=Data | B=Hora | C=Missa | D=Ministros | E=Obs
 *   Aba "Regras":  A=Regra | B=Hora | C=Missa | D=Ministros | E=Obs
 *
 * Configuração:
 *   1) Crie uma planilha com as abas "Extras" e "Regras" (ou ajuste os nomes abaixo).
 *   2) Cole o ID da planilha em SPREADSHEET_ID (URL: .../spreadsheets/d/ESTE_ID/edit).
 *      Se o projeto estiver VINCULADO à planilha (Extensões > Apps Script), pode deixar '' e usar só getActiveSpreadsheet().
 *   3) Implante como app da Web: Executar como = você | Quem tem acesso = qualquer pessoa (para o HTML externo ler/gravar).
 */

var SPREADSHEET_ID = '11fV62v1MY-w4b7RrPXJwiDhSiY03kS5vkvL_tv--Kos';
var SHEET_EXTRAS = 'Extras';
var SHEET_REGRAS = 'Regras';

function getSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Defina SPREADSHEET_ID no Code.gs ou abra o editor a partir da planilha (projeto vinculado).');
  }
  return ss;
}

function getSheet_(name) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    throw new Error('Aba não encontrada: "' + name + '". Crie a aba ou ajuste SHEET_EXTRAS / SHEET_REGRAS.');
  }
  return sh;
}

/**
 * GET → JSON { extras: [...], regras: [...] }
 * Cada linha é um array de células (índices 0..n), como retorna getValues().
 */
function doGet(e) {
  try {
    var extras = getSheet_(SHEET_EXTRAS).getDataRange().getValues();
    var regras = getSheet_(SHEET_REGRAS).getDataRange().getValues();
    return jsonOut_({ extras: extras, regras: regras });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}

/**
 * POST body JSON:
 *   { "action": "addEscala", "data", "hora", "missa", "ministro", "obs" }
 *   { "action": "addRegra", "regra", "hora", "missa", "ministro", "obs" }
 */
function doPost(e) {
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.action) {
      body = e.parameter;
    } else {
      return jsonOut_({ ok: false, error: 'Corpo vazio ou inválido' });
    }

    var action = String(body.action || '').trim();

    if (action === 'addEscala') {
      var data = body.data || '';
      var hora = body.hora || '';
      var missa = body.missa || '';
      var ministro = body.ministro || '';
      var obs = body.obs != null ? String(body.obs) : '';
      if (!data) {
        return jsonOut_({ ok: false, error: 'Campo data obrigatório' });
      }
      getSheet_(SHEET_EXTRAS).appendRow([data, hora, missa, ministro, obs]);
      return jsonOut_({ ok: true });
    }

    if (action === 'addRegra') {
      var regra = body.regra || '';
      var h = body.hora || '';
      var m = body.missa || '';
      var mi = body.ministro || '';
      var obsRegra = body.obs != null ? String(body.obs) : '';
      if (!regra) {
        return jsonOut_({ ok: false, error: 'Campo regra obrigatório' });
      }
      getSheet_(SHEET_REGRAS).appendRow([regra, h, m, mi, obsRegra]);
      return jsonOut_({ ok: true });
    }

    return jsonOut_({ ok: false, error: 'Ação desconhecida: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Opcional: rode uma vez no editor para criar abas e cabeçalhos.
 */
function setupPlanilhaMESC() {
  var ss = getSpreadsheet_();
  ensureSheetWithHeaders_(ss, SHEET_EXTRAS, ['Data', 'Hora', 'Missa', 'Ministros', 'Obs']);
  ensureSheetWithHeaders_(ss, SHEET_REGRAS, ['Regra', 'Hora', 'Missa', 'Ministros', 'Obs']);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  } else {
    var first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
    var empty = first.every(function (c) { return c === '' || c === null; });
    if (empty) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
}
