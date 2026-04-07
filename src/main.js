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

const heroEl    = document.getElementById('hero');
const headerEl  = document.getElementById('site-header');
const sidebarEl = document.getElementById('site-sidebar');
const img2El    = document.querySelector('.img2');

setTimeout(expandHero, LOGO_DONE);

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

  // After expansion: lock hero as parallax bg and reveal header
  setTimeout(() => {
    makeHeroFixed();
    showHeader();
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
