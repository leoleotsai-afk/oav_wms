(function () {
  const app = document.getElementById("app");
  const titleEl = document.getElementById("page-title");
  const backBtn = document.getElementById("back-btn");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const mainEl = document.getElementById("content");
  const statusPill = document.getElementById("status-pill");
  const pendingHint = document.getElementById("pending-hint");

  const MENU = window.MENU_DATA;
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

  function render() {
    disposeCurrent();
    const parts = parseHash();
    if (parts.length === 0) return renderHome();
    const mod = MENU.find((m) => m.key === parts[0]);
    if (!mod) return renderHome();
    if (parts.length === 1) return renderModule(mod);
    const cat = mod.categories.find((c) => c.key === parts[1]);
    if (!cat) return renderModule(mod);
    if (parts.length === 2) return renderCategory(mod, cat);
    const item = cat.items.find((i) => i.key === parts[2]);
    if (!item) return renderCategory(mod, cat);
    return renderLeaf(mod, cat, item);
  }

  const CATEGORY_ICON = { org: "sitemap", master: "database", txn: "receipt", report: "chart" };

  function setHeader(title, showBack, crumbs) {
    titleEl.textContent = title;
    backBtn.classList.toggle("visible", !!showBack);
    backBtn.innerHTML = window.Icon("back", { size: 20 });
    if (!crumbs || crumbs.length === 0) {
      breadcrumbEl.innerHTML = "";
    } else {
      breadcrumbEl.innerHTML = crumbs
        .map((c, i) => (i === 0 ? `<span>${c}</span>` : `<span class="sep">${window.Icon("chevronRight", { size: 12 })}</span><span>${c}</span>`))
        .join("");
    }
  }

  function iconBadge(iconName, color) {
    const bg = color ? `${color}1a` : "var(--panel-2)";
    const fg = color || "var(--muted)";
    return `<span class="icon-badge" style="background:${bg};color:${fg};">${window.Icon(iconName, { size: 18 })}</span>`;
  }

  function renderHome() {
    setHeader("OAV ERP 庫存管理系統", false, null);
    const wrap = document.createElement("div");
    wrap.className = "menu-tree";

    MENU.forEach((mod) => {
      const totalItems = mod.categories.reduce((n, c) => n + c.items.length, 0);

      const section = document.createElement("section");
      section.className = "module-section";

      const band = document.createElement("div");
      band.className = "module-band";
      band.style.setProperty("--module-color", mod.color);
      band.innerHTML = `
        ${iconBadge(mod.icon, mod.color)}
        <div>
          <div class="module-band-name">${mod.name}</div>
          <div class="module-band-meta">${mod.categories.length} 大類．${totalItems} 項功能</div>
        </div>
      `;
      section.appendChild(band);

      mod.categories.forEach((cat) => {
        const catLabel = document.createElement("div");
        catLabel.className = "category-label";
        catLabel.innerHTML = `${window.Icon(CATEGORY_ICON[cat.key] || "database", { size: 14 })}<span>${cat.name}</span>`;
        section.appendChild(catLabel);

        const list = document.createElement("div");
        list.className = "list list-compact";
        cat.items.forEach((item) => {
          const row = document.createElement("div");
          row.className = "list-item list-item-compact";
          row.innerHTML = `
            <div class="left">
              <div>
                <div class="name">${item.name}</div>
                <div class="tables">${item.tables.join(", ")}</div>
              </div>
            </div>
            <div class="chevron">${window.Icon("chevronRight", { size: 15 })}</div>
          `;
          row.addEventListener("click", () => navigate([mod.key, cat.key, item.key]));
          list.appendChild(row);
        });
        section.appendChild(list);
      });

      wrap.appendChild(section);
    });

    mainEl.replaceChildren(wrap);
  }

  function renderModule(mod) {
    setHeader(mod.name, true, ["主功能表"]);
    const list = document.createElement("div");
    list.className = "list";
    mod.categories.forEach((cat) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <div class="left">
          ${iconBadge(CATEGORY_ICON[cat.key] || "database", mod.color)}
          <div>
            <div class="name">${cat.name}</div>
            <div class="sub">${cat.items.length} 項功能</div>
          </div>
        </div>
        <div class="chevron">${window.Icon("chevronRight", { size: 16 })}</div>
      `;
      row.addEventListener("click", () => navigate([mod.key, cat.key]));
      list.appendChild(row);
    });
    mainEl.replaceChildren(list);
  }

  function renderCategory(mod, cat) {
    setHeader(cat.name, true, ["主功能表", mod.name]);
    const list = document.createElement("div");
    list.className = "list";
    cat.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <div class="left">
          ${iconBadge(CATEGORY_ICON[cat.key] || "database", mod.color)}
          <div>
            <div class="name">${item.name}</div>
            <div class="tables">${item.tables.join(", ")}</div>
          </div>
        </div>
        <div class="chevron">${window.Icon("chevronRight", { size: 16 })}</div>
      `;
      row.addEventListener("click", () => navigate([mod.key, cat.key, item.key]));
      list.appendChild(row);
    });
    mainEl.replaceChildren(list);
  }

  function renderLeaf(mod, cat, item) {
    setHeader(item.name, true, ["主功能表", mod.name, cat.name]);

    if (item.type === "master" && window.renderMasterScreen) {
      const container = document.createElement("div");
      mainEl.replaceChildren(container);
      currentDispose = window.renderMasterScreen(container, item);
      return;
    }

    if (item.type === "document" && window.renderDocumentScreen) {
      const container = document.createElement("div");
      mainEl.replaceChildren(container);
      currentDispose = window.renderDocumentScreen(container, item);
      return;
    }

    if (item.type === "report" && window.renderReportScreen) {
      const container = document.createElement("div");
      mainEl.replaceChildren(container);
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
    mainEl.replaceChildren(box);
  }

  backBtn.addEventListener("click", () => {
    const parts = parseHash();
    parts.pop();
    navigate(parts);
  });

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
