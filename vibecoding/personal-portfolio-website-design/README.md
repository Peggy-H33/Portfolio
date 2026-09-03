# Peijing Han | 滚动叙事个人作品集网站

[English Version](#english-version)

> 一个由我独立通过 vibecoding 完成的网站设计作品：使用 600 帧 Canvas 序列，把滚动、触控和键盘操作转化为连续的电影式页面叙事。

![个人作品集网站第一页预览](./tests/artifacts/page-1.png)

## 设计与交互

| 维度 | 实现 |
| --- | --- |
| 叙事结构 | 两页全屏体验：第一页建立个人作品集主题，第二页呈现面向不同访问者的项目入口 |
| 核心交互 | 鼠标滚轮、触控滑动、方向键、Page Up / Page Down 与空格键均可驱动帧序列 |
| 视觉方式 | Canvas 全屏绘制 600 张连续画面，滚动过程形成可逆的电影式叙事 |
| 页面切换 | 第 300 帧与第 301 帧之间通过状态机完成页面边界过渡，支持正向与反向浏览 |
| 响应式表现 | Canvas 根据视口与设备像素比重绘，文字和玻璃卡片适配桌面与移动端 |

## 技术结构

```text
personal-portfolio-website-design/
├── index.html                 两页语义结构
├── styles.css                 字体、全屏布局与玻璃卡片样式
├── script.js                  帧加载、Canvas 绘制与输入控制
├── frame-state.js             可独立测试的帧序列状态机
├── frames/                    600 张 2560×1440 WebP 发布帧
├── assets/fonts/              本地字体与 OFL 许可证
└── tests/                     状态机测试、浏览器测试与页面截图
```

页面运行时只依赖原生 HTML、CSS、JavaScript 和浏览器 Canvas，不需要后端服务或外部字体网络请求。

## 发布资源优化

原始创作素材为一段 7680×4320、30fps、约 20 秒的视频，并导出了 600 张 8K JPEG 帧。为了符合 GitHub 单文件限制并改善网页加载，公开版本将帧序列转换为 600 张 2560×1440 WebP，整体约 75 MB；未被运行时引用的 223 MB 源视频未上传。桌面源文件夹中的原始视频和 8K 帧保持不变。

## 本地预览

在本目录启动静态服务器：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

然后打开 <http://127.0.0.1:4173/>。

## 测试

状态机测试无需安装依赖：

```bash
npm run test:state
```

浏览器端到端测试需要 Playwright：

```bash
npm install
npx playwright install chromium
npm test
```

浏览器测试覆盖首帧、300→301 页面切换、反向返回、终帧、Retina Canvas 尺寸、字体加载、玻璃卡片样式、390×844 移动端无横向溢出和控制台错误。

[返回 vibecoding 项目目录](../README.md) · [返回作品集首页](../../README.md)

---

## English Version

> A website-design project built independently through vibecoding that turns scrolling, touch gestures, and keyboard input into a continuous cinematic narrative rendered through a 600-frame Canvas sequence.

![First-page preview of the personal portfolio website](./tests/artifacts/page-1.png)

### Design and Interaction

| Dimension | Implementation |
| --- | --- |
| Narrative structure | A two-page, full-screen experience: the first page establishes the personal-portfolio theme, while the second presents project entry points for different audiences |
| Core input | Mouse wheel, touch gestures, arrow keys, Page Up / Page Down, and the space bar can all drive the frame sequence |
| Visual approach | A full-screen Canvas renders 600 consecutive images, creating a reversible cinematic story as the user scrolls |
| Page transition | A state machine controls the boundary between frames 300 and 301 and supports both forward and reverse navigation |
| Responsive behavior | The Canvas redraws for the viewport and device pixel ratio, while typography and glass cards adapt across desktop and mobile layouts |

### Technical Structure

```text
personal-portfolio-website-design/
├── index.html                 Semantic structure for the two pages
├── styles.css                 Fonts, full-screen layout, and glass-card styles
├── script.js                  Frame loading, Canvas rendering, and input control
├── frame-state.js             Independently testable frame-sequence state machine
├── frames/                    600 published 2560×1440 WebP frames
├── assets/fonts/              Local fonts and OFL license files
└── tests/                     State-machine tests, browser tests, and screenshots
```

The runtime uses only native HTML, CSS, JavaScript, and the browser Canvas API. It requires no backend service or external font requests.

### Published-Asset Optimization

The original creative source was a 7680×4320, 30fps video of approximately 20 seconds, exported as 600 8K JPEG frames. To meet GitHub's single-file limit and improve web loading, the public version converts the sequence to 600 2560×1440 WebP frames totaling approximately 75 MB. The unused 223 MB source video is not included. The original video and 8K frames remain unchanged in the desktop source folder.

### Local Preview

Start a static server from this directory:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173/>.

### Tests

The state-machine test has no install-time dependency:

```bash
npm run test:state
```

The browser end-to-end test requires Playwright:

```bash
npm install
npx playwright install chromium
npm test
```

The browser suite covers the opening frame, the 300→301 page transition, reverse navigation, the final frame, Retina Canvas dimensions, font loading, glass-card styling, a 390×844 mobile no-overflow check, and console errors.

[Back to vibecoding projects](../README.md) · [Back to portfolio home](../../README.md)
