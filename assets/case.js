/* Verónica Arciniega — comportamiento común de los casos de estudio */
(() => {
  const root = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lang = 'es';
  const T = (es, en) => (lang === 'es' ? es : en);

  /* ---------- idioma (compartido con la portada) ---------- */
  const i18n = [...document.querySelectorAll('[data-en]')];
  i18n.forEach(el => (el.dataset.es = el.innerHTML));
  const i18nAttr = [...document.querySelectorAll('[data-en-aria]')];
  i18nAttr.forEach(el => (el.dataset.esAria = el.getAttribute('aria-label')));
  function setLang(l) {
    lang = l; root.lang = l;
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
    i18n.forEach(el => (el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.es));
    i18nAttr.forEach(el => el.setAttribute('aria-label', l === 'en' ? el.dataset.enAria : el.dataset.esAria));
    buildToc(); setThemeLabel();
  }
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => {
    setLang(b.dataset.lang);
    try { localStorage.setItem('va-lang', b.dataset.lang); } catch (e) {}
  }));

  /* ---------- tema (compartido con la portada) ---------- */
  const themeBtn = document.getElementById('themeBtn'), icon = document.getElementById('themeIcon');
  const sun = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';
  const moon = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';
  const isLight = () => getComputedStyle(root).colorScheme.includes('light');
  function setThemeLabel() {
    if (!themeBtn) return;
    const l = isLight();
    icon.innerHTML = l ? moon : sun;
    themeBtn.setAttribute('aria-label', l ? T('Cambiar a modo oscuro', 'Switch to dark mode') : T('Cambiar a modo claro', 'Switch to light mode'));
  }
  themeBtn && themeBtn.addEventListener('click', () => {
    root.dataset.theme = isLight() ? 'dark' : 'light'; root.dataset.userTheme = '1';
    try { localStorage.setItem('va-theme', root.dataset.theme); } catch (e) {}
    setThemeLabel();
  });
  new MutationObserver(setThemeLabel).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  try { const t = localStorage.getItem('va-theme'); if (t) { root.dataset.theme = t; root.dataset.userTheme = '1'; } } catch (e) {}

  /* ---------- índice lateral con sección activa ---------- */
  const toc = document.getElementById('tocList');
  const secs = [...document.querySelectorAll('.sec[id]')];
  function buildToc() {
    if (!toc) return;
    toc.innerHTML = secs.map(s => `<li><a href="#${s.id}">${s.querySelector('h2').textContent}</a></li>`).join('');
  }
  if (toc && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      toc.querySelectorAll('a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-35% 0px -60% 0px' });
    secs.forEach(s => io.observe(s));
  }

  /* ---------- visor de imágenes y vídeos ---------- */
  const viewer = document.getElementById('viewer'), vMedia = document.getElementById('vMedia');
  const items = [...document.querySelectorAll('[data-view]')];
  let cur = 0, lastFocus;
  function show(i) {
    cur = (i + items.length) % items.length;
    const el = items[cur], src = el.dataset.view, isVideo = /\.(mp4|webm|mov)$/i.test(src);
    vMedia.innerHTML = isVideo ? `<video src="${src}" controls autoplay playsinline></video>` : `<img src="${src}" alt="${el.dataset.cap || ''}">`;
    document.getElementById('vCap').textContent = el.dataset.cap || '';
    document.getElementById('vCount').textContent = `${cur + 1} / ${items.length}`;
  }
  function open(i) { lastFocus = document.activeElement; viewer.hidden = false; document.body.style.overflow = 'hidden'; show(i); document.getElementById('vClose').focus(); }
  function close() { viewer.hidden = true; vMedia.innerHTML = ''; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  if (viewer) {
    items.forEach((el, i) => el.addEventListener('click', () => open(i)));
    document.getElementById('vClose').addEventListener('click', close);
    document.getElementById('vPrev').addEventListener('click', () => show(cur - 1));
    document.getElementById('vNext').addEventListener('click', () => show(cur + 1));
    viewer.addEventListener('click', e => { if (e.target === viewer || e.target.classList.contains('v-stage')) close(); });
    addEventListener('keydown', e => {
      if (viewer.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    let sx = null;
    viewer.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
    viewer.addEventListener('touchend', e => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------- reels: se reproducen sin sonido solo cuando se ven ---------- */
  if (!still && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }), { threshold: .4 });
    document.querySelectorAll('.piece video').forEach(v => vio.observe(v));
  }

  /* ---------- customer journey: botones y desplazamiento ---------- */
  document.querySelectorAll('.jx').forEach(jx => {
    const sc = jx.querySelector('.jx-scroll'), btns = jx.querySelectorAll('.jx-btn');
    const step = () => (jx.querySelector('.jx-col')?.getBoundingClientRect().width || 240) + 12;
    const update = () => {
      const can = sc.scrollWidth > sc.clientWidth + 4;
      jx.classList.toggle('scrollable', can);
      btns[0].disabled = sc.scrollLeft <= 2;
      btns[1].disabled = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2;
    };
    btns.forEach(b => b.addEventListener('click', () => sc.scrollBy({ left: step() * +b.dataset.dir, behavior: still ? 'auto' : 'smooth' })));
    sc.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  });

  /* ---------- foco de luz en tarjetas ---------- */
  document.querySelectorAll('.card').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* ---------- volver arriba ---------- */
  const toTop = document.getElementById('toTop'), prog = document.getElementById('ttProg');
  if (toTop) {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      toTop.classList.toggle('show', scrollY > innerHeight * .6);
      prog.style.strokeDashoffset = (138.2 * (1 - Math.min(1, scrollY / max))).toFixed(1);
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    toTop.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' }); });
  }

  let saved = 'es';
  try { saved = localStorage.getItem('va-lang') || 'es'; } catch (e) {}
  setLang(saved);
  root.classList.remove('i18n-wait');
})();
