const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/QDLKV46CAQ';

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* header */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger?.addEventListener('click', () => {
    const o = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', o);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
  }));

  /* hero title: words in masks */
  const title = $('[data-split]');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  }

  /* phone mask (ник Telegram оставляем) */
  $$('input[type="tel"]').forEach(input => input.addEventListener('input', e => {
    const raw = e.target.value;
    if (/[a-zA-Zа-яА-Я@]/.test(raw)) return;
    let v = raw.replace(/\D/g, '');
    if (!v) { e.target.value = ''; return; }
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let out = '+7';
    if (v.length > 1) out += ' (' + v.slice(1, 4);
    if (v.length >= 4) out += ') ' + v.slice(4, 7);
    if (v.length >= 7) out += '-' + v.slice(7, 9);
    if (v.length >= 9) out += '-' + v.slice(9, 11);
    e.target.value = out;
  }));

  /* smooth anchors */
  const fmtSelect = $('#fmtSelect'), reqSelect = $('#reqSelect');
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href'); if (href.length <= 1) return;
    const t = $(href); if (!t) return;
    if (a.dataset.req !== undefined && reqSelect) reqSelect.selectedIndex = +a.dataset.req;
    if (a.dataset.fmt && fmtSelect) {
      let f = a.dataset.fmt;
      if (f === 'calc') { const n = +$('#nRange').value; f = n === 1 ? 'first' : n < 10 ? 'short' : 'long'; }
      fmtSelect.value = f;
    }
    e.preventDefault();
    const top = t.getBoundingClientRect().top + scrollY - 64;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* counters */
  $$('[data-target]').forEach(el => {
    const target = +el.dataset.target;
    if (reduce) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now();
      const tick = t => { const p = clamp((t - t0) / 1400); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
      el.textContent = 0; requestAnimationFrame(tick);
    }), { threshold: .5 });
    io.observe(el);
  });

  /* ---------- HERO ORBIT: точка ходит по кругу, за ней след ---------- */
  const odot = $('#odot'), trail = $('#trail');
  if (odot) {
    const NS = 'http://www.w3.org/2000/svg', ghosts = [];
    for (let i = 0; i < 9; i++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 12 - i * .9); c.setAttribute('fill', '#E0572A'); c.setAttribute('fill-opacity', (.5 - i * .05).toFixed(2));
      trail.appendChild(c); ghosts.push(c);
    }
    let ang = -Math.PI / 2, last = performance.now(), vis = true;
    new IntersectionObserver(es => vis = es[0].isIntersecting).observe($('#orbit'));
    const place = a => {
      odot.setAttribute('cx', 300 + 222 * Math.cos(a)); odot.setAttribute('cy', 300 + 222 * Math.sin(a));
      ghosts.forEach((g, i) => { const b = a - (i + 1) * .09; g.setAttribute('cx', 300 + 222 * Math.cos(b)); g.setAttribute('cy', 300 + 222 * Math.sin(b)); });
    };
    place(ang);
    if (!reduce) {
      const loop = now => { const dt = now - last; last = now; if (vis) { ang += dt * .0011; place(ang); } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- SCENE: круг → путь, ведёт скролл ---------- */
  const scene = $('#scene');
  if (scene) {
    const fut = $('#pFuture'), walk = $('#pWalked'), dot = $('#dotMain'), halo = $('#dotHalo');
    const lab = $('#coilLab'), endT = $('#coilEnd'), bar = $('#bar'), steps = $$('.step', scene);
    const N = 3, PHI = 2 * Math.PI * (N + 1), M = 420, R = 150, CX = 400, CY = 330;
    const pt = (phi, p) => {
      const a = phi - Math.PI / 2, u = phi / PHI;
      return [CX + R * Math.cos(a) * (1 - p) + p * (-330 + 660 * u), CY + R * Math.sin(a) * (1 - p) + p * (210 - 420 * u)];
    };
    const build = (p, from, to) => {
      const n = Math.max(2, Math.ceil(M * (to - from) / PHI)); let d = '';
      for (let i = 0; i <= n; i++) { const [x, y] = pt(from + (to - from) * i / n, p); d += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }
      return d;
    };
    let p = 0, tau = 0, lastP = -1, lastTau = -1, vis = true, t0 = performance.now(), cur = 0;
    const progress = () => {
      const r = scene.getBoundingClientRect(), h = r.height - innerHeight;
      if (h <= 0) return 0;
      return clamp(-r.top / h);
    };
    const draw = () => {
      const raw = progress();
      p = clamp((raw - .03) / .9);
      if (p > 0.001) tau = tau; // заморожена фаза
      const phi = p > 0.001 ? tau + p * (PHI - tau) : tau;
      if (p !== lastP || (p <= .001 && Math.abs(tau - lastTau) > 0)) {
        walk.setAttribute('d', build(p, Math.max(0, phi - (p <= .001 ? 2.2 : phi)), phi));
        fut.setAttribute('d', build(p, phi, PHI));
        lastP = p; lastTau = tau;
      }
      const [x, y] = pt(phi, p);
      dot.setAttribute('cx', x); dot.setAttribute('cy', y); halo.setAttribute('cx', x); halo.setAttribute('cy', y);
      halo.setAttribute('r', 22 + 6 * Math.sin(performance.now() / 280));
      lab.style.opacity = 1 - clamp(p / .12);
      endT.style.opacity = clamp((p - .86) / .1);
      bar.style.transform = `scaleX(${raw})`;
      const idx = raw < .22 ? 0 : raw < .5 ? 1 : raw < .78 ? 2 : 3;
      if (idx !== cur) { steps[cur]?.classList.remove('is-on'); steps[idx]?.classList.add('is-on'); cur = idx; }
    };
    new IntersectionObserver(es => vis = es[0].isIntersecting).observe(scene);
    let prev = performance.now();
    const loop = now => {
      const dt = now - prev; prev = now;
      if (vis) {
        const raw = progress();
        if (raw < .03 && !reduce) { tau = (tau + dt * .0013) % (2 * Math.PI); }
        draw();
      }
      requestAnimationFrame(loop);
    };
    draw(); requestAnimationFrame(loop);
  }

  /* ---------- MANIFEST: слова загораются по скроллу ---------- */
  const mf = $('#manifest');
  if (mf) {
    const words = mf.textContent.trim().split(/\s+/);
    mf.setAttribute('aria-label', words.join(' '));
    mf.innerHTML = words.map(w => `<span class="mw" aria-hidden="true">${w}</span>`).join(' ');
    const ws = $$('.mw', mf);
    const upd = () => {
      const r = mf.getBoundingClientRect();
      const k = clamp((innerHeight * .92 - r.top) / (innerHeight * .55 + r.height));
      const n = Math.round(k * ws.length * 1.15);
      ws.forEach((w, i) => w.classList.toggle('on', reduce || i < n));
    };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- EGO diagram ---------- */
  const egoSvg = $('#egoSvg');
  if (egoSvg) {
    $$('#egoSvg ~ *, .egoPill [data-state]').length;
    $$('.egoPill [data-state]').forEach(b => b.addEventListener('click', () => egoSvg.dataset.state = b.dataset.state));
    egoSvg.dataset.state = 'now';
    const set = k => k ? egoSvg.setAttribute('data-hl', k) : egoSvg.removeAttribute('data-hl');
    $$('#voices li').forEach(li => {
      li.addEventListener('mouseenter', () => { set(li.dataset.e); li.classList.add('hl'); });
      li.addEventListener('mouseleave', () => { set(''); li.classList.remove('hl'); });
    });
    $$('#egoSvg .e').forEach(g => {
      g.addEventListener('mouseenter', () => { set(g.dataset.e); $(`#voices li[data-e="${g.dataset.e}"]`)?.classList.add('hl'); });
      g.addEventListener('mouseleave', () => { set(''); $$('#voices li').forEach(l => l.classList.remove('hl')); });
    });
  }

  /* ---------- FEARS tabs ---------- */
  const tabs = $$('#fearTabs button'), panels = $$('#fearPanels .fp');
  const pick = i => {
    tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i); });
    panels.forEach((p, k) => p.classList.toggle('is-on', k === i));
    tabs[i]?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  };
  tabs.forEach((t, i) => t.addEventListener('click', () => pick(i)));
  $('#fearTabs')?.addEventListener('keydown', e => {
    const i = tabs.findIndex(t => t.classList.contains('is-on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); pick((i + 1) % tabs.length); tabs[(i + 1) % tabs.length].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); const j = (i - 1 + tabs.length) % tabs.length; pick(j); tabs[j].focus(); }
  });

  /* ---------- PRICE tabs ---------- */
  $$('.pricePill [data-p]').forEach(b => b.addEventListener('click', () => {
    $$('.pane').forEach(p => p.classList.toggle('is-on', p.dataset.pane === b.dataset.p));
  }));

  /* ---------- CALC ---------- */
  const rng = $('#nRange');
  if (rng) {
    const out = $('#nOut'), word = $('#nWord'), kind = $('#tKind'), tn = $('#tN'), sum = $('#tSum');
    const fmt = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
    const plural = n => (n % 10 === 1 && n % 100 !== 11) ? 'встреча' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'встречи' : 'встреч';
    const name = n => n === 1 ? 'Первая встреча' : n === 2 ? 'Знакомство и первые шаги' : n <= 5 ? 'Краткосрочная терапия' : n < 10 ? 'Средний курс' : 'Долговременная терапия';
    let shown = 30000, anim = 0;
    const tween = to => {
      cancelAnimationFrame(anim);
      const from = shown, t0 = performance.now();
      const tick = t => {
        const k = reduce ? 1 : clamp((t - t0) / 420), e = 1 - Math.pow(1 - k, 3);
        shown = Math.round(from + (to - from) * e); sum.textContent = fmt(shown);
        if (k < 1) anim = requestAnimationFrame(tick);
      };
      anim = requestAnimationFrame(tick);
    };
    const upd = () => {
      const n = +rng.value;
      out.textContent = n; word.textContent = plural(n); kind.textContent = name(n); tn.textContent = n;
      tween(n * 6000);
      $$('.calc__presets button').forEach(b => b.classList.toggle('is-on', (+b.dataset.n === 1 && n === 1) || (+b.dataset.n === 4 && n >= 3 && n <= 5) || (+b.dataset.n === 10 && n >= 10)));
      rng.style.setProperty('--v', (n - 1) / 14);
    };
    rng.addEventListener('input', upd);
    $$('.calc__presets button').forEach(b => b.addEventListener('click', () => { rng.value = b.dataset.n; upd(); }));
    upd();
  }

  /* ---------- PROCESS line ---------- */
  const proc = $('#proc');
  if (proc) {
    const lis = $$('li', proc);
    const upd = () => {
      const r = proc.getBoundingClientRect();
      const k = clamp((innerHeight * .75 - r.top) / (r.height + innerHeight * .1));
      proc.style.setProperty('--pw', (k * 100).toFixed(1) + '%');
      lis.forEach((li, i) => li.classList.toggle('on', reduce || k > (i + .15) / lis.length));
    };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- FORM → Worker → Telegram ---------- */
  const form = $('#leadForm'), note = $('#formNote');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]'), label = btn.firstElementChild || btn, orig = label.textContent;
    const fd = new FormData(form), payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и телефон или Telegram'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    payload.format = fmtSelect.options[fmtSelect.selectedIndex].textContent;
    btn.disabled = true; label.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Я свяжусь с вами и предложу время.';
      form.reset();
    } catch (err) {
      console.error(err);
      label.textContent = 'Не отправилось';
      note.textContent = 'Не получилось отправить. Попробуйте ещё раз или напишите в Telegram.';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
