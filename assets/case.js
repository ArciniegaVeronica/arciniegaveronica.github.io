/* Verónica Arciniega — comportamiento común de los casos de estudio */
(() => {
  const root = document.documentElement;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lang = 'es';
  const T = (es, en) => (lang === 'es' ? es : en);

  /* ---------- idioma (compartido con la portada) ---------- */

  const i18n = [...document.querySelectorAll('[data-en]')];
  i18n.forEach(el => {
    el.dataset.es = el.innerHTML;
  });

  const i18nAttr = [...document.querySelectorAll('[data-en-aria]')];
  i18nAttr.forEach(el => {
    el.dataset.esAria = el.getAttribute('aria-label');
  });

  function setLang(l) {
    lang = l;
    root.lang = l;

    document.querySelectorAll('.lang button').forEach(button => {
      button.setAttribute(
        'aria-pressed',
        button.dataset.lang === l
      );
    });

    i18n.forEach(el => {
      el.innerHTML = l === 'en'
        ? el.dataset.en
        : el.dataset.es;
    });

    i18nAttr.forEach(el => {
      el.setAttribute(
        'aria-label',
        l === 'en'
          ? el.dataset.enAria
          : el.dataset.esAria
      );
    });

    buildToc();
    setThemeLabel();
  }

  document.querySelectorAll('.lang button').forEach(button => {
    button.addEventListener('click', () => {
      setLang(button.dataset.lang);

      try {
        localStorage.setItem(
          'va-lang',
          button.dataset.lang
        );
      } catch (e) {}
    });
  });


  /* ---------- tema claro / oscuro ---------- */

  const themeBtn = document.getElementById('themeBtn');
  const icon = document.getElementById('themeIcon');

  const sun =
    '<circle cx="12" cy="12" r="4.2"/>' +
    '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>';

  const moon =
    '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>';


  /* Saber directamente qué tema está activo */
  function isLight() {
    const t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t === 'light';
    return matchMedia('(prefers-color-scheme: light)').matches;
  }


  /* Actualizar icono y accesibilidad */
  function setThemeLabel() {
    if (!themeBtn || !icon) return;

    const light = isLight();

    icon.innerHTML = light ? moon : sun;

    themeBtn.setAttribute(
      'aria-label',
      light
        ? T(
            'Cambiar a modo oscuro',
            'Switch to dark mode'
          )
        : T(
            'Cambiar a modo claro',
            'Switch to light mode'
          )
    );
  }


  /* Cambiar tema */
  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      theme = 'dark';
    }

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-user-theme', '1');

    try {
      localStorage.setItem('va-theme', theme);
    } catch (e) {}

    setThemeLabel();
  }


  /* Recuperar tema guardado */
  try {
    const savedTheme = localStorage.getItem('va-theme');

    if (
      savedTheme === 'light' ||
      savedTheme === 'dark'
    ) {
      root.setAttribute('data-theme', savedTheme);
      root.setAttribute('data-user-theme', '1');
    }
  } catch (e) {}


  /* Botón de tema */
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      setTheme(
        isLight()
          ? 'dark'
          : 'light'
      );
    });
  }

  /* Actualizar icono al cargar */
  setThemeLabel();


  /* ---------- índice lateral con sección activa ---------- */

  const toc = document.getElementById('tocList');

  const secs = [
    ...document.querySelectorAll('.sec[id]')
  ];

  function buildToc() {
    if (!toc) return;

    toc.innerHTML = secs
      .map(section => {
        const heading = section.querySelector('h2');

        return `
          <li>
            <a href="#${section.id}">
              ${heading ? heading.textContent : ''}
            </a>
          </li>
        `;
      })
      .join('');
  }

  if (
    toc &&
    'IntersectionObserver' in window
  ) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          toc.querySelectorAll('a').forEach(a => {
            a.setAttribute(
              'aria-current',
              a.getAttribute('href') ===
                '#' + entry.target.id
            );
          });
        });
      },
      {
        rootMargin: '-35% 0px -60% 0px'
      }
    );

    secs.forEach(section => {
      io.observe(section);
    });
  }


  /* ---------- visor de imágenes y vídeos ---------- */

  const viewer = document.getElementById('viewer');
  const vMedia = document.getElementById('vMedia');

  const live = () => [...document.querySelectorAll('[data-view]')]
    .filter(e => e.isConnected && !e.closest('.is-empty'));
  let items = live();

  let cur = 0;
  let lastFocus;


  function show(i) {
    items = live();
    if (!vMedia || items.length === 0) return;

    cur =
      (i + items.length) %
      items.length;

    const el = items[cur];

    const src = el.dataset.view;

    const isVideo =
      /\.(mp4|webm|mov)$/i.test(src);

    vMedia.innerHTML = isVideo
      ? `
        <video
          src="${src}"
          controls
          autoplay
          playsinline
        ></video>
      `
      : `
        <img
          src="${src}"
          alt="${el.dataset.cap || ''}"
        >
      `;

    const caption =
      document.getElementById('vCap');

    const count =
      document.getElementById('vCount');

    if (caption) {
      caption.textContent =
        el.dataset.cap || '';
    }

    if (count) {
      count.textContent =
        `${cur + 1} / ${items.length}`;
    }
  }


  function openViewer(i) {
    if (!viewer) return;

    lastFocus =
      document.activeElement;

    viewer.hidden = false;

    document.body.style.overflow =
      'hidden';

    show(i);

    document
      .getElementById('vClose')
      ?.focus();
  }


  function closeViewer() {
    if (!viewer) return;

    viewer.hidden = true;

    if (vMedia) {
      vMedia.innerHTML = '';
    }

    document.body.style.overflow = '';

    if (lastFocus) {
      lastFocus.focus();
    }
  }


  if (viewer) {

    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', () => {
        items = live();
        openViewer(items.indexOf(el));
      });
    });


    document
      .getElementById('vClose')
      ?.addEventListener(
        'click',
        closeViewer
      );


    document
      .getElementById('vPrev')
      ?.addEventListener(
        'click',
        () => show(cur - 1)
      );


    document
      .getElementById('vNext')
      ?.addEventListener(
        'click',
        () => show(cur + 1)
      );


    viewer.addEventListener(
      'click',
      e => {
        if (
          e.target === viewer ||
          e.target.classList.contains('v-stage')
        ) {
          closeViewer();
        }
      }
    );


    addEventListener(
      'keydown',
      e => {
        if (viewer.hidden) return;

        if (e.key === 'Escape') {
          closeViewer();
        }

        if (e.key === 'ArrowLeft') {
          show(cur - 1);
        }

        if (e.key === 'ArrowRight') {
          show(cur + 1);
        }
      }
    );


    let sx = null;

    viewer.addEventListener(
      'touchstart',
      e => {
        sx = e.touches[0].clientX;
      },
      {
        passive: true
      }
    );


    viewer.addEventListener(
      'touchend',
      e => {
        if (sx === null) return;

        const d =
          e.changedTouches[0].clientX - sx;

        if (Math.abs(d) > 50) {
          show(
            cur +
            (d < 0 ? 1 : -1)
          );
        }

        sx = null;
      }
    );
  }


  /* ---------- sin huecos: si falta una imagen o vídeo se oculta todo su marco ---------- */

  const FRAME = '.hero-img,.piece,.shot,.media,.embed';

  function prune() {
    document.querySelectorAll('.hero-img,.piece,.shot,.media:not(:has(iframe))').forEach(f => {
      if (!f.querySelector('img,video')) f.classList.add('is-empty');
    });
    document.querySelectorAll('.screens,.board').forEach(g => {
      const none = !g.querySelector(':scope > :not(.is-empty)');
      g.classList.toggle('is-empty', none);
      const fl = g.closest('.flow');
      if (fl) fl.classList.toggle('is-empty', none);
      const t = g.previousElementSibling;
      if (t && t.classList.contains('group-t')) t.classList.toggle('is-empty', none);
    });
  }

  addEventListener('error', e => {
    const m = e.target;
    if (!m || !/^(IMG|VIDEO|SOURCE)$/.test(m.tagName)) return;
    const f = m.closest(FRAME);
    if (f) f.classList.add('is-empty');
    prune();
  }, true);

  document.querySelectorAll('img').forEach(im => {
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) {
      const f = im.closest(FRAME);
      if (f) f.classList.add('is-empty');
    }
  });
  prune();


  /* ---------- reels: reproducción al estar visibles ---------- */

  if (
    !still &&
    'IntersectionObserver' in window
  ) {
    const vio =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            const video = entry.target;

            if (entry.isIntersecting) {
              video
                .play()
                .catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        {
          threshold: 0.4
        }
      );


    document
      .querySelectorAll('.piece video')
      .forEach(video => {
        vio.observe(video);
      });
  }


  /* ---------- customer journey ---------- */

  document
    .querySelectorAll('.jx')
    .forEach(jx => {

      const sc =
        jx.querySelector('.jx-scroll');

      const btns =
        jx.querySelectorAll('.jx-btn');

      if (!sc || btns.length < 2) return;


      const step = () => {
        return (
          jx
            .querySelector('.jx-col')
            ?.getBoundingClientRect()
            .width ||
          240
        ) + 12;
      };


      const update = () => {

        const can =
          sc.scrollWidth >
          sc.clientWidth + 4;

        jx.classList.toggle(
          'scrollable',
          can
        );


        btns[0].disabled =
          sc.scrollLeft <= 2;

        btns[1].disabled =
          sc.scrollLeft +
            sc.clientWidth >=
          sc.scrollWidth - 2;
      };


      btns.forEach(button => {
        button.addEventListener(
          'click',
          () => {

            sc.scrollBy({
              left:
                step() *
                Number(button.dataset.dir),

              behavior:
                still
                  ? 'auto'
                  : 'smooth'
            });

          }
        );
      });


      sc.addEventListener(
        'scroll',
        update,
        {
          passive: true
        }
      );


      addEventListener(
        'resize',
        update
      );


      update();
    });


  /* ---------- foco de luz en tarjetas ---------- */

  document
    .querySelectorAll('.card')
    .forEach(el => {

      el.addEventListener(
        'pointermove',
        e => {

          const r =
            el.getBoundingClientRect();

          el.style.setProperty(
            '--mx',
            `${e.clientX - r.left}px`
          );

          el.style.setProperty(
            '--my',
            `${e.clientY - r.top}px`
          );

        }
      );

    });


  /* ---------- volver arriba ---------- */

  const toTop =
    document.getElementById('toTop');

  const prog =
    document.getElementById('ttProg');


  if (toTop) {

    const onScroll = () => {

      const max =
        Math.max(
          1,
          document.documentElement
            .scrollHeight -
          innerHeight
        );


      toTop.classList.toggle(
        'show',
        scrollY > innerHeight * 0.6
      );


      if (prog) {
        prog.style.strokeDashoffset =
          (
            138.2 *
            (
              1 -
              Math.min(
                1,
                scrollY / max
              )
            )
          ).toFixed(1);
      }

    };


    addEventListener(
      'scroll',
      onScroll,
      {
        passive: true
      }
    );


    onScroll();


    toTop.addEventListener(
      'click',
      e => {

        e.preventDefault();

        scrollTo({
          top: 0,
          behavior:
            still
              ? 'auto'
              : 'smooth'
        });

      }
    );

  }



  /* ---------- manuales PDF: se abren como un libro que se hojea ---------- */

  const LIB = {
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    flip: 'https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js'
  };

  const loadScript = src => new Promise((ok, ko) => {
    if (document.querySelector('script[data-lib="' + src + '"]')) return ok();
    const sc = document.createElement('script');
    sc.src = src; sc.dataset.lib = src; sc.onload = ok; sc.onerror = ko;
    document.head.appendChild(sc);
  });

  const pdfLinks = [...document.querySelectorAll('a.file[href$=".pdf"]')];

  if (pdfLinks.length) {
    const bookEl = document.createElement('div');
    bookEl.className = 'viewer book';
    bookEl.hidden = true;
    bookEl.setAttribute('role', 'dialog');
    bookEl.setAttribute('aria-modal', 'true');
    bookEl.innerHTML =
      '<div class="v-top"><b id="bkTitle"></b><div class="bk-tools">' +
      '<a class="ghost bk-open" id="bkOpen" target="_blank" rel="noopener"></a>' +
      '<button class="v-btn" type="button" id="bkClose"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div></div>' +
      '<div class="v-stage"><button class="v-btn" type="button" id="bkPrev"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 3 5 8l5 5"/></svg></button>' +
      '<div class="bk-area" id="bkArea"><p class="bk-msg" id="bkMsg"></p><div class="bk-flip" id="bkFlip"></div></div>' +
      '<button class="v-btn" type="button" id="bkNext"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 3l5 5-5 5"/></svg></button></div>' +
      '<p class="v-count" id="bkCount"></p>';
    document.body.appendChild(bookEl);

    const $ = id => document.getElementById(id);
    let flipper = null, token = 0, bookFocus;

    function setLabels() {
      $('bkClose').setAttribute('aria-label', T('Cerrar', 'Close'));
      $('bkPrev').setAttribute('aria-label', T('Página anterior', 'Previous page'));
      $('bkNext').setAttribute('aria-label', T('Página siguiente', 'Next page'));
      $('bkOpen').textContent = T('Abrir PDF', 'Open PDF');
    }

    function closeBook() {
      token++;
      if (flipper) { try { flipper.destroy(); } catch (e) {} flipper = null; }
      $('bkFlip').innerHTML = '';
      bookEl.hidden = true;
      document.body.style.overflow = '';
      removeEventListener('keydown', bookKeys);
      if (bookFocus) bookFocus.focus();
    }

    function bookKeys(e) {
      if (e.key === 'Escape') closeBook();
      if (flipper && e.key === 'ArrowLeft') flipper.flipPrev();
      if (flipper && e.key === 'ArrowRight') flipper.flipNext();
    }

    async function openBook(href, title) {
      const my = ++token;
      bookFocus = document.activeElement;
      setLabels();
      $('bkTitle').textContent = title;
      $('bkOpen').href = href;
      $('bkCount').textContent = '';
      $('bkFlip').innerHTML = '';
      $('bkMsg').hidden = false;
      $('bkMsg').textContent = T('Preparando el manual…', 'Preparing the manual…');
      bookEl.hidden = false;
      document.body.style.overflow = 'hidden';
      addEventListener('keydown', bookKeys);
      $('bkClose').focus();

      try {
        await Promise.all([loadScript(LIB.pdf), loadScript(LIB.flip)]);
        if (my !== token) return;
        pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.worker;
        const doc = await pdfjsLib.getDocument(href).promise;
        if (my !== token) return;

        const first = await doc.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        const ratio = vp.width / vp.height;

        /* tamaño de cada página: cabe siempre entera, con margen, y el libro queda centrado */
        const area = $('bkArea').getBoundingClientRect();
        const wide = area.width > 760;
        const maxW = (wide ? area.width / 2 : area.width) * .94;
        const ph = Math.floor(Math.min(area.height * .86, maxW / ratio));
        const pw = Math.floor(ph * ratio);
        const total = doc.numPages;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        /* las páginas se dibujan solo cuando se acercan: así un manual largo abre al instante */
        const pages = [], done = new Set();
        for (let n = 0; n < total; n++) {
          const holder = document.createElement('div');
          holder.className = 'bk-page';
          pages.push(holder);
        }
        async function paint(i) {
          if (i < 0 || i >= total || done.has(i)) return;
          done.add(i);
          const page = await doc.getPage(i + 1);
          if (my !== token) return;
          const v = page.getViewport({ scale: (pw * dpr) / page.getViewport({ scale: 1 }).width });
          const cv = document.createElement('canvas');
          cv.width = Math.floor(v.width); cv.height = Math.floor(v.height);
          await page.render({ canvasContext: cv.getContext('2d'), viewport: v }).promise;
          if (my === token) pages[i].appendChild(cv);
        }
        const near = c => { for (let k = c - 3; k <= c + 5; k++) paint(k); };
        near(0);
        await paint(0);
        if (my !== token) return;

        $('bkMsg').hidden = true;
        flipper = new St.PageFlip($('bkFlip'), {
          width: pw, height: ph, size: 'fixed', showCover: true, usePortrait: !wide,
          drawShadow: true, maxShadowOpacity: .35, flippingTime: still ? 1 : 800,
          mobileScrollSupport: false, useMouseEvents: true
        });
        flipper.loadFromHTML(pages);

        /* portada y contraportada están solas: se desplaza el libro para que siempre quede centrado */
        const holderEl = $('bkFlip');
        const upd = () => {
          const c = flipper.getCurrentPageIndex();
          $('bkCount').textContent = (c + 1) + ' / ' + total;
          let dx = 0;
          if (wide) { if (c === 0) dx = -pw / 2; else if (c >= total - 1 && total % 2 === 0) dx = pw / 2; }
          holderEl.style.transform = 'translateX(' + dx + 'px)';
          near(c);
        };
        /* primera colocación sin animar: el libro nace ya centrado */
        holderEl.style.transition = 'none';
        upd();
        void holderEl.offsetWidth;
        holderEl.style.transition = still ? 'none' : 'transform .6s cubic-bezier(.2,.8,.2,1)';
        flipper.on('flip', upd);
      } catch (err) {
        /* si algo falla (sin conexión, PDF no encontrado…), se abre el PDF normal */
        if (my === token) { closeBook(); window.open(href, '_blank', 'noopener'); }
      }
    }

    $('bkClose').addEventListener('click', closeBook);
    $('bkPrev').addEventListener('click', () => flipper && flipper.flipPrev());
    $('bkNext').addEventListener('click', () => flipper && flipper.flipNext());
    bookEl.addEventListener('click', e => { if (e.target === bookEl || e.target.classList.contains('v-stage')) closeBook(); });

    pdfLinks.forEach(a => a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      const b = a.querySelector('b');
      openBook(a.getAttribute('href'), b ? b.textContent : '');
    }));
  }


  /* ---------- idioma guardado ---------- */

  let saved = 'es';

  try {
    saved =
      localStorage.getItem('va-lang') ||
      'es';
  } catch (e) {}


  if (
    saved !== 'es' &&
    saved !== 'en'
  ) {
    saved = 'es';
  }


  setLang(saved);


  /* ---------- finalizar carga ---------- */

  root.classList.remove(
    'i18n-wait'
  );

})();
