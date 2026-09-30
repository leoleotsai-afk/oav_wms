const path = require("path");
const express = require("express");
const { sql, getPool } = require("./db");
const { MASTER_TABLES } = require("./masterConfig");
const { DOCUMENT_TABLES } = require("./documentConfig");
const { REPORT_TABLES } = require("./reportConfig");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// 健康檢查：確認 API 與 SQL Server 連線正常
app.get("/api/health", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT DB_NAME() AS db_name, GETDATE() AS server_time");
    res.json({ ok: true, db: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 依規格書資料表白名單查詢筆數，供主功能表未來顯示各功能的資料量
const KNOWN_TABLES = [
  "銷售組織維護", "採購組織維護", "工廠代碼維護", "工廠倉庫維護",
  "客戶資料維護", "廠商資料維護", "物料資料維護", "物管資料維護", "用量清單維護",
  "客戶訂單主檔", "客戶訂單明細", "訂單出貨主檔", "訂單出貨明細", "出貨退回主檔", "出貨退回明細",
  "廠商採購主檔", "廠商採購明細", "採購收貨主檔", "採購收貨明細", "收貨退回主檔", "收貨退回明細",
  "物料預留主檔", "物料預留明細", "庫存領用主檔", "庫存領用明細", "庫存繳庫主檔", "庫存繳庫明細",
  "生產工單主檔", "生產工單明細", "工單入庫主檔", "工單入庫明細", "工單領料主檔", "工單領料明細",
  "庫存異動明細", "每日庫存餘額", "庫存在途明細", "每日供需餘額",
  "已訂未出明細", "訂單出退分析", "已採未交明細", "採購收退分析",
];

app.get("/api/tables/:name/count", async (req, res) => {
  const name = req.params.name;
  if (!KNOWN_TABLES.includes(name)) {
    return res.status(404).json({ ok: false, error: "unknown table" });
  }
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT COUNT(*) AS cnt FROM [dbo].[${name}]`);
    res.json({ ok: true, table: name, count: result.recordset[0].cnt });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- 通用「組織架構 / 主數據」維護 API ----
// table/欄位名稱一律取自 masterConfig.js 的白名單，使用者輸入只會綁定為參數值。
function getConfig(key) {
  const cfg = MASTER_TABLES[key];
  if (!cfg) return null;
  return cfg;
}

function bindParams(request, fields, body, prefix) {
  const assigns = [];
  fields.forEach((f, i) => {
    const p = `${prefix}${i}`;
    request.input(p, body[f.name]);
    assigns.push({ field: f, param: p });
  });
  return assigns;
}

app.get("/api/master/:key/schema", (req, res) => {
  const cfg = getConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown master key" });
  res.json({ ok: true, table: cfg.table, pk: cfg.pk, fields: cfg.fields });
});

app.get("/api/master/:key", async (req, res) => {
  const cfg = getConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown master key" });
  try {
    const pool = await getPool();
    const orderBy = cfg.pk.map((c) => `[${c}]`).join(", ");
    const result = await pool.request().query(`SELECT * FROM [dbo].[${cfg.table}] ORDER BY ${orderBy}`);
    res.json({ ok: true, rows: result.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/master/:key/options", async (req, res) => {
  const cfg = getConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown master key" });
  try {
    const pool = await getPool();
    const pkCol = cfg.pk[0];
    const hasNote = cfg.fields.some((f) => f.name === "備註說明");
    const cols = hasNote ? `[${pkCol}], [備註說明]` : `[${pkCol}]`;
    const result = await pool.request().query(`SELECT ${cols} FROM [dbo].[${cfg.table}] ORDER BY [${pkCol}]`);
    const options = result.recordset.map((r) => ({
      value: r[pkCol],
      label: hasNote && r["備註說明"] ? `${r[pkCol]} - ${r["備註說明"]}` : r[pkCol],
    }));
    res.json({ ok: true, options });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/master/:key", async (req, res) => {
  const cfg = getConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown master key" });
  const body = req.body || {};
  for (const f of cfg.fields) {
    if (f.required && (body[f.name] === undefined || body[f.name] === null || body[f.name] === "")) {
      return res.status(400).json({ ok: false, error: `${f.label} 為必填` });
    }
  }
  try {
    const pool = await getPool();
    const request = pool.request();
    const assigns = bindParams(request, cfg.fields, body, "v");
    const colList = assigns.map((a) => `[${a.field.name}]`).join(", ");
    const paramList = assigns.map((a) => `@${a.param}`).join(", ");
    await request.query(`INSERT INTO [dbo].[${cfg.table}] (${colList}) VALUES (${paramList})`);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.put("/api/master/:key", async (req, res) => {
  const cfg = getConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown master key" });
  const body = req.body || {};
  const nonPkFields = cfg.fields.filter((f) => !cfg.pk.includes(f.name));
  try {
    const pool = await getPool();
    const request = pool.request();
    const setAssigns = bindParams(request, nonPkFields, body, "s");
    const pkAssigns = bindParams(request, cfg.pk.map((name) => ({ name })), body, "k");
    const setClause = setAssigns.map((a) => `[${a.field.name}] = @${a.param}`).join(", ");
    const whereClause = pkAssigns.map((a) => `[${a.field.name}] = @${a.param}`).join(" AND ");
    const result = await request.query(`UPDATE [dbo].[${cfg.table}] SET ${setClause} WHERE ${whereClause}`);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ ok: false, error: "找不到資料列" });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete("/api/master/:key", async (req, res) => {
  const cfg = getConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown master key" });
  const body = req.body || {};
  try {
    const pool = await getPool();
    const request = pool.request();
    const pkAssigns = bindParams(request, cfg.pk.map((name) => ({ name })), body, "k");
    const whereClause = pkAssigns.map((a) => `[${a.field.name}] = @${a.param}`).join(" AND ");
    const result = await request.query(`DELETE FROM [dbo].[${cfg.table}] WHERE ${whereClause}`);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ ok: false, error: "找不到資料列" });
    }
    res.json({ ok: true });
  } catch (err) {
    // 外鍵限制交由 SQL Server 擋下，直接回傳訊息即可
    res.status(409).json({ ok: false, error: err.message });
  }
});

// ---- 通用「報表輸出」API：全部唯讀 ----
app.get("/api/report/:key", async (req, res) => {
  const cfg = REPORT_TABLES[req.params.key];
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown report key" });
  try {
    const pool = await getPool();
    const orderBy = cfg.orderBy.map((c) => `[${c}]`).join(", ");
    const result = await pool.request().query(`SELECT * FROM [dbo].[${cfg.source}] ORDER BY ${orderBy}`);
    res.json({ ok: true, rows: result.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 樞紐分析：年度由使用者輸入，其餘全部由 SQL Server 的 TVF 完成
app.get("/api/report/:key/pivot", async (req, res) => {
  const cfg = REPORT_TABLES[req.params.key];
  if (!cfg || !cfg.pivot) return res.status(404).json({ ok: false, error: "unknown pivot report key" });
  const year = parseInt(req.query.year, 10);
  if (!Number.isInteger(year) || year < 1900 || year > 2999) {
    return res.status(400).json({ ok: false, error: "請輸入有效的年度" });
  }
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input("year", sql.Int, year);
    const result = await request.query(`SELECT * FROM [dbo].[${cfg.pivot.fn}](@year) ORDER BY [${cfg.pivot.rowLabel}]`);
    res.json({ ok: true, rowLabel: cfg.pivot.rowLabel, rows: result.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- 通用「交易數據(主檔+明細)」維護 API ----
function getDocConfig(key) {
  return DOCUMENT_TABLES[key] || null;
}

function padItemNo(n) {
  return String(n).padStart(4, "0");
}

function docFieldsSchema(cfg) {
  return {
    headerTable: cfg.headerTable,
    headerPk: cfg.headerPk,
    headerFields: cfg.headerFields,
    headerReadonlyFields: cfg.headerReadonlyFields || [],
    detailTable: cfg.detailTable,
    detailFk: cfg.detailFk,
    itemNoField: cfg.itemNoField,
    detailFields: cfg.detailFields,
    readonlyDetailFields: cfg.readonlyDetailFields || [],
    sourceView: cfg.sourceView || null,
  };
}

app.get("/api/doc/:key/schema", (req, res) => {
  const cfg = getDocConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown document key" });
  res.json({ ok: true, ...docFieldsSchema(cfg) });
});

app.get("/api/doc/:key", async (req, res) => {
  const cfg = getDocConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown document key" });
  try {
    const pool = await getPool();
    const pkCol = cfg.headerPk[0];
    const fkCol = cfg.detailFk[0];
    const result = await pool.request().query(`
      SELECT h.*, (SELECT COUNT(*) FROM [dbo].[${cfg.detailTable}] d WHERE d.[${fkCol}] = h.[${pkCol}]) AS _lineCount
      FROM [dbo].[${cfg.headerTable}] h
      ORDER BY h.[${pkCol}] DESC
    `);
    res.json({ ok: true, rows: result.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/doc/:key/:pkValue", async (req, res) => {
  const cfg = getDocConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown document key" });
  try {
    const pool = await getPool();
    const pkCol = cfg.headerPk[0];
    const fkCol = cfg.detailFk[0];
    const hReq = pool.request();
    hReq.input("pk", req.params.pkValue);
    const hResult = await hReq.query(`SELECT * FROM [dbo].[${cfg.headerTable}] WHERE [${pkCol}] = @pk`);
    if (hResult.recordset.length === 0) return res.status(404).json({ ok: false, error: "找不到單據" });

    const dReq = pool.request();
    dReq.input("pk", req.params.pkValue);
    const dResult = await dReq.query(`SELECT * FROM [dbo].[${cfg.detailTable}] WHERE [${fkCol}] = @pk ORDER BY [${cfg.itemNoField}]`);
    res.json({ ok: true, header: hResult.recordset[0], details: dResult.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

function validateRequired(fields, obj, label) {
  for (const f of fields) {
    if (f.required && (obj[f.name] === undefined || obj[f.name] === null || obj[f.name] === "")) {
      throw new Error(`${label}「${f.label}」為必填`);
    }
  }
}

app.post("/api/doc/:key", async (req, res) => {
  const cfg = getDocConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown document key" });
  const body = req.body || {};
  const header = body.header || {};
  const details = Array.isArray(body.details) ? body.details : [];
  const pkCol = cfg.headerPk[0];
  const fkCol = cfg.detailFk[0];

  try {
    validateRequired(cfg.headerFields, header, "主檔");
    if (details.length === 0) throw new Error("至少需要一筆明細");
    details.forEach((d, i) => validateRequired(cfg.detailFields, d, `明細第${i + 1}列`));
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const hReq = new sql.Request(tx);
    const hCols = cfg.headerFields.map((f, i) => {
      hReq.input(`h${i}`, header[f.name]);
      return { col: f.name, param: `h${i}` };
    });
    await hReq.query(
      `INSERT INTO [dbo].[${cfg.headerTable}] (${hCols.map((c) => `[${c.col}]`).join(", ")}) VALUES (${hCols
        .map((c) => `@${c.param}`)
        .join(", ")})`
    );

    let seq = 1;
    for (const d of details) {
      const dReq = new sql.Request(tx);
      dReq.input("fk", header[pkCol]);
      dReq.input("itemNo", padItemNo(seq++));
      const dCols = cfg.detailFields.map((f, i) => {
        dReq.input(`d${i}`, d[f.name]);
        return { col: f.name, param: `d${i}` };
      });
      const allCols = [fkCol, cfg.itemNoField, ...dCols.map((c) => c.col)];
      const allParams = ["fk", "itemNo", ...dCols.map((c) => c.param)];
      await dReq.query(
        `INSERT INTO [dbo].[${cfg.detailTable}] (${allCols.map((c) => `[${c}]`).join(", ")}) VALUES (${allParams
          .map((p) => `@${p}`)
          .join(", ")})`
      );
    }

    await tx.commit();
    res.status(201).json({ ok: true, pk: header[pkCol] });
  } catch (err) {
    try { await tx.rollback(); } catch (e) { /* already rolled back */ }
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.put("/api/doc/:key/:pkValue", async (req, res) => {
  const cfg = getDocConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown document key" });
  const body = req.body || {};
  const header = body.header || {};
  const details = Array.isArray(body.details) ? body.details : [];
  const pkCol = cfg.headerPk[0];
  const fkCol = cfg.detailFk[0];
  const pkValue = req.params.pkValue;

  try {
    validateRequired(cfg.headerFields, header, "主檔");
    if (details.length === 0) throw new Error("至少需要一筆明細");
    details.forEach((d, i) => validateRequired(cfg.detailFields, d, `明細第${i + 1}列`));
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    const nonPkHeaderFields = cfg.headerFields.filter((f) => !cfg.headerPk.includes(f.name));
    const hReq = new sql.Request(tx);
    hReq.input("pk", pkValue);
    const hSet = nonPkHeaderFields.map((f, i) => {
      hReq.input(`h${i}`, header[f.name]);
      return `[${f.name}] = @h${i}`;
    });
    const hUpdateResult = await hReq.query(
      `UPDATE [dbo].[${cfg.headerTable}] SET ${hSet.join(", ")} WHERE [${pkCol}] = @pk`
    );
    if (hUpdateResult.rowsAffected[0] === 0) throw new Error("找不到主檔資料");

    const existingReq = new sql.Request(tx);
    existingReq.input("pk", pkValue);
    const existing = (
      await existingReq.query(`SELECT * FROM [dbo].[${cfg.detailTable}] WHERE [${fkCol}] = @pk`)
    ).recordset;

    const incomingItemNos = new Set(details.map((d) => d[cfg.itemNoField]).filter(Boolean));
    const toDelete = existing.filter((row) => !incomingItemNos.has(row[cfg.itemNoField]));
    for (const row of toDelete) {
      const delReq = new sql.Request(tx);
      delReq.input("pk", pkValue);
      delReq.input("no", row[cfg.itemNoField]);
      await delReq.query(`DELETE FROM [dbo].[${cfg.detailTable}] WHERE [${fkCol}] = @pk AND [${cfg.itemNoField}] = @no`);
    }

    const toUpdate = details.filter((d) => d[cfg.itemNoField]);
    for (const d of toUpdate) {
      const upReq = new sql.Request(tx);
      upReq.input("pk", pkValue);
      upReq.input("no", d[cfg.itemNoField]);
      const setParts = cfg.detailFields.map((f, i) => {
        upReq.input(`d${i}`, d[f.name]);
        return `[${f.name}] = @d${i}`;
      });
      await upReq.query(
        `UPDATE [dbo].[${cfg.detailTable}] SET ${setParts.join(", ")} WHERE [${fkCol}] = @pk AND [${cfg.itemNoField}] = @no`
      );
    }

    const maxExisting = existing.reduce((m, row) => Math.max(m, parseInt(row[cfg.itemNoField], 10) || 0), 0);
    let seq = maxExisting + 1;
    const toInsert = details.filter((d) => !d[cfg.itemNoField]);
    for (const d of toInsert) {
      const insReq = new sql.Request(tx);
      insReq.input("fk", pkValue);
      insReq.input("itemNo", padItemNo(seq++));
      const dCols = cfg.detailFields.map((f, i) => {
        insReq.input(`d${i}`, d[f.name]);
        return { col: f.name, param: `d${i}` };
      });
      const allCols = [fkCol, cfg.itemNoField, ...dCols.map((c) => c.col)];
      const allParams = ["fk", "itemNo", ...dCols.map((c) => c.param)];
      await insReq.query(
        `INSERT INTO [dbo].[${cfg.detailTable}] (${allCols.map((c) => `[${c}]`).join(", ")}) VALUES (${allParams
          .map((p) => `@${p}`)
          .join(", ")})`
      );
    }

    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await tx.rollback(); } catch (e) { /* already rolled back */ }
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete("/api/doc/:key/:pkValue", async (req, res) => {
  const cfg = getDocConfig(req.params.key);
  if (!cfg) return res.status(404).json({ ok: false, error: "unknown document key" });
  const pkCol = cfg.headerPk[0];
  const fkCol = cfg.detailFk[0];
  const pkValue = req.params.pkValue;

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const dReq = new sql.Request(tx);
    dReq.input("pk", pkValue);
    await dReq.query(`DELETE FROM [dbo].[${cfg.detailTable}] WHERE [${fkCol}] = @pk`);

    const hReq = new sql.Request(tx);
    hReq.input("pk", pkValue);
    const result = await hReq.query(`DELETE FROM [dbo].[${cfg.headerTable}] WHERE [${pkCol}] = @pk`);
    if (result.rowsAffected[0] === 0) throw new Error("找不到單據");

    await tx.commit();
    res.json({ ok: true });
  } catch (err) {
    try { await tx.rollback(); } catch (e) { /* already rolled back */ }
    res.status(409).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`OAV ERP server listening on http://localhost:${PORT}`);
});
