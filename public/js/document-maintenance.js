// 通用「交易數據(主檔+明細)」維護畫面：主檔表單 + 明細列表格，
// 累加型欄位(已出貨/已領用量...)一律唯讀，交由 SQL Server 觸發器維護。
window.renderDocumentScreen = function renderDocumentScreen(container, item) {
  let disposed = false;
  let schema = null;
  let headers = [];
  let optionsCache = {}; // refKey -> [{value,label}]
  let mode = "list"; // "list" | "edit"
  let currentHeader = null;
  let currentDetails = null; // array of row objects
  let currentIsNew = false;
  let pickerOpen = false;
  let pickerRows = [];

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmt(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return v;
  }

  async function loadSchema() {
    const res = await fetch(`/api/doc/${item.apiKey}/schema`).then((r) => r.json());
    if (!res.ok) throw new Error(res.error || "schema load failed");
    schema = res;
    const refKeys = new Set();
    [...schema.headerFields, ...schema.detailFields].forEach((f) => {
      if (f.type === "select" && f.refKey) refKeys.add(f.refKey);
    });
    for (const rk of refKeys) {
      const o = await fetch(`/api/master/${rk}/options`).then((r) => r.json());
      optionsCache[rk] = o.ok ? o.options : [];
    }
  }

  async function loadHeaders() {
    const res = await fetch(`/api/doc/${item.apiKey}`).then((r) => r.json());
    headers = res.ok ? res.rows : [];
  }

  function inputHtml(f, value, disabled) {
    const val = value === undefined || value === null ? "" : value;
    if (f.type === "select") {
      const opts = (optionsCache[f.refKey] || [])
        .map((o) => `<option value="${escapeHtml(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
        .join("");
      return `<select data-field="${f.name}" ${disabled ? "disabled" : ""}><option value="">請選擇</option>${opts}</select>`;
    }
    const type = f.type === "number" ? "number" : f.type === "date" ? "date" : "text";
    const dateVal = f.type === "date" ? fmt(val) : val;
    return `<input data-field="${f.name}" type="${type}" value="${escapeHtml(dateVal)}" ${disabled ? "disabled" : ""} />`;
  }

  function drawList() {
    const wrap = document.createElement("div");
    const toolbar = document.createElement("div");
    toolbar.className = "toolbar-row";
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary";
    addBtn.textContent = "＋ 新增單據";
    addBtn.addEventListener("click", () => startNew());
    toolbar.appendChild(addBtn);
    wrap.appendChild(toolbar);

    const list = document.createElement("div");
    list.className = "list";
    if (headers.length === 0) {
      const empty = document.createElement("div");
      empty.className = "placeholder";
      empty.innerHTML = "<p>目前沒有單據</p>";
      list.appendChild(empty);
    }
    const pkCol = schema.headerPk[0];
    headers.forEach((h) => {
      const row = document.createElement("div");
      row.className = "list-item";
      const otherFields = schema.headerFields.filter((f) => f.name !== pkCol).slice(0, 3);
      const summary = otherFields.map((f) => fmt(h[f.name])).filter(Boolean).join(" / ");
      row.innerHTML = `
        <div>
          <div class="name">${escapeHtml(h[pkCol])} <span class="sub" style="display:inline;">(${h._lineCount ?? 0} 行)</span></div>
          <div class="tables">${escapeHtml(summary)}</div>
        </div>
      `;
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:6px;";
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-secondary btn-sm";
      editBtn.textContent = "編輯";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startEdit(h[pkCol]);
      });
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.textContent = "刪除";
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`確定要刪除單據「${h[pkCol]}」嗎？`)) return;
        await handleDelete(h[pkCol]);
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      row.appendChild(actions);
      list.appendChild(row);
    });
    wrap.appendChild(list);
    container.replaceChildren(wrap);
  }

  function emptyHeader() {
    const h = {};
    schema.headerFields.forEach((f) => (h[f.name] = ""));
    return h;
  }
  function emptyDetailRow() {
    const d = {};
    schema.detailFields.forEach((f) => (d[f.name] = ""));
    return d;
  }

  function startNew() {
    currentIsNew = true;
    currentHeader = emptyHeader();
    currentDetails = [emptyDetailRow()];
    mode = "edit";
    draw();
  }

  async function startEdit(pkValue) {
    container.innerHTML = '<div class="placeholder">載入中…</div>';
    const res = await fetch(`/api/doc/${item.apiKey}/${encodeURIComponent(pkValue)}`).then((r) => r.json());
    if (!res.ok) {
      container.innerHTML = `<div class="placeholder"><h2>載入失敗</h2><p>${escapeHtml(res.error)}</p></div>`;
      return;
    }
    currentIsNew = false;
    currentHeader = res.header;
    currentDetails = res.details;
    mode = "edit";
    draw();
  }

  function draw() {
    if (disposed) return;
    if (mode === "list") return drawList();
    return drawEdit();
  }

  function drawEdit() {
    const wrap = document.createElement("div");

    const headerBox = document.createElement("div");
    headerBox.className = "placeholder";
    headerBox.style.textAlign = "left";
    headerBox.innerHTML = `<h2>${currentIsNew ? "新增單據" : "編輯單據 " + escapeHtml(currentHeader[schema.headerPk[0]])}</h2>`;
    const hGrid = document.createElement("div");
    hGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin:12px 0;";
    schema.headerFields.forEach((f) => {
      const isPk = schema.headerPk.includes(f.name);
      const line = document.createElement("label");
      line.className = "field-label";
      line.innerHTML = `<span>${escapeHtml(f.label)}${f.required ? " *" : ""}</span>${inputHtml(f, currentHeader[f.name], isPk && !currentIsNew)}`;
      hGrid.appendChild(line);
    });
    (schema.headerReadonlyFields || []).forEach((f) => {
      if (currentIsNew) return;
      const line = document.createElement("label");
      line.className = "field-label";
      line.innerHTML = `<span>${escapeHtml(f.label)}</span><input value="${escapeHtml(fmt(currentHeader[f.name]))}" disabled />`;
      hGrid.appendChild(line);
    });
    headerBox.appendChild(hGrid);
    wrap.appendChild(headerBox);

    const detailBox = document.createElement("div");
    detailBox.className = "placeholder";
    detailBox.style.textAlign = "left";
    const dTitle = document.createElement("div");
    dTitle.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;";
    dTitle.innerHTML = `<h2 style="margin:0;">明細</h2>`;
    const dBtns = document.createElement("div");
    dBtns.style.cssText = "display:flex;gap:8px;";
    if (schema.sourceView) {
      const pickBtn = document.createElement("button");
      pickBtn.className = "btn btn-secondary btn-sm";
      pickBtn.textContent = `從「${schema.sourceView.label}」挑選`;
      pickBtn.addEventListener("click", () => openPicker());
      dBtns.appendChild(pickBtn);
    }
    const addRowBtn = document.createElement("button");
    addRowBtn.className = "btn btn-secondary btn-sm";
    addRowBtn.textContent = "＋ 新增列";
    addRowBtn.addEventListener("click", () => {
      currentDetails.push(emptyDetailRow());
      draw();
    });
    dBtns.appendChild(addRowBtn);
    dTitle.appendChild(dBtns);
    detailBox.appendChild(dTitle);

    const tableWrap = document.createElement("div");
    tableWrap.className = "data-table-wrap";
    tableWrap.style.border = "none";
    const table = document.createElement("table");
    table.className = "data-table";
    const headCells = [
      !currentIsNew ? `<th>項次</th>` : "",
      ...schema.detailFields.map((f) => `<th>${escapeHtml(f.label)}${f.required ? " *" : ""}</th>`),
      ...(schema.readonlyDetailFields || []).map((f) => `<th>${escapeHtml(f.label)}</th>`),
      `<th></th>`,
    ].join("");
    table.innerHTML = `<thead><tr>${headCells}</tr></thead>`;
    const tbody = document.createElement("tbody");
    currentDetails.forEach((row, idx) => {
      const tr = document.createElement("tr");
      const itemNoCell = !currentIsNew ? `<td class="sub">${escapeHtml(row[schema.itemNoField] || "(新)")}</td>` : "";
      const fieldCells = schema.detailFields
        .map((f) => `<td style="min-width:110px;">${inputHtml(f, row[f.name], false)}</td>`)
        .join("");
      const readonlyCells = (schema.readonlyDetailFields || [])
        .map((f) => `<td class="sub" style="text-align:center;">${escapeHtml(fmt(row[f.name]))}</td>`)
        .join("");
      tr.innerHTML = `${itemNoCell}${fieldCells}${readonlyCells}<td></td>`;
      tr.querySelectorAll("[data-field]").forEach((el) => {
        el.addEventListener("input", () => {
          row[el.dataset.field] = el.value;
        });
      });
      const rmCell = tr.lastElementChild;
      const rmBtn = document.createElement("button");
      rmBtn.className = "btn btn-danger btn-xs";
      rmBtn.textContent = "移除";
      rmBtn.addEventListener("click", () => {
        currentDetails.splice(idx, 1);
        draw();
      });
      rmCell.appendChild(rmBtn);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    detailBox.appendChild(tableWrap);
    wrap.appendChild(detailBox);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:10px;justify-content:center;margin-top:4px;";
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-success";
    saveBtn.textContent = "儲存";
    saveBtn.addEventListener("click", handleSave);
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "取消";
    cancelBtn.addEventListener("click", () => {
      mode = "list";
      draw();
    });
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    wrap.appendChild(btnRow);

    container.replaceChildren(wrap);

    if (pickerOpen) drawPicker();
  }

  async function openPicker() {
    pickerOpen = true;
    const res = await fetch(`/api/report/${schema.sourceView.key}`).then((r) => r.json());
    pickerRows = res.ok ? res.rows : [];
    draw();
  }

  function drawPicker() {
    const overlay = document.createElement("div");
    overlay.className = "picker-overlay";
    const sheet = document.createElement("div");
    sheet.className = "picker-sheet";
    sheet.innerHTML = `<h2 style="margin-top:0;">${escapeHtml(schema.sourceView.label)}</h2>`;
    if (pickerRows.length === 0) {
      sheet.innerHTML += `<p class="sub">沒有未結清的明細</p>`;
    }
    pickerRows.forEach((r) => {
      const line = document.createElement("div");
      line.className = "list-item";
      line.style.marginBottom = "8px";
      const remain = (r["訂單數量"] ?? r["採購數量"] ?? 0) - (r["出貨數量"] ?? r["收貨數量"] ?? 0) + (r["退回數量"] ?? 0);
      line.innerHTML = `<div>
        <div class="name">${escapeHtml(r["訂單編號"] || r["採購編號"])} / ${escapeHtml(r["訂單項次"] || r["採購項次"])} - ${escapeHtml(r["物料編號"])}</div>
        <div class="tables">尚餘 ${escapeHtml(remain)}</div>
      </div>`;
      line.addEventListener("click", () => {
        const row = emptyDetailRow();
        if ("訂單編號" in row) row["訂單編號"] = r["訂單編號"];
        if ("訂單項次" in row) row["訂單項次"] = r["訂單項次"];
        if ("採購編號" in row) row["採購編號"] = r["採購編號"];
        if ("採購項次" in row) row["採購項次"] = r["採購項次"];
        if ("物料編號" in row) row["物料編號"] = r["物料編號"];
        const qtyField = schema.detailFields.find((f) => /數量$/.test(f.name));
        if (qtyField) row[qtyField.name] = remain;
        currentDetails.push(row);
        pickerOpen = false;
        draw();
      });
      sheet.appendChild(line);
    });
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn btn-secondary";
    closeBtn.style.cssText = "margin-top:10px;width:100%;";
    closeBtn.textContent = "關閉";
    closeBtn.addEventListener("click", () => {
      pickerOpen = false;
      draw();
    });
    sheet.appendChild(closeBtn);
    overlay.appendChild(sheet);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        pickerOpen = false;
        draw();
      }
    });
    document.body.appendChild(overlay);
  }

  async function handleSave() {
    const pkCol = schema.headerPk[0];
    const payload = { header: currentHeader, details: currentDetails.map((r) => ({ ...r })) };
    const url = currentIsNew ? `/api/doc/${item.apiKey}` : `/api/doc/${item.apiKey}/${encodeURIComponent(currentHeader[pkCol])}`;
    const method = currentIsNew ? "POST" : "PUT";

    if (navigator.onLine) {
      try {
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json());
        if (!res.ok) {
          alert(res.error || "儲存失敗");
          return;
        }
      } catch (e) {
        await window.OfflineQueue.submit(url, { method, body: JSON.stringify(payload) });
        toast("離線，已加入待重傳佇列");
      }
    } else {
      await window.OfflineQueue.submit(url, { method, body: JSON.stringify(payload) });
      toast("離線，已加入待重傳佇列");
    }
    mode = "list";
    await loadHeaders();
    draw();
  }

  async function handleDelete(pkValue) {
    const url = `/api/doc/${item.apiKey}/${encodeURIComponent(pkValue)}`;
    try {
      const res = await fetch(url, { method: "DELETE" }).then((r) => r.json());
      if (!res.ok) {
        alert(res.error || "刪除失敗(可能已被其他單據引用)");
        return;
      }
    } catch (e) {
      await window.OfflineQueue.submit(url, { method: "DELETE" });
      toast("離線，刪除動作已加入待重傳佇列");
    }
    await loadHeaders();
    draw();
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  container.innerHTML = '<div class="placeholder">載入中…</div>';
  loadSchema()
    .then(loadHeaders)
    .then(draw)
    .catch((err) => {
      container.innerHTML = `<div class="placeholder"><h2>載入失敗</h2><p>${escapeHtml(err.message)}</p></div>`;
    });

  return function dispose() {
    disposed = true;
  };
};
