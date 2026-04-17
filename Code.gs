/**
 * Google Apps Script — MESC Paróquia
 *
 * Planilha:
 *   Aba "Extras":    A=Local | B=Data  | C=Hora | D=Missa | E=Ministros | F=Obs
 *   Aba "Regras":    A=Local | B=Regra | C=Hora | D=Missa | E=Ministros | F=Obs
 *   Aba "Ministros": A=Nome | B=Local
 *   Aba "Tokens":    A=Paroquia | B=Login | C=Codigo
 *   Aba "Avisos":    A=Data | B=Hora | C=Mensagem | D=Local | E=Zap | F=Calendar
 *
 * Locais suportados: Matriz | SaoJudas | SaoFrancisco | SaoSebastiao
 *
 * Configuração:
 *   1) Cole o ID da planilha em SPREADSHEET_ID.
 *   2) Implante como App da Web: Executar como = você | Acesso = qualquer pessoa.
 *   3) Rode setupPlanilhaMESC() uma vez para criar as abas e cabeçalhos.
 */

var SPREADSHEET_ID  = '11fV62v1MY-w4b7RrPXJwiDhSiY03kS5vkvL_tv--Kos';
var SHEET_EXTRAS    = 'Extras';
var SHEET_REGRAS    = 'Regras';
var SHEET_MINISTROS = 'Ministros';
var SHEET_TOKENS    = 'Tokens';
var SHEET_AVISOS    = 'Avisos';

/* ── helpers ─────────────────────────────────────────────────────────────── */

/**
 * Converts a spreadsheet cell value to a plain serializable type.
 * Date objects (dates and time-only values) are formatted as local strings
 * using the script timezone so that JSON output is always human-readable.
 */
function formatCell_(v) {
  if (v instanceof Date) {
    var tz = Session.getScriptTimeZone();
    // Time-only values in Google Sheets use 1899-12-30 or 1900-01-01 as base date
    if (v.getFullYear() <= 1900) {
      return Utilities.formatDate(v, tz, 'HH:mm');
    }
    return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  }
  return v;
}

function formatRows_(rows) {
  return rows.map(function(row) {
    return row.map(formatCell_);
  });
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Defina SPREADSHEET_ID no Code.gs ou abra o editor a partir da planilha.');
  return ss;
}

function getOrCreateSheet_(name, headers) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (headers && headers.length) sh.appendRow(headers);
  }
  return sh;
}

/* ── GET ─────────────────────────────────────────────────────────────────── */

/**
 * GET ?local=Matriz  →  JSON { extras, regras, avisos, ministros, abas }
 * Se "local" for omitido, retorna todos os registros sem filtro.
 */
function doGet(e) {
  try {
    var local = (e && e.parameter && e.parameter.local) ? String(e.parameter.local).trim() : '';

    var extrasAll    = getOrCreateSheet_(SHEET_EXTRAS,    ['Local','Data','Hora','Missa','Ministros','Obs']).getDataRange().getValues();
    var regrasAll    = getOrCreateSheet_(SHEET_REGRAS,    ['Local','Regra','Hora','Missa','Ministros','Obs']).getDataRange().getValues();
    var avisosAll    = getOrCreateSheet_(SHEET_AVISOS,    ['Data','Hora','Mensagem','Local','Zap','Calendar']).getDataRange().getValues();
    var ministrosAll = getOrCreateSheet_(SHEET_MINISTROS, ['Nome','Local']).getDataRange().getValues();

    var lc = local.toLowerCase();

    var extras = local
      ? extrasAll.filter(function(r, i) { return i === 0 || String(r[0]).trim().toLowerCase() === lc; })
      : extrasAll;

    var regras = local
      ? regrasAll.filter(function(r, i) { return i === 0 || String(r[0]).trim().toLowerCase() === lc; })
      : regrasAll;

    var avisos = local
      ? avisosAll.filter(function(r, i) { return i === 0 || String(r[3]).trim().toLowerCase() === 'todos' || String(r[3]).trim().toLowerCase() === lc; })
      : avisosAll;

    // Filter ministers by local strictly: a minister is visible only in the local where
    // they were registered. Legacy rows without Local are NOT shown in any specific local
    // (but still shown when no local filter is given, so a coordinator can migrate them).
    var ministros = local
      ? ministrosAll.filter(function(r, i) { return i === 0 || (r[1] && String(r[1]).trim().toLowerCase() === lc); })
      : ministrosAll;

    var abas = getSpreadsheet_().getSheets().map(function(s) { return s.getName(); });

    return jsonOut_({
      extras:    formatRows_(extras),
      regras:    formatRows_(regras),
      avisos:    formatRows_(avisos),
      ministros: formatRows_(ministros),
      abas:      abas
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}

/* ── POST ────────────────────────────────────────────────────────────────── */

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

    /* ── Escalas ── */
    if (action === 'addEscala') {
      var localE = body.local || 'Matriz';
      var dataE  = body.data  || '';
      if (!dataE) return jsonOut_({ ok: false, error: 'Campo data obrigatório' });
      getOrCreateSheet_(SHEET_EXTRAS, ['Local','Data','Hora','Missa','Ministros','Obs'])
        .appendRow([localE, dataE, body.hora || '', body.missa || '', body.ministro || '', body.obs != null ? String(body.obs) : '']);
      return jsonOut_({ ok: true });
    }

    if (action === 'addRegra') {
      var localR = body.local || 'Matriz';
      var regra  = body.regra || '';
      if (!regra) return jsonOut_({ ok: false, error: 'Campo regra obrigatório' });
      getOrCreateSheet_(SHEET_REGRAS, ['Local','Regra','Hora','Missa','Ministros','Obs'])
        .appendRow([localR, regra, body.hora || '', body.missa || '', body.ministro || '', body.obs != null ? String(body.obs) : '']);
      return jsonOut_({ ok: true });
    }

    /* ── Ministros ── */
    if (action === 'addMinistro') {
      var nome = body.nome || '';
      var localM = String(body.local || '');
      if (!nome) return jsonOut_({ ok: false, error: 'Nome obrigatório' });
      getOrCreateSheet_(SHEET_MINISTROS, ['Nome','Local']).appendRow([nome, localM]);
      return jsonOut_({ ok: true });
    }

    if (action === 'removerMinistro') {
      var nomeRem = body.nome || '';
      var localRem = String(body.local || '').toLowerCase();
      var shM = getOrCreateSheet_(SHEET_MINISTROS, ['Nome','Local']);
      var rowsM = shM.getDataRange().getValues();
      for (var i = rowsM.length - 1; i >= 0; i--) {
        if (String(rowsM[i][0]) === nomeRem) {
          if (!localRem || !rowsM[i][1] || String(rowsM[i][1]).toLowerCase() === localRem) {
            shM.deleteRow(i + 1); break;
          }
        }
      }
      return jsonOut_({ ok: true });
    }

    /* ── Avisos ── */
    if (action === 'addAviso') {
      var msg = body.mensagem || '';
      if (!msg) return jsonOut_({ ok: false, error: 'Mensagem obrigatória' });
      getOrCreateSheet_(SHEET_AVISOS, ['Data','Hora','Mensagem','Local','Zap','Calendar'])
        .appendRow([body.data || '', body.hora || '', msg, body.local || 'Todos', body.zap ? '1' : '0', body.calendar ? '1' : '0']);
      return jsonOut_({ ok: true });
    }

    /* ── Abas / Planilha ── */
    if (action === 'criarAba') {
      var nomeAba  = body.nomeAba  || '';
      var headersA = body.headers  || [];
      if (!nomeAba) return jsonOut_({ ok: false, error: 'Nome da aba obrigatório' });
      var ss2 = getSpreadsheet_();
      if (ss2.getSheetByName(nomeAba)) return jsonOut_({ ok: false, error: 'Aba já existe: ' + nomeAba });
      var shNew = ss2.insertSheet(nomeAba);
      if (headersA.length) shNew.appendRow(headersA);
      return jsonOut_({ ok: true });
    }

    /* ── Tokens ── */
    if (action === 'verificarToken') {
      var par = String(body.paroquia || '').toUpperCase().trim();
      var log = String(body.login    || '').toUpperCase().trim();
      var cod = String(body.codigo   || '').toUpperCase().trim();
      var shT = getOrCreateSheet_(SHEET_TOKENS, ['Paroquia','Login','Codigo']);
      var rowsT = shT.getDataRange().getValues();
      for (var i = 1; i < rowsT.length; i++) {
        var rPar = String(rowsT[i][0]).toUpperCase().trim();
        var rLog, rCod;
        // Support both legacy 2-column layout (Paroquia|Codigo) and new 3-column (Paroquia|Login|Codigo)
        if (rowsT[i].length >= 3 && String(rowsT[i][2]).trim() !== '') {
          rLog = String(rowsT[i][1]).toUpperCase().trim();
          rCod = String(rowsT[i][2]).toUpperCase().trim();
        } else {
          rLog = '';
          rCod = String(rowsT[i][1]).toUpperCase().trim();
        }
        if (rPar !== par) continue;
        if (rCod !== cod) continue;
        // If the stored row has a login, require the submitted login to match it.
        // If the stored row has no login (legacy), accept any login value.
        if (rLog && rLog !== log) continue;
        return jsonOut_({ ok: true });
      }
      return jsonOut_({ ok: false, error: 'Código, login ou paróquia inválidos' });
    }

    if (action === 'cadastrarToken') {
      var parC = String(body.paroquia || '').toUpperCase().trim();
      var logC = String(body.login    || '').toUpperCase().trim();
      var codC = String(body.codigo   || '').toUpperCase().trim();
      if (!parC || !codC) return jsonOut_({ ok: false, error: 'Campos obrigatórios' });
      getOrCreateSheet_(SHEET_TOKENS, ['Paroquia','Login','Codigo']).appendRow([parC, logC, codC]);
      return jsonOut_({ ok: true });
    }

    /* ── Verificar cadastro do ministro num local ── */
    if (action === 'verificarMinistro') {
      var nomeV  = String(body.nome  || '').trim().toLowerCase();
      var localV = String(body.local || '').trim().toLowerCase();
      if (!nomeV || !localV) return jsonOut_({ ok: false, error: 'Nome e local obrigatórios' });
      var shV = getOrCreateSheet_(SHEET_MINISTROS, ['Nome','Local']);
      var rowsV = shV.getDataRange().getValues();
      for (var iv = 1; iv < rowsV.length; iv++) {
        var nomeRow  = String(rowsV[iv][0] || '').trim().toLowerCase();
        var localRow = String(rowsV[iv][1] || '').trim().toLowerCase();
        if (nomeRow === nomeV && localRow === localV) {
          return jsonOut_({ ok: true });
        }
      }
      return jsonOut_({ ok: false, error: 'Ministro não cadastrado neste local' });
    }

    /* ── Buscar escala do ministro ── */
    if (action === 'buscarMinhaEscala') {
      var nomeMin  = String(body.nome  || '').trim().toLowerCase();
      var localMin = String(body.local || '').trim().toLowerCase();
      var hoje     = new Date();
      hoje.setHours(0, 0, 0, 0);
      var escalas  = [];

      var shEx = getOrCreateSheet_(SHEET_EXTRAS, ['Local','Data','Hora','Missa','Ministros','Obs']);
      var extRows = shEx.getDataRange().getValues();
      for (var i = 1; i < extRows.length; i++) {
        var r = extRows[i];
        if (localMin && String(r[0]).trim().toLowerCase() !== localMin) continue;
        if (String(r[4]).toLowerCase().indexOf(nomeMin) === -1) continue;
        // Normalize Data: may be Date object, ISO string, or "yyyy-MM-dd"
        var dataStr = formatCell_(r[1]);
        var partes = String(dataStr).split('T')[0].split('-');
        if (partes.length === 3) {
          var dEsc = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
          if (dEsc >= hoje) {
            escalas.push({
              tipo:  'Extra',
              data:  dEsc.getDate().toString().padStart(2,'0') + '/' + (dEsc.getMonth()+1).toString().padStart(2,'0') + '/' + dEsc.getFullYear(),
              hora:  String(formatCell_(r[2])),
              missa: String(r[3]),
              local: String(r[0])
            });
          }
        }
      }

      var shRe = getOrCreateSheet_(SHEET_REGRAS, ['Local','Regra','Hora','Missa','Ministros','Obs']);
      var regRows = shRe.getDataRange().getValues();
      for (var j = 1; j < regRows.length; j++) {
        var rr = regRows[j];
        if (localMin && String(rr[0]).trim().toLowerCase() !== localMin) continue;
        if (String(rr[4]).toLowerCase().indexOf(nomeMin) === -1) continue;
        escalas.push({ tipo: 'Fixa', data: String(rr[1]), hora: String(formatCell_(rr[2])), missa: String(rr[3]), local: String(rr[0]) });
      }

      return jsonOut_({ ok: true, escalas: escalas });
    }

    /* ── Manutenção ── */
    if (action === 'setupPlanilha') {
      setupPlanilhaMESC();
      return jsonOut_({ ok: true });
    }

    if (action === 'limparTudo') {
      var localLimpar = body.local || '';
      var shE = getOrCreateSheet_(SHEET_EXTRAS, ['Local','Data','Hora','Missa','Ministros','Obs']);
      var shR = getOrCreateSheet_(SHEET_REGRAS, ['Local','Regra','Hora','Missa','Ministros','Obs']);
      if (localLimpar) {
        limparLinhasPorLocal_(shE, localLimpar);
        limparLinhasPorLocal_(shR, localLimpar);
      } else {
        if (shE.getLastRow() > 1) shE.deleteRows(2, shE.getLastRow() - 1);
        if (shR.getLastRow() > 1) shR.deleteRows(2, shR.getLastRow() - 1);
      }
      return jsonOut_({ ok: true });
    }

    return jsonOut_({ ok: false, error: 'Ação desconhecida: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err.message || err) });
  }
}

function limparLinhasPorLocal_(sh, local) {
  var rows = sh.getDataRange().getValues();
  var lc = local.toLowerCase();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]).trim().toLowerCase() === lc) sh.deleteRow(i + 1);
  }
}

/* ── Utilitários ─────────────────────────────────────────────────────────── */

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Rode uma vez no editor para criar todas as abas e cabeçalhos padrão.
 */
function setupPlanilhaMESC() {
  var ss = getSpreadsheet_();
  ensureSheetWithHeaders_(ss, SHEET_EXTRAS,    ['Local','Data','Hora','Missa','Ministros','Obs']);
  ensureSheetWithHeaders_(ss, SHEET_REGRAS,    ['Local','Regra','Hora','Missa','Ministros','Obs']);
  ensureSheetWithHeaders_(ss, SHEET_MINISTROS, ['Nome','Local']);
  ensureSheetWithHeaders_(ss, SHEET_TOKENS,    ['Paroquia','Login','Codigo']);
  ensureSheetWithHeaders_(ss, SHEET_AVISOS,    ['Data','Hora','Mensagem','Local','Zap','Calendar']);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    return;
  }
  // Always normalize the first row to match the expected header schema. This
  // fixes sheets created by older versions whose header row is shorter or
  // shifted relative to the current schema (e.g. missing the leading "Local"
  // column), which would otherwise make headers misaligned with the data.
  var first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  var matches = headers.every(function(h, i) {
    return String(first[i] || '').trim() === h;
  });
  if (!matches) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}
