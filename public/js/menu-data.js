// 功能表資料結構：對應規格書中的 SD/MM/IM/PP 四大模組
// 每個模組底下依 組織架構 / 主數據 / 交易數據 / 報表輸出 分類
// leaf 節點的 tables 對應到後端實際資料表(或視圖)名稱
window.MENU_DATA = [
  {
    key: "sd",
    icon: "box",
    color: "#2563eb",
    name: "SD訂單模組",
    categories: [
      {
        key: "org",
        name: "組織架構",
        items: [
          { key: "sales-org", name: "銷售組織維護", tables: ["銷售組織維護"], type: "master", apiKey: "sales-org" }
        ]
      },
      {
        key: "master",
        name: "主數據",
        items: [
          { key: "customer", name: "客戶資料維護", tables: ["客戶資料維護"], type: "master", apiKey: "customer" }
        ]
      },
      {
        key: "txn",
        name: "交易數據",
        items: [
          { key: "sales-order", name: "客戶訂單維護", tables: ["客戶訂單主檔", "客戶訂單明細"], type: "document", apiKey: "sales-order" },
          { key: "shipment", name: "訂單出貨維護", tables: ["訂單出貨主檔", "訂單出貨明細"], type: "document", apiKey: "shipment" },
          { key: "shipment-return", name: "出貨退回維護", tables: ["出貨退回主檔", "出貨退回明細"], type: "document", apiKey: "shipment-return" }
        ]
      },
      {
        key: "report",
        name: "報表輸出",
        items: [
          { key: "order-open", name: "已訂未出明細", tables: ["已訂未出明細"], isView: true, type: "report", apiKey: "order-open" },
          { key: "order-analysis", name: "訂單出退分析", tables: ["訂單出退分析"], isView: true, type: "report", apiKey: "order-analysis", pivot: true }
        ]
      }
    ]
  },
  {
    key: "mm",
    icon: "cart",
    color: "#7c3aed",
    name: "MM採購模組",
    categories: [
      {
        key: "org",
        name: "組織架構",
        items: [
          { key: "purchase-org", name: "採購組織維護", tables: ["採購組織維護"], type: "master", apiKey: "purchase-org" }
        ]
      },
      {
        key: "master",
        name: "主數據",
        items: [
          { key: "vendor", name: "廠商資料維護", tables: ["廠商資料維護"], type: "master", apiKey: "vendor" }
        ]
      },
      {
        key: "txn",
        name: "交易數據",
        items: [
          { key: "purchase-order", name: "廠商採購維護", tables: ["廠商採購主檔", "廠商採購明細"], type: "document", apiKey: "purchase-order" },
          { key: "receiving", name: "採購收貨維護", tables: ["採購收貨主檔", "採購收貨明細"], type: "document", apiKey: "receiving" },
          { key: "receiving-return", name: "收貨退回維護", tables: ["收貨退回主檔", "收貨退回明細"], type: "document", apiKey: "receiving-return" }
        ]
      },
      {
        key: "report",
        name: "報表輸出",
        items: [
          { key: "purchase-open", name: "已採未交明細", tables: ["已採未交明細"], isView: true, type: "report", apiKey: "purchase-open" },
          { key: "purchase-analysis", name: "採購收退分析", tables: ["採購收退分析"], isView: true, type: "report", apiKey: "purchase-analysis", pivot: true }
        ]
      }
    ]
  },
  {
    key: "im",
    icon: "warehouse",
    color: "#059669",
    name: "IM庫存模組",
    categories: [
      {
        key: "org",
        name: "組織架構",
        items: [
          { key: "warehouse", name: "工廠倉庫維護", tables: ["工廠倉庫維護"], type: "master", apiKey: "warehouse" }
        ]
      },
      {
        key: "master",
        name: "主數據",
        items: [
          { key: "material", name: "物料資料維護", tables: ["物料資料維護"], type: "master", apiKey: "material" }
        ]
      },
      {
        key: "txn",
        name: "交易數據",
        items: [
          { key: "reservation", name: "物料預留維護", tables: ["物料預留主檔", "物料預留明細"], type: "document", apiKey: "reservation" },
          { key: "issue", name: "庫存領用維護", tables: ["庫存領用主檔", "庫存領用明細"], type: "document", apiKey: "issue" },
          { key: "return-to-stock", name: "庫存繳回維護", tables: ["庫存繳庫主檔", "庫存繳庫明細"], type: "document", apiKey: "return-to-stock" }
        ]
      },
      {
        key: "report",
        name: "報表輸出",
        items: [
          { key: "stock-movement", name: "庫存異動明細", tables: ["庫存異動明細"], type: "report", apiKey: "stock-movement" },
          { key: "daily-balance", name: "每日庫存餘額", tables: ["物料資料維護", "每日庫存餘額", "庫存異動明細"], type: "report", apiKey: "daily-balance", drilldown: true }
        ]
      }
    ]
  },
  {
    key: "pp",
    icon: "cog",
    color: "#d97706",
    name: "PP生產模組",
    categories: [
      {
        key: "org",
        name: "組織架構",
        items: [
          { key: "plant", name: "工廠代碼維護", tables: ["工廠代碼維護"], type: "master", apiKey: "plant" }
        ]
      },
      {
        key: "master",
        name: "主數據",
        items: [
          { key: "planning", name: "物管資料維護", tables: ["物管資料維護"], type: "master", apiKey: "planning" },
          { key: "bom", name: "用量清單維護", tables: ["用量清單維護"], type: "master", apiKey: "bom" }
        ]
      },
      {
        key: "txn",
        name: "交易數據",
        items: [
          { key: "work-order", name: "生產工單維護", tables: ["生產工單主檔", "生產工單明細"], type: "document", apiKey: "work-order" },
          { key: "material-issue", name: "工單領料維護", tables: ["工單領料主檔", "工單領料明細"], type: "document", apiKey: "material-issue" },
          { key: "receipt", name: "工單入庫維護", tables: ["工單入庫主檔", "工單入庫明細"], type: "document", apiKey: "receipt" }
        ]
      },
      {
        key: "report",
        name: "報表輸出",
        items: [
          { key: "wip", name: "庫存在途明細", tables: ["庫存在途明細"], type: "report", apiKey: "wip" },
          { key: "supply-demand", name: "每日供需餘額", tables: ["每日供需餘額"], type: "report", apiKey: "supply-demand" }
        ]
      }
    ]
  }
];
