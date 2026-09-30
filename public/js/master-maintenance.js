// 通用「組織架構 / 主數據」維護畫面：欄位定義完全由後端 schema 決定，
// 前端只負責畫表單/表格與呼叫 API，不做任何業務邏輯判斷(那些交給 SQL Server 的約束)。
window.renderMasterScreen = function renderMasterScreen(container, item) {
  let disposed = false;
  let schema = null;
  let rows = [];
  let optionsCache = {};
  let editingKey = null; // null = 未編輯, "__new__" = 新增中, 其餘 = 該列 pk 組成的字串

  function pkString(row) {
    return schema.pk.map((k) => row[k]).join("\u0001");
  }

  function emptyRow() {
    const r = {};
    schema.fields.forEach((f) => (r[f.name] = ""));
    return r;
  }

  async function loadSchema() {
    const res = await fetch(`/api/master/${item.apiKey}/schema`).then((r) => r.json());
    if (!res.ok) throw new Error(res.error || "schema load failed");
    schema = res;
    for (const f of schema.fields) {
      if (f.type === "select" && f.refKey) {
        const o = await fetch(`/api/master/${f.refKey}/options`).then((r) => r.json());
        optionsCache[f.name] = o.ok ? o.options : [];
      }
    }
  }

  async function loadRows() {
    const res = await fetch(`/api/master/${item.apiKey}`).then((r) => r.json());
    rows = res.ok ? res.rows : [];
  }

  function fieldInputHtml(f, value, isPk, disablePk) {
    const val = value === undefined || value === null ? "" : value;
    if (f.type === "select") {
      const opts = (optionsCache[f.name] || [])
        .map((o) => `<option value="${escapeAttr(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
        .join("");
      return `<select data-field="${f.name}" ${isPk && disablePk ? "disabled" : ""}><option value="">請選擇</option>${opts}</select>`;
    }
    const inputType = f.type === "number" ? "number" : "text";
    return `<input data-field="${f.name}" type="${inputType}" value="${escapeAttr(val)}" ${isPk && disablePk ? "disabled" : ""} />`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function draw() {
    if (disposed) return;
    const wrap = document.createElement("div");

    const toolbar = document.createElement("div");
    toolbar.className = "toolbar-row";
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary";
    addBtn.textContent = "＋ 新增";
    addBtn.addEventListener("click", () => {
      editingKey = "__new__";
      draw();
    });
    toolbar.appendChild(addBtn);
    wrap.appendChild(toolbar);

    if (editingKey === "__new__") {
      wrap.appendChild(buildForm(emptyRow(), true));
    }

    const list = document.createElement("div");
    list.className = "list";
    rows.forEach((row) => {
      const key = pkString(row);
      if (editingKey === key) {
        list.appendChild(buildForm(row, false));
        return;
      }
      const item2 = document.createElement("div");
      item2.className = "list-item";
      const summary = schema.fields.map((f) => row[f.name]).filter((v) => v !== null && v !== "").join(" / ");
      item2.innerHTML = `
        <div>
          <div class="name">${escapeHtml(schema.pk.map((k) => row[k]).join(" / "))}</div>
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
        editingKey = key;
        draw();
      });
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger btn-sm";
      delBtn.textContent = "刪除";
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`確定要刪除「${schema.pk.map((k) => row[k]).join(" / ")}」嗎？`)) return;
        await handleDelete(row);
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      item2.appendChild(actions);
      list.appendChild(item2);
    });
    wrap.appendChild(list);

    container.replaceChildren(wrap);
  }

  function buildForm(row, isNew) {
    const box = document.createElement("div");
    box.className = "placeholder";
    box.style.textAlign = "left";
    const title = document.createElement("h2");
    title.textContent = isNew ? "新增" : "編輯";
    box.appendChild(title);

    const formGrid = document.createElement("div");
    formGrid.style.cssText = "display:flex;flex-direction:column;gap:10px;margin:12px 0;";
    schema.fields.forEach((f) => {
      const line = document.createElement("label");
      line.className = "field-label";
      const isPk = schema.pk.includes(f.name);
      line.innerHTML = `<span>${escapeHtml(f.label)}${f.required ? " *" : ""}</span>${fieldInputHtml(f, row[f.name], isPk, !isNew)}`;
      formGrid.appendChild(line);
    });
    box.appendChild(formGrid);

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:10px;justify-content:center;";
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-success";
    saveBtn.textContent = "儲存";
    saveBtn.addEventListener("click", async () => {
      const values = {};
      formGrid.querySelectorAll("[data-field]").forEach((el) => {
        values[el.dataset.field] = el.value;
      });
      await handleSubmit(values, isNew, row);
    });
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "取消";
    cancelBtn.addEventListener("click", () => {
      editingKey = null;
      draw();
    });
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    box.appendChild(btnRow);
    return box;
  }

  async function handleSubmit(values, isNew, originalRow) {
    const url = `/api/master/${item.apiKey}`;
    const method = isNew ? "POST" : "PUT";
    const result = await window.OfflineQueue.submit(url, {
      method,
      body: JSON.stringify(values),
    });

    if (isNew) {
      rows.push(values);
    } else {
      const idx = rows.findIndex((r) => pkString(r) === pkString(originalRow));
      if (idx >= 0) rows[idx] = { ...rows[idx], ...values };
    }
    editingKey = null;
    draw();

    if (result.queued) {
      toast("已離線暫存，恢復連線後將自動送出");
    } else {
      await loadRows();
      draw();
    }
  }

  async function handleDelete(row) {
    const url = `/api/master/${item.apiKey}`;
    const pkValues = {};
    schema.pk.forEach((k) => (pkValues[k] = row[k]));
    const result = await window.OfflineQueue.submit(url, {
      method: "DELETE",
      body: JSON.stringify(pkValues),
    });
    rows = rows.filter((r) => pkString(r) !== pkString(row));
    draw();
    if (result.queued) {
      toast("刪除動作已離線暫存，恢復連線後將自動送出");
    } else {
      await loadRows();
      draw();
    }
  }

  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  const onlineHandler = () => {
    loadRows().then(draw);
  };
  window.addEventListener("online", onlineHandler);

  container.innerHTML = '<div class="placeholder">載入中…</div>';
  loadSchema()
    .then(loadRows)
    .then(draw)
    .catch((err) => {
      container.innerHTML = `<div class="placeholder"><h2>載入失敗</h2><p>${escapeHtml(err.message)}</p></div>`;
    });

  return function dispose() {
    disposed = true;
    window.removeEventListener("online", onlineHandler);
  };
};
