const fs = require("fs");
const path = require("path");
const sql = require("mssql");

// 簡易 .env 讀取(不額外安裝套件)：只在本機開發用，真實密碼絕不進版本控制。
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile();

const required = ["OAV_DB_SERVER", "OAV_DB_PORT", "OAV_DB_NAME", "OAV_DB_USER", "OAV_DB_PASSWORD"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(
    `缺少資料庫連線設定：${missing.join(", ")}。請在 server/.env 內設定(可參考 server/.env.example)。`
  );
}

const config = {
  server: process.env.OAV_DB_SERVER,
  port: Number(process.env.OAV_DB_PORT),
  database: process.env.OAV_DB_NAME,
  user: process.env.OAV_DB_USER,
  password: process.env.OAV_DB_PASSWORD,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

module.exports = { sql, getPool };
