# 沪上住志

原创“上海高端酒店民宿”电影化长页。页面、文案、影像、静帧、字体系统和交互均为本项目重新生成或重新设计。

直接以静态服务器打开：

```bash
python3 -m http.server 4182
```

访问 `http://127.0.0.1:4182/`。

## 素材状态

- `media/hero-atmosphere.mp4`：SenseAudio / Seedance，8.04 秒，720p，江岸酒店 Hero。
- `media/lane-house.mp4`：SenseAudio / Seedance，8.04 秒，720p，雨后石库门里弄。
- `media/closing-night.mp4`：SenseAudio / Seedance，8.04 秒，720p，雨夜夜床结尾。
- `media/river-dawn.jpg`：ImageGen 原创浦江晨景静帧，373KB。
- `media/room-ritual-still.jpg`：ImageGen 原创客房茶仪式静帧，263KB。

三段最终视频均附 provider/model/task ID sidecar 和首中末帧证据。一次茶仪式视频创建曾在未返回 task ID 时发生 SSL EOF，按计费安全规则没有重复提交；该尝试不进入最终视频清单。

## 字体与交互

- 猫啃网风雅宋：Hero、章节与结尾题名。
- 龙藏体：跨五个非首屏区域的作者性短题词。
- 霞鹜新致宋：正文、导航、按钮、元数据与表单。
- 支持全局动效开关、每段视频独立播放、三种住法选择器、原生咨询 dialog、`prefers-reduced-motion` 和无脚本内容回退。

## 校验结果

- v10 输出校验：3 videos / 7 sections / 0 warnings。
- v6 字体校验：9 modules / 65 visible surfaces / 3 fonts / distributed expression。
- 1440、768、390 三个视口均为 0px 横向溢出，Hero 媒体覆盖率 1.000，浏览器错误 0。

详细决策、字体覆盖、媒体来源与 QA 记录见 `study/`。
