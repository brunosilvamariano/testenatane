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
   GALLERY — Lightbox
   ================================================== */

(function initGallery() {

  const masonry    = document.getElementById('galleryMasonry');
  const modal      = document.getElementById('galleryModal');
  const modalImg   = document.getElementById('galleryModalImg');
  const modalClose = document.getElementById('galleryModalClose');

  if (!masonry || !modal) return;

  const cells = masonry.querySelectorAll('.g-cell');

  function openModal(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt || '';
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  cells.forEach(cell => {
    cell.addEventListener('click', () => openModal(cell.dataset.src, cell.dataset.alt));
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(cell.dataset.src, cell.dataset.alt); }
    });
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

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
   HERO TYPEWRITER — Palavras alternadas em loop
   ================================================== */

(function initHeroTypewriter() {

  const el = qs('#typed-word');
  if (!el) return;

  const words          = ['acolhida'];
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

/* ==================================================
   PAIN — Assistente de triagem em formato de chat
   ================================================== */
(function initPainBot() {

  const bot     = qs('#painBot');
  const thread  = qs('#painBotThread');
  const form    = qs('#painBotForm');
  const input   = qs('#painBotInput');
  const stepsEl = qs('#painBotSteps');

  if (!bot || !thread || !form || !input) return;

  const WHATSAPP_NUMBER = '5547996240418';
  const MIN_IDADE = 0;
  const MAX_IDADE = 17;

  const SIGN_OPTIONS = [
    'Mudança de comportamento',
    'Dificuldade na escola',
    'Medos ou ansiedade',
    'Choro frequente',
    'Isolamento',
    'Não sei dizer, só sinto que algo mudou',
  ];

  const steps = [
    {
      key: 'nome',
      type: 'text',
      placeholder: 'Digite seu nome',
      ariaLabel: 'Digite seu nome',
      bot: () => 'Oi, tudo bem? Antes de começarmos, como você se chama?',
    },
    {
      key: 'idade',
      type: 'number',
      placeholder: 'Ex: 7',
      ariaLabel: 'Digite a idade do seu filho ou filha',
      bot: answers => `Prazer, ${answers.nome}. Qual a idade do seu filho ou filha?`,
    },
    {
      key: 'relato',
      type: 'chips',
      options: SIGN_OPTIONS,
      ariaLabel: 'Escreva detalhes adicionais, se quiser',
      placeholder: 'Quer contar mais alguma coisa? (opcional)',
      bot: () => 'Certo. O que você tem percebido? Pode marcar quantos quiser.',
    },
  ];

  const answers = {};
  const selectedSigns = new Set();
  let stepIndex = 0;
  let waitingForBot = false;

  function scrollToEnd() {
    thread.scrollTop = thread.scrollHeight;
  }

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = 'pain__msg pain__msg--' + role;
    bubble.textContent = text;
    thread.appendChild(bubble);
    scrollToEnd();
    return bubble;
  }

  function addTyping() {
    const typing = document.createElement('div');
    typing.className = 'pain__typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    thread.appendChild(typing);
    scrollToEnd();
    return typing;
  }

  function updateStepsLabel() {
    if (!stepsEl) return;
    const current = Math.min(stepIndex + 1, steps.length);
    stepsEl.textContent = String(current).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
  }

  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  function setWaiting(isWaiting) {
    waitingForBot = isWaiting;
    form.classList.toggle('is-waiting', isWaiting);
    input.disabled = isWaiting;
  }

  function renderChipsStep(step) {
    const wrap = document.createElement('div');
    wrap.className = 'pain__chips';

    step.options.forEach(label => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pain__chip';
      chip.textContent = label;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        const isSelected = selectedSigns.has(label);
        if (isSelected) {
          selectedSigns.delete(label);
          chip.classList.remove('is-selected');
          chip.setAttribute('aria-pressed', 'false');
        } else {
          selectedSigns.add(label);
          chip.classList.add('is-selected');
          chip.setAttribute('aria-pressed', 'true');
        }
        continueBtn.classList.toggle('is-ready', selectedSigns.size > 0);
      });
      wrap.appendChild(chip);
    });

    thread.appendChild(wrap);

    const continueBtn = document.createElement('button');
    continueBtn.type = 'button';
    continueBtn.className = 'pain__chip-continue';
    continueBtn.textContent = 'Continuar';
    continueBtn.addEventListener('click', () => {
      if (selectedSigns.size === 0) return;
      submitChipsStep();
    });
    thread.appendChild(continueBtn);
    scrollToEnd();
  }

  function submitChipsStep() {
    const chosen = Array.from(selectedSigns);
    const extra = input.value.trim();

    addMessage(chosen.join(', '), 'user');
    if (extra) addMessage(extra, 'user');

    answers.relato = chosen.join(', ') + (extra ? ` — ${extra}` : '');

    input.value = '';
    autoGrow();
    form.classList.remove('is-ready');

    qsa('.pain__chips, .pain__chip-continue', thread).forEach(el => el.remove());

    stepIndex += 1;
    updateStepsLabel();
    finish();
  }

  function askCurrentStep() {
    setWaiting(true);
    updateStepsLabel();
    const typing = addTyping();

    setTimeout(() => {
      typing.remove();
      const step = steps[stepIndex];
      addMessage(step.bot(answers), 'bot');

      input.placeholder = step.placeholder;
      input.setAttribute('aria-label', step.ariaLabel);
      input.setAttribute('inputmode', step.type === 'number' ? 'numeric' : 'text');

      if (step.type === 'chips') {
        renderChipsStep(step);
      }

      setWaiting(false);
      input.focus();
    }, 550 + Math.random() * 350);
  }

  function buildWhatsAppLink() {
    const text =
      `Olá! Meu nome é ${answers.nome}. ` +
      `Meu filho(a) tem ${answers.idade} anos. ` +
      `O que tenho percebido: ${answers.relato}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  }

  function finish() {
    setWaiting(true);
    const typing = addTyping();

    setTimeout(() => {
      typing.remove();
      addMessage(`Obrigada por compartilhar isso, ${answers.nome}. Vamos conversar com calma pelo WhatsApp.`, 'bot');

      const ctaWrap = document.createElement('div');
      ctaWrap.className = 'pain__msg pain__msg--cta';

      const link = document.createElement('a');
      link.href = buildWhatsAppLink();
      link.className = 'pain__cta';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Enviar essas informações pelo WhatsApp (abre em nova aba)');
      link.innerHTML = '<i class="bi bi-whatsapp" aria-hidden="true"></i> Enviar para a psicóloga';

      ctaWrap.appendChild(link);
      thread.appendChild(ctaWrap);

      const privacyNote = document.createElement('p');
      privacyNote.className = 'pain__privacy-note';
      privacyNote.textContent = 'Suas respostas só são usadas para montar a mensagem — nada fica salvo aqui.';
      thread.appendChild(privacyNote);

      const restart = document.createElement('button');
      restart.type = 'button';
      restart.className = 'pain__restart';
      restart.textContent = 'Recomeçar conversa';
      restart.addEventListener('click', resetBot);
      thread.appendChild(restart);

      bot.classList.add('is-done');
      scrollToEnd();
      link.focus();
    }, 550);
  }

  function resetBot() {
    Object.keys(answers).forEach(k => delete answers[k]);
    selectedSigns.clear();
    stepIndex = 0;
    thread.innerHTML = '';
    bot.classList.remove('is-done');
    input.value = '';
    autoGrow();
    askCurrentStep();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (waitingForBot) return;

    const step = steps[stepIndex];

    // Passo de chips não é enviado pelo form — só o botão "Continuar"
    if (step.type === 'chips') return;

    const value = input.value.trim();
    if (!value) {
      addMessage('Preciso dessa informação pra continuar. 🙂', 'error');
      return;
    }

    if (step.type === 'number') {
      const idade = parseInt(value, 10);
      if (Number.isNaN(idade) || idade < MIN_IDADE || idade > MAX_IDADE) {
        addMessage('Pode digitar só a idade em números (0 a 17)?', 'error');
        return;
      }
    }

    answers[step.key] = value;
    addMessage(value, 'user');

    input.value = '';
    autoGrow();
    form.classList.remove('is-ready');

    stepIndex += 1;
    askCurrentStep();
  });

  input.addEventListener('input', () => {
    autoGrow();
    form.classList.toggle('is-ready', input.value.trim().length > 0);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentStep = steps[stepIndex];
      if (currentStep && currentStep.type === 'chips') {
        if (selectedSigns.size > 0) submitChipsStep();
      } else {
        form.requestSubmit();
      }
    }
  });

  askCurrentStep();

}());