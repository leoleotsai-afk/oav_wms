(function () {
  const treePane = document.getElementById("tree-pane");
  const contentEl = document.getElementById("content");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const statusPill = document.getElementById("status-pill");
  const pendingHint = document.getElementById("pending-hint");

  const MENU = window.MENU_DATA;
  const CATEGORY_ICON = { org: "sitemap", master: "database", txn: "receipt", report: "chart" };

  let currentDispose = null;
  function disposeCurrent() {
    if (typeof currentDispose === "function") currentDispose();
    currentDispose = null;
  }

  function updateStatusPill() {
    const online = navigator.onLine;
    statusPill.innerHTML = `<span class="dot"></span>${online ? "線上" : "離線"}`;
    statusPill.className = "status-pill " + (online ? "online" : "offline");
  }
  window.addEventListener("online", updateStatusPill);
  window.addEventListener("offline", updateStatusPill);
  updateStatusPill();

  function renderPendingHint(n) {
    if (n > 0) {
      pendingHint.innerHTML = `${window.Icon("pending", { size: 13 })}待重傳 ${n} 筆`;
      pendingHint.style.display = "inline-flex";
    } else {
      pendingHint.style.display = "none";
    }
  }
  renderPendingHint(0);

  if (window.OfflineQueue) {
    window.OfflineQueue.onChange(async () => {
      renderPendingHint(await window.OfflineQueue.count());
    });
    window.OfflineQueue.count().then(renderPendingHint);
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    return raw ? raw.split("/") : [];
  }

  function navigate(path) {
    location.hash = "#/" + path.join("/");
  }

  function resolveLeaf(parts) {
    if (parts.length !== 3) return null;
    const mod = MENU.find((m) => m.key === parts[0]);
    if (!mod) return null;
    const cat = mod.categories.find((c) => c.key === parts[1]);
    if (!cat) return null;
    const item = cat.items.find((i) => i.key === parts[2]);
    if (!item) return null;
    return { mod, cat, item };
  }

  function iconBadge(iconName, color) {
    const bg = color ? `${color}1a` : "var(--panel-2)";
    const fg = color || "var(--muted)";
    return `<span class="icon-badge" style="background:${bg};color:${fg};">${window.Icon(iconName, { size: 18 })}</span>`;
  }

  // ---------- 左側/頂部：常駐的完整功能樹(模組可收合) ----------
  let expandedModuleKey = null;

  function setModuleExpanded(modKey, expanded) {
    const section = treePane.querySelector(`.module-section[data-mod="${modKey}"]`);
    if (!section) return;
    section.classList.toggle("expanded", expanded);
    const body = section.querySelector(".module-body");
    if (body) body.style.display = expanded ? "" : "none";
  }

  function toggleModule(modKey) {
    const willExpand = expandedModuleKey !== modKey;
    if (expandedModuleKey) setModuleExpanded(expandedModuleKey, false);
    expandedModuleKey = willExpand ? modKey : null;
    if (expandedModuleKey) setModuleExpanded(expandedModuleKey, true);
  }

  function buildTree() {
    const wrap = document.createElement("div");
    wrap.className = "menu-tree";

    MENU.forEach((mod) => {
      const totalItems = mod.categories.reduce((n, c) => n + c.items.length, 0);

      const section = document.createElement("section");
      section.className = "module-section";
      section.dataset.mod = mod.key;

      const band = document.createElement("div");
      band.className = "module-band";
      band.style.setProperty("--module-color", mod.color);
      band.innerHTML = `
        ${iconBadge(mod.icon, mod.color)}
        <div class="module-band-text">
          <div class="module-band-name">${mod.name}</div>
          <div class="module-band-meta">${mod.categories.length} 大類．${totalItems} 項功能</div>
        </div>
        <div class="module-band-caret">${window.Icon("chevronRight", { size: 15 })}</div>
      `;
      band.addEventListener("click", () => toggleModule(mod.key));
      section.appendChild(band);

      const body = document.createElement("div");
      body.className = "module-body";
      body.style.display = "none";

      mod.categories.forEach((cat) => {
        const catLabel = document.createElement("div");
        catLabel.className = "category-label";
        catLabel.innerHTML = `${window.Icon(CATEGORY_ICON[cat.key] || "database", { size: 14 })}<span>${cat.name}</span>`;
        body.appendChild(catLabel);

        const list = document.createElement("div");
        list.className = "list list-compact";
        cat.items.forEach((item) => {
          const row = document.createElement("div");
          row.className = "list-item list-item-compact";
          row.dataset.path = [mod.key, cat.key, item.key].join("/");
          row.innerHTML = `
            <div class="left">
              <div>
                <div class="name">${item.name}</div>
                <div class="tables">${item.tables.join(", ")}</div>
              </div>
            </div>
            <div class="chevron">${window.Icon("chevronRight", { size: 15 })}</div>
          `;
          row.addEventListener("click", (e) => {
            e.stopPropagation();
            navigate([mod.key, cat.key, item.key]);
          });
          list.appendChild(row);
        });
        body.appendChild(list);
      });

      section.appendChild(body);
      wrap.appendChild(section);
    });

    treePane.replaceChildren(wrap);
  }

  function highlightActive(path, modKey) {
    treePane.querySelectorAll(".list-item-compact").forEach((row) => {
      row.classList.toggle("active", row.dataset.path === path);
    });
    if (modKey && expandedModuleKey !== modKey) toggleModule(modKey);
  }

  // ---------- 右側/下方：選定功能的內容 ----------
  function renderEmptyDetail() {
    breadcrumbEl.innerHTML = "";
    contentEl.innerHTML = `
      <div class="placeholder empty-detail">
        ${window.Icon("box", { size: 32 })}
        <h2>請從左側功能樹選擇一個項目</h2>
        <p>選擇組織架構、主數據、交易數據或報表輸出中的任一功能，內容會顯示在這裡。</p>
      </div>
    `;
  }

  function setBreadcrumb(mod, cat, item) {
    const crumbs = [mod.name, cat.name, item.name];
    breadcrumbEl.innerHTML = crumbs
      .map((c, i) => (i === 0 ? `<span>${c}</span>` : `<span class="sep">${window.Icon("chevronRight", { size: 12 })}</span><span>${c}</span>`))
      .join("");
  }

  function renderDetail(mod, cat, item) {
    setBreadcrumb(mod, cat, item);

    if (item.type === "master" && window.renderMasterScreen) {
      const container = document.createElement("div");
      contentEl.replaceChildren(container);
      currentDispose = window.renderMasterScreen(container, item);
      return;
    }
    if (item.type === "document" && window.renderDocumentScreen) {
      const container = document.createElement("div");
      contentEl.replaceChildren(container);
      currentDispose = window.renderDocumentScreen(container, item);
      return;
    }
    if (item.type === "report" && item.drilldown && window.renderDrilldownScreen) {
      const container = document.createElement("div");
      contentEl.replaceChildren(container);
      currentDispose = window.renderDrilldownScreen(container, item);
      return;
    }

    if (item.type === "report" && window.renderReportScreen) {
      const container = document.createElement("div");
      contentEl.replaceChildren(container);
      currentDispose = window.renderReportScreen(container, item);
      return;
    }

    const box = document.createElement("div");
    box.className = "placeholder";
    box.innerHTML = `
      <h2>${item.name}</h2>
      <p>此功能畫面尚未建置，資料庫物件已就緒。</p>
      <div class="tables">${item.isView ? "視圖" : "資料表"}：${item.tables.join(", ")}</div>
      <div class="badge">功能開發中</div>
    `;
    contentEl.replaceChildren(box);
  }

  function render() {
    disposeCurrent();
    const parts = parseHash();
    const resolved = resolveLeaf(parts);
    if (!resolved) {
      highlightActive(null);
      renderEmptyDetail();
      return;
    }
    highlightActive(parts.join("/"), resolved.mod.key);
    renderDetail(resolved.mod, resolved.cat, resolved.item);

    if (window.matchMedia("(max-width: 900px)").matches) {
      const detailPane = document.getElementById("detail-pane");
      detailPane.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const brandIconEl = document.getElementById("sidebar-brand-icon");
  if (brandIconEl) brandIconEl.innerHTML = window.Icon("box", { size: 20 });

  buildTree();
  window.addEventListener("hashchange", render);
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {
        /* 離線快取為漸進增強，註冊失敗不影響主功能表運作 */
      });
    });
  }
})();
