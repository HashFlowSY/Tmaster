import { render } from '@testing-library/react-native';
import { LegalDocText } from './LegalDocText';
import { LEGAL_DOCS } from './legalContent';

// 行为契约（spec Testing Decisions / issue 03）：法务正文组件必须真的渲染出所选文档的正文与
// 「非律师审阅 · v1 占位」标注，而不是占位空壳；且两份文档都覆盖本 App 的真实数据面
// （账号邮箱、出生信息、AI 对话）。不断言样式/布局（视觉双端人工核对）。

describe('LegalDocText', () => {
  it('渲染用户协议的引言与分节标题', async () => {
    const { getByText } = await render(<LegalDocText doc={LEGAL_DOCS.terms} />);
    expect(getByText(/欢迎使用天机/)).toBeTruthy();
    expect(getByText('一、账号与注册')).toBeTruthy();
  });

  it('渲染隐私政策的引言与分节标题', async () => {
    const { getByText } = await render(<LegalDocText doc={LEGAL_DOCS.privacy} />);
    expect(getByText(/天机重视你的隐私/)).toBeTruthy();
    expect(getByText('一、我们收集的信息')).toBeTruthy();
  });

  it('每份文档顶部都带「非律师审阅 · v1 占位」标注', async () => {
    const terms = await render(<LegalDocText doc={LEGAL_DOCS.terms} />);
    expect(terms.getByText(/非律师审阅 · v1 占位/)).toBeTruthy();
    const privacy = await render(<LegalDocText doc={LEGAL_DOCS.privacy} />);
    expect(privacy.getByText(/非律师审阅 · v1 占位/)).toBeTruthy();
  });

  it('隐私政策覆盖三条真实数据面：邮箱、出生信息、AI 对话', async () => {
    const { getByText } = await render(<LegalDocText doc={LEGAL_DOCS.privacy} />);
    expect(getByText(/邮箱地址/)).toBeTruthy();
    expect(getByText(/出生年、月、日、时与出生地点/)).toBeTruthy();
    expect(getByText(/与 AI 之间的提问与解读记录/)).toBeTruthy();
  });
});
