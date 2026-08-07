import { render } from '@testing-library/react-native';
import { FontLicenseText } from './FontLicenseText';

// 行为契约（spec Testing Decisions）：致谢页正文组件必须真的渲染出 OFL 原文与字体归属，
// 而不是占位——这是 issue 12 / User Story 33「OFL 随 App 展示」的可回归兜底。
// 不断言样式/布局（视觉双端人工核对）。

describe('FontLicenseText', () => {
  it('渲染 SIL OFL 1.1 许可原文', async () => {
    const { getByText } = await render(<FontLicenseText />);
    expect(getByText(/SIL OPEN FONT LICENSE Version 1\.1/)).toBeTruthy();
    expect(getByText(/PERMISSION & CONDITIONS/)).toBeTruthy();
  });

  it('渲染打包字体归属（Noto Serif SC / Noto Sans SC）', async () => {
    const { getByText } = await render(<FontLicenseText />);
    expect(getByText(/Noto Serif SC/)).toBeTruthy();
    expect(getByText(/Noto Sans SC/)).toBeTruthy();
  });
});
