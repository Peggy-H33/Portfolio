# Hi, Claude!｜Claude 形象电脑桌宠

[English Version](#english-version)

> 一个通过 vibecoding 制作的 macOS 桌宠：12 套 Claude 风格角色拥有各自的待机与局部动态，可以沿屏幕边缘或任意应用窗口外沿行走，并通过鼠标互动和控制面板改变行为。

<table>
  <tr>
    <td align="center"><img src="./docs/preview/desktop-pet.png" width="180" alt="Hi, Claude! 桌宠实际运行截图"><br><sub>桌宠实际运行效果</sub></td>
    <td align="center"><img src="./docs/preview/settings-panel.png" width="360" alt="Hi, Claude! 控制面板实际运行截图"><br><sub>中文控制面板</sub></td>
  </tr>
</table>

## 核心体验

| 能力 | 具体表现 |
| --- | --- |
| 12 套角色形象 | 游戏、煎蛋、编程、阅读、听歌、刷牙、睡觉、机枪、绘画、女仆、浇花和地图旅行 |
| 独立动态动作 | 不同角色分别拥有按键抖动、抛锅、代码闪烁、呼吸、节拍律动、刷牙、漂浮 Z 字、枪管与子弹、画笔、扭腰、浇水和地图开合等动画 |
| 屏幕边缘巡逻 | 可在屏幕上、右、下、左四条边连续行走，也可以只选择部分边缘；单边模式下会自动折返 |
| 窗口边缘行走 | 开启“窗口行者”后，将桌宠拖到任意窗口边缘即可吸附，并沿该窗口的外沿移动 |
| 窗口阻拦 | 可检测行进方向上的普通应用窗口；窗口挡路时桌宠会停下，窗口移开后继续行走 |
| 鼠标互动 | 鼠标靠近时跟随；单击会跳起并散发爱心、星星和粒子；拖动可重新放置；右键打开设置 |
| 自动行为 | 随机停留、眨眼和定时切换形象；具有朝向的角色会随行进方向自动镜像 |

## 控制面板

控制面板支持中文、English 和日本語，可调节：

- 巡逻速度与平滑 / 摇摆两种运动方式；
- 桌宠数量（1–8 只）；
- 鼠标跟随、固定形象、停在原地、窗口阻拦和窗口行者；
- 自动换装间隔及参与巡逻的屏幕边缘；
- 上一形象、随机切换和下一形象。

所有设置均保存在 Electron 的本地 `userData/settings.json` 中。应用运行时不请求外部 API、不上传数据，也不依赖在线素材。

## 实现结构

| 模块 | 作用 |
| --- | --- |
| `main.js` | 管理透明置顶窗口、桌宠状态、屏幕 / 窗口几何、移动策略、鼠标跟随和本地设置 |
| `index.html` | 使用 Canvas 将静态角色图拆分为身体、腿部和局部区域，并实时绘制步态、待机、眨眼与互动粒子 |
| `settings.html` | 三语言控制面板及全部行为参数 |
| `preload.js` / `settings-preload.js` | 在启用上下文隔离的前提下提供最小化 IPC 接口 |
| `tools/winlist.m` | 基于 macOS CoreGraphics 枚举屏幕上的普通窗口，为阻拦和窗口边缘行走提供几何信息 |
| `assets/robot/manifest.json` | 记录 12 套角色素材的显示尺寸和辅助色 |

```text
hi-claude-desktop-pet/
├── assets/robot/              12 套透明 PNG 角色素材与 manifest
├── build/icon.icns            macOS 应用图标
├── docs/preview/              实际运行截图
├── tools/
│   ├── winlist                Apple Silicon 预编译窗口检测工具
│   ├── winlist.m              窗口检测工具源码
│   ├── cutout.py              可选的角色抠图与 manifest 生成工具
│   └── makeicon.py             可选的应用图标生成工具
├── index.html                 桌宠 Canvas 渲染层
├── settings.html              设置面板
├── main.js                    Electron 主进程与运动逻辑
├── preload.js                 桌宠窗口 IPC 桥接
├── settings-preload.js        设置窗口 IPC 桥接
├── launch-hi-claude.command   macOS 双击启动脚本
└── package.json               运行与打包命令
```

## 本地运行

运行环境：macOS 12 或更高版本、Node.js 22.12 或更高版本及 npm。

```bash
npm ci
npm start
```

也可以双击 `launch-hi-claude.command`；首次启动时脚本会自动执行 `npm ci`。右键桌宠可打开设置面板。

仓库内的 `tools/winlist` 为 Apple Silicon / arm64 版本。Intel Mac 或需要重新构建该工具时，请先安装 Xcode Command Line Tools，然后运行：

```bash
npm run build:window-helper
```

## 打包 macOS 应用

```bash
npm ci
npm run build:window-helper
npm run package:mac-arm64
```

构建结果会生成在 `dist/`。原始交付包中包含约 273 MB 的完整 `.app`，其中 Electron Framework 单文件约 188 MB，超过 GitHub 的单文件限制；因此本仓库发布可重建源码和素材，不直接提交预打包 Electron 运行时。

## 可选素材工具

`tools/cutout.py` 和 `tools/makeicon.py` 用于从自备图片重新生成透明角色图和应用图标，不是应用运行所必需的依赖：

```bash
python3 -m pip install numpy pillow
python3 tools/cutout.py /path/to/numbered-jpgs --count 12
python3 tools/makeicon.py /path/to/icon-source.jpg
```

## 品牌与使用说明

这是一个独立制作的非官方个人实验，与 Anthropic 不存在隶属、合作或背书关系。“Claude”及相关品牌标识归其各自权利人所有。仓库目前未附加开源许可证，公开代码用于作品集查看，不代表已授予复制、修改或再分发权利。

[返回 vibecoding 项目目录](../README.md) · [返回作品集首页](../../README.md)

---

## English Version

> A macOS desktop pet built through vibecoding. Twelve Claude-inspired characters have distinct idle and local animations, can patrol the screen perimeter or the outer edge of an application window, and respond to mouse input and a configurable control panel.

### Core Experience

| Capability | Behavior |
| --- | --- |
| 12 character forms | Gaming, cooking, coding, reading, listening to music, brushing teeth, sleeping, firing a minigun, painting, maid, watering plants, and map-based travel |
| Character-specific motion | Per-form animation includes controller movement, pan tossing, flickering code, breathing, beat pulses, brushing, floating Zs, spinning barrels and bullets, brush strokes, swaying, water droplets, and a folding map |
| Screen-edge patrol | Walks continuously around any selected combination of the top, right, bottom, and left screen edges; reverses direction when only one edge is enabled |
| Window-edge walking | With Window Walker enabled, dragging a pet close to a window attaches it to that window's outer rim for perimeter patrol |
| Window blocking | Detects ordinary application windows in the movement path, waits when blocked, and resumes after the obstacle moves |
| Mouse interaction | Follows a nearby cursor, jumps and emits hearts / sparkles when clicked, supports drag-to-place, and opens settings on right-click |
| Autonomous behavior | Random pauses, blinking, and timed form changes; directional characters mirror automatically to face their direction of travel |

### Control Panel

The control panel supports Chinese, English, and Japanese and provides controls for:

- Patrol speed and smooth / sway movement styles;
- One to eight simultaneous pets;
- Cursor following, form locking, stay mode, window blocking, and Window Walker;
- Automatic form-change timing and selected screen edges;
- Previous, random, and next character selection.

Settings are stored locally in Electron's `userData/settings.json`. The running application makes no external API calls, uploads no data, and has no online asset dependency.

### Architecture

| Module | Responsibility |
| --- | --- |
| `main.js` | Transparent always-on-top windows, pet state, screen / window geometry, movement policies, cursor following, and local settings |
| `index.html` | Canvas-based sprite segmentation and real-time gait, idle, blink, regional, and interaction-particle rendering |
| `settings.html` | Three-language control panel and behavior parameters |
| `preload.js` / `settings-preload.js` | Minimal IPC surfaces while Electron context isolation remains enabled |
| `tools/winlist.m` | A macOS CoreGraphics helper that enumerates normal on-screen windows for blocking and window-edge movement |
| `assets/robot/manifest.json` | Display dimensions and accent colors for all 12 character assets |

### Run Locally

Requirements: macOS 12 or later, Node.js 22.12 or later, and npm.

```bash
npm ci
npm start
```

You can also double-click `launch-hi-claude.command`; it runs `npm ci` automatically on the first launch. Right-click the pet to open its control panel.

The included `tools/winlist` binary targets Apple Silicon / arm64. On an Intel Mac, or whenever the helper needs to be rebuilt, install Xcode Command Line Tools and run:

```bash
npm run build:window-helper
```

### Package the macOS App

```bash
npm ci
npm run build:window-helper
npm run package:mac-arm64
```

The build is written to `dist/`. The original deliverable contains a complete `.app` bundle of approximately 273 MB, including a roughly 188 MB Electron Framework file that exceeds GitHub's per-file limit. This repository therefore publishes the reproducible source and assets rather than the prepackaged Electron runtime.

### Optional Asset Utilities

`tools/cutout.py` and `tools/makeicon.py` regenerate transparent character sprites and the application icon from user-supplied source images. They are not runtime dependencies:

```bash
python3 -m pip install numpy pillow
python3 tools/cutout.py /path/to/numbered-jpgs --count 12
python3 tools/makeicon.py /path/to/icon-source.jpg
```

### Brand and Usage Notice

This is an independently created, unofficial personal experiment and is not affiliated with, sponsored by, or endorsed by Anthropic. “Claude” and related brand assets belong to their respective rights holders. No open-source license is currently included; public source visibility is for portfolio review and does not grant permission to copy, modify, or redistribute the work.

[Back to vibecoding projects](../README.md) · [Back to portfolio home](../../README.md)
