const { app, BrowserWindow, screen, ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROBOT_DIR = path.join(__dirname, 'assets', 'robot');
const manifest = JSON.parse(fs.readFileSync(path.join(ROBOT_DIR, 'manifest.json'), 'utf8'));

const PAD_ALONG = 14;
const LEGLEN = 12;     // kept as away-side slack (room for the jump)
const SLACK = 14;
const FOLLOW_ENTER = 40;
const FOLLOW_EXIT = 120;
const GAP = 30;
const MAX_PETS = 8;
const EDGE_NAMES = ['top', 'right', 'bottom', 'left'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const Rnd = Math.round;

// ---------------- settings ----------------
const DEFAULTS = {
  patrolSpeed: 0.9,
  follow: true,
  lockForm: false,
  stay: false,
  blockWalls: false,
  windowWalker: false,
  switchMinutes: 5,
  gait: 'smooth',          // 'smooth' | 'sway'
  lang: 'zh',              // 'zh' | 'en' | 'ja'
  count: 1,
  edges: { top: true, right: true, bottom: true, left: true },
};
let settingsPath = null;
let settings = { ...DEFAULTS };

function loadSettings() {
  try {
    const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    settings = { ...DEFAULTS, ...s, edges: { ...DEFAULTS.edges, ...(s.edges || {}) } };
  } catch { settings = { ...DEFAULTS }; }
  if (settings.gait !== 'sway') settings.gait = 'smooth';
  settings.count = clamp(Rnd(Number(settings.count) || 1), 1, MAX_PETS);
}
function saveSettings() {
  try { fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)); } catch {}
}

// ---------------- geometry ----------------
function dimsFor(form, edge) {
  const sw = manifest[form].w, sh = manifest[form].h;
  const away = sh + LEGLEN + SLACK;
  const along = sw + 2 * PAD_ALONG;
  return (edge === 0 || edge === 2) ? { w: along, h: away } : { w: away, h: along };
}
function enabledMask() {
  const en = EDGE_NAMES.map((k) => !!settings.edges[k]);
  return en.some(Boolean) ? en : [false, false, true, false];
}
function nextEnabled(edge, dir) {
  const en = enabledMask();
  for (let i = 1; i <= 4; i++) {
    const ni = (((edge + dir * i) % 4) + 4) % 4;
    if (en[ni]) return ni;
  }
  return edge;
}
function bounds(wa) { return { x0: wa.x, y0: wa.y, x1: wa.x + wa.width, y1: wa.y + wa.height }; }
function edgeSpan(edge, wa, dims) {
  const B = bounds(wa);
  return (edge === 0 || edge === 2)
    ? Math.max(1, (B.x1 - dims.w) - B.x0)
    : Math.max(1, (B.y1 - dims.h) - B.y0);
}
function edgeOrigin(edge, t, wa, dims) {
  const B = bounds(wa); t = clamp(t, 0, 1);
  switch (edge) {
    case 0: return { x: lerp(B.x0, B.x1 - dims.w, t), y: B.y0 };
    case 1: return { x: B.x1 - dims.w, y: lerp(B.y0, B.y1 - dims.h, t) };
    case 3: return { x: B.x0, y: lerp(B.y1 - dims.h, B.y0, t) };
    default: return { x: lerp(B.x1 - dims.w, B.x0, t), y: B.y1 - dims.h };
  }
}
function nearestEdgeT(cx, cy, wa) {
  const B = bounds(wa); const en = enabledMask();
  const opt = [
    { edge: 0, dist: cy - B.y0, t: (cx - B.x0) / (B.x1 - B.x0) },
    { edge: 1, dist: B.x1 - cx, t: (cy - B.y0) / (B.y1 - B.y0) },
    { edge: 2, dist: B.y1 - cy, t: 1 - (cx - B.x0) / (B.x1 - B.x0) },
    { edge: 3, dist: cx - B.x0, t: 1 - (cy - B.y0) / (B.y1 - B.y0) },
  ];
  let best = null;
  for (const o of opt) { if (en[o.edge] && (!best || o.dist < best.dist)) best = o; }
  best = best || { edge: 2, t: 0.5 };
  return { edge: best.edge, t: clamp(best.t, 0, 1) };
}

// ---------------- window obstacles (窗口阻拦) ----------------
const WINLIST = path.join(__dirname, 'tools', 'winlist');
let obstacles = [];
let obstacleTimer = null;

function pollObstacles() {
  execFile(WINLIST, { timeout: 2000 }, (err, stdout) => {
    if (err) return;
    try {
      obstacles = JSON.parse(stdout)
        .filter((o) => o[4] !== process.pid)
        .map(([x, y, w, h, , id]) => ({ x, y, w, h, id }));
    } catch {}
  });
}
function needsObstacles() { return settings.blockWalls || settings.windowWalker; }
function syncObstaclePolling() {
  if (needsObstacles() && !obstacleTimer) {
    pollObstacles();
    obstacleTimer = setInterval(pollObstacles, 500);
  } else if (!needsObstacles() && obstacleTimer) {
    clearInterval(obstacleTimer);
    obstacleTimer = null;
    obstacles = [];
  }
}

// the sprite's on-screen footprint, given its render orientation and window origin
function bodyRectFromOrigin(form, orient, o) {
  const dims = dimsFor(form, orient);
  const m = manifest[form];
  switch (orient) {
    case 0: return { x: o.x + PAD_ALONG, y: o.y, w: m.w, h: m.h };
    case 1: return { x: o.x + dims.w - m.h, y: o.y + PAD_ALONG, w: m.h, h: m.w };
    case 3: return { x: o.x, y: o.y + PAD_ALONG, w: m.h, h: m.w };
    default: return { x: o.x + PAD_ALONG, y: o.y + dims.h - m.h, w: m.w, h: m.h };
  }
}
function blockedBy(r, excludeId) {
  if (!settings.blockWalls || !obstacles.length) return false;
  return obstacles.some((o) => o.id !== excludeId &&
    r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
}
function blockedAt(form, edge, t, wa) {
  return blockedBy(bodyRectFromOrigin(form, edge, edgeOrigin(edge, t, wa, dimsFor(form, edge))));
}

// ---------------- window walker (窗口行者) ----------------
// pets walk the OUTER rim of a host window: on its top edge they stand upright,
// below its bottom edge they hang, etc. Window edge -> render orientation:
const OPP = [2, 3, 0, 1];   // top->bottom, right->left, bottom->top, left->right

// clockwise loop around the window; corner-continuous (edge K t=1 meets edge K+1 t=0)
function hostEdgeOrigin(we, t, r, dims) {
  t = clamp(t, 0, 1);
  const rx0 = r.x, ry0 = r.y, rx1 = r.x + r.w, ry1 = r.y + r.h;
  switch (we) {
    case 0: return { x: lerp(rx0, rx1 - dims.w, t), y: ry0 - dims.h };
    case 1: return { x: rx1, y: lerp(ry0, ry1 - dims.h, t) };
    case 2: return { x: lerp(rx1 - dims.w, rx0, t), y: ry1 };
    default: return { x: rx0 - dims.w, y: lerp(ry1 - dims.h, ry0, t) };
  }
}
function hostSpan(we, r, dims) {
  return (we === 0 || we === 2) ? Math.max(1, r.w - dims.w) : Math.max(1, r.h - dims.h);
}
function hostRectFor(st) {
  if (st.hostId == null) return null;
  const r = obstacles.find((o) => o.id === st.hostId);
  if (!r) st.hostId = null;   // window closed / left the screen
  return r || null;
}
// nearest enabled window edge within snap range of the drop point
function findAttachment(form, cx, cy) {
  const en = enabledMask();
  let best = null;
  for (const r of obstacles) {
    for (let we = 0; we < 4; we++) {
      if (!en[we]) continue;
      const dims = dimsFor(form, OPP[we]);
      const span = hostSpan(we, r, dims);
      let t;
      switch (we) {
        case 0: t = (cx - dims.w / 2 - r.x) / span; break;
        case 2: t = (r.x + r.w - dims.w - (cx - dims.w / 2)) / span; break;
        case 1: t = (cy - dims.h / 2 - r.y) / span; break;
        default: t = (r.y + r.h - dims.h - (cy - dims.h / 2)) / span; break;
      }
      t = clamp(t, 0, 1);
      const o = hostEdgeOrigin(we, t, r, dims);
      const d = Math.hypot(o.x + dims.w / 2 - cx, o.y + dims.h / 2 - cy);
      if (d < 80 && (!best || d < best.d)) best = { id: r.id, edge: we, t, d };
    }
  }
  return best;
}

// ---------------- pets ----------------
const pets = [];
let settingsWin = null;

function makeState() {
  return {
    form: 0, edge: 2, t: 0.5, perimDir: 1, face: -1, hostId: null,
    dragging: false, dragOffset: { x: 0, y: 0 },
    reactingUntil: 0, following: false, idleUntil: 0, nextSwitchAt: 0,
    vx: 0, vy: 0, cx: null, cy: null, spd: 0,
  };
}

function createPet() {
  const wa = screen.getPrimaryDisplay().workArea;
  const st = makeState();
  st.form = Math.floor(Math.random() * manifest.length);
  const en = enabledMask();
  const choices = [0, 1, 2, 3].filter((e) => en[e]);
  st.edge = choices.length ? choices[Math.floor(Math.random() * choices.length)] : 2;
  st.t = Math.random();
  st.perimDir = Math.random() < 0.5 ? 1 : -1;
  st.face = -st.perimDir;
  st.nextSwitchAt = Date.now() + settings.switchMinutes * 60000 * (0.4 + Math.random());

  const dims = dimsFor(st.form, st.edge);
  const o = edgeOrigin(st.edge, st.t, wa, dims);

  const win = new BrowserWindow({
    width: dims.w, height: dims.h, x: Rnd(o.x), y: Rnd(o.y),
    frame: false, transparent: true, backgroundColor: '#00000000',
    resizable: false, movable: true, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile('index.html');

  const pet = { win, st };
  win.webContents.on('did-finish-load', () => sendForm(pet));
  pets.push(pet);
  return pet;
}

function setCount(n) {
  n = clamp(Rnd(n), 1, MAX_PETS);
  settings.count = n;
  while (pets.length < n) createPet();
  while (pets.length > n) {
    const p = pets.pop();
    if (p && p.win && !p.win.isDestroyed()) p.win.destroy();
  }
  saveSettings();
}

function petFromEvent(e) {
  return pets.find((p) => p.win && !p.win.isDestroyed() && p.win.webContents.id === e.sender.id);
}

const dataUrlCache = {};
function spriteDataUrl(file) {
  if (!dataUrlCache[file]) {
    dataUrlCache[file] = 'data:image/png;base64,' +
      fs.readFileSync(path.join(ROBOT_DIR, file)).toString('base64');
  }
  return dataUrlCache[file];
}
function sendForm(pet) {
  if (pet.win && !pet.win.isDestroyed()) {
    const m = manifest[pet.st.form];
    pet.win.webContents.send('form', { file: m.file, w: m.w, h: m.h, foot: m.foot, data: spriteDataUrl(m.file) });
  }
}
function switchForm(pet, i) { pet.st.form = i; sendForm(pet); }

function sendTick(pet, edge, moving, speed) {
  if (pet.win && !pet.win.isDestroyed()) {
    pet.win.webContents.send('tick', {
      edge: EDGE_NAMES[edge], moving, speed,
      gait: settings.gait,
      face: pet.st.face || -1,
      reacting: Date.now() < pet.st.reactingUntil,
    });
  }
}

// ---------------- per-pet tick ----------------
function tick(pet) {
  const win = pet.win, st = pet.st;
  if (!win || win.isDestroyed()) return;
  const wa = screen.getPrimaryDisplay().workArea;
  const B = bounds(wa);
  const b = win.getBounds();
  // float center tracked in state: deriving it from the integer-rounded window
  // bounds makes sub-pixel walking (speed < 1) stutter
  const cur = { x: st.cx == null ? b.x + b.width / 2 : st.cx,
                y: st.cy == null ? b.y + b.height / 2 : st.cy };
  const cursor = screen.getCursorScreenPoint();
  const now = Date.now();
  const rel = { x: cursor.x - cur.x, y: cursor.y - cur.y };
  const dist = Math.hypot(rel.x, rel.y);

  if (st.dragging) {
    const dims = dimsFor(st.form, 2);
    const nx = clamp(Rnd(cursor.x - st.dragOffset.x), B.x0, B.x1 - dims.w);
    const ny = clamp(Rnd(cursor.y - st.dragOffset.y), B.y0, B.y1 - dims.h);
    win.setBounds({ x: nx, y: ny, width: dims.w, height: dims.h });
    st.cx = null; st.cy = null; st.spd = 0;
    sendTick(pet, 2, false, 0);
    return;
  }
  if (now < st.reactingUntil) {
    sendTick(pet, st.following ? 2 : (st.hostId != null ? OPP[st.edge] : st.edge), false, 0);
    return;
  }

  if (!settings.windowWalker) st.hostId = null;
  const hostRect = hostRectFor(st);

  if (settings.follow && !settings.stay && !hostRect) {
    if (!st.following && dist < FOLLOW_ENTER) st.following = true;
    else if (st.following && dist > FOLLOW_EXIT) {
      st.following = false;
      const ne = nearestEdgeT(cur.x, cur.y, wa);
      st.edge = ne.edge; st.t = ne.t;
    }
  } else st.following = false;

  if (!st.following && !settings.lockForm && now >= st.nextSwitchAt) {
    let n = st.form;
    if (manifest.length > 1) while (n === st.form) n = Math.floor(Math.random() * manifest.length);
    switchForm(pet, n);
    st.nextSwitchAt = now + settings.switchMinutes * 60000;
  }

  let edge, dims, tx, ty, ease;
  if (st.following) {
    edge = 2; dims = dimsFor(st.form, 2);
    if (dist > GAP) { const k = (dist - GAP) / dist; tx = cur.x + rel.x * k; ty = cur.y + rel.y * k; }
    else { tx = cur.x; ty = cur.y; }
    ease = 0.16;
  } else if (hostRect) {
    // window walker: patrol the host window's outer rim
    if (!settings.stay && now >= st.idleUntil) {
      if (Math.random() < 0.003) {
        st.idleUntil = now + 900 + Math.random() * 2600;
      } else {
        const prev = { t: st.t, edge: st.edge, dir: st.perimDir };
        const span = hostSpan(st.edge, hostRect, dimsFor(st.form, OPP[st.edge]));
        st.t += st.perimDir * (settings.patrolSpeed / span);
        if (Math.random() < 0.0012) st.perimDir *= -1;
        while (st.t > 1 || st.t < 0) {
          if (st.t > 1) {
            const ne = nextEnabled(st.edge, +1);
            if (ne === st.edge) { st.t = 2 - st.t; st.perimDir = -1; }
            else { st.t -= 1; st.edge = ne; }
          } else {
            const ne = nextEnabled(st.edge, -1);
            if (ne === st.edge) { st.t = -st.t; st.perimDir = 1; }
            else { st.t += 1; st.edge = ne; }
          }
        }
        if (!enabledMask()[st.edge]) st.edge = nextEnabled(st.edge, st.perimDir);
        st.face = st.perimDir;   // host loop runs clockwise: t+ moves toward local +x
        const cand = bodyRectFromOrigin(st.form, OPP[st.edge],
          hostEdgeOrigin(st.edge, st.t, hostRect, dimsFor(st.form, OPP[st.edge])));
        if (blockedBy(cand, st.hostId)) {
          st.t = prev.t; st.edge = prev.edge; st.perimDir = prev.dir;
        }
      }
    }
    edge = OPP[st.edge];
    dims = dimsFor(st.form, edge);
    const o = hostEdgeOrigin(st.edge, st.t, hostRect, dims);
    tx = o.x + dims.w / 2; ty = o.y + dims.h / 2;
    ease = 0.12;
  } else {
    if (!settings.stay && now >= st.idleUntil) {
      if (Math.random() < 0.003) {
        st.idleUntil = now + 900 + Math.random() * 2600;
      } else {
        const prev = { t: st.t, edge: st.edge, dir: st.perimDir };
        const d0 = dimsFor(st.form, st.edge);
        const span = edgeSpan(st.edge, wa, d0);
        st.t += st.perimDir * (settings.patrolSpeed / span);
        if (Math.random() < 0.0012) st.perimDir *= -1;
        // wrap to the next enabled edge; on a lone edge, turn around instead
        while (st.t > 1 || st.t < 0) {
          if (st.t > 1) {
            const ne = nextEnabled(st.edge, +1);
            if (ne === st.edge) { st.t = 2 - st.t; st.perimDir = -1; }
            else { st.t -= 1; st.edge = ne; }
          } else {
            const ne = nextEnabled(st.edge, -1);
            if (ne === st.edge) { st.t = -st.t; st.perimDir = 1; }
            else { st.t += 1; st.edge = ne; }
          }
        }
        if (!enabledMask()[st.edge]) st.edge = nextEnabled(st.edge, st.perimDir);
        st.face = -st.perimDir;   // sprite-local +x faces against perimeter direction
        // a window in the way: stand and wait (keep facing it) until it moves
        if (blockedAt(st.form, st.edge, st.t, wa)) {
          st.t = prev.t; st.edge = prev.edge; st.perimDir = prev.dir;
        }
      }
    }
    edge = st.edge; dims = dimsFor(st.form, edge);
    const o = edgeOrigin(edge, st.t, wa, dims);
    tx = o.x + dims.w / 2; ty = o.y + dims.h / 2;
    ease = 0.12;
  }

  let ncx = cur.x + (tx - cur.x) * ease;
  let ncy = cur.y + (ty - cur.y) * ease;
  if (Math.abs(tx - ncx) < 1) ncx = tx;   // settle exactly once close
  if (Math.abs(ty - ncy) < 1) ncy = ty;
  st.vx = ncx - cur.x; st.vy = ncy - cur.y;
  if (st.following && Math.abs(st.vx) > 0.5) st.face = st.vx > 0 ? 1 : -1;

  st.cx = clamp(ncx, B.x0 + dims.w / 2, B.x1 - dims.w / 2);
  st.cy = clamp(ncy, B.y0 + dims.h / 2, B.y1 - dims.h / 2);
  win.setBounds({ x: Rnd(st.cx - dims.w / 2), y: Rnd(st.cy - dims.h / 2), width: dims.w, height: dims.h });

  // smoothed speed: the raw per-tick value flickers across the threshold at low
  // patrol speeds, which made the walk/idle animations rapidly alternate
  st.spd += (Math.hypot(st.vx, st.vy) - st.spd) * 0.25;
  sendTick(pet, edge, st.spd > 0.18, st.spd);
}

// ---------------- settings window ----------------
function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 320, height: 740, resizable: false, title: 'Hi, Claude!',
    webPreferences: { preload: path.join(__dirname, 'settings-preload.js'), contextIsolation: true },
  });
  settingsWin.setMenuBarVisibility(false);
  // pop on the current Space (even a fullscreen one), above the pets
  settingsWin.setAlwaysOnTop(true, 'floating');
  settingsWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  settingsWin.loadFile('settings.html');
  settingsWin.once('ready-to-show', () => {
    if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); }
  });
  settingsWin.on('closed', () => { settingsWin = null; });
}
function applySettings(incoming) {
  settings = { ...settings, ...incoming, edges: { ...settings.edges, ...(incoming.edges || {}) } };
  settings.patrolSpeed = clamp(Number(settings.patrolSpeed) || 0.9, 0.1, 3);
  settings.switchMinutes = clamp(Number(settings.switchMinutes) || 5, 0.1, 120);
  settings.gait = settings.gait === 'sway' ? 'sway' : 'smooth';
  const newCount = clamp(Rnd(Number(settings.count) || 1), 1, MAX_PETS);
  saveSettings();
  if (!settings.follow) pets.forEach((p) => { p.st.following = false; });
  syncObstaclePolling();
  if (!settings.windowWalker) {
    pets.forEach((p) => {
      if (p.st.hostId == null || !p.win || p.win.isDestroyed()) return;
      const b = p.win.getBounds();
      const ne = nearestEdgeT(b.x + b.width / 2, b.y + b.height / 2, screen.getPrimaryDisplay().workArea);
      p.st.hostId = null; p.st.edge = ne.edge; p.st.t = ne.t;
    });
  }
  if (settings.stay) {
    const wa = screen.getPrimaryDisplay().workArea;
    pets.forEach((p) => {
      if (!p.win || p.win.isDestroyed()) return;
      p.st.following = false;
      if (p.st.hostId != null) return;   // stays glued to its host window
      const b = p.win.getBounds();
      const ne = nearestEdgeT(b.x + b.width / 2, b.y + b.height / 2, wa);
      p.st.edge = ne.edge; p.st.t = ne.t;
    });
  }
  pets.forEach((p) => { p.st.nextSwitchAt = Date.now() + settings.switchMinutes * 60000; });
  if (newCount !== pets.length) setCount(newCount);
}

// ---------------- IPC ----------------
ipcMain.on('drag-start', (e) => {
  const p = petFromEvent(e); if (!p) return;
  const b = p.win.getBounds();
  const c = screen.getCursorScreenPoint();
  p.st.dragOffset = { x: c.x - b.x, y: c.y - b.y };
  p.st.dragging = true;
});
ipcMain.on('drag-end', (e) => {
  const p = petFromEvent(e); if (!p) return;
  p.st.dragging = false;
  const wa = screen.getPrimaryDisplay().workArea;
  const b = p.win.getBounds();
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  p.st.following = false;
  if (settings.windowWalker) {
    const att = findAttachment(p.st.form, cx, cy);
    if (att) { p.st.hostId = att.id; p.st.edge = att.edge; p.st.t = att.t; return; }
  }
  p.st.hostId = null;
  const ne = nearestEdgeT(cx, cy, wa);
  p.st.edge = ne.edge; p.st.t = ne.t;
});
ipcMain.on('react', (e) => { const p = petFromEvent(e); if (p) p.st.reactingUntil = Date.now() + 950; });
ipcMain.on('open-settings', openSettings);
ipcMain.on('app:quit', () => app.quit());
ipcMain.handle('settings:get', () => settings);
ipcMain.on('settings:set', (_e, inc) => applySettings(inc));
function eachPet(fn) {
  const n = manifest.length;
  for (const p of pets) {
    fn(p, n);
    p.st.nextSwitchAt = Date.now() + settings.switchMinutes * 60000;
  }
}
ipcMain.on('form:next', () => eachPet((p, n) => switchForm(p, (p.st.form + 1) % n)));
ipcMain.on('form:prev', () => eachPet((p, n) => switchForm(p, (p.st.form - 1 + n) % n)));
ipcMain.on('form:random', () => eachPet((p, n) => {
  let r = p.st.form;
  if (n > 1) while (r === p.st.form) r = Math.floor(Math.random() * n);
  switchForm(p, r);
}));

// ---------------- lifecycle ----------------
// one instance only: overlapping transparent pet windows from two instances
// steal each other's clicks and share the same userData dir
if (!app.requestSingleInstanceLock()) {
  app.quit();
}
app.on('second-instance', () => openSettings());

app.whenReady().then(() => {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  loadSettings();
  syncObstaclePolling();
  setCount(settings.count);
  setInterval(() => { for (const p of pets) tick(p); }, 1000 / 30);
  app.on('activate', () => { if (pets.length === 0) setCount(settings.count); });
});
app.on('window-all-closed', () => app.quit());
