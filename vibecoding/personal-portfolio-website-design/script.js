(function initializePortfolio() {
  "use strict";

  const { FrameSequenceState } = window.ScrollFramePortfolio;
  const canvas = document.getElementById("frame-canvas");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const bootStatus = document.getElementById("boot-status");
  const panels = Array.from(document.querySelectorAll(".panel"));
  const projectPanel = document.getElementById("project");

  const SOURCE_WIDTH = 2560;
  const SOURCE_HEIGHT = 1440;
  const FRAME_COUNT = 600;
  const FRAME_VERSION = "web-1440p-600-v1";
  const SECTION_DURATION_MS = 520;
  const CACHE_LIMIT = 4;
  const NODES = Object.freeze([
    Object.freeze({ startFrame: 1, endFrame: 300 }),
    Object.freeze({ startFrame: 301, endFrame: 600 }),
  ]);

  const state = new FrameSequenceState(NODES);
  const imageCache = new Map();
  let transitioning = false;
  let lastDrawnFrame = null;
  let touchY = null;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  function framePath(frame) {
    return `./frames/frame_${String(frame).padStart(4, "0")}.webp?v=${FRAME_VERSION}`;
  }

  function touchCache(frame, image) {
    imageCache.delete(frame);
    imageCache.set(frame, image);

    while (imageCache.size > CACHE_LIMIT) {
      const oldestFrame = imageCache.keys().next().value;
      imageCache.delete(oldestFrame);
    }
  }

  function loadFrame(frame) {
    if (imageCache.has(frame)) {
      const cachedImage = imageCache.get(frame);
      touchCache(frame, cachedImage);
      return cachedImage.promise;
    }

    const image = new Image();
    image.decoding = "async";
    const record = { image, promise: null };

    record.promise = new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`Unable to load frame ${frame}.`)), {
        once: true,
      });
    });

    image.src = framePath(frame);
    touchCache(frame, record);
    return record.promise;
  }

  function resizeCanvas() {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const bitmapWidth = Math.max(1, Math.round(window.innerWidth * ratio));
    const bitmapHeight = Math.max(1, Math.round(window.innerHeight * ratio));

    if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
      canvas.width = bitmapWidth;
      canvas.height = bitmapHeight;
    }

    context.imageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
  }

  function drawImageCover(image, frame) {
    resizeCanvas();

    const scale = Math.max(canvas.width / SOURCE_WIDTH, canvas.height / SOURCE_HEIGHT);
    const drawWidth = Math.ceil(SOURCE_WIDTH * scale);
    const drawHeight = Math.ceil(SOURCE_HEIGHT * scale);
    const drawX = Math.floor((canvas.width - drawWidth) / 2);
    const drawY = Math.floor((canvas.height - drawHeight) / 2);

    context.drawImage(
      image,
      0,
      0,
      SOURCE_WIDTH,
      SOURCE_HEIGHT,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
    );

    lastDrawnFrame = frame;
    canvas.dataset.frame = String(frame);
  }

  function preloadAround(frame, direction) {
    const heading = direction >= 0 ? 1 : -1;
    const longerLead = frame > 286 && frame < 301
      ? 301
      : frame + heading * 7;
    const candidates = [frame, frame + heading, longerLead, frame - heading];

    for (const candidate of candidates) {
      if (candidate >= 1 && candidate <= FRAME_COUNT) {
        loadFrame(candidate).catch(() => {});
      }
    }
  }

  async function renderFrame(frame, direction = 1) {
    canvas.dataset.requestedFrame = String(frame);

    try {
      const image = await loadFrame(frame);

      if (state.frame === frame) {
        drawImageCover(image, frame);
      }

      preloadAround(frame, direction);
    } catch (error) {
      bootStatus.textContent = `IMAGE ${String(frame).padStart(4, "0")} FAILED`;
      console.error(error);
    }
  }

  function updateContentState() {
    const cardsShouldShow = state.page === 1 && state.pendingTransition !== "previous";
    projectPanel.classList.toggle("is-active", cardsShouldShow);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function animateSectionTransition() {
    if (transitioning || !state.pendingTransition) {
      return;
    }

    transitioning = true;
    const destinationPage = state.pendingTransition === "next" ? state.page + 1 : state.page - 1;
    const startY = window.scrollY;
    const targetY = panels[destinationPage].offsetTop;
    const distance = targetY - startY;
    const startedAt = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / SECTION_DURATION_MS);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, Math.round(startY + distance * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
        return;
      }

      window.scrollTo(0, targetY);
      state.commitTransition();
      transitioning = false;
      updateContentState();
      renderFrame(state.frame, destinationPage > 0 ? 1 : -1);
    }

    requestAnimationFrame(tick);
  }

  function scrub(signedDelta, requestedStep) {
    if (transitioning) {
      return;
    }

    const direction = signedDelta > 0 ? 1 : -1;
    const result = state.advance(direction * requestedStep);
    updateContentState();
    renderFrame(result.frame, direction);

    if (result.transition) {
      requestAnimationFrame(animateSectionTransition);
    }
  }

  function normalizedWheelPixels(event) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return event.deltaY * 16;
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return event.deltaY * window.innerHeight;
    }

    return event.deltaY;
  }

  function onWheel(event) {
    event.preventDefault();
    const pixels = normalizedWheelPixels(event);

    if (pixels === 0) {
      return;
    }

    const step = Math.max(1, Math.min(8, Math.round(Math.abs(pixels) / 18)));
    scrub(pixels, step);
  }

  function onKeyDown(event) {
    const forward = ["ArrowDown", "ArrowRight", "PageDown", " "];
    const backward = ["ArrowUp", "ArrowLeft", "PageUp"];

    if (!forward.includes(event.key) && !backward.includes(event.key)) {
      return;
    }

    event.preventDefault();
    const direction = forward.includes(event.key) ? 1 : -1;
    const step = event.key.startsWith("Page") || event.key === " " ? 16 : 5;
    scrub(direction, step);
  }

  function onTouchStart(event) {
    touchY = event.touches[0]?.clientY ?? null;
  }

  function onTouchMove(event) {
    if (touchY === null || !event.touches[0]) {
      return;
    }

    event.preventDefault();
    const nextY = event.touches[0].clientY;
    const delta = touchY - nextY;
    touchY = nextY;

    if (Math.abs(delta) >= 2) {
      const step = Math.max(1, Math.min(8, Math.round(Math.abs(delta) / 4)));
      scrub(delta, step);
    }
  }

  function resetExperience() {
    state.reset();
    transitioning = false;
    window.scrollTo(0, 0);
    updateContentState();
    renderFrame(1, 1);
  }

  function onResize() {
    resizeCanvas();
    window.scrollTo(0, panels[state.page].offsetTop);

    const cached = imageCache.get(state.frame);
    if (cached?.image.complete) {
      drawImageCover(cached.image, state.frame);
    } else {
      renderFrame(state.frame, 1);
    }
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", () => {
    touchY = null;
  });
  window.addEventListener("resize", onResize);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      resetExperience();
    }
  });

  Object.defineProperty(window, "__portfolioDebug", {
    configurable: false,
    writable: false,
    value: Object.freeze({
      snapshot() {
        return Object.freeze({
          page: state.page,
          frame: state.frame,
          drawnFrame: lastDrawnFrame,
          transitioning,
          pendingTransition: state.pendingTransition,
          scrollY: Math.round(window.scrollY),
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          cacheSize: imageCache.size,
          cardsVisible: projectPanel.classList.contains("is-active"),
        });
      },
    }),
  });

  window.scrollTo(0, 0);
  resizeCanvas();
  updateContentState();
  loadFrame(1)
    .then((image) => {
      drawImageCover(image, 1);
      bootStatus.classList.add("is-ready");
      bootStatus.textContent = "READY";
      preloadAround(1, 1);
      loadFrame(301).catch(() => {});
    })
    .catch((error) => {
      bootStatus.textContent = "OPENING IMAGE FAILED";
      console.error(error);
    });
})();
