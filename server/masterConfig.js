// 主數據 / 組織架構維護畫面的通用設定。
// 前端與後端都只認得這份白名單裡的 table / 欄位名稱，
// 使用者輸入永遠只會被當成「值」綁定進參數化查詢，不會被當成 SQL 識別字。
const MASTER_TABLES = {
  "sales-org": {
    table: "銷售組織維護",
    pk: ["銷售組織"],
    fields: [
      { name: "銷售組織", label: "銷售組織", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  "purchase-org": {
    table: "採購組織維護",
    pk: ["採購組織"],
    fields: [
      { name: "採購組織", label: "採購組織", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  plant: {
    table: "工廠代碼維護",
    pk: ["工廠代碼"],
    fields: [
      { name: "工廠代碼", label: "工廠代碼", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  warehouse: {
    table: "工廠倉庫維護",
    pk: ["倉庫代碼"],
    fields: [
      { name: "工廠代碼", label: "工廠代碼", type: "select", refKey: "plant", required: true },
      { name: "倉庫代碼", label: "倉庫代碼", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  customer: {
    table: "客戶資料維護",
    pk: ["客戶編號"],
    fields: [
      { name: "客戶編號", label: "客戶編號", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  vendor: {
    table: "廠商資料維護",
    pk: ["廠商編號"],
    fields: [
      { name: "廠商編號", label: "廠商編號", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  material: {
    table: "物料資料維護",
    pk: ["物料編號"],
    fields: [
      { name: "物料編號", label: "物料編號", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  planning: {
    table: "物管資料維護",
    pk: ["物管編號"],
    fields: [
      { name: "物管編號", label: "物管編號", type: "text", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
  bom: {
    table: "用量清單維護",
    pk: ["主階編號", "子階編號"],
    fields: [
      { name: "主階編號", label: "主階編號(物料)", type: "select", refKey: "material", required: true },
      { name: "子階編號", label: "子階編號(物料)", type: "select", refKey: "material", required: true },
      { name: "標準用量", label: "標準用量", type: "number", required: true },
      { name: "備註說明", label: "備註說明", type: "text" },
    ],
  },
};

module.exports = { MASTER_TABLES };
