/* Daniel Wang portfolio: interactions
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

  /* ---------- about statement: words spread from centre, converge on scroll ---------- */
  const statement = document.getElementById('about-statement');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    const centre = (words.length - 1) / 2;
    statement.textContent = '';
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      // distance from the centre word, scaled down so the outer words travel further
      span.style.setProperty('--d', ((i - centre) / 4).toFixed(2));
      statement.appendChild(span);
      if (i < words.length - 1) statement.appendChild(document.createTextNode(' '));
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
    };
    const close = () => { dlg.close(); };
    const step = (d) => { idx = (idx + d + items.length) % items.length; render(d); };

    dlg.addEventListener('close', () => { body.style.overflow = ''; });
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

  /* ---------- 3. hero dot field ---------- */
  const heroCanvas = document.querySelector('.hero__bg');
  if (heroCanvas && heroCanvas.getContext) {
    const ctx = heroCanvas.getContext('2d');
    const hero = heroCanvas.parentElement;
    const gap = 26, radius = 220, pull = 16;
    let dots = [], w = 0, h = 0, dpr = 1;
    let px = -9999, py = -9999, t = 0, raf = null, visible = true;
    const color = () => {
      const c = getComputedStyle(body).color; // current --fg
      return c.replace('rgb(', 'rgba(').replace(')', ', 0.14)');
    };
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      heroCanvas.width = Math.round(w * dpr); heroCanvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) dots.push({ x, y, ox: x, oy: y });
      draw(true);
    };
    const draw = (still) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color();
      const anim = !still && !reduceMotion.matches;
      for (const d of dots) {
        let tx = d.ox, ty = d.oy, r = 1.3;
        if (anim) {
          // slow drift so the field never sits perfectly still
          tx += Math.sin(t * 0.0007 + d.oy * 0.02) * 1.6;
          ty += Math.cos(t * 0.0006 + d.ox * 0.02) * 1.6;
          const dx = px - d.ox, dy = py - d.oy, dist = Math.hypot(dx, dy);
          if (dist < radius) {
            const k = (1 - dist / radius);
            const f = k * k * pull;
            tx += (dx / (dist || 1)) * f; ty += (dy / (dist || 1)) * f;
            r += k * 1.4;
          }
        }
        d.x += (tx - d.x) * 0.12; d.y += (ty - d.y) * 0.12;
        ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
      }
    };
    const loop = (now) => { t = now; if (visible) draw(false); raf = requestAnimationFrame(loop); };
    size();
    window.addEventListener('resize', size);
    if (!reduceMotion.matches) {
      if (finePointer.matches) {
        hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
        hero.addEventListener('pointerleave', () => { px = -9999; py = -9999; });
      }
      if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
      raf = requestAnimationFrame(loop);
    }
  }

  /* ---------- 4. scroll storyboard ---------- */
  document.querySelectorAll('.story').forEach((story) => {
    const slides = [...story.querySelectorAll('.story__slide')];
    const steps = [...story.querySelectorAll('.story__step')];
    const cap = story.querySelector('.story__cap');
    const count = story.querySelector('.story__count');
    const bar = story.querySelector('.story__progress i');
    if (!slides.length || !steps.length) return;
    const show = (i) => {
      slides.forEach((s, j) => s.classList.toggle('is-active', j === i));
      steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      if (cap) cap.textContent = slides[i].dataset.caption || '';
      if (count) count.textContent = `${i + 1} / ${slides.length}`;
      if (bar) bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    };
    show(0);
    if (!('IntersectionObserver' in window)) return;
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) show(steps.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach((st) => spy.observe(st));
  });

  /* ---------- footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
