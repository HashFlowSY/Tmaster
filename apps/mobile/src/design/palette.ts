// 调色板原语 —— 与原型 docs/ui/tianji-app-design.html 的 :root CSS `--vars` 1:1 命名。
// 值 100% 来自原型 :root，改这里等于改设计真源。语义别名见 ./semantic。
export const palette = {
  ink: '#0b0d12', // --ink
  ink2: '#12151e', // --ink-2
  ink3: '#1b1f2b', // --ink-3
  ink4: '#242938', // --ink-4
  gold: '#c9a24a', // --gold
  gold2: '#e6c979', // --gold-2
  goldSoft: 'rgba(201,162,74,0.14)', // --gold-soft
  ivory: '#ece5d6', // --ivory
  muted: '#8d8674', // --muted
  muted2: '#615c50', // --muted-2
  line: 'rgba(233,220,190,0.10)', // --line
  line2: 'rgba(233,220,190,0.06)', // --line-2
  ok: '#6f9a6a', // --ok

  // 五行 —— 仅供「八字盘」内部作数据编码，禁止作通用 UI 色（spec §3、User Story 11/31）。
  wxJin: '#d9c9a3', // --wx-jin 金
  wxMu: '#6f9a6a', // --wx-mu 木
  wxShui: '#5a7fa3', // --wx-shui 水
  wxHuo: '#b2564a', // --wx-huo 火
  wxTu: '#b0894f', // --wx-tu 土
} as const;

export type PaletteToken = keyof typeof palette;
