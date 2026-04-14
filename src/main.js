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
      // Limpiar delays para que hover sea instantáneo
      const clearDelay = (names.length - 1) * 16 + 1100;
      setTimeout(() => names.forEach(el => el.style.transitionDelay = '0ms'), clearDelay);
      clientsIo.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  clientsIo.observe(clientsGrid);
}

// ─── Hero sequence ───
// Bar + us-group animations complete at: 4.34s + 1.8s = 6.14s
const LOGO_DONE    = 6140;
const EXPAND_DUR   = 1800;
const REVEAL_START = 4340;  // same delay as revealLTR
const GLASS_DUR    = 1800;  // same duration as revealLTR
const N_STRIPS     = 18;    // vertical glass strips
const GLASS_AMP    = 52;    // max horizontal displacement (px)
const GLASS_BLUR   = 14;    // max blur (px)
const SWEEP_DUR    = 2000;
const SWEEP_STRIPS = 22;
const SWEEP_AMP    = 70;
const SWEEP_BLUR   = 18;

const heroEl    = document.getElementById('hero');
const headerEl  = document.getElementById('site-header');
const sidebarEl = document.getElementById('site-sidebar');
const img2El    = document.querySelector('.img2');

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  expandHero();
} else {
  setTimeout(startGlassAnimation, REVEAL_START);
  setTimeout(expandHero, LOGO_DONE);
}

function expandHero() {
  const imgEl    = img2El.querySelector('img');
  const heroRect = heroEl.getBoundingClientRect();
  const imgRect  = img2El.getBoundingClientRect();

  // Freeze clip-path at fully-visible state before killing animation
  img2El.style.clipPath  = 'inset(0 0% 0 0)';
  img2El.style.animation = 'none';

  // Convert from CSS-driven position to explicit pixels (relative to hero)
  Object.assign(img2El.style, {
    position: 'absolute',
    top:    (imgRect.top  - heroRect.top)  + 'px',
    bottom: 'auto',
    left:   (imgRect.left - heroRect.left) + 'px',
    width:  imgRect.width  + 'px',
    height: imgRect.height + 'px',
    zIndex: '2',          // above img1/img3 (z-index:1), below hero-content (z-index:3)
  });

  Object.assign(imgEl.style, {
    width:      '100%',
    height:     '100%',
    objectFit:  'cover',
  });

  img2El.offsetHeight; // force reflow before transition

  // Expand to fill the full hero (= full viewport)
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const t    = `${EXPAND_DUR}ms ${ease}`;
  img2El.style.transition = `top ${t}, left ${t}, width ${t}, height ${t}`;

  Object.assign(img2El.style, {
    top: '0', left: '0',
    width: '100%', height: '100%',
  });

  // Logo turns white ~300ms into the expansion
  setTimeout(() => heroEl.classList.add('logo-white'), 300);

  // After expansion: lock hero as parallax bg, reveal header, run glass sweep
  setTimeout(() => {
    makeHeroFixed();
    showHeader();

    runSweep(img2El);
    img2El.style.cursor = 'pointer';
    heroEl.addEventListener('click', () => runSweep(img2El), { passive: true });

    // img2 interactive hover distortion
    initImg3Hover(img2El);
  }, EXPAND_DUR);
}

function makeHeroFixed() {
  // Insert spacer so content doesn't jump when hero leaves the flow
  const spacer = document.createElement('div');
  spacer.style.height = '100svh';
  heroEl.parentNode.insertBefore(spacer, heroEl.nextSibling);
  heroEl.classList.add('hero-fixed');
}

function showHeader() {
  Object.assign(headerEl.style, {
    transition: 'opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1)',
  });
  headerEl.classList.add('visible');
  if (sidebarEl) sidebarEl.classList.add('visible');
  initScrollHeader();
}

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

// ─── Menú hamburguesa ───
const hamburgerBtn = document.querySelector('.hamburger');
const menuOverlay  = document.getElementById('menu-overlay');

hamburgerBtn.addEventListener('click', toggleMenu);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOverlay.classList.contains('menu-open')) toggleMenu();
});

function toggleMenu() {
  const isOpen = menuOverlay.classList.toggle('menu-open');
  hamburgerBtn.classList.toggle('open', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  hamburgerBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  document.body.style.overflow = isOpen ? 'hidden' : '';

  const items = menuOverlay.querySelectorAll('.menu-service-item');

  if (isOpen) {
    // Items: duraciones individuales 3s, 3.5s, 4s
    const durations = ['3s', '3.5s', '4s'];
    const delays    = [0.4, 0.9, 1.4];
    items.forEach((item, i) => {
      item.style.transitionDuration = durations[i];
      item.style.transitionDelay = `${delays[i]}s`;
      item.classList.add('menu-item-visible');
    });
  } else {
    items.forEach(item => {
      item.style.transitionDuration = '';
      item.style.transitionDelay = '0s';
      item.classList.remove('menu-item-visible');
    });
  }
}

function animateHeaderLetters() {
  const svg = headerEl.querySelector('.header-logo svg');
  if (!svg) return;

  const ch = Array.from(svg.children);
  // SVG children order: i-body(0), i-dot(1), n(2), t(3), e(4), r(5), a(6), c(7), t2(8), i2(9), bar(10), u(11), s(12)
  const seq = [
    { els: [ch[0], ch[1]], delay: 0    },  // i
    { els: [ch[2]],        delay: 0.14 },  // n
    { els: [ch[3]],        delay: 0.28 },  // t
    { els: [ch[4]],        delay: 0.42 },  // e
    { els: [ch[5]],        delay: 0.56 },  // r
    { els: [ch[6]],        delay: 0.70 },  // a
    { els: [ch[7]],        delay: 0.84 },  // c
    { els: [ch[8]],        delay: 0.98 },  // t2
    { els: [ch[9]],        delay: 1.12 },  // i2
    { els: [ch[10]],       delay: 1.26 },  // bar
    { els: [ch[11]],       delay: 1.40 },  // u
    { els: [ch[12]],       delay: 1.54 },  // s
  ];

  seq.forEach(({ els, delay }) => {
    (els || []).filter(Boolean).forEach(el => {
      el.style.opacity = '0';
      el.offsetHeight;
      el.style.animation = `letraIn .5s cubic-bezier(.16,1,.3,1) ${delay}s both`;
    });
  });
}

// ─── Glass strip helpers ───────────────────────────────────────────────────

// Create a canvas overlay sized to cardEl and append it
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

// Draw img with object-fit: cover semantics, shifted by xShift (canvas px)
function drawCover(ctx, imgEl, w, h, xShift = 0) {
  const iw = imgEl.naturalWidth;
  const ih = imgEl.naturalHeight;
  if (!iw || !ih) { ctx.drawImage(imgEl, xShift, 0, w, h); return; }

  const imgAR = iw / ih;
  const dstAR = w  / h;
  let sx, sy, sw, sh;
  if (imgAR > dstAR) {
    sh = ih; sw = sh * dstAR;
    sx = (iw - sw) / 2; sy = 0;
  } else {
    sw = iw; sh = sw / dstAR;
    sx = 0; sy = (ih - sh) / 2;
  }
  sx += xShift * (sw / w);
  ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, w, h);
}

// Draw vertical glass strips: each strip shifts source x by a sine wave
function drawGlassStrips(ctx, imgEl, w, h, amp, blur, nStrips, useCover) {
  ctx.clearRect(0, 0, w, h);
  const sw = w / nStrips;
  for (let i = 0; i < nStrips; i++) {
    const xShift = amp * Math.sin((i / nStrips) * Math.PI * 4);
    ctx.save();
    ctx.beginPath();
    ctx.rect(i * sw, 0, sw + 1, h);
    ctx.clip();
    ctx.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
    if (useCover) {
      drawCover(ctx, imgEl, w, h, xShift);
    } else {
      ctx.translate(xShift, 0);
      ctx.drawImage(imgEl, 0, 0, w, h);
    }
    ctx.restore();
  }
}

// ─── img3 interactive hover distortion ────────────────────────────────────

function initImg3Hover(cardEl) {
  const imgEl   = cardEl.querySelector('img');
  const H_STRIPS = 20;
  const H_AMP    = 55;
  const H_BLUR   = 12;

  let res     = null;   // { canvas, ctx, w, h }
  let mouseNX = 0.5;    // normalized X [0–1] within card
  let amp     = 0;      // current amplitude
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
      const env    = Math.exp(-dist * dist * 14) * amp; // gaussian around cursor

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

// ─── Initial glass animation (img1, img2, img3 during revealLTR) ───────────

function startGlassAnimation() {
  const cards  = ['.img1', '.img2', '.img3']
    .map(s => document.querySelector(s)).filter(Boolean);

  const setups = cards.map(card => {
    const res = makeCanvas(card);
    return res ? { ...res, imgEl: card.querySelector('img') } : null;
  }).filter(Boolean);

  if (!setups.length) return;

  const t0 = performance.now();
  function tick(now) {
    const p   = Math.min((now - t0) / GLASS_DUR, 1);
    const rem = Math.pow(1 - p, 2.5); // ease-out: 1 → 0
    const amp  = GLASS_AMP  * rem;
    const blur = GLASS_BLUR * rem;
    setups.forEach(({ ctx, imgEl, w, h }) =>
      drawGlassStrips(ctx, imgEl, w, h, amp, blur, N_STRIPS, false)
    );
    if (p < 1) requestAnimationFrame(tick);
    else setups.forEach(({ canvas }) => canvas.remove());
  }
  requestAnimationFrame(tick);
}

// ─── Fullscreen sweep (img2 after expansion, and on click) ─────────────────

function runSweep(cardEl) {
  // Remove any in-progress sweep canvas
  cardEl.querySelectorAll('.sweep-canvas').forEach(c => c.remove());

  const res = makeCanvas(cardEl, '10');
  if (!res) return;
  const { canvas, ctx, w, h } = res;
  canvas.classList.add('sweep-canvas');

  const imgEl = cardEl.querySelector('img');
  const t0 = performance.now();

  function tick(now) {
    const p = Math.min((now - t0) / SWEEP_DUR, 1);
    ctx.clearRect(0, 0, w, h);

    // Base: clean image
    ctx.filter = 'none';
    drawCover(ctx, imgEl, w, h, 0);

    // Sweep: glass wave travelling left → right
    const sw = w / SWEEP_STRIPS;
    for (let i = 0; i < SWEEP_STRIPS; i++) {
      const center   = (i + 0.5) / SWEEP_STRIPS;
      const dist     = Math.abs(center - p);
      const envelope = Math.exp(-dist * dist * 28); // gaussian bell
      if (envelope < 0.01) continue;

      const xShift = SWEEP_AMP  * envelope * Math.sin((i / SWEEP_STRIPS) * Math.PI * 6);
      const blur   = SWEEP_BLUR * envelope;

      ctx.save();
      ctx.beginPath();
      ctx.rect(i * sw, 0, sw + 1, h);
      ctx.clip();
      ctx.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
      drawCover(ctx, imgEl, w, h, xShift);
      ctx.restore();
    }

    if (p < 1) requestAnimationFrame(tick);
    else canvas.remove();
  }
  requestAnimationFrame(tick);
}

// ─── Apply hover glass to all portfolio images ─────────────────────────────
document.querySelectorAll('.work-img-wrap').forEach(el => initImg3Hover(el));
