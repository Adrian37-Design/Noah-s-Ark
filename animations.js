/**
 * animations.js — Noah's Ark Fairview
 * Central Animation Controller
 */

// ============================================================
// 1. SCROLL REVEAL — Intersection Observer
// ============================================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .gold-line').forEach(el => {
    observer.observe(el);
  });
}

// ============================================================
// 2. STAGGERED CARD ENTRANCE
// ============================================================
function initStaggeredCards() {
  const groups = document.querySelectorAll('.stagger-group');
  groups.forEach(group => {
    new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.stagger-item').forEach((item, i) => {
            setTimeout(() => item.classList.add('visible'), i * 130);
          });
        }
      });
    }, { threshold: 0.1 }).observe(group);
  });
}

// ============================================================
// 3. NAVBAR SCROLL GLASS EFFECT
// ============================================================
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ============================================================
// 4. PARTICLE SYSTEM (Home page only)
// ============================================================
function initParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const heroSections = document.querySelectorAll('.home-hero, .page-hero');
  if (!heroSections.length) return;

  heroSections.forEach(hero => {
    let canvas = hero.querySelector('.particleCanvas') || hero.querySelector('#particleCanvas');
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'particleCanvas';
      canvas.setAttribute('aria-hidden', 'true');
      hero.insertBefore(canvas, hero.firstChild);
    }

    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const colors = [
      'rgba(201,168,76,0.75)', 'rgba(201,168,76,0.45)',
      'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.22)',
      'rgba(232,201,122,0.6)',  'rgba(255,220,150,0.35)'
    ];
    
    // Scale particle count dynamically based on the section's pixel area, clamped a bit
    const density = Math.floor((hero.offsetWidth * hero.offsetHeight) / 12000);
    const particleCount = Math.min(Math.max(density, 20), 120);

    const particles = Array.from({ length: particleCount }, () => ({
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      r:      Math.random() * 1.8 + 0.4,
      color:  colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 0.22,
      speedY: -(Math.random() * 0.38 + 0.08),
      phase:  Math.random() * Math.PI * 2,
    }));

    let raf;
    let isVisible = false;

    function draw() {
      if (!isVisible && raf) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now() * 0.001;
      particles.forEach(p => {
        const pulse = 1 + Math.sin(now + p.phase) * 0.28;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.x += p.speedX; p.y += p.speedY;
        if (p.y < -8)               p.y = canvas.height + 8;
        if (p.x < -8)               p.x = canvas.width  + 8;
        if (p.x > canvas.width + 8) p.x = -8;
      });
      raf = requestAnimationFrame(draw);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isVisible = true;
          draw();
        } else {
          isVisible = false;
          cancelAnimationFrame(raf);
        }
      });
    }, { threshold: 0.01 });
    
    observer.observe(hero);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isVisible = false;
        cancelAnimationFrame(raf);
      } else if (observer.takeRecords().some(r => r.isIntersecting) || document.visibilityState === 'visible') {
         // Rely on intersection observer for resuming
      }
    });
  });
}

// ============================================================
// 5. ANIMATED NUMBER COUNTERS
// ============================================================
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 2200;
  const step = target / (duration / 16);
  let current = 0;
  const suffix = el.dataset.suffix || '';
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + suffix;
    if (current >= target) clearInterval(timer);
  }, 16);
}
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// ============================================================
// 6. SCROLL INDICATOR
// ============================================================
function initScrollIndicator() {
  const ind = document.querySelector('.scroll-indicator');
  if (!ind) return;
  ind.addEventListener('click', () => {
    const next = document.querySelector('.scripture-ticker, .service-times-section, .section-wrap');
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  });
}

// ============================================================
// 7. EVENT FILTER (events page)
// ============================================================
function initEventFilter() {
  const btns = document.querySelectorAll('.filter-btn');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      
      // Query cards dynamically inside the click handler
      const cards = document.querySelectorAll('.event-grid-card');
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        if (!show) {
          card.style.opacity    = '0';
          card.style.transform  = 'scale(0.92)';
          card.style.pointerEvents = 'none';
          // Collapse space so grid reflows
          setTimeout(() => card.style.display = 'none', 350);
        } else {
          card.style.display    = 'block';
          // Small delay to allow display block to render before animating opacity
          setTimeout(() => {
            card.style.opacity    = '1';
            card.style.transform  = 'scale(1)';
            card.style.pointerEvents = 'auto';
          }, 10);
        }
        card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      });
    });
  });
}

// ============================================================
// INITIALISE ALL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initStaggeredCards();
  initNavScroll();
  initParticles();
  initCounters();
  initScrollIndicator();
  initEventFilter();
});
