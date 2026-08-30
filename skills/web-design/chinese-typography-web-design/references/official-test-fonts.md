# 官方字体内部测试模式

本模式只用于比较字形、排版和网页构图，不是生产授权方案。

## 本项目强制政策

- 标记 `internal_preview_only_no_commercial_no_public_redistribution` 的字体可以在受控的内部测试页中使用，但本项目禁止商用、正式上线、公开部署、公开字体 URL、把字体传给第三方或随 skill/Git/npm/CDN 再分发。
- 这是一条比部分官方许可更保守的项目自限政策，不是在宣称“官方协议一定禁止商用”。若要正式使用，必须针对当时版本重新阅读官方协议，并确认网页嵌入、跨域传输、子集化、格式转换、交付、署名和再分发权限。
- 字体二进制不属于 skill。`assets/official-test-fonts.css` 只有在 `assets/fonts` 指向已获授权的本地字体目录时才会生效。
- 不从第三方字体站、网页缓存、App 包或未知镜像提取字体；不把相近字体冒充缺失字体；不修改、转换或子集化官方字体。

## 当前核验清单

| ID | 当前测试文件 | 官方入口 | 当前状态与限制 |
| --- | --- | --- | --- |
| `alibaba-puhuiti-3` | `alibaba-puhuiti-3.woff2` | [Alibaba Fonts](https://www.alibabafonts.com/) | 官方 Webfont；本项目仅内部测试，禁止商用/公开分发 |
| `alimama-shuheiti` | `alimama-shuheiti.woff2` | [Alibaba Fonts](https://www.alibabafonts.com/) | 官方 Webfont；本项目仅内部测试，禁止商用/公开分发 |
| `alimama-shuzhiti` | — | [Alibaba Fonts](https://www.alibabafonts.com/) | 尚未核验到官方稳定下载文件；只保留风格参考 |
| `alimama-dongfang-dakai` | `alimama-dongfang-dakai.woff2` | [Alibaba Fonts](https://www.alibabafonts.com/) | 官方 Webfont；本项目仅内部测试，禁止商用/公开分发 |
| `alimama-daoliti` | `alimama-daoliti.woff2` | [Alibaba Fonts](https://www.alibabafonts.com/) | 官方 Webfont；本项目仅内部测试，禁止商用/公开分发 |
| `dingtalk-jinbuti` | `dingtalk-jinbuti.ttf` | [Alibaba Fonts](https://www.alibabafonts.com/) | 官方 TTF；本项目仅内部测试，禁止商用/公开分发 |
| `misans` | `misans.woff2` | [MiSans 下载与协议](https://hyperos.mi.com/font/zh/download/) | 官方包内原始 WOFF2；不得改编或单独再分发；本项目禁止商用/公开部署 |
| `harmonyos-sans` | `harmonyos-sans.ttf` | [HarmonyOS 设计资源](https://developer.huawei.com/consumer/cn/design/resource-V1/) | 官方包内 SC Regular；保留随包协议和使用声明；本项目禁止商用/公开部署 |
| `oppo-sans` | `oppo-sans.otf` | [OPPO Sans 3.0](https://www.coloros.com/article/A00000050/) | 当前安装 3.0，不是 4.0；不得改造、售卖或提供下载渠道；本项目禁止商用/公开部署 |
| `honor-sans` | — | [HONOR Sans](https://developer.honor.com/cn/doc/guides/100681) | 页面有交互式下载，但未核验到稳定直链；当前不安装 |
| `vivo-sans` | `vivo-sans.ttf` | [vivo Sans](https://www.vivo.com/hk/zh/originos) | 官方包内 SC Regular 并保留包内协议；本项目禁止商用/公开部署 |
| `jd-langzheng` | `jd-langzheng.woff2` | [京东朗正体](https://jdrdl.jd.com/Brand-Font.html) | 官方网页字体；页面未明确完整许可边界，本项目只作内部预览 |

## 服务器目录约定

当前测试服务器使用：

```text
/mnt/cache/zhaohui_share/banjiarui/other/chinese_words/
├── downloads/official-test-fonts/   # 原始下载包；不得公开提供下载
├── fonts/                           # 预览选中的原始字体文件
│   └── licenses/official-test-fonts/
├── motion-site-chinese-web-design/
└── motion-site-chinese-web-design-v2/
```

两版 skill 的 `assets/fonts` 都应是只在该受控服务器存在的相对软链接：

```bash
ln -sfn ../../fonts motion-site-chinese-web-design/assets/fonts
ln -sfn ../../fonts motion-site-chinese-web-design-v2/assets/fonts
```

不要把软链接解引用后提交或同步到公开仓库。

## 使用步骤

1. 先按页面风格和内容角色选择字体，不因“免费”而选择。
2. 检查 `font-catalog.yaml` 的 `test_policy`、`preview_file`、`official_download` 与 `caution`。
3. 仅当任务明确是内部非商用测试，且服务器测试文件存在时，才载入 `assets/official-test-fonts.css`。
4. 页面上记录字体 ID、版本、官方来源、原始包和随包协议位置。
5. 任何对外演示、客户交付、正式发布或商业实验都切换为许可清晰的开源字体，或先取得对应正式授权。

## CSS 接入边界

测试页可以直接引用：

```html
<link rel="stylesheet" href="./assets/official-test-fonts.css">
```

真实项目不要复制整张测试 CSS。只在受控内网测试页中写入实际采用的一个或两个 `@font-face`，并保持字体文件原格式。生产页面必须移除这些测试规则，除非已经完成新的许可核验。
