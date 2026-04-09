# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server (localhost:5173)
npm run build     # Build to dist/
npm run preview   # Preview the build locally
```

Deploy: push to `main` → Vercel auto-deploys (`prj_UMhRPkDBZXOnYWVnEt4WzvWtxrK2`).

## Stack

Static HTML site — no framework, no SPA routing.

- **Build:** Vite 5.4.0 (zero config — `index.html` is the entry point)
- **JS:** Vanilla ES modules (`src/main.js`)
- **CSS:** 12 modular files imported via `src/css/main.css`
- **Fonts:** DM Mono + Playfair Display via Google Fonts (loaded in `<head>`)

## Architecture

### Hero animation sequence (`src/main.js` + `animations.css`)

The hero has a two-phase JS-driven animation totalling ~8s:

1. **Logo reveal** (CSS, 0–4.34s): each SVG letter fades in sequentially via `.l1`–`.l11` classes
2. **Bar + "us" group** (CSS, 4.34s–6.14s): bar grows left→right, "us" letters push right
3. **Image expand** (JS, 6.14s): `expandHero()` fires — `.img2` converts from CSS-positioned to `position:absolute` with explicit px coords, then transitions to `width:100% height:100%` filling the hero
4. **Hero becomes fixed** (JS, after expand): `hero-fixed` class makes `#hero` `position:fixed` as a parallax background; a spacer `div` replaces it in flow

`prefers-reduced-motion`: CSS animations are disabled via media query. JS checks `window.matchMedia('(prefers-reduced-motion: reduce)')` and calls `expandHero()` immediately instead of waiting.

### Images

All images live in `public/imgs/` and are served at `/imgs/`. Every image uses `<picture>` with WebP + PNG fallback for cross-browser compatibility:

```html
<picture>
  <source srcset="/imgs/name.webp" type="image/webp">
  <img src="/imgs/name.png" alt="..." width="W" height="H">
</picture>
```

- Hero images (`img1`, `img2`, `img3`): `fetchpriority="high"`, no lazy load
- Separator (`img-sep`): `loading="lazy"`
- Portfolio images (`p01_*` – `p07_*`): `loading="lazy"`
- Stored but not yet used: `img01`, `img02`, `img05` (project assets for future sections)

### CSS modules load order

`reset → base → sidebar → animations → header → hero → intro → services → work → clients → footer → responsive`

### Scroll reveals

`IntersectionObserver` in `main.js` adds `.revealed` to elements with `.reveal` (text, opacity+translateY+blur) or `.reveal-img` (clip-path left→right). Clients grid has its own observer with staggered `transitionDelay` per item.

### Content reference

`refs/texts.md` contains the copy source for all sections. `refs/` is not served — for design reference only.
