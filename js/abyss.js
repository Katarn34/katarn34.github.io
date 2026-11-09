/* Project Abyss devlog: renders the roadmap and the entries from data/abyss.json */
(() => {
  'use strict';
  const road = document.querySelector('[data-abyss-roadmap]');
  const log = document.querySelector('[data-abyss-devlog]');
  if (!road && !log) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FRL = document.documentElement.lang === 'fr';
  const T = FRL ? { tasks: 'tâches terminées', plan: 'du plan', all: 'tous les jalons', done: 'Terminé', last: 'dernière mise à jour', isDone: ' (terminée)' }
                : { tasks: 'tasks done', plan: 'of the plan', all: 'all milestones', done: 'Done', last: 'last update', isDone: ' (done)' };
  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString(FRL ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  fetch(((road || log).dataset.base || (road && road.dataset.base) || '../') + 'data/abyss.json').then((r) => r.json()).then((data) => {
    const MN = (m) => (FRL && data.milestone_names_fr && data.milestone_names_fr[m.id]) || m.name;
    const ms = data.milestones || [];
    const all = ms.flatMap((m) => m.tasks);
    const done = all.filter((t) => t.done).length;
    if (road) {
      const pct = all.length ? Math.round((done / all.length) * 100) : 0;
      const current = ms.find((m) => m.tasks.some((t) => !t.done));
      road.innerHTML = `
        <div class="road__sum">
          <div><b>${done} / ${all.length}</b><span>${T.tasks}</span></div>
          <div><b>${pct}%</b><span>${T.plan}</span></div>
          <div><b>${current ? esc(current.id) : T.done}</b><span>${current ? esc(MN(current)) : T.all}</span></div>
          <div><b>${data.synced ? fmt(data.synced) : '—'}</b><span>${T.last}</span></div>
        </div>
        <ol class="road__list">${ms.map((m) => {
          const d = m.tasks.filter((t) => t.done).length, n = m.tasks.length;
          const state = d === n ? 'done' : (m === current ? 'now' : 'next');
          return `<li class="road__m road__m--${state}">
            <details>
              <summary><span class="road__id">${esc(m.id)}</span><span class="road__name">${esc(MN(m))}</span>
                <span class="road__bar" aria-hidden="true"><i style="width:${n ? (d / n) * 100 : 0}%"></i></span>
                <span class="road__n">${d}/${n}</span></summary>
              <ul>${m.tasks.map((t) => `<li class="${t.done ? 'is-done' : ''}"><span aria-hidden="true">${t.done ? '☑' : '☐'}</span> ${esc(t.id)} · ${esc(t.title)}<span class="sr-only">${t.done ? T.isDone : ''}</span></li>`).join('')}</ul>
            </details>
          </li>`;
        }).join('')}</ol>`;
    }
    if (log) {
      log.innerHTML = (data.devlog || []).map((e0) => { const e = FRL && e0.fr ? { ...e0, ...e0.fr } : e0; return `
        <article class="node entry reveal is-live" style="--c:var(--ac)">
          <div class="node__head"><span class="node__icon" aria-hidden="true">✎</span>${esc(e.title)}<span class="meta">${fmt(e.date)}</span></div>
          <div class="node__body">
            ${(e.tags || []).length ? `<div class="card__tags">${e.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
            ${(e.text || []).map((p) => `<p>${esc(p)}</p>`).join('')}
            ${e.video ? `<video class="entry__media" controls preload="none" playsinline ${e.poster ? `poster="../${esc(e.poster)}"` : ''}><source src="../${esc(e.video)}" type="video/mp4"></video>` : ''}
            ${(e.images || []).map((i) => `<figure class="entry__fig"><img src="../${esc(i.src)}" alt="${esc(i.alt || '')}" loading="lazy"><figcaption>${esc(i.caption || '')}</figcaption></figure>`).join('')}
          </div>
        </article>`; }).join('');
    }
    document.dispatchEvent(new CustomEvent('layout:changed'));
  }).catch(() => {});
})();
