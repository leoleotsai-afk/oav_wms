# Agent 須知

給任何在這個 repo 裡工作的 AI coding agent（Claude Code 或其他工具）看的最短版規則。
完整背景見 `CLAUDE.md`，擴充功能的操作步驟見 `SKILL.md`。

## 鐵律

1. **業務邏輯寫 T-SQL，不要寫 JS。** 數量累加、參照完整性、數量必須 > 0、樞紐彙總——
   這些一律用 trigger / FK / CHECK constraint / table-valued function 在 SQL Server 端解決
   （見 `db/10_triggers_accumulation.sql`、`db/11_check_constraints.sql`、`db/12_pivot_functions.sql`）。
   前端和 Node 後端只做「顯示、呼叫 API、離線暫存」。
2. **三個通用引擎是設定檔驅動的（`masterConfig.js` / `documentConfig.js` / `reportConfig.js`），
   新增畫面請改設定檔，不要手刻新路由或新前端元件。** 步驟見 `SKILL.md`。
3. **絕對不要把真實資料庫密碼寫進程式碼或提交進 git。** 密碼只放 `server/.env`
   （已 gitignore）。範本是 `server/.env.example`，裡面只能放假值。
4. **修改 `db/*.sql` 後要實際執行 `db/run_all.ps1` 套用到 oav67 資料庫**，不是只改檔案就結束；
   每支腳本都要保持可重複執行（`IF OBJECT_ID(...) IS NULL` / `CREATE OR ALTER`）。
5. **修改 `server/*.js` 後要重啟 node process**（沒有 hot reload），並至少打一次相關 API 驗證，
   不要只憑語法檢查就當作完成。
6. **每完成一個階段要 commit + push 到 `leoleotsai-afk/oav_wms`**，並同步更新
   `CLAUDE.md` / `SKILL.md` / `AGENT.md` 讓文件跟得上現況。commit 前用 `git status` 確認
   沒有夾帶 `.env`、`node_modules` 或任何密碼字串。

## 這台機器的限制

沒有 sqlcmd / python / dotnet SDK，只有 PowerShell 5.1 + Node.js(winget 裝的)。
不要假設這些工具存在，改用 repo 裡現成的 `db/run_all.ps1`（.NET SqlClient 直連）跟
`node server.js`。
