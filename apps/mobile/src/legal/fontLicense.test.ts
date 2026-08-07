import { FONT_LICENSE } from './fontLicense';

// OFL 合规护栏（issue 12 / ADR-0006 / spec User Story 33）。
// App 内展示的 FONT_LICENSE 常量与随字体二进制分发的 assets/fonts/OFL.txt 必须逐字一致，
// 且都不得再是占位文本。改其一未同步改另一，或退回占位，都会在这里红。
//
// jest 跑在 Node 运行时可直接读磁盘上的 OFL.txt；RN app 端不会引入本文件（仅测试）。
// mobile tsconfig 不含 @types/node，故就地声明用到的 Node 全局，避免为一个测试引入整套 node 类型。
declare const require: (id: 'fs') => { readFileSync(path: string, encoding: 'utf8'): string };
declare const __dirname: string;

const OFL_TXT_PATH = `${__dirname}/../../assets/fonts/OFL.txt`;

describe('打包字体 OFL 许可', () => {
  const oflFile = require('fs').readFileSync(OFL_TXT_PATH, 'utf8');

  it('App 内展示文本与 assets/fonts/OFL.txt 逐字一致', () => {
    expect(FONT_LICENSE).toBe(oflFile);
  });

  it('是真正的 OFL 1.1 原文，而非占位', () => {
    expect(FONT_LICENSE).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(FONT_LICENSE).toContain('PERMISSION & CONDITIONS');
    expect(FONT_LICENSE).toContain('Reserved Font Name');
    expect(FONT_LICENSE).not.toContain('占位');
  });
});
