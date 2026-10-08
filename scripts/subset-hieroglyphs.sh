#!/usr/bin/env bash
# Rebuilds src/assets/fonts/NotoSansEgyptianHieroglyphs-subset.woff2 with only the hieroglyphs the
# Egyptian widgets use (src/widgets/egyptian/*.ts). Run it after adding a glyph there.
# Needs python3 with fonttools and brotli (pip install fonttools brotli).
set -euo pipefail
cd "$(dirname "$0")/.."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

curl -sfL -o "$tmp/full.ttf" \
    "https://github.com/notofonts/notofonts.github.io/raw/main/fonts/NotoSansEgyptianHieroglyphs/hinted/ttf/NotoSansEgyptianHieroglyphs-Regular.ttf"

codepoints=$(grep -ohE '\\u\{1[0-9A-F]{4}\}' src/widgets/egyptian/*.ts | sed -E 's/\\u\{(.*)\}/U+\1/' | sort -u | paste -sd, -)

python3 -m fontTools.subset "$tmp/full.ttf" \
    --unicodes="$codepoints" \
    --flavor=woff2 \
    --output-file=src/assets/fonts/NotoSansEgyptianHieroglyphs-subset.woff2

echo "Subset with: $codepoints"
