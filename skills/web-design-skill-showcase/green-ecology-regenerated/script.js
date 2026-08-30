const root = document.documentElement;
const nav = document.querySelector('.site-nav');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-list');
const mediaButton = document.querySelector('.media-toggle');
const mediaLabel = document.querySelector('.media-label');
const mediaBlocks = [...document.querySelectorAll('.scene-media')];
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

document.fonts.ready.then(() => root.classList.add('fonts-ready'));

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.18 });

document.querySelectorAll('.reveal').forEach((node) => revealObserver.observe(node));

const setMenu = (open) => {
  menu.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('span').textContent = open ? '关闭' : '目录';
  document.body.classList.toggle('menu-open', open);
  if (open) menu.querySelector('a')?.focus();
};

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) {
    setMenu(false);
    menuButton.focus();
  }
});

let desiredPlaying = !prefersReduced.matches;
let playbackRequest = 0;

const loadMedia = (block) => {
  const video = block.querySelector('video');
  if (!video.currentSrc && !video.src && video.dataset.src) {
    video.src = video.dataset.src;
    video.load();
  }
  block.dataset.loaded = 'true';
  return video;
};

const pauseMedia = (block) => {
  const video = block.querySelector('video');
  video.pause();
  block.classList.remove('is-playing');
};

const playMedia = async (block, requestId) => {
  const video = loadMedia(block);
  try {
    await video.play();
    if (requestId !== playbackRequest || !desiredPlaying) {
      video.pause();
      return;
    }
    block.classList.add('is-playing');
  } catch {
    block.classList.remove('is-playing');
  }
};

const syncPlayback = () => {
  const requestId = ++playbackRequest;
  root.setAttribute('data-motion', desiredPlaying ? 'playing' : 'paused');
  mediaButton.setAttribute('aria-pressed', String(desiredPlaying));
  const compact = window.matchMedia('(max-width: 759px)').matches;
  mediaLabel.textContent = desiredPlaying ? (compact ? '暂停' : '暂停影像') : (compact ? '播放' : '播放影像');
  for (const block of mediaBlocks) {
    if (desiredPlaying && block.dataset.inview === 'true') playMedia(block, requestId);
    else pauseMedia(block);
  }
};

window.addEventListener('resize', syncPlayback, { passive: true });

for (const block of mediaBlocks) {
  const video = block.querySelector('video');
  video.addEventListener('playing', () => {
    if (desiredPlaying) block.classList.add('is-playing');
  });
  video.addEventListener('error', () => {
    block.classList.remove('is-playing');
    mediaLabel.textContent = '部分影像不可用';
  });
}

const loadObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      loadMedia(entry.target);
      loadObserver.unobserve(entry.target);
    }
  }
}, { rootMargin: '120% 0px' });

const playObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.dataset.inview = String(entry.isIntersecting && entry.intersectionRatio >= 0.12);
  }
  syncPlayback();
}, { threshold: [0, 0.12, 0.45] });

mediaBlocks.forEach((block) => {
  loadObserver.observe(block);
  playObserver.observe(block);
});

mediaButton.addEventListener('click', () => {
  desiredPlaying = !desiredPlaying;
  if (desiredPlaying) mediaBlocks.forEach(loadMedia);
  syncPlayback();
});

prefersReduced.addEventListener('change', (event) => {
  desiredPlaying = !event.matches;
  syncPlayback();
});

const toneObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) nav.classList.toggle('is-light', visible.target.dataset.navTone === 'light');
}, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01] });

document.querySelectorAll('[data-nav-tone]').forEach((section) => toneObserver.observe(section));

const sectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const id = entry.target.dataset.section;
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const active = link.dataset.nav === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });

document.querySelectorAll('[data-section]').forEach((section) => sectionObserver.observe(section));

let progressTicking = false;
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  document.querySelector('.scroll-progress span').style.transform = `scaleY(${progress})`;
  progressTicking = false;
};

window.addEventListener('scroll', () => {
  if (!progressTicking) {
    requestAnimationFrame(updateProgress);
    progressTicking = true;
  }
}, { passive: true });
updateProgress();

document.querySelector('.action-cta').addEventListener('click', () => {
  const row = document.querySelector('#action-01');
  row.classList.add('is-selected');
  setTimeout(() => row.classList.remove('is-selected'), 1600);
});
