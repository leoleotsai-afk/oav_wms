// 報表輸出畫面：全部唯讀，資料來源可能是視圖(SD/MM)或實體表(IM/PP)。
const REPORT_TABLES = {
  "order-open": { source: "已訂未出明細", orderBy: ["訂單編號", "訂單項次"] },
  "order-analysis": {
    source: "訂單出退分析",
    orderBy: ["單據編號", "單據項次"],
    pivot: { fn: "fn_訂單出退分析_樞紐", rowLabel: "客戶編號" },
  },
  "purchase-open": { source: "已採未交明細", orderBy: ["採購編號", "採購項次"] },
  "purchase-analysis": {
    source: "採購收退分析",
    orderBy: ["單據編號", "單據項次"],
    pivot: { fn: "fn_採購收退分析_樞紐", rowLabel: "廠商編號" },
  },
  "stock-movement": {
    source: "庫存異動明細",
    orderBy: ["異動序號"],
    filterable: ["物料編號", "倉庫代碼", "異動日期"],
  },
  "daily-balance": {
    source: "每日庫存餘額",
    orderBy: ["日期", "物料編號", "倉庫代碼"],
    filterable: ["物料編號", "倉庫代碼", "日期"],
    // 每日庫存餘額畫面採三層下鑽：物料資料維護 -> 每日庫存餘額 -> 庫存異動明細
    drilldown: {
      level1: { apiKey: "material", label: "物料資料維護", filterField: "物料編號" },
      level2: { apiKey: "daily-balance", label: "每日庫存餘額" },
      level3: { apiKey: "stock-movement", label: "庫存異動明細" },
    },
  },
  wip: { source: "庫存在途明細", orderBy: ["工單編號", "物料編號"] },
  "supply-demand": { source: "每日供需餘額", orderBy: ["日期", "物料編號", "工廠代碼"] },
};

module.exports = { REPORT_TABLES };
