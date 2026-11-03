/* Esteban Lafargue — Portfolio · tiny, dependency-free behaviour */
(() => {
  'use strict';

  /* 1. Light up nodes, pins and wires as they enter the viewport */
  const live = document.querySelectorAll('.reveal, .wire, .node');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-live');
          io.unobserve(e.target);
        }
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    live.forEach((el) => io.observe(el));
  } else {
    live.forEach((el) => el.classList.add('is-live'));
  }

  /* 2. YouTube facade: load the player only when asked (fast first paint) */
  document.querySelectorAll('.yt[data-yt]').forEach((box) => {
    const id = box.dataset.yt;
    const btn = box.querySelector('.yt__btn');
    if (!btn || !/^[\w-]{11}$/.test(id)) {
      if (btn) { btn.disabled = true; btn.querySelector('.yt__label').textContent = '[Showreel — link to come]'; }
      return;
    }
    btn.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/maxresdefault.jpg)`;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      f.title = box.dataset.title || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      box.replaceChildren(f);
    }, { once: true });
  });

  /* 3. Case-study cards: play the hover clip if one is provided */
  document.querySelectorAll('.card, .sys--main').forEach((card) => {
    const v = card.querySelector('video');
    if (!v) return;
    const play = () => { v.play().then(() => v.classList.add('is-ready')).catch(() => {}); };
    const stop = () => { v.pause(); };
    card.addEventListener('mouseenter', play);
    card.addEventListener('focus', play);
    card.addEventListener('mouseleave', stop);
    card.addEventListener('blur', stop);
  });
})();

/* 4. Step clips: play while visible, pause when off-screen; click toggles */
(() => {
  const clips = document.querySelectorAll('video.loop');
  if (!clips.length) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  clips.forEach((v) => {
    v.addEventListener('click', () => (v.paused ? v.play() : v.pause()));
    if (calm) v.controls = true;
  });
  if (calm || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }
  }, { threshold: 0.4 });
  clips.forEach((v) => io.observe(v));
})();

/* 5. Blueprint lightbox: click a graph to view it full size, click again to zoom, ← → to browse */
(() => {
  const dlg = document.querySelector('dialog.lightbox');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const stage = dlg.querySelector('.lightbox__stage');
  const img = stage.querySelector('img');
  const cap = dlg.querySelector('.lightbox__cap');
  const num = dlg.querySelector('.lightbox__n');
  let set = [], i = 0;
  const show = () => {
    const b = set[i];
    stage.classList.remove('is-zoomed');
    img.src = b.dataset.full; img.alt = b.dataset.caption; cap.textContent = b.dataset.caption;
    num.textContent = `${i + 1} / ${set.length}`;
  };
  document.querySelectorAll('.bp__thumb').forEach((b) => b.addEventListener('click', () => {
    set = [...b.closest('.bp__list').querySelectorAll('.bp__thumb')];
    i = set.indexOf(b); show(); dlg.showModal();
  }));
  const step = (d) => { i = (i + d + set.length) % set.length; show(); };
  img.addEventListener('click', (e) => {
    const r = img.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    const z = stage.classList.toggle('is-zoomed');
    if (z) { stage.scrollLeft = fx * img.naturalWidth - stage.clientWidth / 2; stage.scrollTop = fy * img.naturalHeight - stage.clientHeight / 2; }
  });
  dlg.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (a) { a.dataset.lb === 'close' ? dlg.close() : step(a.dataset.lb === 'next' ? 1 : -1); }
    else if (e.target === dlg) dlg.close();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
})();

/* 6. Exec rail: one continuous Blueprint wire in the left margin.
      Every section title (.stitle) or [data-stop] element gets a pin; the wire fills as you read. */
(() => {
  const main = document.querySelector('main.wrap');
  if (!main) return;
  document.documentElement.classList.add('has-rail');
  const rail = document.createElement('div');
  rail.className = 'rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<i class="rail__fill"></i>';
  main.prepend(rail);
  let stops = [];

  const layout = () => {
    rail.querySelectorAll('.rail__stop').forEach((n) => n.remove());
    const els = [...main.querySelectorAll('.stitle, [data-stop]')].filter((e) => e.offsetParent !== null);
    if (els.length < 2) { rail.hidden = true; return; }
    rail.hidden = false;
    const mTop = main.getBoundingClientRect().top + scrollY;
    const rLeft = rail.getBoundingClientRect().left;
    stops = els.map((el) => {
      const r = el.getBoundingClientRect();
      const anchor = el.querySelector('.stitle__tag, .node__head') || el;
      const ar = anchor.getBoundingClientRect();
      const y = ar.top + scrollY - mTop + Math.min(ar.height, 44) / 2;
      const c = getComputedStyle(anchor).getPropertyValue('--c').trim() || getComputedStyle(el).getPropertyValue('--c').trim();
      const s = document.createElement('span');
      s.className = 'rail__stop';
      s.style.top = `${y}px`;
      if (c) s.style.setProperty('--c', c);
      s.style.setProperty('--w', `${Math.max(0, r.left - rLeft - 6)}px`);
      rail.append(s);
      return { y, s };
    });
    const first = stops[0].y, last = stops[stops.length - 1].y;
    rail.style.setProperty('--top', `${first}px`);
    rail.style.setProperty('--len', `${last - first}px`);
    update();
  };

  const update = () => {
    if (!stops.length) return;
    const mTop = main.getBoundingClientRect().top + scrollY;
    const reading = scrollY + innerHeight * 0.55 - mTop;
    const first = stops[0].y, last = stops[stops.length - 1].y;
    const fill = Math.max(0, Math.min(reading, last) - first);
    rail.style.setProperty('--fill', `${fill}px`);
    stops.forEach(({ y, s }) => s.classList.toggle('is-on', y <= reading));
  };

  let raf = 0;
  addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); });
  addEventListener('load', layout);
  document.addEventListener('layout:changed', () => requestAnimationFrame(layout));
  document.querySelectorAll('details').forEach((d) => d.addEventListener('toggle', () => requestAnimationFrame(layout)));
  if ('ResizeObserver' in window) new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); }).observe(main);
  layout();
})();
