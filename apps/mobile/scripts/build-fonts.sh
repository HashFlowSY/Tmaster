#!/usr/bin/env bash
# 子集化打包字体（spec §Fonts、ADR-0006）。
#
# 前置：
#   - pip install fonttools brotli
#   - 把四个全量源字体放到 apps/mobile/assets/fonts/_src/，文件名与目标一致：
#       NotoSerifSC-Regular.otf  NotoSansSC-Regular.otf
#       NotoSansSC-Medium.otf    NotoSansSC-SemiBold.otf
#   - 常用汉字表 apps/mobile/assets/fonts/_src/hanzi.txt（纯文本，约 4000 常用字，
#     如《通用规范汉字表》一级字表 ~3500 + 二级补充或项目实际用字）
#
# 运行：pnpm --filter @tianji/mobile fonts:subset
# 输出：子集化后的四个文件写入 apps/mobile/assets/fonts/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FONTS_DIR="$SCRIPT_DIR/../assets/fonts"
SRC_DIR="$FONTS_DIR/_src"
HANZI="$SRC_DIR/hanzi.txt"

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "✗ 未找到 pyftsubset。请先安装：pip install fonttools brotli" >&2
  exit 1
fi
if [ ! -f "$HANZI" ]; then
  echo "✗ 缺少常用汉字表：$HANZI（见 assets/fonts/README.md）" >&2
  exit 1
fi

# ASCII + Latin-1 标点 + 通用标点 + CJK 符号标点 + 全/半角形式 + CJK 兼容标点
UNICODES="U+0020-007E,U+00A0-00FF,U+2000-206F,U+3000-303F,U+FF00-FFEF,U+FE30-FE4F"

FILES=(
  "NotoSerifSC-Regular.otf"
  "NotoSansSC-Regular.otf"
  "NotoSansSC-Medium.otf"
  "NotoSansSC-SemiBold.otf"
)

for f in "${FILES[@]}"; do
  src="$SRC_DIR/$f"
  out="$FONTS_DIR/$f"
  if [ ! -f "$src" ]; then
    echo "✗ 缺少源字体：$src（见 assets/fonts/README.md）" >&2
    exit 1
  fi
  echo "→ 子集化 $f"
  pyftsubset "$src" \
    --output-file="$out" \
    --text-file="$HANZI" \
    --unicodes="$UNICODES" \
    --layout-features='kern,liga,calt,ccmp,mark,mkmk' \
    --name-IDs='*' \
    --recalc-timestamp
  echo "  ✓ $(du -h "$out" | cut -f1)  →  $out"
done

echo "完成。四个子集字体已写入 $FONTS_DIR"
