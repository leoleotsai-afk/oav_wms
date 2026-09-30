// 內建線條圖示(inline SVG，stroke=currentColor)，不依賴任何外部圖示套件/CDN，離線也能用。
window.Icon = function Icon(name, opts) {
  const size = (opts && opts.size) || 20;
  const body = ICONS[name] || ICONS.box;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};

const ICONS = {
  // SD 訂單模組
  box: `<path d="M12 3 3 7.5 12 12l9-4.5L12 3Z"/><path d="M3 7.5V16.5L12 21l9-4.5V7.5"/><path d="M12 12v9"/>`,
  // MM 採購模組
  cart: `<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.6L21 8H6.2"/>`,
  // IM 庫存模組
  warehouse: `<path d="M4 10 12 4l8 6"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>`,
  // PP 生產模組
  cog: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.96 19a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/>`,
  // 分類圖示
  sitemap: `<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v4M12 11H6v6M12 11h6v6"/>`,
  database: `<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/><path d="M4 11.5v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>`,
  receipt: `<path d="M6 3h12v18l-2.5-1.5L13 21l-1.5-1.5L10 21l-2.5-1.5L6 21V3Z"/><path d="M9 8h6M9 12h6"/>`,
  chart: `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`,
  // UI
  chevronRight: `<path d="m9 6 6 6-6 6"/>`,
  back: `<path d="m14 6-6 6 6 6"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  pending: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
};
