// 通用報表輸出畫面：純唯讀表格，資料來源可能是視圖或實體表。
// pivot 類型的報表(訂單出退分析/採購收退分析)需先輸入年度，
// 縱軸/橫軸的彙總運算完全由 SQL Server 的 Table-Valued Function 完成。
window.renderReportScreen = function renderReportScreen(container, item) {
  let disposed = false;

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function formatCell(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return v;
  }

  function drawTable(rows) {
    if (rows.length === 0) {
      const p = document.createElement("div");
      p.className = "placeholder";
      p.innerHTML = "<p>目前沒有資料</p>";
      return p;
    }
    const cols = Object.keys(rows[0]);
    const wrap = document.createElement("div");
    wrap.className = "data-table-wrap";
    const table = document.createElement("table");
    table.className = "data-table";
    const thead = `<thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows
      .map((row) => `<tr>${cols.map((c) => `<td>${escapeHtml(formatCell(row[c]))}</td>`).join("")}</tr>`)
      .join("")}</tbody>`;
    table.innerHTML = thead + tbody;
    wrap.appendChild(table);
    return wrap;
  }

  async function loadFlat() {
    container.innerHTML = '<div class="placeholder">載入中…</div>';
    try {
      const res = await fetch(`/api/report/${item.apiKey}`).then((r) => r.json());
      if (disposed) return;
      if (!res.ok) throw new Error(res.error || "load failed");
      const wrap = drawTable(res.rows);
      const summary = document.createElement("div");
      summary.className = "breadcrumb";
      summary.style.marginTop = "10px";
      summary.textContent = `共 ${res.rows.length} 筆`;
      container.replaceChildren(wrap, summary);
    } catch (err) {
      if (disposed) return;
      container.innerHTML = `<div class="placeholder"><h2>載入失敗</h2><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  function loadPivot() {
    const currentYear = new Date().getFullYear();
    const wrap = document.createElement("div");

    const bar = document.createElement("div");
    bar.className = "placeholder";
    bar.style.textAlign = "left";
    bar.style.display = "flex";
    bar.style.alignItems = "flex-end";
    bar.style.gap = "10px";
    bar.style.flexWrap = "wrap";
    bar.innerHTML = `
      <label class="field-label" style="flex:0 0 auto;">
        <span>年度</span>
        <input id="pivot-year" type="number" value="${currentYear}" style="width:100px;" />
      </label>
    `;
    const queryBtn = document.createElement("button");
    queryBtn.className = "btn btn-primary";
    queryBtn.textContent = "查詢";
    bar.appendChild(queryBtn);
    wrap.appendChild(bar);

    const resultBox = document.createElement("div");
    resultBox.style.marginTop = "12px";
    wrap.appendChild(resultBox);

    container.replaceChildren(wrap);

    async function runQuery() {
      const year = parseInt(wrap.querySelector("#pivot-year").value, 10);
      resultBox.innerHTML = '<div class="placeholder">載入中…</div>';
      try {
        const res = await fetch(`/api/report/${item.apiKey}/pivot?year=${encodeURIComponent(year)}`).then((r) => r.json());
        if (disposed) return;
        if (!res.ok) throw new Error(res.error || "查詢失敗");
        const table = drawTable(res.rows);
        const summary = document.createElement("div");
        summary.className = "breadcrumb";
        summary.style.marginTop = "10px";
        summary.textContent = `${year} 年度，共 ${res.rows.length} 筆(依「${res.rowLabel}」彙總)`;
        resultBox.replaceChildren(table, summary);
      } catch (err) {
        if (disposed) return;
        resultBox.innerHTML = `<div class="placeholder"><h2>查詢失敗</h2><p>${escapeHtml(err.message)}</p></div>`;
      }
    }

    queryBtn.addEventListener("click", runQuery);
    runQuery();
  }

  if (item.pivot) {
    loadPivot();
  } else {
    loadFlat();
  }

  return function dispose() {
    disposed = true;
  };
};
