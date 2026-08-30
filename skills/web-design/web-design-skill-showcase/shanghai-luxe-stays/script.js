(() => {
  const doc = document;
  const root = doc.documentElement;
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionReduced = reducedQuery.matches;
  root.dataset.motion = motionReduced ? 'reduced' : 'full';

  const header = doc.querySelector('[data-header]');
  const menuToggle = doc.querySelector('[data-menu-toggle]');
  const mobileMenu = doc.querySelector('[data-mobile-menu]');
  const setMenu = (open) => {
    header?.classList.toggle('menu-open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    if (mobileMenu) mobileMenu.inert = !open;
  };
  if (mobileMenu) mobileMenu.inert = true;
  menuToggle?.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  mobileMenu?.addEventListener('click', (event) => {
    if (event.target.closest('a,button')) setMenu(false);
  });

  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const reveals = [...doc.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !motionReduced) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -7% 0px' });
    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  const videoShells = [...doc.querySelectorAll('[data-video-shell]')];
  const setVideoState = async (shell, shouldPlay, explicit = false) => {
    const video = shell.querySelector('[data-video]');
    const control = shell.parentElement?.querySelector('[data-video-toggle]') || shell.querySelector('[data-video-toggle]');
    if (!video) return;
    if (shouldPlay) {
      const source = video.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
        video.load();
      }
      try {
        await video.play();
        shell.dataset.playing = 'true';
        shell.dataset.explicitPlay = String(explicit);
      } catch {
        shell.dataset.playing = 'false';
      }
    } else {
      video.pause();
      shell.dataset.playing = 'false';
    }
    const isPlaying = shell.dataset.playing === 'true';
    if (control) {
      control.setAttribute('aria-label', isPlaying ? '暂停影像' : '播放影像');
      const icon = control.querySelector('.video-control-icon');
      const label = control.querySelector('.video-control-label');
      if (icon) icon.textContent = isPlaying ? 'Ⅱ' : '▶';
      if (label) label.textContent = isPlaying ? '暂停' : '播放';
    }
  };

  videoShells.forEach((shell) => {
    const video = shell.querySelector('[data-video]');
    const control = shell.parentElement?.querySelector('[data-video-toggle]') || shell.querySelector('[data-video-toggle]');
    control?.addEventListener('click', () => setVideoState(shell, shell.dataset.playing !== 'true', true));
    video?.addEventListener('error', () => { shell.dataset.playing = 'false'; shell.dataset.videoError = 'true'; });
  });

  const motionToggles = [...doc.querySelectorAll('[data-motion-toggle]')];
  const setGlobalMotion = (reduced) => {
    motionReduced = reduced;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    motionToggles.forEach((toggle) => {
      toggle.setAttribute('aria-pressed', String(reduced));
      toggle.textContent = reduced ? '动效 · 关' : '动效 · 开';
    });
    if (reduced) {
      reveals.forEach((el) => el.classList.add('is-visible'));
      videoShells.forEach((shell) => setVideoState(shell, false, false));
    } else {
      videoShells.forEach((shell) => {
        const rect = shell.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) setVideoState(shell, true, false);
      });
    }
  };
  motionToggles.forEach((toggle) => toggle.addEventListener('click', () => setGlobalMotion(!motionReduced)));
  reducedQuery.addEventListener?.('change', (event) => setGlobalMotion(event.matches));
  setGlobalMotion(motionReduced);

  if ('IntersectionObserver' in window) {
    const mediaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const shell = entry.target;
        const userOverride = shell.dataset.explicitPlay === 'true';
        if (entry.isIntersecting && !motionReduced && !userOverride) setVideoState(shell, true, false);
        if (!entry.isIntersecting && !userOverride) setVideoState(shell, false, false);
      });
    }, { threshold: 0.36, rootMargin: '120px 0px' });
    videoShells.forEach((shell) => mediaObserver.observe(shell));
  } else if (!motionReduced) {
    videoShells.forEach((shell) => setVideoState(shell, true, false));
  }

  const stayContent = {
    river: {
      label: '为初见上海的人', title: '把城市放在窗前',
      body: '醒来就看见浦江，适合两晚以上的城市首站。白天向外探索，夜里回到一间有完整服务、也有足够留白的房间。',
      facts: ['建议节奏：2–3 晚', '同行方式：双人 / 独行', '城市距离：开阔但不疏远']
    },
    lane: {
      label: '为再访上海的人', title: '让街区走进日常',
      body: '适合已经看过城市地标、这次更想认识一条街的人。住进里弄，咖啡、面包、雨声和晚归的脚步都不再只是路过。',
      facts: ['建议节奏：3 晚以上', '同行方式：双人 / 小家庭', '城市距离：贴近而私密']
    },
    ritual: {
      label: '为重视被照顾的人', title: '把讲究留在房间里',
      body: '不需要密集的行程，只需要每一次回房都恰到好处。细致的材料、安静的服务与完整的客房仪式，让夜晚本身成为目的地。',
      facts: ['建议节奏：2–4 晚', '同行方式：独行 / 双人', '城市距离：内收而从容']
    }
  };
  const tabs = [...doc.querySelectorAll('[data-stay]')];
  const detail = doc.querySelector('#stay-detail');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
    const item = stayContent[tab.dataset.stay];
    if (!detail || !item) return;
    detail.animate([{ opacity: .25, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: motionReduced ? 1 : 280, easing: 'cubic-bezier(.2,.7,.2,1)' });
    detail.innerHTML = `<p class="detail-label" data-type-surface="selector-detail-label">${item.label}</p><h3 data-type-surface="selector-detail-title">${item.title}</h3><p data-type-surface="selector-detail-body">${item.body}</p><ul data-type-surface="selector-detail-facts">${item.facts.map((fact) => `<li>${fact}</li>`).join('')}</ul>`;
    detail.focus({ preventScroll: true });
  }));

  const dialog = doc.querySelector('[data-dialog]');
  const form = doc.querySelector('[data-inquiry-form]');
  const status = doc.querySelector('[data-dialog-status]');
  doc.querySelectorAll('[data-open-dialog]').forEach((button) => button.addEventListener('click', () => {
    setMenu(false);
    if (typeof dialog?.showModal === 'function') dialog.showModal();
  }));
  doc.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '你');
    const nights = String(data.get('nights') || '2 晚');
    const stay = String(data.get('stay') || '江岸高处');
    form.hidden = true;
    status.hidden = false;
    status.innerHTML = `<strong>${name}，你的住法摘要已经生成。</strong><br>${nights} · ${stay}。这是页面内演示，不会发送或保存任何个人资料。`;
  });
  dialog?.addEventListener('close', () => {
    if (form) form.hidden = false;
    if (status) status.hidden = true;
  });

  const year = doc.querySelector('[data-year]');
  if (year) year.textContent = `© ${new Date().getFullYear()}`;
  document.fonts.ready.then(() => {
    const checks = [
      document.fonts.check("400 72px 'MaoKenWang FengYaSong'", '把上海住成一场电影'),
      document.fonts.check("400 42px 'Long Cang'", '今晚不赶路'),
      document.fonts.check("400 17px 'LXGW Neo ZhiSong'", '上海旅居')
    ];
    root.dataset.fontsReady = String(checks.every(Boolean));
  });
})();
