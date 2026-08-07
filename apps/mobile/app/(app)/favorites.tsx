import { type Conversation, systemLabel } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ConversationApi } from '../../src/api/endpoints';
import { relativeTime } from '../../src/chat/conversationMeta';
import { ListRow, Pager, Screen, SearchBar, TitleBar } from '../../src/design/primitives';
import { filterRows, normalizeQuery } from '../../src/list/listSearch';
import { pageView, slicePage } from '../../src/list/pager';
import { semantic } from '../../src/design/semantic';
import { fonts, tracking } from '../../src/design/typography';

// 原型每页 6 行、共 2 页 12 条（.pagegroup）。与历史页同档（复用 list/pager 纯逻辑，不另分档）。
const PAGE_SIZE = 6;

/** 一行的视图模型（由真实 Conversation 派生，见文末数据边界裁定）。 */
interface RowVM {
  key: string;
  title: string;
  time: string;
  tag: string;
}
// 行的可搜文本 = 标题 + 时间 + 系统标签（对应原型 .convrow 的 textContent；同历史页，无断语预览，见裁定）。
const toText = (r: RowVM) => `${r.title} ${r.time} ${r.tag}`;

/**
 * 我的收藏页 —— 与原型 docs/ui/tianji-app-design.html 的 favorites 屏 1:1（spec §8、issue 11）。
 * 命主浏览已收藏的对话为「收藏行」（bookmarkFilled 金标 + 两行截断标题 + 时间 + 系统标签），
 * 可跨全部页客户端搜索（清除按钮），并翻页浏览;空态与无结果态各自渲染。自绘原型衬线标题栏 + 返回键
 * （(app) 布局对本页 headerShown:false）。整体结构与历史页（issue 10）同构，差异仅在收藏语义（见裁定）。
 *
 * 逻辑 seam（spec Testing Decisions）由纯函数承载并单测且与历史页同一真源、不另开分支:
 * 搜索谓词 list/listSearch、分页区间 list/pager;相对时间复用 chat/relativeTime。
 * SearchBar/ListRow/Pager 为 issue 10 落地的 Tier-2 primitive;收藏行走 ListRow 的 `favorite` 变体。
 *
 * 数据边界裁定（spec Out of Scope:禁改 schema / 不加新功能;同 issue 09/10「不造假」取舍）:
 * - 收藏粒度:收藏 = 一整条对话（CONTEXT.md 术语表 / ticket 11）。故取 ConversationApi.list(true) 的
 *   已收藏对话,行标题即对话标题（Conversation.title，schema 上限 60 字,较长时两行截断——原型 .favtitle）。
 * - 收藏标记（原型 .cico.star 填充书签）:全行统一用 bookmarkFilled 金标,不按系统分型换图标
 *   （分型信息由右侧 .ctag 承载,收藏标记只表「已收藏」）。
 * - 断语摘要 / 来源标注（原型 .favtitle 断语 + .csnip「来自「原对话」」）:该框架预设收藏是从对话中摘出的
 *   逐条断语;但本域收藏即整条对话,标题已是对话本身,无独立「来源对话」可标注,故省略 snippet
 *   （同历史页据真实数据不填,不编造摘要;ListRow 仍保留 snippet 槽以维持 1:1 形状）。
 * - 搜索/提示文案:原型 placeholder「搜索收藏的断语…」/ listhint「…断语与吉时」引用不存在的断语字段,
 *   按历史页先例改为据真实数据的措辞（「搜索我的收藏…」/「按时间倒序」);aria-label / 无结果文案与原型一致。
 * - 时间（.ctime）:relativeTime(updatedAt)（今天/昨天 HH:mm / MM-DD）。排序:按 updatedAt 倒序。
 * - 点击行:进入「对话」页（按 id 深链到具体线程需 chat 页接 route 参数,属 issue 07,越界;同历史页）。
 * - 分页:仅在多于一页时显示 Pager（单页时惰性无意义,隐藏;同历史页）。
 */
export default function FavoritesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // 聚焦即刷新（从对话返回、或在别处改动收藏后保持最新，同历史/我的的取数模式）。
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      ConversationApi.list(true)
        .then((list) => {
          if (cancelled) return;
          setItems(list);
          setLoaded(true);
        })
        .catch(() => {
          if (!cancelled) setLoaded(true);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // 真实已收藏对话 → 收藏行视图模型（按时间倒序）。列表短，每 render 内联重算即可，相对时间随之保持新鲜。
  const now = new Date();
  const rows: RowVM[] = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((c) => ({
      key: c.id,
      title: c.title,
      time: relativeTime(new Date(c.updatedAt), now),
      tag: systemLabel(c.system),
    }));

  // 搜索作用于扁平全集（跨全部页）；分页区间由纯函数计算并切片。
  const searching = normalizeQuery(query) !== '';
  const view = pageView(rows.length, PAGE_SIZE, page);
  const visible = searching ? filterRows(rows, query, toText) : slicePage(rows, view);

  const header = <TitleBar title="我的收藏" onBack={() => router.back()} />;

  return (
    <Screen scroll header={header} contentStyle={styles.pad}>
      {!loaded ? null : items.length === 0 ? (
        // 空态：命主尚无任何收藏（原型 .conv-empty）。
        <Text style={styles.emptyState}>暂无收藏</Text>
      ) : (
        <>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="搜索我的收藏…"
            accessibilityLabel="搜索我的收藏"
          />

          {/* 列表提示（原型 .listhint）——仅在非搜索时显示。 */}
          {!searching ? (
            <Text style={styles.hint}>共 {rows.length} 条收藏 · 按时间倒序</Text>
          ) : null}

          {visible.map((r, i) => (
            <ListRow
              key={r.key}
              variant="favorite"
              icon="bookmarkFilled"
              title={r.title}
              time={r.time}
              tag={r.tag}
              divider={i < visible.length - 1}
              onPress={() => router.push('/chat')}
            />
          ))}

          {/* 无结果态（原型 .search-empty）——搜索中且零命中。 */}
          {searching && visible.length === 0 ? (
            <Text style={styles.searchEmpty}>未找到匹配的收藏，换个关键词试试。</Text>
          ) : null}

          {/* 分页（原型 .pager）——非搜索且多于一页时。 */}
          {!searching && view.totalPages > 1 ? (
            <Pager page={view.page} totalPages={view.totalPages} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // 内容区：原型 favorites .pad 顶 2、底 30（横向 26 由 Screen 承载；同历史页）。
  pad: { paddingTop: 2, paddingBottom: 30 },
  // 原型 .conv-empty：居中、muted、13、上下留白、舒适行高。
  emptyState: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13 * 1.9,
    color: semantic.textSecondary,
    textAlign: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  // 原型 .listhint：12、muted-2、.04em、左内边距 4、下 8。
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: tracking(0.04, 12),
    color: semantic.textFaint,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  // 原型 .search-empty：居中、muted、13、上下留白、舒适行高。
  searchEmpty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13 * 1.9,
    color: semantic.textSecondary,
    textAlign: 'center',
    paddingVertical: 52,
    paddingHorizontal: 24,
  },
});
