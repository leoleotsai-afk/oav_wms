# 開發手冊：如何擴充 OAV ERP

系統的三大維護畫面（組織架構/主數據、交易數據、報表）都是「一份通用引擎 + 設定檔」，
新增功能時**優先改設定檔**，不要另外手刻一個新畫面或新路由。

## 新增一個組織架構/主數據維護畫面

1. 確認 `db/` 裡對應資料表已存在（沒有的話新增一支 `db/xx_xxx.sql`，用
   `IF OBJECT_ID(N'[dbo].[表名]') IS NULL BEGIN CREATE TABLE ... END`，然後
   `powershell -File db/run_all.ps1` 套用）
2. 在 `server/masterConfig.js` 的 `MASTER_TABLES` 加一筆：
   ```js
   "some-key": {
     table: "資料表名稱",
     pk: ["主鍵欄位"],
     fields: [
       { name: "欄位", label: "顯示名稱", type: "text"|"number"|"select", required: true, refKey: "另一個master key" },
     ],
   }
   ```
3. 在 `public/js/menu-data.js` 對應的 leaf 節點加上 `type: "master", apiKey: "some-key"`
4. 重啟 `node server.js`，畫面就會自動出現新增/編輯/刪除/下拉選單，不用寫任何前端程式碼

## 新增一個交易數據（主檔+明細）維護畫面

1. 資料表需求同上（主檔 + 明細，明細要有一個項次欄位，例如 `xx項次 nvarchar(04)`）
2. 在 `server/documentConfig.js` 的 `DOCUMENT_TABLES` 加一筆，指定：
   - `headerTable` / `headerPk` / `headerFields`
   - `detailTable` / `detailFk`（明細指回主檔的欄位）/ `itemNoField`（項次欄位名）/ `detailFields`
   - 若明細有「累加型」欄位（例如已出貨數量，由觸發器維護，不可被使用者編輯），放進
     `readonlyDetailFields`（主檔的累加型欄位放 `headerReadonlyFields`），絕對不要放進
     `detailFields`／`headerFields`，否則 API 會嘗試寫入這些欄位
   - 若這個單據是「對另一張已開立單據的行進行部分結算」（例如出貨對訂單行、收貨對採購行），
     加上 `sourceView: { key: "report key", label: "顯示名稱" }`，前端就會出現「從XX挑選」按鈕
3. 如果新增/更新累加到上游單據的邏輯（過帳機制），寫成 SQL trigger 放進 `db/10_triggers_accumulation.sql`
   （或新增一支 db 腳本），不要在 Node 或前端寫這個邏輯
4. 在 `menu-data.js` 加 `type: "document", apiKey: "..."`，重啟 server

## 新增一個報表畫面

1. 資料來源是 view 或實體表都可以：在 `server/reportConfig.js` 的 `REPORT_TABLES` 加一筆
   `{ source: "視圖或資料表名稱", orderBy: [...] }`
2. 如果需要「輸入年度、縱軸XX橫軸月份」這種樞紐分析，寫一支 T-SQL inline table-valued function
   （見 `db/12_pivot_functions.sql` 兩個範例），然後在 config 裡加
   `pivot: { fn: "fn_名稱", rowLabel: "縱軸欄位名" }`
3. 在 `menu-data.js` 加 `type: "report", apiKey: "...", pivot: true`（有樞紐才加 pivot）

## 資料庫變更的通用流程

- 每支 `.sql` 檔案都要用 `IF OBJECT_ID(...) IS NULL` / `CREATE OR ALTER` 包起來，確保
  `db/run_all.ps1` 可以重複執行而不出錯
- 檔名前綴數字決定執行順序，新檔案接續現有最大編號往後加
- 改完直接 `powershell -File db/run_all.ps1` 套用到 oav67，不需要手動一支一支貼到 SSMS

## 開發環境限制（這台機器）

- 沒有 sqlcmd / python / dotnet，只有 PowerShell + Node.js(已透過 winget 安裝)
- 執行 SQL 用 `db/run_all.ps1`（.NET SqlClient），不要假設 sqlcmd 存在
- 修改 `server/*.js` 後要手動 kill 掉舊的 `node server.js` process 再重開，沒有 nodemon

## 安全規則

- 真實資料庫密碼只能放在 `server/.env`（已 gitignore），程式碼裡任何地方都不能寫死密碼，
  也不要把預設值退回成含密碼的字串
- commit 前若動到連線設定，先 `git status`/`git diff` 確認沒有把 `.env` 或密碼字串帶進去
