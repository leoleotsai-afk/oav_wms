# OAV ERP 庫存管理系統

PWA 前端 + Node/Express + SQL Server。核心原則：**能用 T-SQL 解決的，一律不寫在前端/後端 JS**。
JS 層只做「顯示表單、呼叫 API、離線佇列」，數量累加、參照完整性、樞紐彙總全部交給 SQL Server。

## 環境

- SQL Server：`163.17.141.61,8082`，資料庫 `oav67`
- 真實帳密只存在 `server/.env`（已 gitignore，不進版控），範本見 `server/.env.example`
- 這台機器沒有安裝 sqlcmd，`db/run_all.ps1` 用 .NET `System.Data.SqlClient` 直接執行 `db/*.sql`
- 後端：Node.js + Express + `mssql` 套件（`server/`）
- 前端：純 HTML/CSS/JS，無框架、無建置流程（`public/`），PWA (manifest + service worker)

## 啟動方式

```powershell
cd server
npm install        # 只需一次
node server.js     # 監聽 http://localhost:8080，同時serve public/ 與提供 /api/*
```

修改 `db/*.sql` 後：`powershell -File db/run_all.ps1`（所有腳本都用 `IF OBJECT_ID(...) IS NULL` /
`CREATE OR ALTER` 包起來，可重複執行）。修改 `server/*.js` 後需要重啟 node process（沒有 hot reload）。

## 資料庫物件（db/）

- `00`~`07`：四大模組(SD/MM/IM/PP)的組織架構、主數據、交易數據資料表，以及 IM/PP 報表用實體表
- `08`：SD/MM 報表視圖（已訂未出明細、訂單出退分析、已採未交明細、採購收退分析）
- `09`：欄位命名修正（廠商採購主檔.客戶編號 → 廠商編號）
- `10`：**過帳觸發器**——明細新增/修改/刪除時，自動把數量累加回上游單據
  （訂單出貨→客戶訂單明細.出貨數量、出貨退回→客戶訂單明細.退回數量、
  採購收貨→廠商採購明細.收貨數量、收貨退回→廠商採購明細.退回數量、
  工單入庫→生產工單主檔.入庫數量、工單領料→生產工單明細.已領用量）
- `11`：數量欄位 `CHECK (> 0)` 約束
- `12`：**樞紐分析** table-valued functions（`fn_訂單出退分析_樞紐(@年度)`、`fn_採購收退分析_樞紐(@年度)`），
  縱軸客戶/廠商編號、橫軸月份，全部在 SQL 端用 `SUM(CASE WHEN MONTH(...)...)` 完成

所有主檔/明細都有 PK/FK 約束；刪除一筆已被下游單據引用的資料（例如已出貨的訂單行）會被 SQL Server
的 FK 擋下，API 直接把錯誤訊息回傳給前端，不需要額外程式碼檢查。

## 後端（server/）— 三個通用引擎，不是逐畫面手刻

- `masterConfig.js` + `/api/master/:key`：組織架構/主數據維護（新增/編輯/刪除，單一資料表）
- `documentConfig.js` + `/api/doc/:key`：交易數據維護（主檔+明細），含交易(transaction)、
  自動項次編號、更新時用「保留既有項次 + 刪除移除的 + 新增沒項次的」的 merge 策略
  （不是整批刪除重建，這樣才不會破壞下游單據對舊項次的參照）
- `reportConfig.js` + `/api/report/:key`（唯讀）、`/api/report/:key/pivot?year=YYYY`（樞紐）

新增一個畫面幾乎都只需要改設定檔，不需要新寫路由或新寫前端元件，細節見 `SKILL.md`。

## 前端（public/）

- `js/menu-data.js`：功能表樹狀結構，每個 leaf 節點標記 `type: "master"|"document"|"report"` + `apiKey`
- `js/app.js`：hash router，依 `type` 分派到對應的通用畫面元件
- `js/master-maintenance.js` / `document-maintenance.js` / `report-viewer.js`：三個通用畫面元件，
  欄位定義完全從後端 schema 動態取得，不寫死任何表格
- `js/offline-queue.js`：IndexedDB 佇列，離線時的新增/修改/刪除先暫存，`online` 事件觸發後自動重送
- 白底、單欄垂直清單樣式（`css/styles.css` 用 CSS variables 統一配色）

## 目前狀態

- 34 張資料表、4 個報表視圖、2 個樞紐分析 TVF、6 個過帳觸發器、14 個數量檢查約束，全部已在 oav67 建好並驗證
- 9 個主數據維護畫面、12 個交易單據維護畫面、8 個報表畫面（2 個含樞紐）全部可用
- 尚未建置：`庫存異動明細`、`每日庫存餘額`、`庫存在途明細`、`每日供需餘額` 這 4 張實體表目前沒有
  資料寫入的排程/程序（結構已建好，等後續設計過帳/日結批次）

## 版控

GitHub: `leoleotsai-afk/oav_wms`。`server/.env`、`server/node_modules/` 已加入 `.gitignore`，
絕對不要移除這兩條規則或把真實密碼寫回程式碼。每完成一個階段就 commit + push，
並同步更新這份 `CLAUDE.md`、`SKILL.md`、`AGENT.md`。
