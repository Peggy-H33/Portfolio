const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll("[data-enhance-video]").forEach((video) => {
  const shell = video.closest("[data-video-shell]");
  const toggle = shell?.querySelector("[data-video-toggle]");

  const sync = () => {
    const playing = !video.paused && !video.ended;
    shell?.classList.toggle("is-playing", playing);
    if (toggle) {
      toggle.textContent = playing ? "暂停" : "播放";
      toggle.setAttribute("aria-label", playing ? "暂停视频" : "播放视频");
    }
  };

  video.addEventListener("playing", sync);
  video.addEventListener("pause", sync);
  video.addEventListener("ended", sync);
  video.addEventListener("error", () => shell?.classList.remove("is-playing"));

  if (toggle) {
    video.autoplay = false;
    toggle.addEventListener("click", async () => {
      if (video.paused) {
        try { await video.play(); } catch { shell?.classList.remove("is-playing"); }
      } else {
        video.pause();
      }
    });
  } else if (!reduceMotion.matches) {
    video.play().catch(() => shell?.classList.remove("is-playing"));
  }
});

reduceMotion.addEventListener("change", (event) => {
  if (event.matches) {
    document.querySelectorAll("video").forEach((video) => video.pause());
  }
});
