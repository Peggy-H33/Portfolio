#!/usr/bin/env python3
"""Build the self-contained font specimen from references/font-catalog.yaml."""
from __future__ import annotations

import ast
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def parse_list(value: str) -> list[str]:
    value = value.strip()
    if value == "[]":
        return []
    if '"' in value or "'" in value:
        return [str(item) for item in ast.literal_eval(value)]
    return [item.strip() for item in value.strip("[]").split(",") if item.strip()]


def parse_scalar(value: str) -> str:
    value = value.strip()
    if value[:1] in {'"', "'"}:
        return str(ast.literal_eval(value))
    return value


def parse_catalog(path: Path) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    field_pattern = re.compile(r"^    ([a-z_]+):\s*(.*)$")
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        if raw_line.startswith("  - id:"):
            if current:
                entries.append(current)
            current = {"id": raw_line.split(":", 1)[1].strip()}
            continue
        if current is None:
            continue
        match = field_pattern.match(raw_line)
        if not match:
            continue
        key, value = match.groups()
        current[key] = parse_list(value) if key in {"names", "roles"} else parse_scalar(value)
    if current:
        entries.append(current)

    required = {"id", "names", "roles", "region", "license", "license_class", "style", "source", "caution"}
    for entry in entries:
        missing = required - set(entry)
        if missing:
            raise ValueError(f"{entry.get('id', '<unknown>')} missing {sorted(missing)}")
        names = entry["names"]
        assert isinstance(names, list)
        entry["family"] = entry.get("css_family") or (names[1] if len(names) > 1 else names[0])
    return entries


HTML = r'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="中文网页设计 Skill 的完整字体标本、风格说明、授权等级与本地字体预览。">
  <title>中文字体标本室 · __COUNT__ 个字体家族</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Huninn&family=Liu+Jian+Mao+Cao&family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;700;900&family=Noto+Serif+SC:wght@400;700;900&family=ZCOOL+KuaiLe&family=ZCOOL+QingKe+HuangYou&family=ZCOOL+XiaoWei&family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
  <link href="./fonts/local-fonts.css" rel="stylesheet">
  <link href="./official-test-fonts.css" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
      --paper: #f1eee5;
      --ink: #171814;
      --muted: #6d6d63;
      --line: rgba(23, 24, 20, .18);
      --acid: #d8ff36;
      --orange: #fa5e32;
      --card: rgba(255, 254, 248, .78);
      font-family: "Noto Sans SC", system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; color: var(--ink); background: var(--paper); }
    button, input, textarea { font: inherit; }
    a { color: inherit; }
    .masthead {
      min-height: 78svh;
      display: grid;
      grid-template-rows: auto 1fr auto;
      padding: clamp(18px, 3vw, 44px);
      border-bottom: 1px solid var(--line);
      background:
        radial-gradient(circle at 82% 18%, rgba(250, 94, 50, .24), transparent 28%),
        linear-gradient(135deg, transparent 48%, rgba(23, 24, 20, .08) 48.2%, transparent 48.5%);
    }
    .eyebrow, .counter, .meta, .badge, .status, .source { font: 600 11px/1.4 ui-monospace, monospace; letter-spacing: .05em; }
    .topline { display: flex; justify-content: space-between; gap: 24px; }
    .masthead h1 {
      align-self: center;
      max-width: 8em;
      margin: 5vh 0;
      font: 900 clamp(4.4rem, 15vw, 13rem)/.82 "Noto Serif SC", serif;
      letter-spacing: -.035em;
    }
    .masthead h1 i { font-family: "Zhi Mang Xing", cursive; font-weight: 400; color: var(--orange); }
    .lede { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 540px); gap: 36px; align-items: end; }
    .lede p { margin: 0; max-width: 36em; font-size: clamp(1rem, 1.5vw, 1.35rem); line-height: 1.65; }
    .notice { padding: 15px 18px; border: 1px solid var(--line); background: rgba(255,255,255,.35); font-size: 13px; line-height: 1.55; }
    .controls {
      position: sticky;
      top: 0;
      z-index: 20;
      display: grid;
      gap: 14px;
      padding: 16px clamp(18px, 3vw, 44px);
      border-bottom: 1px solid var(--line);
      background: rgba(241, 238, 229, .92);
      backdrop-filter: blur(16px);
    }
    .control-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .search { flex: 1 1 240px; min-width: 0; padding: 11px 13px; border: 1px solid var(--line); background: #fffdf6; color: inherit; }
    .sample { flex: 3 1 520px; min-height: 48px; resize: vertical; padding: 10px 13px; border: 1px solid var(--line); background: #fffdf6; color: inherit; }
    .chip { padding: 8px 11px; border: 1px solid var(--line); border-radius: 999px; background: transparent; cursor: pointer; }
    .chip[aria-pressed="true"] { color: var(--paper); background: var(--ink); }
    .summary { padding: 22px clamp(18px, 3vw, 44px) 0; color: var(--muted); font-size: 13px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1px;
      margin: 22px clamp(18px, 3vw, 44px) 64px;
      border: 1px solid var(--line);
      background: var(--line);
    }
    .specimen { min-width: 0; padding: clamp(18px, 2.4vw, 32px); background: var(--card); }
    .specimen-head { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
    .specimen h2 { margin: 0; font-size: 1rem; line-height: 1.35; }
    .specimen h2 span { display: block; margin-top: 4px; color: var(--muted); font: 500 11px/1.4 ui-monospace, monospace; }
    .badge { display: inline-flex; padding: 4px 7px; border: 1px solid currentColor; border-radius: 99px; white-space: nowrap; }
    .badge.brand_reference, .badge.proprietary_free, .badge.brand_free { color: #a13d22; }
    .policy { margin-top: 12px; padding: 8px 10px; border-left: 3px solid var(--orange); background: rgba(250,94,50,.08); color: #7f321e; font-size: 12px; line-height: 1.55; }
    .glyph {
      min-height: 2.6em;
      margin: clamp(34px, 5vw, 74px) 0 26px;
      font-size: clamp(2.7rem, 6.5vw, 7.4rem);
      line-height: 1.02;
      overflow-wrap: anywhere;
      white-space: pre-line;
      font-synthesis: none;
    }
    .style { max-width: 34em; margin: 0; font-size: 15px; line-height: 1.7; }
    .roles { display: flex; flex-wrap: wrap; gap: 6px; margin: 18px 0; padding: 0; list-style: none; }
    .roles li { padding: 4px 7px; background: rgba(23,24,20,.065); font: 11px/1.35 ui-monospace, monospace; }
    .details { display: grid; grid-template-columns: 1fr auto; gap: 14px; padding-top: 15px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; line-height: 1.55; }
    .source { text-decoration-thickness: 1px; text-underline-offset: 3px; }
    .font-loader { margin-top: 14px; padding: 7px 9px; border: 1px solid var(--line); background: transparent; cursor: pointer; font-size: 12px; }
    .font-loader:hover { background: var(--acid); }
    .font-loader:disabled { opacity: .58; cursor: default; }
    .status { display: block; margin-top: 8px; color: #876a00; }
    .status.loaded { color: #31702e; }
    .empty { grid-column: 1 / -1; padding: 80px 30px; background: var(--card); text-align: center; }
    .page-footer { padding: 0 clamp(18px, 3vw, 44px) 56px; color: var(--muted); font-size: 13px; line-height: 1.65; }
    @media (max-width: 840px) {
      .masthead { min-height: 70svh; }
      .lede, .grid { grid-template-columns: 1fr; }
      .grid { margin-inline: 12px; }
      .controls { position: relative; }
    }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
  </style>
</head>
<body>
  <header class="masthead">
    <div class="topline"><span class="eyebrow">MOTION SITE / CHINESE TYPE LIBRARY</span><span class="counter">__COUNT__ FAMILIES</span></div>
    <h1>中文<i>花体</i><br>标本室</h1>
    <div class="lede">
      <p>不是只换一个字体名称，而是同时说明它的地域字形、页面角色、视觉气质、授权等级和使用风险。页面会自动载入服务器已有的开源字体和官方测试字体，在浏览器里即时试排。</p>
      <div class="notice"><strong>官方测试字体政策：</strong>服务器中的品牌/专有字体仅用于本项目内部评估，禁止商用、公开发布或再分发，也不会随 skill 打包。该项目政策不等同于官方许可结论；正式使用前仍须逐款复核官方协议。</div>
    </div>
  </header>

  <section class="controls" aria-label="字体筛选和试排">
    <div class="control-row"><input class="search" id="search" type="search" aria-label="搜索字体、风格、角色或区域" placeholder="搜索字体、风格、角色或区域"><textarea class="sample" id="sample" rows="2" aria-label="输入字体试排文案">让想象先动起来。
AI 眼镜 / 2026 / 2.4×</textarea></div>
    <div class="control-row" id="filters"></div>
  </section>
  <p class="summary" id="summary" aria-live="polite"></p>
  <main class="grid" id="grid"></main>
  <footer class="page-footer">授权标签不是法律意见。OFL 字体按许可证使用；标记“内部测试”的官方字体在本项目中一律禁止商用、公开发布和再分发。若要正式使用，必须回到官方来源重新核验版本、网页嵌入、子集化、交付和署名条件。</footer>
  <input id="font-file" type="file" accept=".otf,.ttf,.woff,.woff2,font/otf,font/ttf,font/woff,font/woff2" hidden>

  <script>
    const FONTS = __FONT_DATA__;
    const GROUPS = ['全部', '花体/手写', '圆体/可爱', '海报/品牌', '编辑/宋体', '技术/像素', '正文/UI'];
    const state = {
      group: '全部',
      query: '',
      sample: document.querySelector('#sample').value,
      loaded: new Map(),
      serverLoaded: new Set(),
      serverLoading: new Set(),
      serverErrors: new Map(),
    };
    const grid = document.querySelector('#grid');
    const summary = document.querySelector('#summary');
    const fileInput = document.querySelector('#font-file');
    let loadTarget = null;

    function isOfficialTestFont(font) {
      return Boolean(font.test_policy && font.test_policy.startsWith('internal_preview_only'));
    }

    function isServerFont(font) {
      return font.license_class.startsWith('open_source') || Boolean(font.preview_file);
    }

    function groupOf(font) {
      const hay = `${font.roles.join(' ')} ${font.style}`.toLowerCase();
      if (/hand|callig|kai|brush|script|diary|quote|书法|手写|楷|行草|草书|题字/.test(hay)) return '花体/手写';
      if (/round|cute|playful|kawaii|child|圆|可爱|萌|童/.test(hay)) return '圆体/可爱';
      if (/poster|campaign|brand|commerce|signage|bold|海报|品牌|电商|促销/.test(hay)) return '海报/品牌';
      if (/serif|editorial|literary|宋|明体|出版|编辑|仿宋/.test(hay)) return '编辑/宋体';
      if (/mono|code|pixel|data|developer|像素|代码|等宽/.test(hay)) return '技术/像素';
      return '正文/UI';
    }

    async function loadServerFont(font) {
      if (!isServerFont(font) || state.serverLoaded.has(font.family)) return;
      state.serverLoading.add(font.family);
      state.serverErrors.delete(font.family);
      render();
      try {
        const faces = await document.fonts.load(`${font.preview_weight || 400} 48px "${font.family}"`, state.sample);
        if (!faces.length) throw new Error('浏览器没有找到对应的服务器字体规则');
        state.serverLoaded.add(font.family);
      } catch (error) {
        state.serverErrors.set(font.family, error.message || '字体文件加载失败');
      } finally {
        state.serverLoading.delete(font.family);
        render();
      }
    }

    function filteredFonts() {
      const query = state.query.trim().toLowerCase();
      return FONTS.filter(font => {
        if (state.group !== '全部' && groupOf(font) !== state.group) return false;
        if (!query) return true;
        const hay = [font.id, ...font.names, ...font.roles, font.region, font.license_class, font.style].join(' ').toLowerCase();
        return hay.includes(query);
      });
    }

    function render() {
      const list = filteredFonts();
      const serverFonts = FONTS.filter(isServerFont);
      const officialTests = serverFonts.filter(isOfficialTestFont);
      summary.textContent = `显示 ${list.length} / ${FONTS.length} 个字体家族 · 当前分类：${state.group} · 服务器字体自动载入：${state.serverLoaded.size} / ${serverFonts.length}${state.autoLoading ? '（进行中）' : '（完成）'} · 官方内部测试字体：${officialTests.length}`;
      grid.replaceChildren();
      if (!list.length) {
        grid.innerHTML = '<p class="empty">没有匹配结果，尝试搜索“手写”“科技”“TC”或“open_source”。</p>';
        return;
      }
      list.forEach(font => {
        const family = state.loaded.get(font.family) || font.family;
        const localAlias = state.loaded.get(font.family);
        const loaded = Boolean(localAlias) || state.serverLoaded.has(font.family);
        const loading = state.serverLoading.has(font.family);
        const manualLicense = !isServerFont(font);
        const officialTest = isOfficialTestFont(font);
        const statusText = localAlias
          ? '● 已从本地文件载入'
          : loaded
            ? officialTest
              ? '● 已从服务器载入 · 仅内部测试 · 禁止商用/公开分发'
              : '● 已从服务器载入'
            : loading
              ? '◌ 正在从服务器载入…'
          : manualLicense
            ? '○ 未提供已核验服务器文件；仅可在确认官方来源后本地载入'
            : state.serverErrors.has(font.family)
              ? `○ 服务器加载失败：${state.serverErrors.get(font.family)}`
              : '○ 已下载到服务器；点击“加载服务器字体”预览';
        const card = document.createElement('article');
        card.className = 'specimen';
        card.dataset.id = font.id;
        card.innerHTML = `
          <div class="specimen-head"><h2>${font.names[0]}<span>${font.family} · ${font.region}</span></h2><span class="badge ${font.license_class}">${font.license_class}</span></div>
          <div class="glyph"></div>
          <p class="style">${font.style}</p>
          ${officialTest ? '<p class="policy">本项目仅供内部测试：禁止商用、公开部署、公开分享字体 URL 或再分发字体文件。</p>' : ''}
          <ul class="roles">${font.roles.map(role => `<li>${role}</li>`).join('')}</ul>
          <div class="details"><span>${font.caution}</span><a class="source" href="${font.source}" target="_blank" rel="noreferrer">官方来源 ↗</a></div>
          ${manualLicense
            ? '<button class="font-loader" type="button">载入本地字体文件</button>'
            : `<button class="font-loader" type="button" ${loaded || loading ? 'disabled' : ''}>${loaded ? '服务器字体已载入' : loading ? '正在载入…' : '加载服务器字体'}</button>`}
          <span class="status ${loaded ? 'loaded' : ''}">${statusText}</span>`;
        const glyph = card.querySelector('.glyph');
        glyph.textContent = state.sample;
        glyph.style.fontFamily = `"${family}", "Noto Sans SC", sans-serif`;
        glyph.style.fontWeight = font.preview_weight || 400;
        const loader = card.querySelector('.font-loader');
        if (manualLicense) {
          loader.setAttribute('aria-label', `为${font.names[0]}载入本地字体文件`);
          loader.onclick = () => { loadTarget = font; fileInput.value = ''; fileInput.click(); };
        } else {
          loader.setAttribute('aria-label', `从服务器载入${font.names[0]}`);
          loader.onclick = () => loadServerFont(font);
        }
        grid.append(card);
      });
    }

    GROUPS.forEach(group => {
      const button = document.createElement('button');
      button.className = 'chip';
      button.type = 'button';
      button.textContent = group;
      button.setAttribute('aria-pressed', String(group === state.group));
      button.onclick = () => {
        state.group = group;
        document.querySelectorAll('.chip').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        render();
      };
      document.querySelector('#filters').append(button);
    });

    document.querySelector('#search').addEventListener('input', event => { state.query = event.target.value; render(); });
    document.querySelector('#sample').addEventListener('input', event => { state.sample = event.target.value; render(); });
    fileInput.addEventListener('change', async () => {
      if (!loadTarget || !fileInput.files[0]) return;
      try {
        const alias = `Specimen-${loadTarget.id}`;
        const face = new FontFace(alias, await fileInput.files[0].arrayBuffer());
        await face.load();
        document.fonts.add(face);
        state.loaded.set(loadTarget.family, alias);
        render();
      } catch (error) {
        window.alert(`字体加载失败：${error.message}`);
      }
    });

    async function autoLoadServerFonts() {
      const serverFonts = FONTS.filter(isServerFont);
      state.autoLoading = true;
      render();
      for (const font of serverFonts) {
        await loadServerFont(font);
      }
      state.autoLoading = false;
      render();
    }

    render();
    autoLoadServerFonts();
  </script>
</body>
</html>
'''


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT
    entries = parse_catalog(root / "references/font-catalog.yaml")
    output = root / "assets/font-library-preview.html"
    payload = json.dumps(entries, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    output.write_text(HTML.replace("__COUNT__", str(len(entries))).replace("__FONT_DATA__", payload), encoding="utf-8")
    print(f"Wrote {output} with {len(entries)} font families")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
