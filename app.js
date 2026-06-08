/* ============================================================
   NIDUS — app.js
   ============================================================ */

'use strict';

/* ─── NAV SCROLL EFFECT ──────────────────────────────────── */
const nav = document.querySelector('.nav');
let lastScroll = 0;

function onScroll() {
  const scrollY = window.scrollY;

  if (scrollY > 60) {
    nav.classList.add('nav--scrolled');
  } else {
    nav.classList.remove('nav--scrolled');
  }

  lastScroll = scrollY;
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ─── MOBILE NAV TOGGLE ──────────────────────────────────── */
const navToggle = document.querySelector('.nav__toggle');
const navLinks  = document.querySelector('.nav__links');

navToggle?.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('nav__links--open');
  document.body.style.overflow = expanded ? '' : 'hidden';
});

// Close nav on link click
navLinks?.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.classList.remove('open');
    navLinks.classList.remove('nav__links--open');
    document.body.style.overflow = '';
  });
});

/* ─── SCROLL REVEAL ──────────────────────────────────────── */
function setupReveal() {
  const revealTargets = [
    '.search__header',
    '.search__tabs',
    '.search__form',
    '.search__map-preview',
    '.featured__header',
    '.prop-card',
    '.service-item',
    '.city-card',
    '.testimonial',
    '.cta__content',
    '.contact-form',
    '.cities__header',
  ];

  const allElements = [];
  revealTargets.forEach((selector, sIdx) => {
    document.querySelectorAll(selector).forEach((el, eIdx) => {
      el.classList.add('reveal');
      if (eIdx > 0) el.classList.add(`reveal--delay-${Math.min(eIdx, 5)}`);
      allElements.push(el);
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  allElements.forEach(el => observer.observe(el));
}

/* ─── ANIMATED COUNTERS ──────────────────────────────────── */
function animateCounters() {
  const counters = document.querySelectorAll('.stat__num[data-target]');
  if (!counters.length) return;

  const easeOutQuad = t => 1 - (1 - t) * (1 - t);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOutQuad(progress) * target);
        el.textContent = value.toLocaleString('es-ES');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ─── SEARCH TABS ────────────────────────────────────────── */
function setupSearchTabs() {
  const tabs = document.querySelectorAll('.stab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('stab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('stab--active');
      tab.setAttribute('aria-selected', 'true');
    });
  });
}

/* ─── FILTER CHIPS ───────────────────────────────────────── */
function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.textContent.includes('tamaño')) {
        chips.forEach(c => c.classList.remove('filter-chip--active'));
        chip.classList.add('filter-chip--active');
      } else {
        chip.classList.toggle('filter-chip--active');
        const sizeChip = chips[0];
        sizeChip?.classList.remove('filter-chip--active');
      }
    });
  });
}

/* ─── FAVOURITE BUTTON ───────────────────────────────────── */
function setupFavourites() {
  document.querySelectorAll('.prop-card__fav').forEach(btn => {
    btn.addEventListener('click', () => {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      btn.textContent = pressed ? '♡' : '♥';
      btn.style.color = pressed ? '' : 'var(--c-rust)';
    });
  });
}

/* ─── TESTIMONIALS CAROUSEL ──────────────────────────────── */
function setupTestimonials() {
  const track = document.querySelector('.testimonials__track');
  const dots   = document.querySelectorAll('.t-dot');
  const prev   = document.querySelector('.t-nav--prev');
  const next   = document.querySelector('.t-nav--next');

  if (!track || !dots.length) return;

  let current = 0;
  const items = track.querySelectorAll('.testimonial');
  const total = items.length;

  // On mobile only, show one at a time
  function isMobile() { return window.innerWidth <= 768; }

  function update(idx) {
    current = (idx + total) % total;

    dots.forEach((d, i) => {
      d.classList.toggle('t-dot--active', i === current);
    });

    if (isMobile()) {
      items.forEach((item, i) => {
        item.style.display = i === current ? '' : 'none';
      });
    } else {
      items.forEach(item => { item.style.display = ''; });
    }
  }

  prev?.addEventListener('click', () => update(current - 1));
  next?.addEventListener('click', () => update(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => update(i)));

  window.addEventListener('resize', () => update(current));

  // Auto-advance
  let autoTimer = setInterval(() => update(current + 1), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => {
    autoTimer = setInterval(() => update(current + 1), 5000);
  });
}

/* ─── MODAL ──────────────────────────────────────────────── */
function setupModal() {
  const modal     = document.getElementById('acceso');
  const trigger   = document.querySelector('a[href="#acceso"]');
  const closeBtn  = document.querySelector('.modal__close');
  const backdrop  = document.querySelector('.modal__backdrop');
  const modalTabs = document.querySelectorAll('.modal__tab');
  const loginForm = document.getElementById('modal-login');
  const regForm   = document.getElementById('modal-register');

  if (!modal) return;

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('input')?.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    trigger?.focus();
  }

  trigger?.addEventListener('click', e => { e.preventDefault(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // Trap focus inside modal
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button, input, a, [tabindex="0"]')].filter(el => !el.hidden);
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });

  // Modal tabs
  modalTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modalTabs.forEach(t => {
        t.classList.remove('modal__tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('modal__tab--active');
      tab.setAttribute('aria-selected', 'true');
      const isLogin = tab.dataset.modalTab === 'login';
      if (loginForm) loginForm.hidden = !isLogin;
      if (regForm)   regForm.hidden   = isLogin;
    });
  });

  // Form submission (demo)
  [loginForm, regForm].forEach(form => {
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      btn.textContent = '✓ ¡Bienvenido!';
      btn.style.background = 'var(--c-sage)';
      setTimeout(() => closeModal(), 1200);
    });
  });
}

/* ─── SEARCH FORM ────────────────────────────────────────── */
function setupSearch() {
  const form = document.querySelector('.search__form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const ciudad = form.querySelector('#ciudad')?.value.trim();
    const btn = form.querySelector('.btn--search');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = ciudad
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Buscando en ${ciudad}…`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Buscando…`;
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
    }, 2000);
  });
}

/* ─── CONTACT FORM ───────────────────────────────────────── */
function setupContactForm() {
  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn--primary');
    if (!btn) return;
    btn.textContent = '✓ Consulta enviada';
    btn.style.background = 'var(--c-sage)';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Enviar consulta';
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
}

/* ─── MAP DOTS INTERACTION ───────────────────────────────── */
function setupMapDots() {
  document.querySelectorAll('.map-dot').forEach(dot => {
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('role', 'button');
    const label = dot.querySelector('.map-dot__label');
    if (label) dot.setAttribute('aria-label', `Propiedad disponible: ${label.textContent}`);

    const activate = () => {
      dot.style.transform = 'scale(1.4)';
      dot.style.zIndex = '10';
      setTimeout(() => {
        dot.style.transform = '';
        dot.style.zIndex = '';
      }, 600);
    };
    dot.addEventListener('click', activate);
    dot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });
}

/* ─── SMOOTH ANCHOR LINKS ────────────────────────────────── */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      // Skip modal triggers
      if (id === 'acceso') return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─── CURSOR GLOW (desktop only) ────────────────────────── */
function setupCursorGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed; pointer-events: none; z-index: 9998;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(122,158,126,.06) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: opacity .4s;
    will-change: transform;
  `;
  document.body.appendChild(glow);

  let mouseX = -500, mouseY = -500;
  let glowX = -500, glowY = -500;
  let rafId;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateGlow() {
    glowX = lerp(glowX, mouseX, 0.1);
    glowY = lerp(glowY, mouseY, 0.1);
    glow.style.left = glowX + 'px';
    glow.style.top  = glowY + 'px';
    rafId = requestAnimationFrame(animateGlow);
  }
  animateGlow();

  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });
}

/* ─── PARALLAX HERO VISUAL ───────────────────────────────── */
function setupParallax() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const visual = document.querySelector('.hero__visual');
  if (!visual) return;

  document.addEventListener('mousemove', e => {
    const xPct = (e.clientX / window.innerWidth - .5) * 2;
    const yPct = (e.clientY / window.innerHeight - .5) * 2;
    visual.style.transform = `translateY(-50%) translate(${xPct * 12}px, ${yPct * 8}px)`;
  });
}

/* ─── INIT ───────────────────────────────────────────────── */
function init() {
  setupReveal();
  animateCounters();
  setupSearchTabs();
  setupFilterChips();
  setupFavourites();
  setupTestimonials();
  setupModal();
  setupSearch();
  setupContactForm();
  setupMapDots();
  setupSmoothScroll();
  setupCursorGlow();
  setupParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}