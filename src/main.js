import './css/main.css';

// ─── Scroll reveal ───
const io = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal, .reveal-img, .service-row').forEach(el => io.observe(el));

// ─── Clients staggered reveal ───
const clientsGrid = document.querySelector('.clients-grid');
if (clientsGrid) {
  const clientsIo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const names = Array.from(e.target.querySelectorAll('.client-name'));
      names.forEach((el, i) => {
        el.style.transitionDelay = `${i * 16}ms`;
        el.classList.add('revealed');
      });
      const clearDelay = (names.length - 1) * 16 + 1100;
      setTimeout(() => names.forEach(el => el.style.transitionDelay = '0ms'), clearDelay);
      clientsIo.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  clientsIo.observe(clientsGrid);
}

// ─── Header + Sidebar ───
const headerEl  = document.getElementById('site-header');
const sidebarEl = document.getElementById('site-sidebar');

function showHeader() {
  if (headerEl) headerEl.classList.add('visible');
  if (sidebarEl) sidebarEl.classList.add('visible');
  initScrollHeader();
}

showHeader();

// ─── Hide on scroll down / show on scroll up ───
function initScrollHeader() {
  let lastY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY;

      if (scrollingDown && currentY > 80) {
        headerEl.classList.add('header-hidden');
      } else {
        headerEl.classList.remove('header-hidden');
      }

      lastY = currentY;
      ticking = false;
    });
  }, { passive: true });
}

// ─── Hero scroll-pinned expansion ───
const heroEl   = document.getElementById('hero');
const mediaEl  = document.getElementById('hero-media');
const videoEl  = document.getElementById('hero-video');

if (heroEl && mediaEl && videoEl) {
  // Insert spacer immediately so content flow is preserved
  const spacer = document.createElement('div');
  spacer.id = 'hero-spacer';
  spacer.style.height = '100svh';
  heroEl.after(spacer);

  // Pin hero
  heroEl.classList.add('hero-fixed');

  const EXPAND_PX = 300; // scroll distance (px) to go from partial → fullscreen
  let videoStarted = false;
  let heroDone = false;

  function onHeroScroll() {
    if (heroDone) return;

    const scrollY = window.scrollY;
    const spacerBottom = spacer.getBoundingClientRect().bottom;

    // progress: 0 at scroll=0, 1 at scroll=EXPAND_PX
    const progress = Math.min(scrollY / EXPAND_PX, 1);

    // Interpolate height: 58% → 100%
    const pct = 58 + progress * 42;
    mediaEl.style.height = pct + '%';
    mediaEl.style.transition = 'none';

    // Start video when fully expanded
    if (progress >= 1 && !videoStarted) {
      videoEl.style.display = 'block';
      videoEl.play().catch(() => {});
      videoStarted = true;
    }

    // When spacer scrolls off-screen, unpin hero
    if (spacerBottom <= 0) {
      heroDone = true;
      heroEl.classList.remove('hero-fixed');
      heroEl.style.position = 'absolute';
      heroEl.style.top = '0';
      window.removeEventListener('scroll', onHeroScroll);
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Skip animation: show full image immediately
    mediaEl.style.height = '100%';
    videoEl.style.display = 'block';
    videoEl.play().catch(() => {});
    videoStarted = true;
  } else {
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    onHeroScroll(); // run once on load
  }
}

// ─── Contact overlay (hamburger) ───
const hamburgerBtn = document.querySelector('.hamburger');
const menuOverlay  = document.getElementById('menu-overlay');

if (hamburgerBtn && menuOverlay) {
  hamburgerBtn.addEventListener('click', toggleMenu);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuOverlay.classList.contains('menu-open')) toggleMenu();
  });
}

function toggleMenu() {
  const isOpen = menuOverlay.classList.toggle('menu-open');
  hamburgerBtn.classList.toggle('open', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  hamburgerBtn.setAttribute('aria-label', isOpen ? 'Cerrar contacto' : 'Abrir contacto');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// ─── Portfolio image hover distortion ───
function makeCanvas(cardEl, zIndex = 'auto') {
  if (getComputedStyle(cardEl).position === 'static') cardEl.style.position = 'relative';
  const dpr  = window.devicePixelRatio || 1;
  const rect = cardEl.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w === 0 || h === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  Object.assign(canvas.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none',
    zIndex,
  });
  cardEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, w, h };
}

function initImg3Hover(cardEl) {
  const imgEl   = cardEl.querySelector('img');
  const H_STRIPS = 20;
  const H_AMP    = 55;
  const H_BLUR   = 12;

  let res     = null;
  let mouseNX = 0.5;
  let amp     = 0;
  let rafId   = null;

  function ensureCanvas() {
    if (res) return;
    res = makeCanvas(cardEl, '5');
  }

  function drawFrame() {
    if (!res) return;
    const { ctx, w, h } = res;
    ctx.clearRect(0, 0, w, h);

    const sw = w / H_STRIPS;
    for (let i = 0; i < H_STRIPS; i++) {
      const center = (i + 0.5) / H_STRIPS;
      const dist   = Math.abs(center - mouseNX);
      const env    = Math.exp(-dist * dist * 14) * amp;

      const xShift = env * Math.sin((i / H_STRIPS) * Math.PI * 6);
      const blur   = (H_BLUR / H_AMP) * env;

      ctx.save();
      ctx.beginPath();
      ctx.rect(i * sw, 0, sw + 1, h);
      ctx.clip();
      if (blur > 0.1) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      ctx.translate(xShift, 0);
      ctx.drawImage(imgEl, 0, 0, w, h);
      ctx.restore();
    }
  }

  function fadeOut() {
    amp *= 0.80;
    drawFrame();
    if (amp > 1) {
      rafId = requestAnimationFrame(fadeOut);
    } else {
      amp = 0;
      if (res) { res.canvas.remove(); res = null; }
      rafId = null;
    }
  }

  cardEl.addEventListener('mousemove', (e) => {
    const rect = cardEl.getBoundingClientRect();
    mouseNX = (e.clientX - rect.left) / rect.width;
    amp     = H_AMP;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    ensureCanvas();
    drawFrame();
  }, { passive: true });

  cardEl.addEventListener('mouseleave', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(fadeOut);
  }, { passive: true });
}

document.querySelectorAll('.work-img-wrap').forEach(el => initImg3Hover(el));
