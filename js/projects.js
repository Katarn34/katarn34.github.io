/* Projects: reads data/projects.json and renders cards.
   <div data-projects="featured" data-base=""></div>      → featured cards (home)
   <div data-projects="all" data-base="../"></div>        → filters + year timeline (projects page) */
(() => {
  'use strict';
  const hosts = document.querySelectorAll('[data-projects]');
  if (!hosts.length) return;

  const FRL = document.documentElement.lang === 'fr';
  const CTA_FR = {
    'case-study': 'Lire l’étude de cas ▷',
    video: 'Voir la vidéo ↗',
    external: 'Jouer sur itch.io ↗',
    nda: 'Sous NDA · voir Expériences ▷',
    devlog: 'Lire le devlog ▷',
    info: 'Projet de stage',
    soon: 'Étude de cas bientôt',
    wip: 'En cours'
  };
  const L = (p, k) => (FRL && p.fr && p.fr[k] != null ? p.fr[k] : p[k]);
  const CL = (c) => (FRL && c.label_fr ? c.label_fr : c.label);
  const CTA = {
    'case-study': 'Read case study ▷',
    video: 'Watch the video ↗',
    external: 'Play on itch.io ↗',
    nda: 'Under NDA · see Experience ▷',
    devlog: 'Read the devlog ▷',
    info: 'Internship project',
    soon: 'Case study coming soon',
    wip: 'In progress'
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const abs = (u, base) => (!u || /^(https?:|#|mailto:)/.test(u) ? u : base + u);

  function card(p, cats, base, linkBase) {
    const cat = cats[p.category] || { label: p.category, color: '--c-projects' };
    const ctaMap = FRL ? CTA_FR : CTA;
    const linked = p.url && !['soon', 'wip', 'info'].includes(p.status);
    const tag = linked ? 'a' : 'div';
    const href = linked ? ` href="${esc(abs(p.url, linkBase))}"` : '';
    const ext = linked && /^https?:/.test(p.url) ? ' target="_blank" rel="noopener"' : '';
    const media = p.thumb
      ? `<img src="${esc(abs(p.thumb, base))}" alt="" loading="lazy">${p.hover ? `<video muted loop playsinline preload="none" src="${esc(abs(p.hover, base))}"></video>` : ''}`
      : `<span class="card__ph card__ph--${esc(p.status)}">${p.status === 'nda' ? (FRL ? 'NDA · sans visuels' : 'NDA · no visuals') : esc(CL(cat))}</span>`;
    return `<${tag} class="node card reveal${linked ? '' : ' card--soon'}" style="--c:var(${cat.color})"${href}${ext}>
      <div class="node__head"><span class="node__icon" aria-hidden="true">ƒ</span>${esc(L(p, 'title'))}<span class="meta">${esc(L(p, 'period'))}</span></div>
      <div class="card__media">${media}</div>
      <div class="card__body">
        <div class="card__cat"><span class="chip" style="--c:var(${cat.color})">${esc(CL(cat))}</span><span class="card__team">${esc(L(p, 'team'))}</span></div>
        <p class="card__pitch">${esc(L(p, 'pitch'))}</p>
        <p class="card__role">${esc(L(p, 'role'))}</p>
        <span class="card__cta">${ctaMap[p.status] || ''}</span>
      </div>
    </${tag}>`;
  }

  /* Bento card (home): one-line hook + proof metric, no role line */
  function bento(p, cats, base, linkBase, i) {
    const cat = cats[p.category] || { label: p.category, color: '--c-projects' };
    const linked = p.url && !['soon', 'wip', 'info'].includes(p.status);
    const tag = linked ? 'a' : 'div';
    const href = linked ? ` href="${esc(abs(p.url, linkBase))}"` : '';
    const media = p.thumb
      ? `<img src="${esc(abs(p.thumb, base))}" alt="" loading="lazy">${p.hover ? `<video muted loop playsinline preload="none" src="${esc(abs(p.hover, base))}"></video>` : ''}`
      : `<span class="card__ph card__ph--${esc(p.status)}">${esc(L(p, 'title'))}</span>`;
    return `<${tag} class="node card bento__item bento__item--${i} reveal" style="--c:var(${cat.color})"${href}>
      <div class="node__head"><span class="node__icon" aria-hidden="true">ƒ</span>${esc(L(p, 'title'))}<span class="meta">${esc(CL(cat))} · ${esc(L(p, 'period'))}</span></div>
      <div class="card__media">${media}</div>
      <div class="card__body">
        <p class="bento__hook">${esc(L(p, 'hook') || L(p, 'pitch'))}</p>
        ${p.metric ? `<p class="bento__metric">${esc(L(p, 'metric'))}</p>` : ''}
        <span class="card__cta">${(FRL ? CTA_FR : CTA)[p.status] || ''}</span>
      </div>
    </${tag}>`;
  }

  function wireHover(root) {
    root.querySelectorAll('.card').forEach((c) => {
      const v = c.querySelector('video');
      if (!v) return;
      const play = () => v.play().then(() => v.classList.add('is-ready')).catch(() => {});
      c.addEventListener('mouseenter', play); c.addEventListener('focus', play);
      c.addEventListener('mouseleave', () => v.pause()); c.addEventListener('blur', () => v.pause());
    });
    root.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-live'));
  }

  hosts.forEach(async (host) => {
    const base = host.dataset.base || '';
    const linkBase = host.dataset.linkBase ?? base; // page links stay inside the current language
    let data;
    try { data = await (await fetch(base + 'data/projects.json')).json(); } catch { return; }
    const cats = data.categories;
    const list = [...data.projects].sort((a, b) => b.date.localeCompare(a.date));

    if (host.dataset.projects === 'featured') {
      const feat = list.filter((p) => p.featured).sort((a, b) => a.featured - b.featured);
      host.innerHTML = host.dataset.layout === 'bento'
        ? `<div class="bento">${feat.map((p, i) => bento(p, cats, base, linkBase, i + 1)).join('')}</div>`
        : `<div class="cards">${feat.map((p) => card(p, cats, base, linkBase)).join('')}</div>`;
      const n = document.querySelector('[data-projects-count]');
      if (n) n.textContent = list.length;
      wireHover(host);
      return;
    }

    /* All projects: filters + grouped by year */
    const counts = list.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
    const keys = Object.keys(cats).filter((k) => counts[k]);
    host.innerHTML = `
      <div class="filters" role="group" aria-label="${FRL ? 'Filtrer les projets' : 'Filter projects'}">
        <button type="button" class="filter" aria-pressed="true" data-f="all">${FRL ? 'Tous' : 'All'} <span>${list.length}</span></button>
        ${keys.map((k) => `<button type="button" class="filter" aria-pressed="false" data-f="${k}" style="--c:var(${cats[k].color})">${esc(CL(cats[k]))} <span>${counts[k]}</span></button>`).join('')}
      </div>
      <div class="timeline" aria-live="polite"></div>`;
    const tl = host.querySelector('.timeline');
    const render = (f) => {
      const items = list.filter((p) => f === 'all' || p.category === f);
      const years = [...new Set(items.map((p) => p.date.slice(0, 4)))];
      tl.innerHTML = years.map((y) => `
        <section class="year" aria-label="${y}">
          <h2 class="year__label stitle" style="--c:var(--ac)"><span class="stitle__tag">${y}</span><span class="stitle__rule"></span></h2>
          <div class="cards">${items.filter((p) => p.date.startsWith(y)).map((p) => card(p, cats, base, linkBase)).join('')}</div>
        </section>`).join('');
      wireHover(tl);
      document.dispatchEvent(new CustomEvent('layout:changed'));
    };
    host.querySelectorAll('.filter').forEach((b) => b.addEventListener('click', () => {
      host.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render(b.dataset.f);
      try { history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname : `#${b.dataset.f}`); } catch {}
    }));
    const start = location.hash.slice(1);
    const btn = host.querySelector(`.filter[data-f="${CSS.escape(start)}"]`);
    if (btn) btn.click(); else render('all');
  });
})();
