// 三層下鑽報表(目前用於「每日庫存餘額」)：
// 第一層 物料資料維護 -> 第二層 每日庫存餘額(依物料過濾) -> 第三層 庫存異動明細(依物料+倉庫+日期過濾)
// 每一層的過濾條件都交給後端組成參數化 SQL WHERE，前端只負責畫面與狀態切換。
window.renderDrilldownScreen = function renderDrilldownScreen(container, item) {
  let disposed = false;
  let drilldown = null;
  let level = 1;
  let material = null; // { 物料編號, 備註說明 }
  let balanceRow = null; // 選定的每日庫存餘額列

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmt(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return v;
  }

  function drawTable(rows, onRowClick) {
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
    if (onRowClick) table.style.cursor = "pointer";
    table.innerHTML = `<thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`;
    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = cols.map((c) => `<td>${escapeHtml(fmt(row[c]))}</td>`).join("");
      if (onRowClick) tr.addEventListener("click", () => onRowClick(row));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function steps() {
    const s = [{ n: 1, label: drilldown.level1.label, enabled: true }];
    s.push({ n: 2, label: drilldown.level2.label, enabled: !!material });
    s.push({ n: 3, label: drilldown.level3.label, enabled: !!(material && balanceRow) });
    return s;
  }

  function drawStepBar() {
    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:14px;font-size:13px;";
    steps().forEach((s, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.style.color = "var(--muted)";
        sep.innerHTML = window.Icon("chevronRight", { size: 13 });
        bar.appendChild(sep);
      }
      const btn = document.createElement("button");
      btn.textContent = `${s.n}. ${s.label}`;
      btn.disabled = !s.enabled;
      btn.className = "btn btn-sm " + (level === s.n ? "btn-primary" : "btn-secondary");
      btn.style.opacity = s.enabled ? "1" : ".5";
      btn.addEventListener("click", () => {
        if (!s.enabled) return;
        level = s.n;
        draw();
      });
      bar.appendChild(btn);
    });
    return bar;
  }

  async function draw() {
    if (disposed) return;
    const wrap = document.createElement("div");
    wrap.appendChild(drawStepBar());

    const body = document.createElement("div");
    body.innerHTML = '<div class="placeholder">載入中…</div>';
    wrap.appendChild(body);
    container.replaceChildren(wrap);

    try {
      if (level === 1) {
        const res = await fetch(`/api/master/${drilldown.level1.apiKey}`).then((r) => r.json());
        if (disposed) return;
        if (!res.ok) throw new Error(res.error || "load failed");
        const rows = res.rows;
        body.replaceChildren(
          drawTable(rows, (row) => {
            material = row;
            balanceRow = null;
            level = 2;
            draw();
          })
        );
      } else if (level === 2) {
        const filterField = drilldown.level1.filterField;
        const url = `/api/report/${drilldown.level2.apiKey}?${encodeURIComponent(filterField)}=${encodeURIComponent(material[filterField])}`;
        const res = await fetch(url).then((r) => r.json());
        if (disposed) return;
        if (!res.ok) throw new Error(res.error || "load failed");
        const hint = document.createElement("div");
        hint.className = "breadcrumb";
        hint.style.marginBottom = "10px";
        hint.textContent = `物料：${material[filterField]}${material["備註說明"] ? " - " + material["備註說明"] : ""}`;
        body.replaceChildren(
          hint,
          drawTable(res.rows, (row) => {
            balanceRow = row;
            level = 3;
            draw();
          })
        );
      } else if (level === 3) {
        const filterField = drilldown.level1.filterField;
        const qs = new URLSearchParams({
          [filterField]: material[filterField],
          倉庫代碼: balanceRow["倉庫代碼"],
          異動日期: fmt(balanceRow["日期"]),
        });
        const res = await fetch(`/api/report/${drilldown.level3.apiKey}?${qs.toString()}`).then((r) => r.json());
        if (disposed) return;
        if (!res.ok) throw new Error(res.error || "load failed");
        const hint = document.createElement("div");
        hint.className = "breadcrumb";
        hint.style.marginBottom = "10px";
        hint.textContent = `物料：${material[filterField]}，倉庫：${balanceRow["倉庫代碼"]}，日期：${fmt(balanceRow["日期"])}`;
        body.replaceChildren(hint, drawTable(res.rows, null));
      }
    } catch (err) {
      if (disposed) return;
      body.innerHTML = `<div class="placeholder"><h2>載入失敗</h2><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  async function init() {
    container.innerHTML = '<div class="placeholder">載入中…</div>';
    try {
      const schemaRes = await fetch(`/api/report/${item.apiKey}/schema`).then((r) => r.json());
      if (disposed) return;
      if (!schemaRes.ok || !schemaRes.drilldown) throw new Error("此報表未設定下鑽層級");
      drilldown = schemaRes.drilldown;
      draw();
    } catch (err) {
      if (disposed) return;
      container.innerHTML = `<div class="placeholder"><h2>載入失敗</h2><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  init();

  return function dispose() {
    disposed = true;
  };
};
