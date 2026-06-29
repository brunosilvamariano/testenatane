/* ============================================================
   MAIN.JS — Interatividade Principal
   v3.0 — Refatorado: bugs corrigidos, código morto removido
   ============================================================ */

'use strict';

/* ==================================================
   UTILITÁRIOS
   ================================================== */

const qs  = (sel, parent = document) => parent.querySelector(sel);
const qsa = (sel, parent = document) => parent.querySelectorAll(sel);


/* ==================================================
   HEADER — Scroll + Menu Drawer Lateral
   ================================================== */

(function initHeader() {

  const header      = qs('#header');
  const menuTrigger = qs('#menuTrigger');
  const navScrim    = qs('#navScrim');
  const navOverlay  = qs('#navOverlay');
  const navLinks    = qsa('.nav-overlay__link');
  const menuLabel   = menuTrigger ? qs('.header__menu-label', menuTrigger) : null;

  if (!menuTrigger || !navOverlay) return;

  let isMenuOpen = false;

  function toggleMenu(open) {
    isMenuOpen = open;
    menuTrigger.setAttribute('aria-expanded', String(open));
    navOverlay.classList.toggle('open', open);
    if (navScrim) navScrim.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    if (menuLabel) menuLabel.textContent = open ? 'FECHAR' : 'MENU';

    if (open) {
      const firstLink = qs('.nav-overlay__link', navOverlay);
      if (firstLink) setTimeout(() => firstLink.focus(), 80);
    } else {
      menuTrigger.focus();
    }
  }

  menuTrigger.addEventListener('click', () => toggleMenu(!isMenuOpen));

  if (navScrim) {
    navScrim.addEventListener('click', () => toggleMenu(false));
  }

  navLinks.forEach(link => link.addEventListener('click', () => toggleMenu(false)));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isMenuOpen) toggleMenu(false);
  });

  /* Trap focus dentro do drawer */
  navOverlay.addEventListener('keydown', e => {
    if (!isMenuOpen || e.key !== 'Tab') return;

    const focusableEls = [
      ...qsa('a, button, [tabindex]:not([tabindex="-1"])', navOverlay),
    ].filter(el => !el.disabled);

    if (!focusableEls.length) return;

    const first = focusableEls[0];
    const last  = focusableEls[focusableEls.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

}());


/* ==================================================
   SMOOTH SCROLL — Âncoras internas
   ================================================== */

(function initSmoothScroll() {

  document.addEventListener('click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

}());


/* ==================================================
   ACTIVE NAV — Destaca link da seção visível
   ================================================== */

(function initActiveNav() {

  const sections   = qsa('section[id]');
  const navAnchors = qsa('.nav-overlay__nav .nav-overlay__link');

  if (!sections.length || !navAnchors.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(anchor => {
        anchor.classList.toggle(
          'nav-overlay__link--active',
          anchor.getAttribute('href') === `#${id}`
        );
      });
    });
  }, { rootMargin: '-20% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s));

}());


/* ==================================================
   FAQ — Accordion Acessível
   ================================================== */

(function initFaq() {

  const faqItems = qsa('.faq__item');

  function closeAll() {
    faqItems.forEach(item => {
      item.classList.remove('active');
      const trigger = qs('.faq__trigger', item);
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  faqItems.forEach(item => {
    const trigger = qs('.faq__trigger', item);
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      closeAll();
      if (!wasActive) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

}());


/* ==================================================
   GALERIA — Filmstrip Editorial + Lightbox (própria, sem libs)
   ================================================== */

(function initGallery() {

  const viewport = qs('.gallery__viewport');
  const cards    = qsa('.gallery__card');
  const header   = qs('.gallery__header');
  if (!viewport || !cards.length) return;

  const cardsArr = Array.from(cards);

  /* --- Reveal de entrada (stagger automático) --- */
  const revealTargets = header ? [header, ...cardsArr] : cardsArr;
  const reduceMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || typeof IntersectionObserver === 'undefined') {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const i = cardsArr.indexOf(entry.target);
        const delay = i > -1 ? Math.min(i, 5) * 80 : 0;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(el => revealObserver.observe(el));
  }

  /* --- Arraste com mouse no desktop (touch já tem scroll nativo) --- */
  let isDragging   = false;
  let dragMoved     = false;
  let dragStartX    = 0;
  let dragStartLeft = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    isDragging   = true;
    dragMoved    = false;
    dragStartX    = e.clientX;
    dragStartLeft = viewport.scrollLeft;
    viewport.classList.add('is-dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 4) dragMoved = true;
    viewport.scrollLeft = dragStartLeft - dx;
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    viewport.classList.remove('is-dragging');
  });

  /* --- Lightbox --- */
  const lightbox = qs('#galleryLightbox');
  if (!lightbox) return;

  const lbImg   = qs('.lightbox__img', lightbox);
  const lbIndex = qs('.lightbox__index', lightbox);
  const lbText  = qs('.lightbox__text', lightbox);
  const lbClose = qs('[data-gallery-close]', lightbox);
  const triggers = qsa('.gallery__trigger');

  let currentIndex = 0;
  let lastFocused  = null;

  function updateLightbox() {
    const trigger = triggers[currentIndex];
    if (!trigger) return;
    const card = trigger.closest('.gallery__card');
    const img  = qs('img', trigger);

    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbText.textContent  = card.querySelector('.gallery__caption-text')?.textContent || '';
    lbIndex.textContent = card.querySelector('.gallery__index')?.textContent || '';
  }

  function openLightbox(index) {
    if (dragMoved) return; // evita abrir o lightbox depois de um arraste
    currentIndex = index;
    updateLightbox();
    lastFocused = document.activeElement;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lbClose?.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lastFocused?.focus();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    updateLightbox();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % triggers.length;
    updateLightbox();
  }

  triggers.forEach((trigger, i) => {
    trigger.addEventListener('click', () => openLightbox(i));
  });

  lbClose?.addEventListener('click', closeLightbox);
  qs('[data-gallery-prev]', lightbox)?.addEventListener('click', showPrev);
  qs('[data-gallery-next]', lightbox)?.addEventListener('click', showNext);

  // Clique no fundo (fora da figura) fecha
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

}());


/* ==================================================
   PARALLAX CAROUSEL — Carrossel infinito
   ================================================== */

(function initParallaxCarousel() {

  const carousel = qs('#parallaxCarousel');
  const track    = qs('#parallaxTrack');

  if (!carousel || !track) return;

  /* Duplica cards para loop contínuo */
  Array.from(track.children).forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  function ajustarDistancia() {
    const metade = track.scrollWidth / 2;
    track.style.setProperty('--scroll-distance', `-${metade}px`);
    const duracao = metade / 40; /* 40px/s */
    track.style.animationDuration = `${duracao}s`;
  }

  ajustarDistancia();

  /* Recalcula após imagens carregarem */
  const imgs = track.querySelectorAll('img');
  let carregadas = 0;
  const total = imgs.length;

  imgs.forEach(img => {
    if (img.complete) {
      carregadas++;
      if (carregadas === total) ajustarDistancia();
    } else {
      img.addEventListener('load', () => {
        carregadas++;
        if (carregadas === total) ajustarDistancia();
      }, { once: true });
    }
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(ajustarDistancia, 200);
  }, { passive: true });

}());


/* ==================================================
   ABOUT SLIDER — Expansível
   ================================================== */

(function initAboutSlider() {

  const slides = qsa('.about__slide');
  if (!slides.length) return;

  slides.forEach(slide => {
    slide.addEventListener('click', () => {
      slides.forEach(s => s.classList.remove('about__slide--active'));
      slide.classList.add('about__slide--active');
    });
  });

}());


/* ==================================================
   AOS — Animações de Entrada por Scroll
   ================================================== */

(function initAos() {
  if (typeof AOS === 'undefined') return;

  AOS.init({
    once:     true,
    offset:   60,
    duration: 680,
    easing:   'ease-out-cubic',
  });
}());


/* ==================================================
   HERO TYPEWRITER — Palavras alternadas em loop
   ================================================== */

(function initHeroTypewriter() {

  const el = qs('#typed-word');
  if (!el) return;

  const words          = ['compreendida', 'acolhida'];
  const typeSpeed      = 80;
  const deleteSpeed    = 50;
  const pauseAfterType = 1800;
  const pauseAfterDel  = 400;

  let wordIndex  = 0;
  let charIndex  = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      el.textContent = currentWord.slice(0, charIndex + 1);
      charIndex++;

      if (charIndex === currentWord.length) {
        isDeleting = true;
        setTimeout(type, pauseAfterType);
        return;
      }
    } else {
      el.textContent = currentWord.slice(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        wordIndex  = (wordIndex + 1) % words.length;
        setTimeout(type, pauseAfterDel);
        return;
      }
    }

    setTimeout(type, isDeleting ? deleteSpeed : typeSpeed);
  }

  type();

}());


/* ==================================================
   HERO STATS — Contagem animada
   ================================================== */

(function initStatsCounter() {

  const statNums = qsa('.hero__stat-num[data-count]');
  if (!statNums.length) return;

  const duration = 2000;

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const start  = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(ease * target);

      el.textContent = prefix + current + suffix;

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  statNums.forEach(el => observer.observe(el));

}());