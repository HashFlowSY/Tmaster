import { LEGAL_DOCS, resolveLegalDoc } from './legalContent';

// 纯逻辑缝（spec Testing Decisions）：路由参数 → 文档的映射必须可回归，令路由页只做接线。
// 只断言外部可观察的选择结果（选中哪份文档），不耦合内部结构。

describe('resolveLegalDoc', () => {
  it('doc=privacy 选中隐私政策', () => {
    expect(resolveLegalDoc('privacy')).toBe(LEGAL_DOCS.privacy);
  });

  it('doc=terms 选中用户协议', () => {
    expect(resolveLegalDoc('terms')).toBe(LEGAL_DOCS.terms);
  });

  it('缺省参数回退到用户协议', () => {
    expect(resolveLegalDoc(undefined)).toBe(LEGAL_DOCS.terms);
  });

  it('非法值回退到用户协议', () => {
    expect(resolveLegalDoc('nonsense')).toBe(LEGAL_DOCS.terms);
  });

  it('数组参数取首项解析（expo-router 可能给出数组）', () => {
    expect(resolveLegalDoc(['privacy'])).toBe(LEGAL_DOCS.privacy);
  });
});
