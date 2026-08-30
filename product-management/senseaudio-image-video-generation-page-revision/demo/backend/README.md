# SenseAudio 本地生成后端

这是配套 `../initial-user-facing-h5-demo.html` 的本地原型后端，使用 Node.js 18+，无需安装第三方依赖。

它已经包含：

- SenseAudio 异步图片生成与状态轮询；
- SenseAudio 视频任务创建与状态轮询；
- 将生成媒体下载到本机，避免供应商临时地址过期；
- 生成成功后的历史作品自动保存；
- 历史作品删除（投稿与审核记录会保留）；
- 投稿记录和审核状态持久化；
- 一个仅用于本地演示的审核接口。

## 启动

在终端进入此文件夹后运行：

```bash
npm start
```

然后在浏览器打开：

```text
http://127.0.0.1:8787/
```

进入页面的“我的创作”，点击右上角“接口设置”，切换为“SenseAudio API”，粘贴你在 SenseAudio 开放平台购买并创建的 API Key 后应用即可。

页面填写的 API Key 只保存在当前页面内存中，会随请求发送到本机后端，不会写入 HTML、浏览器存储或后端数据文件。页面填写的 Key 优先；留空时才会使用服务端环境变量。粘贴时带不带 `Bearer ` 前缀都可以。也可以在启动时设置：

```bash
SENSEAUDIO_API_KEY="你的 API Key" npm start
```

## 默认模型

```text
图片：跟随页面当前选择；默认映射为 doubao-seedream-5-0-260128
视频：doubao-seedance-2-0-260128
```

图片模型名称会映射为 SenseAudio 官方模型 ID；“接口设置”中的模型 ID 输入框留空即可跟随页面选择，也可以手动覆盖。

本地后端调用的 SenseAudio 上游接口：

```text
POST /v1/image/async
GET  /v1/image/pending?task_id=...
POST /v1/video/create
GET  /v1/video/status?id=...
```

官方说明：[API 概览](https://docs.senseaudio.cn/api-reference/introduction)、[异步图片生成](https://docs.senseaudio.cn/api-reference/endpoint/image/async)、[创建视频任务](https://docs.senseaudio.cn/api-reference/endpoint/video/create)。

## 历史作品保存与删除

生成任务成功后，页面会自动调用：

```text
POST /api/works
```

请求示例：

```json
{
  "generation_id": "gen_...",
  "output_index": 0,
  "auto_save": {
    "enabled": true,
    "saved_at": "2026-07-28T10:00:00.000Z"
  }
}
```

接口仍兼容旧版的显式确认保存参数：

```json
{
  "generation_id": "gen_...",
  "output_index": 0,
  "confirmation": {
    "confirmed": true,
    "confirmed_at": "2026-07-28T10:00:00.000Z"
  }
}
```

删除历史作品：

```text
DELETE /api/works/:id
```

`:id` 可以是作品记录 ID（`work_...`），也可以是生成任务 ID（`gen_...`）。删除接口是幂等的：作品已经不存在时仍会返回成功响应。若作品已经投稿，投稿与审核记录不会被删除，只会解除其中的 `work_id` 关联。

## 本地模拟审核

投稿成功后会得到 `submission_id`。以下命令可把状态改成审核通过：

```bash
curl -X PATCH "http://127.0.0.1:8787/api/admin/submissions/替换为投稿ID" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: local-review" \
  -d '{"status":"approved","review_note":"已收录至素材中心。"}'
```

支持的状态：

```text
pending
approved
rejected
```

可通过 `ADMIN_TOKEN` 环境变量修改本地审核口令。

## 数据位置

```text
backend/data/generations.json
backend/data/works.json
backend/data/submissions.json
backend/media/
```

JSON 文件采用串行写入和临时文件原子替换，适合本机原型验证。正式上线时需要替换为公司登录系统、数据库、对象存储、权限校验和正式审核后台。
