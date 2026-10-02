/* Daniel Wang portfolio: interactions
   - GSAP (ScrollTrigger, SplitText) + Lenis smooth scroll on one ticker
   - line-by-line text reveals, layered parallax, pinned carrier showcase
   - theme toggle (persisted)
   - hero word split for staggered entrance
   - scroll reveal (IntersectionObserver)
   - nav hide on scroll down / show on scroll up, active link tracking
   - magnetic buttons (pointer devices only)
   - spotlight border cards (pointer devices only)
   - ESP32 gallery switcher (home)
   - lightbox for [data-gallery] groups (project pages)
   - copy email with state morph
   - mobile menu
*/
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- GSAP (vendored): ScrollTrigger + SplitText ---------- */
  const G = window.gsap && window.ScrollTrigger ? window.gsap : null;
  const ST = G ? window.ScrollTrigger : null;
  if (G) {
    G.registerPlugin(ST);
    if (window.SplitText) G.registerPlugin(window.SplitText);
    root.classList.add('has-gsap');
  }

  /* ---------- Lenis smooth scroll (skipped for reduced motion), driven by GSAP's ticker ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion.matches) {
    lenis = new window.Lenis({
      autoRaf: !G,
      lerp: 0.11,
      anchors: true,
      stopInertiaOnNavigate: true,
      prevent: (node) => !!(node.closest && node.closest('.lb, [data-lenis-prevent]')),
    });
    if (G) {
      lenis.on('scroll', ST.update);
      G.ticker.add((t) => lenis.raf(t * 1000));
      G.ticker.lagSmoothing(0);
    }
    window.__lenis = lenis;
  }

  /* ---------- theme ---------- */
  const toggles = [...document.querySelectorAll('[data-theme-toggle]')];
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => {
    const t = root.getAttribute('data-theme');
    return t ? t === 'dark' : systemDark.matches;
  };
  const paintToggle = () => {
    body.classList.toggle('theme-dark', isDark());
    toggles.forEach((t) => t.setAttribute('aria-pressed', String(isDark())));
  };
  paintToggle();
  systemDark.addEventListener('change', paintToggle);
  toggles.forEach((t) => t.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paintToggle();
  }));

  /* ---------- image fade-in ---------- */
  const markLoaded = (img) => img.classList.add('is-loaded');
  const allImages = [...document.querySelectorAll('img')];
  allImages.forEach((img) => {
    if (img.complete) markLoaded(img);
    else {
      img.addEventListener('load', () => markLoaded(img), { once: true });
      img.addEventListener('error', () => markLoaded(img), { once: true });
    }
  });
  // safety net: nothing stays invisible if an event is missed
  setTimeout(() => allImages.forEach((img) => { if (img.complete) markLoaded(img); }), 1500);
  window.addEventListener('load', () => allImages.forEach(markLoaded));

  /* ---------- hero word split ---------- */
  const title = document.getElementById('hero-title');
  if (title) {
    const words = title.textContent.trim().split(/\s+/);
    title.textContent = '';
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      title.appendChild(outer);
      if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- preload: start fetching images two screens early ---------- */
  const lazyImgs = [...document.querySelectorAll('img[loading="lazy"]')];
  if (lazyImgs.length && 'IntersectionObserver' in window) {
    const warm = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.loading = 'eager';
        warm.unobserve(en.target);
      });
    }, { rootMargin: '200% 0px 200% 0px' });
    lazyImgs.forEach((img) => warm.observe(img));
  }

  /* ---------- line-by-line text reveals (SplitText) ---------- */
  const LINES = '.section__title, .contact__title, .contact__sub, .about__statement, .about__body p, .lab__intro, .timeline__intro, .showcase__title, .showcase__desc, .project--featured .project__title, .project--featured .project__desc, .page__title, .page__summary, .prose > h2, .prose > p, .dossier__title, .dossier__intro p, .dossier__note, .walk__step h2, .walk__step p, .notfound__title, .notfound__sub';
  // anything that now animates line by line drops the block fade, and so do the wrappers around it
  document.querySelectorAll(LINES + ', .about__body, .walk__step').forEach((el) => el.removeAttribute('data-reveal'));
  if (G && window.SplitText && !reduceMotion.matches) {
    document.querySelectorAll(LINES).forEach((el) => {
      window.SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit(self) {
          G.set(el, { opacity: 1 });
          return G.from(self.lines, {
            yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: 0.08,
            force3D: false, clearProps: 'transform',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
    });
  } else {
    root.classList.remove('lines-on');
  }

  /* ---------- layered parallax: images scale into their frames, containers drift ---------- */
  const IMG_IN = '.gallery__stage, .project__media, .strip__item a, .walk__fig a, .page__hero, .masonry a';
  document.querySelectorAll(IMG_IN).forEach((el) => el.setAttribute('data-img-in', ''));
  // drift media only: moving text sits between pixels and shimmers
  [['.project--featured .gallery', 0.95]]
    .forEach(([sel, sp]) => document.querySelectorAll(sel).forEach((el) => { if (!el.dataset.speed) el.dataset.speed = sp; }));
  if (G) {
    const mm = G.matchMedia();
    mm.add({ desk: '(min-width: 768px)', still: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      if (ctx.conditions.still) return;
      document.querySelectorAll('[data-img-in]').forEach((el) => {
        const imgs = el.querySelectorAll('img');
        if (!imgs.length) return;
        G.fromTo(imgs, { scale: 1.18 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 45%', scrub: true },
        });
      });
      if (!ctx.conditions.desk) return;
      document.querySelectorAll('[data-speed]').forEach((el) => {
        const amt = ((parseFloat(el.dataset.speed) || 1) - 1) * 400;
        G.fromTo(el, { y: amt }, {
          y: -amt, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });

    /* ---------- dark carrier showcase: pinned on desktop, frames wipe in sequence ---------- */
    const show = document.querySelector('.showcase');
    if (show) {
      const frames = [...show.querySelectorAll('.showcase__frame')];
      const caps = frames.map((f) => (f.querySelector('figcaption') || {}).textContent || '');
      const countEl = show.querySelector('.showcase__count');
      const capEl = show.querySelector('.showcase__cap');
      const barEl = show.querySelector('.showcase__bar i');
      let cur = 0;
      const setIdx = (i) => {
        if (i === cur) return;
        cur = i;
        countEl.textContent = `[ ${i + 1} / ${frames.length} ]`;
        capEl.textContent = caps[i];
        G.fromTo(capEl, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
      };
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const rest = frames.slice(1);
        G.set(rest, { clipPath: 'inset(100% 0% 0% 0%)' });
        G.set(rest.map((f) => f.querySelector('img')), { scale: 1.12 });
        const tl = G.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: show.querySelector('.showcase__pin'), start: 'top top', end: '+=105%',
            pin: true, scrub: 0.5, anticipatePin: 1,
            onUpdate(self) {
              barEl.style.transform = `scaleX(${self.progress.toFixed(4)})`;
              setIdx(self.progress < 0.25 ? 0 : self.progress < 0.75 ? 1 : 2);
            },
          },
        });
        tl.to({}, { duration: 0.15 });
        rest.forEach((f, i) => {
          tl.to(f, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 })
            .to(f.querySelector('img'), { scale: 1, duration: 1 }, '<');
          if (i < rest.length - 1) tl.to({}, { duration: 0.3 });
        });
        tl.to({}, { duration: 0.15 });
        return () => { cur = 0; countEl.textContent = `[ 1 / ${frames.length} ]`; capEl.textContent = caps[0]; };
      });
      // nav takes the dark scheme while the band sits under it
      // nav, side rail, and scroll readout take the dark scheme while the band sits under them
      let fadeTimer = null;
      const darkUi = (on) => {
        root.classList.add('ui-fading');
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => root.classList.remove('ui-fading'), 700);
        document.querySelectorAll('#nav, .rail, .hud').forEach((el) => el.classList.toggle('is-on-dark', on));
      };
      ST.create({ trigger: show, start: 'top top+=68', end: 'bottom top+=68', onToggle: (self) => darkUi(self.isActive) });
    }

    window.addEventListener('load', () => ST.refresh());
  }

  /* ---------- figures count up when they scroll in ---------- */
  const counters = [...document.querySelectorAll('[data-count]')];
  if (G && counters.length && !reduceMotion.matches) {
    counters.forEach((el, i) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      const fmt = (n) => Math.round(n).toLocaleString('en-US');
      const state = { v: 0 };
      el.textContent = fmt(0);
      G.to(state, {
        v: end, duration: 1.6, ease: 'expo.out', delay: i * 0.06,
        onUpdate: () => { el.textContent = fmt(state.v); },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal], .img-reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- nav: hide/show + active section ---------- */
  const nav = document.getElementById('nav');
  const rail = document.getElementById('rail');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    if (!nav.classList.contains('menu-open')) {
      const goingDown = y > lastY && y > 120;
      const goingUp = y < lastY - 4;
      if (goingDown) nav.classList.add('is-hidden');
      else if (goingUp) nav.classList.remove('is-hidden');
      // the rail stays out once you are past the top of the page
      if (rail) rail.classList.toggle('is-visible', y > 120);
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = navLinks
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && h.startsWith('#'))
    .map((h) => document.querySelector(h))
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- project page table of contents ---------- */
  const tocLinks = [...document.querySelectorAll('[data-toc]')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const heads = tocLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const tocSpy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        tocLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    heads.forEach((h) => tocSpy.observe(h));
    tocLinks[0].classList.add('is-active');
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = document.getElementById('menu-toggle');
  const closeMenu = () => {
    nav.classList.remove('menu-open');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) nav.classList.remove('is-hidden');
    });
  }
  navLinks.forEach((a) => a.addEventListener('click', closeMenu));

  /* ---------- magnetic buttons ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      let raf = null;
      let tx = 0, ty = 0;
      let cx = 0, cy = 0;
      const strength = 0.28;
      const tick = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(tick);
        else { raf = null; if (tx === 0 && ty === 0) el.style.transform = ''; }
      };
      const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * strength;
        ty = (e.clientY - (r.top + r.height / 2)) * strength;
        start();
      });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; start(); });
    });
  }

  /* ---------- spotlight border cards ---------- */
  if (finePointer.matches) {
    document.querySelectorAll('.card-spot').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- home gallery switcher ---------- */
  const gallery = document.getElementById('esp32-gallery');
  if (gallery) {
    const slides = gallery.querySelectorAll('[data-slide]');
    const thumbs = gallery.querySelectorAll('[data-thumb]');
    const show = (idx) => {
      slides.forEach((s) => s.classList.toggle('is-active', s.dataset.slide === idx));
      thumbs.forEach((t) => {
        const on = t.dataset.thumb === idx;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
    };
    thumbs.forEach((t) => t.addEventListener('click', () => show(t.dataset.thumb)));
    gallery.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const list = [...thumbs];
      const cur = list.findIndex((t) => t.classList.contains('is-active'));
      const next = (cur + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
      list[next].focus();
      show(list[next].dataset.thumb);
    });
  }

  /* ---------- draggable strips with arrows ---------- */
  document.querySelectorAll('[data-drag]').forEach((strip) => {
    const wrap = strip.closest('.strip-wrap') || strip.parentElement;
    const items = [...strip.querySelectorAll('.strip__item')];
    const prev = wrap.querySelector('[data-prev]');
    const next = wrap.querySelector('[data-next]');
    const count = wrap.querySelector('.strip__count');
    if (!items.length) return;

    const itemStep = () => items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap || 0);
    const index = () => Math.round(strip.scrollLeft / itemStep());
    const paint = () => {
      const i = Math.min(index(), items.length - 1);
      if (count) count.textContent = `${i + 1} / ${items.length}`;
      if (prev) prev.disabled = strip.scrollLeft <= 2;
      if (next) next.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
    };
    const go = (d) => strip.scrollBy({ left: d * itemStep(), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    strip.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
    window.addEventListener('resize', paint);
    paint();

    // mouse drag to scroll (touch already scrolls natively)
    let down = false, startX = 0, startLeft = 0, moved = false;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft;
    });
    strip.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; strip.classList.add('is-dragging'); try { strip.setPointerCapture(e.pointerId); } catch (err) {} }
      if (moved) strip.scrollLeft = startLeft - dx;
    });
    const end = (e) => {
      if (!down) return;
      down = false;
      if (moved) {
        // settle to the nearest item, then re-enable snapping
        const target = index() * itemStep();
        strip.scrollTo({ left: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        setTimeout(() => strip.classList.remove('is-dragging'), 320);
      }
    };
    strip.addEventListener('pointerup', end);
    strip.addEventListener('pointercancel', end);
    // a drag must not open the lightbox
    strip.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------- lightbox ---------- */
  const groups = document.querySelectorAll('[data-gallery]');
  if (groups.length) {
    const dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.innerHTML = `
      <button class="lb__close icon-btn" type="button" aria-label="Close">
        <svg class="icon"><use href="${iconPath()}#i-x"/></svg>
      </button>
      <button class="lb__nav lb__nav--prev icon-btn" type="button" aria-label="Previous image">
        <svg class="icon"><use href="${iconPath()}#i-caret-left"/></svg>
      </button>
      <figure class="lb__figure">
        <img class="lb__img" alt="" />
        <figcaption class="lb__caption"></figcaption>
      </figure>
      <button class="lb__nav lb__nav--next icon-btn" type="button" aria-label="Next image">
        <svg class="icon"><use href="${iconPath()}#i-caret-right"/></svg>
      </button>
      <p class="lb__count" aria-live="polite"></p>`;
    body.appendChild(dlg);

    const img = dlg.querySelector('.lb__img');
    img.classList.add('is-loaded'); // created after the page-load fade pass
    const cap = dlg.querySelector('.lb__caption');
    const count = dlg.querySelector('.lb__count');
    let items = [];
    let idx = 0;

    const render = (dir) => {
      const it = items[idx];
      img.classList.add('is-switching');
      const swap = () => {
        img.src = it.href;
        img.alt = it.alt;
        cap.textContent = it.caption;
        count.textContent = `${idx + 1} / ${items.length}`;
        img.onload = () => img.classList.remove('is-switching');
      };
      if (dir === 0 || reduceMotion.matches) swap();
      else setTimeout(swap, 120);
    };
    const open = (group, i) => {
      items = [...group.querySelectorAll('[data-lb]')].map((a) => ({
        href: a.getAttribute('href'),
        alt: a.querySelector('img')?.alt || '',
        caption: a.dataset.caption || '',
      }));
      idx = i;
      render(0);
      dlg.showModal();
      body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    };
    const close = () => { dlg.close(); };
    const step = (d) => { idx = (idx + d + items.length) % items.length; render(d); };

    dlg.addEventListener('close', () => { body.style.overflow = ''; if (lenis) lenis.start(); });
    dlg.querySelector('.lb__close').addEventListener('click', close);
    dlg.querySelector('.lb__nav--prev').addEventListener('click', () => step(-1));
    dlg.querySelector('.lb__nav--next').addEventListener('click', () => step(1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
    // swipe
    let sx = 0;
    dlg.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    dlg.addEventListener('pointerup', (e) => {
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
    });

    groups.forEach((group) => {
      group.querySelectorAll('[data-lb]').forEach((a, i) => {
        a.addEventListener('click', (e) => { e.preventDefault(); open(group, i); });
      });
    });
  }

  function iconPath() {
    const use = document.querySelector('use[href*="icons.svg"]');
    return use ? use.getAttribute('href').split('#')[0] : 'assets/icons.svg';
  }

  /* ---------- copy email ---------- */
  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    let timer = null;
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = email; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        body.removeChild(ta);
      }
      copyBtn.classList.add('is-copied');
      copyBtn.setAttribute('aria-label', 'Email address copied');
      clearTimeout(timer);
      timer = setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        copyBtn.removeAttribute('aria-label');
      }, 1800);
    });
  }

  /* ---------- mailto fallback: if no mail app takes the click, copy the address instead ---------- */
  document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    const label = a.querySelector('span:last-child') || a;
    const original = label.textContent;
    let timer = null;
    const cancel = () => { clearTimeout(timer); timer = null; };
    a.addEventListener('click', () => {
      cancel();
      timer = setTimeout(async () => {
        // still here and still visible: nothing handled the mailto
        if (document.visibilityState !== 'visible') return;
        const email = a.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
        try { await navigator.clipboard.writeText(email); } catch (e) { return; }
        label.textContent = 'No mail app. Address copied';
        a.classList.add('is-copied');
        setTimeout(() => { label.textContent = original; a.classList.remove('is-copied'); }, 2400);
      }, 1200);
    });
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') cancel(); });
  });

  /* ---------- escape closes menu ---------- */
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- 1. page transitions: name the media that morphs between pages ---------- */
  const nativeVT = 'PageSwapEvent' in window;
  if (!nativeVT) root.classList.add('no-vt');
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('is-leaving'); });
  if (!nativeVT && !reduceMotion.matches) {
    // fallback: fade the page out before navigating, fade the next one in on load
    document.querySelectorAll('a[href]').forEach((a) => {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || a.target === '_blank' || a.hasAttribute('download')) return;
      if (url.pathname === location.pathname && url.hash) return; // in-page anchors
      a.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const media = (a.closest('.project') || a).querySelector('.gallery__stage, .project__media, .project__panel, .project__stat');
        if (media) media.classList.add('vt-leaving');
        root.classList.add('is-leaving');
        setTimeout(() => { location.href = a.href; }, 250);
      });
    });
  }
  const mediaFor = (link) => {
    const card = link.closest('.project') || link;
    if (link.matches('.showcase__stage')) return link.querySelector('.showcase__frame');
    return card.querySelector('.gallery__stage, .project__media, .project__panel, .project__stat') || (link.matches('.gallery__link') ? link.querySelector('.gallery__stage') : null);
  };
  const projectLinks = [...document.querySelectorAll('a[href*="projects/"]')];
  window.addEventListener('pageswap', (e) => {
    if (!e.viewTransition || !e.activation) return;
    const to = e.activation.entry?.url;
    const link = projectLinks.find((a) => a.href === to);
    const el = link && mediaFor(link);
    if (el) el.style.viewTransitionName = 'project-media';
  });
  window.addEventListener('pagereveal', (e) => {
    if (!e.viewTransition || !window.navigation?.activation?.from) return;
    const from = navigation.activation.from.url;
    const link = projectLinks.find((a) => a.href === from);
    const el = link && mediaFor(link);
    if (el) {
      el.style.viewTransitionName = 'project-media';
      e.viewTransition.finished.finally(() => { el.style.viewTransitionName = ''; });
    }
  });

  /* ---------- pill that rises from the bottom of hovered media ---------- */
  if (finePointer.matches) {
    const iconBase = iconPath();
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      const host = el.querySelector('.gallery__stage') || el;
      const pill = document.createElement('span');
      pill.className = 'media-pill'; pill.setAttribute('aria-hidden', 'true');
      pill.innerHTML = `<span>${el.dataset.cursor}</span><svg class="icon"><use href="${iconBase}#i-${el.dataset.cursor === 'Enlarge' ? 'magnifying-glass-plus' : 'arrow-right'}"/></svg>`;
      host.appendChild(pill);
    });
  }

  /* ---------- 2. colour tone follows the section in view ---------- */
  const toned = [...document.querySelectorAll('[data-tone]')];
  if (toned.length && 'IntersectionObserver' in window) {
    let toneTimer = null;
    const setTone = (tone) => {
      if (body.dataset.tone === tone) return;
      root.classList.add('is-toning');
      if (tone) body.dataset.tone = tone; else delete body.dataset.tone;
      clearTimeout(toneTimer);
      toneTimer = setTimeout(() => root.classList.remove('is-toning'), 760);
    };
    // a section owns the tone while it covers the middle of the viewport
    const toneSpy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setTone(entry.target.dataset.tone);
        else if (body.dataset.tone === entry.target.dataset.tone) {
          // left the middle band: fall back to the default tone
          setTone('');
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    toned.forEach((s) => toneSpy.observe(s));
  }

  /* ---------- 3. hero depth field: orbs and the portrait shift with cursor and scroll ---------- */
  const heroEl = document.querySelector('.hero');
  const depthEls = heroEl ? [...heroEl.querySelectorAll('[data-depth]')] : [];
  const tiltEl = heroEl ? heroEl.querySelector('[data-tilt]') : null;
  if (heroEl && depthEls.length && !reduceMotion.matches) {
    let mx = 0, my = 0, tx = 0, ty = 0, sy = 0, raf = null, inView = true;
    const apply = () => {
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      depthEls.forEach((el) => {
        const d = parseFloat(el.dataset.depth) || 0;
        const x = mx * d * 600, y = my * d * 600 + sy * d * 4;
        el.style.transform = el === tiltEl
          ? `translate3d(${x}px, ${y}px, 0) rotateX(${-my * 6}deg) rotateY(${mx * 8}deg)`
          : `translate3d(${x}px, ${y}px, 0)`;
      });
      if (inView && (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001)) raf = requestAnimationFrame(apply); else raf = null;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(apply); };
    if (finePointer.matches) {
      heroEl.addEventListener('pointermove', (e) => {
        const r = heroEl.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
        if (tiltEl) tiltEl.classList.add('is-tilting');
        kick();
      });
      heroEl.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (tiltEl) tiltEl.classList.remove('is-tilting'); kick(); });
    }
    window.addEventListener('scroll', () => { sy = Math.min(window.scrollY, 900); kick(); }, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) kick(); }).observe(heroEl);
  }

  /* ---------- footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  /* ---------- hero crosshair with a millimetre readout ---------- */
  const xhHost = document.querySelector('.hero');
  if (xhHost && finePointer.matches) {
    const xh = document.createElement('div');
    xh.className = 'xh'; xh.setAttribute('aria-hidden', 'true');
    xh.innerHTML = '<span class="xh__v"></span><span class="xh__h"></span><span class="xh__label"></span>';
    xhHost.insertBefore(xh, xhHost.querySelector('.hero__grid'));
    const v = xh.querySelector('.xh__v'), h = xh.querySelector('.xh__h'), label = xh.querySelector('.xh__label');
    const PX_PER_MM = 96 / 25.4;
    const k = reduceMotion.matches ? 1 : 0.3;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null, on = false;
    const mm = (n) => (n / PX_PER_MM).toFixed(1).padStart(5, '0');
    const draw = () => {
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      v.style.transform = `translate3d(${cx.toFixed(1)}px, 0, 0)`;
      h.style.transform = `translate3d(0, ${cy.toFixed(1)}px, 0)`;
      const w = xhHost.clientWidth;
      const lx = cx + 150 > w ? cx - 142 : cx + 12;
      label.style.transform = `translate3d(${lx.toFixed(1)}px, ${(cy + 12).toFixed(1)}px, 0)`;
      label.textContent = `X ${mm(cx)}  Y ${mm(cy)} mm`;
      if (on && (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3)) raf = requestAnimationFrame(draw); else raf = null;
    };
    xhHost.addEventListener('pointermove', (e) => {
      const r = xhHost.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on) { on = true; cx = tx; cy = ty; xh.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(draw);
    });
    xhHost.addEventListener('pointerleave', () => { on = false; xh.classList.remove('is-on'); });
  }

  /* ---------- scroll HUD: progress plus the section in view ---------- */
  {
    const hud = document.createElement('div');
    hud.className = 'hud'; hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<span class="hud__pct">000%</span><span class="hud__bar"><i></i></span><span class="hud__label"></span>';
    body.appendChild(hud);
    const pct = hud.querySelector('.hud__pct'), bar = hud.querySelector('.hud__bar i'), lab = hud.querySelector('.hud__label');
    let marks = [...document.querySelectorAll('[data-hud]')].map((el) => ({ el, name: el.dataset.hud }));
    if (!marks.length) {
      const first = { el: document.querySelector('main'), name: (document.querySelector('h1') || {}).textContent || 'Page' };
      marks = [first, ...[...document.querySelectorAll('.prose h2, .walk__step h2, .dossier__title, .page__gallery .section__title')]
        .map((el) => ({ el, name: el.getAttribute('aria-label') || el.textContent }))];
    }
    marks.forEach((m) => { m.name = m.name.trim().split(/\s+/).slice(0, 3).join(' '); });
    const foot = document.querySelector('.footer');
    let queued = false;
    const update = () => {
      queued = false;
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, y / max));
      pct.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      const line = window.innerHeight * 0.45;
      let current = marks[0];
      for (const m of marks) if (m.el.getBoundingClientRect().top <= line) current = m;
      if (current && lab.textContent !== current.name) lab.textContent = current.name;
      // step aside once the curtain footer starts to show
      const footH = foot ? foot.offsetHeight : 0;
      hud.classList.toggle('is-on', y > 120 && y < max - footH * 0.6);
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }
})();
