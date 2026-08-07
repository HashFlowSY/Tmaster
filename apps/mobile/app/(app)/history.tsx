import { type Conversation, systemLabel } from '@tianji/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ConversationApi } from '../../src/api/endpoints';
import { relativeTime } from '../../src/chat/conversationMeta';
import { ListRow, Pager, Screen, SearchBar, TitleBar } from '../../src/design/primitives';
import type { IconName } from '../../src/design/primitives';
import { filterRows, normalizeQuery } from '../../src/list/listSearch';
import { pageView, slicePage } from '../../src/list/pager';
import { semantic } from '../../src/design/semantic';
import { fonts, tracking } from '../../src/design/typography';

// 原型每页 6 行、共 3 页 18 段（.pagegroup）。
const PAGE_SIZE = 6;

/** 一行的视图模型（由真实 Conversation 派生，见文末数据边界裁定）。 */
interface RowVM {
  key: string;
  icon: IconName;
  title: string;
  time: string;
  tag: string;
}
// 行的可搜文本 = 标题 + 时间 + 系统标签（对应原型 .convrow 的 textContent；数据模型无断语预览，见裁定）。
const toText = (r: RowVM) => `${r.title} ${r.time} ${r.tag}`;

/**
 * 历史对话页 —— 与原型 docs/ui/tianji-app-design.html 的 history 屏 1:1（spec §8、issue 10）。
 * 命主浏览过往对话为行（图标 + 标题 + 时间 + 系统标签），可跨全部页客户端搜索（清除按钮），
 * 并翻页浏览;空态与无结果态各自渲染。自绘原型衬线标题栏 + 返回键（(app) 布局对本页 headerShown:false）。
 *
 * 逻辑 seam（spec Testing Decisions）由纯函数承载并单测:搜索谓词 list/listSearch、分页区间 list/pager;
 * 相对时间复用 chat/relativeTime。SearchBar/ListRow/Pager 为 issue 10 落地的 Tier-2 primitive。
 *
 * 数据边界裁定（spec Out of Scope:禁改 schema / 不加新功能;同 issue 09「不造假」取舍）:
 * - 分型图标/标签:Conversation.system 仅 'bazi'|'qimen'（原型的运势/合婚等分类不在数据模型内）。
 *   八字→circle+cross（chart 图标）、奇门→九宫格（grid 图标）;标签走 systemLabel。
 * - 断语摘要（原型 .csnip）:Conversation 无消息预览字段,逐行拉 messages 属重请求且越界,故省略 snippet
 *   （ListRow 支持该槽,保留 1:1 形状;本页据真实数据不填,不编造摘要）。
 * - 时间（.ctime）:relativeTime(updatedAt)（今天/昨天 HH:mm / MM-DD）。
 * - 排序:按 updatedAt 倒序（原型「按时间倒序」),不依赖服务端顺序。
 * - 点击行:进入「对话」页。按对话 id 深链到具体线程需 chat 页接 route 参数（属 issue 07 页,越界）,
 *   故此处导航到对话 tab（与既有 history 行为一致）。
 * - 分页:仅在多于一页时显示 Pager（单页时 Pager 为惰性控件,无意义,故隐藏——原型示例恒 3 页未涉此）。
 */
export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // 聚焦即刷新（从对话返回时保持最新，同我的/命盘的取数模式）。
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      ConversationApi.list()
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

  // 真实对话 → 行视图模型（按时间倒序）。列表短，每 render 内联重算即可，相对时间随之保持新鲜。
  const now = new Date();
  const rows: RowVM[] = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((c) => ({
      key: c.id,
      icon: c.system === 'bazi' ? 'chart' : 'grid',
      title: c.title,
      time: relativeTime(new Date(c.updatedAt), now),
      tag: systemLabel(c.system),
    }));

  // 搜索作用于扁平全集（跨全部页）；分页区间由纯函数计算并切片。
  const searching = normalizeQuery(query) !== '';
  const view = pageView(rows.length, PAGE_SIZE, page);
  const visible = searching ? filterRows(rows, query, toText) : slicePage(rows, view);

  const header = <TitleBar title="历史对话" onBack={() => router.back()} />;

  return (
    <Screen scroll header={header} contentStyle={styles.pad}>
      {!loaded ? null : items.length === 0 ? (
        // 空态：命主尚无任何历史对话（原型 .conv-empty）。
        <Text style={styles.emptyState}>暂无历史对话</Text>
      ) : (
        <>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="搜索历史对话…"
            accessibilityLabel="搜索历史对话"
          />

          {/* 列表提示（原型 .listhint）——仅在非搜索时显示。 */}
          {!searching ? (
            <Text style={styles.hint}>共 {rows.length} 段对话 · 按时间倒序</Text>
          ) : null}

          {visible.map((r, i) => (
            <ListRow
              key={r.key}
              icon={r.icon}
              title={r.title}
              time={r.time}
              tag={r.tag}
              divider={i < visible.length - 1}
              onPress={() => router.push('/chat')}
            />
          ))}

          {/* 无结果态（原型 .search-empty）——搜索中且零命中。 */}
          {searching && visible.length === 0 ? (
            <Text style={styles.searchEmpty}>未找到匹配的历史对话，换个关键词试试。</Text>
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
  // 内容区：原型 history .pad 顶 2、底 30（横向 26 由 Screen 承载）。
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
