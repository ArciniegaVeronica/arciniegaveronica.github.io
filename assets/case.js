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
    return root.getAttribute('data-theme') === 'light';
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

  const items = [
    ...document.querySelectorAll('[data-view]')
  ];

  let cur = 0;
  let lastFocus;


  function show(i) {
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

    items.forEach((el, i) => {
      el.addEventListener(
        'click',
        () => openViewer(i)
      );
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
