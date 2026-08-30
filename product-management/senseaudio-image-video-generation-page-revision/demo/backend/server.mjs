import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  createReadStream,
  createWriteStream,
} from 'node:fs';
import {
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(backendDir, '..');
const htmlPath = path.join(projectDir, 'initial-user-facing-h5-demo.html');
const dataDir = path.resolve(process.env.SA_DATA_DIR || path.join(backendDir, 'data'));
const mediaDir = path.resolve(process.env.SA_MEDIA_DIR || path.join(backendDir, 'media'));
const generationsFile = path.join(dataDir, 'generations.json');
const worksFile = path.join(dataDir, 'works.json');
const submissionsFile = path.join(dataDir, 'submissions.json');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const senseAudioBaseUrl = (process.env.SENSEAUDIO_BASE_URL || 'https://api.senseaudio.cn').replace(/\/+$/, '');
const defaultImageModel = process.env.SENSEAUDIO_IMAGE_MODEL || 'doubao-seedream-5-0-260128';
const defaultVideoModel = process.env.SENSEAUDIO_VIDEO_MODEL || 'doubao-seedance-2-0-260128';
const adminToken = process.env.ADMIN_TOKEN || 'local-review';
const maxBodyBytes = 24 * 1024 * 1024;
const writeQueues = new Map();

await Promise.all([
  mkdir(dataDir, { recursive: true }),
  mkdir(mediaDir, { recursive: true }),
]);
await Promise.all([
  ensureJsonFile(generationsFile),
  ensureJsonFile(worksFile),
  ensureJsonFile(submissionsFile),
]);

const server = http.createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'GET' && pathname === '/') {
      await serveFile(res, htmlPath, 'text/html; charset=utf-8');
      return;
    }
    if (req.method === 'GET' && pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'SenseAudio local generation backend',
        provider: 'SenseAudio',
        time: new Date().toISOString(),
      });
      return;
    }
    if (req.method === 'GET' && pathname.startsWith('/media/')) {
      await serveMedia(req, res, pathname.slice('/media/'.length));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/generations') {
      await createGeneration(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/api/generations') {
      sendJson(res, 200, { data: await readStore(generationsFile) });
      return;
    }
    const generationMatch = pathname.match(/^\/api\/generations\/([^/]+)$/);
    if (req.method === 'GET' && generationMatch) {
      await getGeneration(req, res, generationMatch[1]);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/works') {
      await saveWork(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/api/works') {
      sendJson(res, 200, { data: await readStore(worksFile) });
      return;
    }
    const workMatch = pathname.match(/^\/api\/works\/([^/]+)$/);
    if (req.method === 'DELETE' && workMatch) {
      await deleteWork(res, workMatch[1]);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/submissions') {
      await createSubmission(req, res);
      return;
    }
    if (req.method === 'GET' && pathname === '/api/submissions') {
      sendJson(res, 200, { data: await readStore(submissionsFile) });
      return;
    }
    const submissionMatch = pathname.match(/^\/api\/submissions\/([^/]+)$/);
    if (req.method === 'GET' && submissionMatch) {
      const item = (await readStore(submissionsFile)).find((entry) => entry.id === submissionMatch[1]);
      if (!item) throw httpError(404, '投稿记录不存在。');
      sendJson(res, 200, item);
      return;
    }

    const reviewMatch = pathname.match(/^\/api\/admin\/submissions\/([^/]+)$/);
    if (req.method === 'PATCH' && reviewMatch) {
      await reviewSubmission(req, res, reviewMatch[1]);
      return;
    }

    sendJson(res, 404, { error: { message: '接口不存在。' } });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    const safeStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
    sendJson(res, safeStatus, {
      error: {
        code: error.code || 'BackendError',
        message: error.publicMessage || error.message || '服务器处理失败。',
      },
    });
  }
});

server.listen(port, host, () => {
  console.log(`SenseAudio local backend: http://${host}:${port}`);
  console.log(`Open the page at: http://${host}:${port}/`);
  console.log('API keys are accepted per request and are never written to disk.');
});

async function createGeneration(req, res) {
  const body = await readJson(req);
  validateGenerationBody(body);

  const existing = (await readStore(generationsFile)).find((item) => item.request_id === body.request_id);
  if (existing) {
    sendJson(res, existing.status === 'queued' || existing.status === 'running' ? 202 : 200, toGenerationResponse(existing));
    return;
  }

  const apiKey = getApiKey(req);
  if (!apiKey) throw httpError(401, '缺少 SenseAudio API Key。请在页面「接口设置」中填写。');

  const now = new Date().toISOString();
  const id = `gen_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const type = body.type;
  const record = {
    id,
    request_id: body.request_id,
    provider_task_id: null,
    type,
    prompt: body.prompt,
    model: body.model || (type === 'image' ? defaultImageModel : defaultVideoModel),
    reference_images: Array.isArray(body.reference_images) ? body.reference_images : [],
    parameters: body.parameters || {},
    consent: body.consent,
    status: 'queued',
    progress: 8,
    outputs: [],
    error: '',
    created_at: now,
    updated_at: now,
  };
  await mutateStore(generationsFile, (items) => [record, ...items]);

  try {
    if (type === 'image') {
      const created = await senseAudioRequest('/v1/image/async', {
        method: 'POST',
        body: JSON.stringify(buildImagePayload(body)),
      }, apiKey);
      if (!created.task_id) throw httpError(502, 'SenseAudio 未返回图片任务 ID。');
      const queued = await updateGeneration(id, {
        provider_task_id: created.task_id,
        status: 'queued',
        progress: 8,
        updated_at: new Date().toISOString(),
      });
      sendJson(res, 202, toGenerationResponse(queued));
      return;
    }

    const created = await senseAudioRequest('/v1/video/create', {
      method: 'POST',
      body: JSON.stringify(buildVideoPayload(body)),
    }, apiKey);
    if (!created.task_id) throw httpError(502, 'SenseAudio 未返回视频任务 ID。');
    const queued = await updateGeneration(id, {
      provider_task_id: created.task_id,
      status: 'queued',
      progress: 8,
      updated_at: new Date().toISOString(),
    });
    sendJson(res, 202, toGenerationResponse(queued));
  } catch (error) {
    await updateGeneration(id, {
      status: 'failed',
      error: error.publicMessage || error.message || '生成失败。',
      updated_at: new Date().toISOString(),
    });
    throw error;
  }
}

async function getGeneration(req, res, id) {
  let record = (await readStore(generationsFile)).find((item) => item.id === id);
  if (!record) throw httpError(404, '生成任务不存在。');

  if (['succeeded', 'failed', 'cancelled'].includes(record.status)) {
    sendJson(res, 200, toGenerationResponse(record));
    return;
  }

  const apiKey = getApiKey(req);
  if (!apiKey) throw httpError(401, '查询生成任务需要 SenseAudio API Key。');
  if (!record.provider_task_id) throw httpError(500, '生成任务缺少 SenseAudio 任务 ID。');

  try {
    const statusPath = record.type === 'image'
      ? `/v1/image/pending?task_id=${encodeURIComponent(record.provider_task_id)}`
      : `/v1/video/status?id=${encodeURIComponent(record.provider_task_id)}`;
    const upstream = await senseAudioRequest(statusPath, { method: 'GET' }, apiKey);
    const status = normalizeSenseAudioStatus(upstream.status);
    const patch = {
      status,
      progress: status === 'succeeded' ? 100 : Number(upstream.progress) || (status === 'running' ? 62 : 18),
      updated_at: new Date().toISOString(),
      error: upstream.error_message || '',
    };
    if (status === 'succeeded') {
      const sourceUrl = record.type === 'image' ? upstream.url : upstream.video_url;
      if (!sourceUrl) throw httpError(502, `SenseAudio 已完成${record.type === 'image' ? '图片' : '视频'}任务，但未返回结果地址。`);
      const localUrl = await cacheAsset(sourceUrl, `${id}_${record.type}`, req).catch(() => sourceUrl);
      patch.outputs = record.type === 'image'
        ? [{
          type: 'image',
          url: localUrl,
          thumbnail_url: localUrl,
          width: Number(record.parameters?.width) || null,
          height: Number(record.parameters?.height) || null,
        }]
        : [{
          type: 'video',
          url: localUrl,
          thumbnail_url: '',
          duration_seconds: Number(upstream.duration || record.parameters?.duration_seconds) || null,
        }];
    }
    record = await updateGeneration(id, patch);
    sendJson(res, 200, toGenerationResponse(record));
  } catch (error) {
    if (error.statusCode && error.statusCode < 500) {
      record = await updateGeneration(id, {
        status: 'failed',
        error: error.publicMessage || error.message,
        updated_at: new Date().toISOString(),
      });
      sendJson(res, 200, toGenerationResponse(record));
      return;
    }
    throw error;
  }
}

async function saveWork(req, res) {
  const body = await readJson(req);
  const isAutoSave = body.auto_save?.enabled === true;
  const isConfirmedSave = body.confirmation?.confirmed === true;
  if (!isAutoSave && !isConfirmedSave) {
    throw httpError(400, '保存作品需要 auto_save.enabled=true，或保留旧版 confirmation.confirmed=true。');
  }
  const generationId = String(body.generation_id || '');
  const outputIndex = Number(body.output_index || 0);
  const generations = await readStore(generationsFile);
  const generation = generations.find((item) => item.id === generationId);
  if (!generation) throw httpError(404, '对应的生成任务不存在。');
  if (generation.status !== 'succeeded') throw httpError(409, '生成任务尚未完成，暂时不能保存。');
  const output = generation.outputs?.[outputIndex];
  if (!output) throw httpError(400, '要保存的生成结果不存在。');

  const works = await readStore(worksFile);
  const submissions = await readStore(submissionsFile);
  const latestSubmission = submissions.find((item) => item.generation_id === generationId && item.output_index === outputIndex);
  const reviewStatus = latestSubmission?.status || null;
  const existing = works.find((item) => item.generation_id === generationId && item.output_index === outputIndex);
  if (existing) {
    let saved = existing;
    if (existing.review_status !== reviewStatus) {
      await mutateStore(worksFile, (items) => items.map((item) => {
        if (item.id !== existing.id) return item;
        saved = { ...item, review_status: reviewStatus };
        return saved;
      }));
    }
    if (latestSubmission && latestSubmission.work_id !== existing.id) {
      await mutateStore(submissionsFile, (items) => items.map((item) => item.id === latestSubmission.id ? { ...item, work_id: existing.id } : item));
    }
    sendJson(res, 200, saved);
    return;
  }

  const work = {
    id: `work_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    generation_id: generationId,
    output_index: outputIndex,
    type: generation.type,
    prompt: generation.prompt,
    model: generation.model,
    parameters: generation.parameters,
    reference_images: generation.reference_images,
    output,
    review_status: reviewStatus,
    saved_at: body.auto_save?.saved_at || body.confirmation?.confirmed_at || new Date().toISOString(),
  };
  await mutateStore(worksFile, (items) => [work, ...items]);
  if (latestSubmission && latestSubmission.work_id !== work.id) {
    await mutateStore(submissionsFile, (items) => items.map((item) => item.id === latestSubmission.id ? { ...item, work_id: work.id } : item));
  }
  sendJson(res, 201, work);
}

async function deleteWork(res, suppliedId) {
  const id = String(suppliedId || '');
  const deletedWorks = [];
  await mutateStore(worksFile, (items) => items.filter((item) => {
    const matches = item.id === id || item.generation_id === id;
    if (matches) deletedWorks.push(item);
    return !matches;
  }));

  if (deletedWorks.length) {
    const deletedIds = new Set(deletedWorks.map((item) => item.id));
    await mutateStore(submissionsFile, (items) => items.map((item) => {
      if (!item.work_id || !deletedIds.has(item.work_id)) return item;
      return { ...item, work_id: null };
    }));
  }

  const firstDeleted = deletedWorks[0] || null;
  sendJson(res, 200, {
    deleted: deletedWorks.length > 0,
    id: firstDeleted?.id || id,
    generation_id: firstDeleted?.generation_id || null,
  });
}

async function createSubmission(req, res) {
  const body = await readJson(req);
  if (!body.consent?.accepted || !Array.isArray(body.consent?.scopes)) {
    throw httpError(400, '投稿前需要明确同意作品发布授权。');
  }
  const requiredScopes = ['review', 'display', 'template_use'];
  if (!requiredScopes.every((scope) => body.consent.scopes.includes(scope))) {
    throw httpError(400, '投稿授权范围不完整。');
  }

  const suppliedId = String(body.generation_id || body.work_id || '');
  const works = await readStore(worksFile);
  const work = works.find((item) => item.id === suppliedId || item.generation_id === suppliedId);
  const generationId = work ? work.generation_id : suppliedId;
  const generation = (await readStore(generationsFile)).find((item) => item.id === generationId);
  if (!generation || generation.status !== 'succeeded') {
    throw httpError(404, '找不到可投稿的生成作品。');
  }
  const outputIndex = Number(body.output_index || work?.output_index || 0);
  const output = generation.outputs?.[outputIndex];
  if (!output) throw httpError(400, '投稿作品不存在。');

  const submissions = await readStore(submissionsFile);
  const duplicate = submissions.find((item) => item.generation_id === generationId && item.output_index === outputIndex && item.status === 'pending');
  if (duplicate) {
    sendJson(res, 200, toSubmissionResponse(duplicate));
    return;
  }

  const submittedAt = body.consent.accepted_at || new Date().toISOString();
  const submission = {
    id: `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    generation_id: generationId,
    work_id: work?.id || null,
    output_index: outputIndex,
    title: generation.prompt.slice(0, 80),
    type: generation.type,
    thumbnail_url: output.thumbnail_url || output.url,
    asset_url: output.url,
    status: 'pending',
    submitted_at: submittedAt,
    reviewed_at: null,
    review_note: '作品已进入精选审核队列。',
    consent: body.consent,
  };
  await mutateStore(submissionsFile, (items) => [submission, ...items]);
  if (work) {
    await mutateStore(worksFile, (items) => items.map((item) => item.id === work.id ? { ...item, review_status: 'pending' } : item));
  }
  sendJson(res, 201, toSubmissionResponse(submission));
}

async function reviewSubmission(req, res, id) {
  if (req.headers['x-admin-token'] !== adminToken) throw httpError(401, '审核口令不正确。');
  const body = await readJson(req);
  const status = String(body.status || '');
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw httpError(400, '审核状态只能是 pending、approved 或 rejected。');
  }
  let updated = null;
  await mutateStore(submissionsFile, (items) => items.map((item) => {
    if (item.id !== id) return item;
    updated = {
      ...item,
      status,
      reviewed_at: status === 'pending' ? null : new Date().toISOString(),
      review_note: String(body.review_note || defaultReviewNote(status)),
    };
    return updated;
  }));
  if (!updated) throw httpError(404, '投稿记录不存在。');
  if (updated.work_id) {
    await mutateStore(worksFile, (items) => items.map((item) => item.id === updated.work_id ? { ...item, review_status: status } : item));
  }
  sendJson(res, 200, toSubmissionResponse(updated));
}

function buildImagePayload(body) {
  const parameters = body.parameters || {};
  const width = Number(parameters.width);
  const height = Number(parameters.height);
  const model = String(body.model || defaultImageModel);
  const supported = new Set([
    'senseaudio-image-2.0-260319',
    'senseaudio-image-1.0-260319',
    'doubao-seedream-5-0-260128',
    'sensenova-u1-fast',
  ]);
  if (!supported.has(model)) throw httpError(422, `SenseAudio 当前不支持图片模型：${model}`);
  const payload = { model, prompt: body.prompt };
  const images = (body.reference_images || []).map((item) => item?.url).filter(Boolean);
  if (width && height) payload.size = `${width}x${height}`;
  else if (!images.length) throw httpError(400, 'SenseAudio 图片生成缺少有效尺寸。');
  if (images.length) payload.reference = images[0];
  return payload;
}

function buildVideoPayload(body) {
  const parameters = body.parameters || {};
  const model = String(body.model || defaultVideoModel);
  if (model !== 'doubao-seedance-2-0-260128') throw httpError(422, `SenseAudio 当前不支持视频模型：${model}`);
  const content = [{ type: 'text', text: body.prompt }];
  for (const item of body.reference_images || []) {
    if (!item?.url) continue;
    content.push({
      type: 'image',
      url: item.url,
      role: 'reference',
    });
  }
  const payload = {
    model,
    content,
    ratio: parameters.aspect_ratio || '16:9',
    resolution: String(parameters.resolution || '720P').toLowerCase(),
    duration: Number(parameters.duration_seconds) || 5,
    watermark: true,
  };
  return payload;
}

function validateGenerationBody(body) {
  if (!body || typeof body !== 'object') throw httpError(400, '生成参数不能为空。');
  if (!body.request_id) throw httpError(400, '缺少 request_id。');
  if (!['image', 'video'].includes(body.type)) throw httpError(400, 'type 只能是 image 或 video。');
  if (!String(body.prompt || '').trim()) throw httpError(400, '提示词不能为空。');
  if (!body.consent?.accepted) throw httpError(400, '开始生成前需要同意本次生成说明。');
}

function getApiKey(req) {
  const authorization = String(req.headers.authorization || '');
  const requestKey = cleanApiKey(authorization);
  if (requestKey) return requestKey;
  return cleanApiKey(process.env.SENSEAUDIO_API_KEY || '');
}

function cleanApiKey(value) {
  return String(value || '').trim().replace(/^(?:Bearer\s+)+/i, '').trim();
}

async function senseAudioRequest(endpoint, options, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15 * 60 * 1000);
  try {
    const response = await fetch(`${senseAudioBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!response.ok) {
      const message = data?.error?.message || data?.detail || data?.message || data?.base_resp?.status_msg || `SenseAudio 请求失败（${response.status}）`;
      const error = httpError(response.status >= 500 ? 502 : response.status, message);
      error.code = data?.error?.code || data?.code || 'SenseAudioApiError';
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw httpError(504, 'SenseAudio 请求超时。');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function cacheAsset(source, stem, req) {
  if (!source) return '';
  if (source.startsWith('data:')) {
    const match = source.match(/^data:([^;,]+);base64,(.+)$/s);
    if (!match) return source;
    const extension = extensionForMime(match[1]);
    const filename = `${safeStem(stem)}.${extension}`;
    await writeFile(path.join(mediaDir, filename), Buffer.from(match[2], 'base64'));
    return `${publicBase(req)}/media/${filename}`;
  }
  if (!/^https?:\/\//i.test(source)) return source;

  const response = await fetch(source);
  if (!response.ok || !response.body) throw new Error(`下载生成结果失败（${response.status}）`);
  const contentType = response.headers.get('content-type') || '';
  const fromUrl = path.extname(new URL(source).pathname).replace(/^\./, '').toLowerCase();
  const extension = extensionForMime(contentType) || (['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mov'].includes(fromUrl) ? fromUrl : 'bin');
  const filename = `${safeStem(stem)}.${extension}`;
  const temporary = path.join(mediaDir, `.${filename}.${crypto.randomBytes(3).toString('hex')}.tmp`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
  await rename(temporary, path.join(mediaDir, filename));
  return `${publicBase(req)}/media/${filename}`;
}

async function serveMedia(req, res, requestedName) {
  const filename = path.basename(requestedName);
  const filepath = path.join(mediaDir, filename);
  const info = await stat(filepath).catch(() => null);
  if (!info?.isFile()) throw httpError(404, '媒体文件不存在。');
  const contentType = contentTypeFor(filename);
  const range = String(req.headers.range || '');
  if (range && contentType.startsWith('video/')) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${info.size}`,
      'Content-Length': end - start + 1,
      'Cache-Control': 'private, max-age=86400',
    });
    createReadStream(filepath, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': info.size,
    'Cache-Control': 'private, max-age=86400',
  });
  createReadStream(filepath).pipe(res);
}

async function serveFile(res, filepath, contentType) {
  const data = await readFile(filepath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': data.length,
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBodyBytes) throw httpError(413, '请求内容过大。');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw httpError(400, '请求 JSON 格式不正确。');
  }
}

async function ensureJsonFile(filepath) {
  try {
    await readFile(filepath, 'utf8');
  } catch {
    await writeFile(filepath, '[]\n', 'utf8');
  }
}

async function readStore(filepath) {
  const text = await readFile(filepath, 'utf8');
  const value = JSON.parse(text || '[]');
  return Array.isArray(value) ? value : [];
}

async function mutateStore(filepath, mutator) {
  const previous = writeQueues.get(filepath) || Promise.resolve();
  const next = previous.catch(() => {}).then(async () => {
    const current = await readStore(filepath);
    const updated = await mutator(current);
    const temporary = `${filepath}.${process.pid}.${crypto.randomBytes(3).toString('hex')}.tmp`;
    await writeFile(temporary, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    await rename(temporary, filepath);
    return updated;
  });
  writeQueues.set(filepath, next);
  return next;
}

async function updateGeneration(id, patch) {
  let updated = null;
  await mutateStore(generationsFile, (items) => items.map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  }));
  if (!updated) throw httpError(404, '生成任务不存在。');
  return updated;
}

function toGenerationResponse(record) {
  return {
    job_id: record.id,
    status: record.status,
    progress: record.progress || 0,
    outputs: record.outputs || [],
    error: record.error || null,
  };
}

function toSubmissionResponse(item) {
  return {
    submission_id: item.id,
    generation_id: item.generation_id,
    work_id: item.work_id,
    title: item.title,
    type: item.type,
    thumbnail_url: item.thumbnail_url,
    status: item.status,
    submitted_at: item.submitted_at,
    reviewed_at: item.reviewed_at,
    review_note: item.review_note,
  };
}

function normalizeSenseAudioStatus(status) {
  const value = String(status || '').toLowerCase();
  if (['completed', 'succeeded', 'success'].includes(value)) return 'succeeded';
  if (['failed', 'cancelled', 'canceled'].includes(value)) return 'failed';
  if (['processing', 'running'].includes(value)) return 'running';
  return 'queued';
}

function defaultReviewNote(status) {
  if (status === 'approved') return '已收录至素材中心。';
  if (status === 'rejected') return '本次作品暂未通过精选审核。';
  return '作品已进入精选审核队列。';
}

function publicBase(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || 'http';
  return `${protocol}://${req.headers.host || `${host}:${port}`}`;
}

function setCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin && origin !== 'null' ? origin : '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
}

function sendJson(res, statusCode, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': data.length,
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function safeStem(value) {
  return String(value || 'asset').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 90);
}

function extensionForMime(mime) {
  const value = String(mime || '').toLowerCase();
  if (value.includes('image/png')) return 'png';
  if (value.includes('image/jpeg')) return 'jpg';
  if (value.includes('image/webp')) return 'webp';
  if (value.includes('video/mp4')) return 'mp4';
  if (value.includes('video/quicktime')) return 'mov';
  return '';
}

function contentTypeFor(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.mp4') return 'video/mp4';
  if (extension === '.mov') return 'video/quicktime';
  return 'application/octet-stream';
}
