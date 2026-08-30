# 循绿｜一滴雨回家的路

使用 `motion-site-art-directed-v10` 与 `motion-site-chinese-web-design-v6` 重新生成的绿色生态环保电影化长页。

## 本地预览

```bash
python3 -m http.server 4183
```

打开 `http://127.0.0.1:4183`。

三段本地生成视频、poster、字体、许可证、来源 sidecar、研究过程与 QA 截图均随项目交付，无远程运行依赖。

## 成品构成

- V10：100svh 全屏湿地 Hero、河流与城市雨水花园两段全屏媒体章节，以及浅色恢复/行动段落。
- V6：Long Cang 主签名字、Ma Shan Zheng 章节题字、Source Han Sans SC 正文与关键控制；47 个可见文本表面逐一归属。
- 视频：3 个互不重复的 SenseAudio 原生时序 MP4，均附 task ID、首/中/末帧和 provenance sidecar。
- 交互：分段懒加载与离屏暂停、全局播放/暂停、reduced-motion 默认海报与用户显式播放覆盖、手机全屏目录。

研究计划、字体测量与最终门禁结果见 `study/page-plan.json`、`study/typography-module-plan.json`、`study/type-fit-metrics.md` 和 `study/qa-report.md`。
