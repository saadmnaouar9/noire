import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import htm from "htm";

const html = htm.bind(React.createElement);
gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */
const u = (id, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;
const VIDEO = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";
const P = {
  milan: "1539109136881-3be0616acf4b",
  maroon: "1483985988355-763728e1935b",
  blazer: "1552374196-1ab2a1c593e8",
  circle: "1488161628813-04466f872be2",
  watch: "1507680434567-5739c80be1ac",
  suit: "1617137968427-85924c800a22",
  tee: "1521572163474-6864f9cf17ab",
  teeAlt: "1576566588028-4147f3842f27",
  teeBlack: "1503342217505-b0a15ec3261c",
  hoodie: "1556821840-3a63f95609a7",
  yellow: "1515886657613-9f3515b0c78f",
  jeans: "1542272604-787c3835535d",
  flatlay: "1544441893-675973e31985",
  leather: "1551028719-00167b16eac5",
  bomber: "1591047139829-d91aecb6caea",
  shoe: "1542291026-7eec264c27ff",
  bag: "1553062407-98eeb64c6a62",
  redTee: "1529139574466-a303027c1d8b",
  girlYellow: "1469334031218-e382a71b716b",
};

const COLLECTION = [
  { no: "01", name: "Sand Tailoring", price: 320, a: P.blazer, b: P.circle },
  { no: "02", name: "Milan Overcoat", price: 540, a: P.milan, b: P.maroon },
  { no: "03", name: "Field Jacket", price: 380, a: P.watch, b: P.suit },
  { no: "04", name: "Graphic Tee 04", price: 85, a: P.teeBlack, b: P.redTee },
];

const PRODUCTS = [
  { id: "tee", cat: "T-Shirts", name: "Oversized Boxy Tee", price: 65, a: P.tee, b: P.teeAlt, tag: "New", colors: [["Bone", "#e8e1d4"], ["Noir", "#111"], ["Stone", "#8a8782"]], blurb: "Heavyweight 280gsm organic cotton, dropped shoulder, boxy cut. Garment dyed for a worn-in hand-feel." },
  { id: "hoodie", cat: "Hoodies", name: "Heavyweight Hoodie", price: 145, a: P.hoodie, b: P.yellow, tag: "Bestseller", colors: [["Ash", "#9a9a98"], ["Noir", "#111"], ["Sand", "#cbbda7"]], blurb: "A brushed-back 450gsm fleece with a double-lined hood and a relaxed, oversized silhouette." },
  { id: "cargo", cat: "Pants", name: "Utility Cargo Pants", price: 160, a: P.jeans, b: P.flatlay, colors: [["Noir", "#111"], ["Khaki", "#a29675"], ["Slate", "#4b5058"]], blurb: "Wide-leg cargo in washed ripstop with articulated knees and adjustable hem toggles." },
  { id: "jacket", cat: "Jackets", name: "Leather Biker Jacket", price: 490, a: P.leather, b: P.bomber, tag: "Limited", colors: [["Noir", "#0d0d0d"], ["Cognac", "#8a5a3a"]], blurb: "Full-grain lambskin, cut sharp and cropped. Brushed hardware and a quilted satin lining." },
  { id: "sneaker", cat: "Sneakers", name: "Runner Low Sneaker", price: 210, a: P.shoe, b: P.flatlay, tag: "New", colors: [["Ruby", "#a3151b"], ["Bone", "#e8e1d4"], ["Noir", "#111"]], blurb: "Engineered knit upper on a sculpted foam sole. Built for the street, finished like a dress shoe." },
  { id: "bag", cat: "Accessories", name: "Everyday Backpack", price: 120, a: P.bag, b: P.watch, colors: [["Midnight", "#1d2540"], ["Noir", "#111"]], blurb: "Water-resistant technical nylon, padded laptop sleeve and hidden zip pockets. Carries the city." },
];
const CATS = ["All", "T-Shirts", "Hoodies", "Pants", "Jackets", "Sneakers", "Accessories"];
const fmt = (n) => `€${n.toLocaleString("en-US")}`;
const FREE_SHIP = 300;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
let lenis = null;
const Store = createContext(null);
const useStore = () => useContext(Store);

function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, []);
  return ref;
}

function Magnetic({ as = "button", className = "", children, strength, ...rest }) {
  const ref = useMagnetic(strength);
  return React.createElement(as, { ref, className: `btn ${className}`, ...rest }, children);
}

/* "WORD *italic* WORD" -> masked words that slide up */
function Split({ text, as = "span", className = "", scroll = true, active = true, delay = 0, stagger = 0.07, start = "top 88%" }) {
  const ref = useRef(null);
  const tokens = [];
  let italic = false;
  text.split(/(\*)/).forEach((part) => {
    if (part === "*") { italic = !italic; return; }
    part.split(" ").filter(Boolean).forEach((w) => tokens.push({ w, italic }));
  });

  useLayoutEffect(() => {
    const inners = ref.current.querySelectorAll(".split-inner");
    const ctx = gsap.context(() => {
      if (scroll) {
        gsap.from(inners, { yPercent: 115, rotate: 5, duration: 1.3, ease: "power4.out", stagger, delay, scrollTrigger: { trigger: ref.current, start, once: true } });
      } else if (active) {
        gsap.fromTo(inners, { yPercent: 115, rotate: 5 }, { yPercent: 0, rotate: 0, duration: 1.4, ease: "power4.out", stagger, delay });
      } else {
        gsap.set(inners, { yPercent: 115, rotate: 5 });
      }
    }, ref);
    return () => ctx.revert();
  }, [active]);

  return React.createElement(
    as,
    { ref, className, "aria-label": text.replace(/\*/g, "") },
    tokens.map((t, i) =>
      html`<span key=${i} aria-hidden="true" className="split-mask"><span className="split-inner">${t.italic ? html`<em>${t.w}</em>` : t.w}</span></span>${" "}`
    )
  );
}

/* image with clip reveal, optional parallax, optional hover-swap image */
function Pic({ src, alt = "", className = "", parallax = 0, swap, reveal = true, style, children, distort }) {
  const box = useRef(null);
  const px = useRef(null);
  const [bad, setBad] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reveal) {
        gsap.fromTo(box.current, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: box.current, start: "top 90%", once: true } });
        gsap.fromTo(px.current, { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: box.current, start: "top 90%", once: true } });
      }
      if (parallax) {
        gsap.fromTo(px.current.parentElement.querySelector(".par"), { yPercent: -parallax }, { yPercent: parallax, ease: "none", scrollTrigger: { trigger: box.current, start: "top bottom", end: "bottom top", scrub: true } });
      }
    }, box);
    return () => ctx.revert();
  }, []);

  const onEnter = () => {
    if (!distort) return;
    const disp = document.getElementById("disp");
    const tgt = px.current;
    tgt.style.filter = "url(#distort)";
    gsap.fromTo(disp, { attr: { scale: 0 } }, { attr: { scale: 70 }, duration: 0.45, ease: "power2.out", yoyo: true, repeat: 1, onComplete: () => { tgt.style.filter = ""; } });
  };

  const imgEl = (s, cls = "") => html`<img className=${cls} src=${s} alt=${alt} loading="lazy" draggable="false" onError=${() => setBad(true)} />`;
  return html`
    <div ref=${box} className=${`reveal ${className} ${bad ? "img-fallback" : ""}`} style=${style} onMouseEnter=${onEnter}>
      <div ref=${px} style=${{ position: "absolute", inset: 0 }}>
        <div className="par" style=${{ position: "absolute", inset: parallax ? `-${parallax + 2}% 0` : 0 }}>
          ${!bad && imgEl(src)}
          ${!bad && swap && html`<div className="swap">${imgEl(swap)}</div>`}
        </div>
      </div>
      ${children}
    </div>`;
}

/* ------------------------------------------------------------------ */
/* loader                                                              */
/* ------------------------------------------------------------------ */
function Loader({ onDone }) {
  const root = useRef(null);
  const count = useRef(null);
  const bar = useRef(null);
  useLayoutEffect(() => {
    const obj = { n: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: onDone });
      tl.from(".loader-word span", { yPercent: 120, duration: 1.1, ease: "power4.out", stagger: 0.08 }, 0.2)
        .to(obj, { n: 100, duration: 2.2, ease: "power2.inOut", onUpdate: () => { count.current.textContent = String(Math.round(obj.n)).padStart(2, "0"); } }, 0.2)
        .to(bar.current, { scaleX: 1, duration: 2.2, ease: "power2.inOut" }, 0.2)
        .to(".loader-word span", { yPercent: -120, duration: 0.8, ease: "power3.in", stagger: 0.05 }, 2.6)
        .to(".loader-meta", { opacity: 0, duration: 0.4 }, 2.6)
        .to(root.current, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, 3.2);
    }, root);
    return () => ctx.revert();
  }, []);
  return html`
    <div ref=${root} className="loader" role="status" aria-label="Loading">
      <div className="loader-word">${"NOIRÉ".split("").map((c, i) => html`<span key=${i}>${c}</span>`)}</div>
      <div className="loader-meta">
        <span className="eyebrow">Define your own style</span>
        <span className="loader-count" ref=${count}>00</span>
      </div>
      <div className="loader-bar" ref=${bar}></div>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* cursor                                                              */
/* ------------------------------------------------------------------ */
function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);
  const label = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const rx = gsap.quickTo(ring.current, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring.current, "y", { duration: 0.45, ease: "power3" });
    const dx = gsap.quickTo(dot.current, "x", { duration: 0.1 });
    const dy = gsap.quickTo(dot.current, "y", { duration: 0.1 });
    gsap.set([ring.current, dot.current], { xPercent: -50, yPercent: -50 });
    const move = (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); };
    const over = (e) => {
      const t = e.target.closest ? e.target.closest("[data-cursor], a, button, input") : null;
      const text = t && t.getAttribute("data-cursor");
      if (text) { label.current.textContent = text; gsap.to(ring.current, { scale: 2.1, duration: 0.4 }); gsap.to(label.current, { opacity: 1, duration: 0.3 }); gsap.to(dot.current, { scale: 0, duration: 0.3 }); }
      else if (t) { gsap.to(ring.current, { scale: 1.6, duration: 0.4 }); gsap.to(label.current, { opacity: 0, duration: 0.2 }); gsap.to(dot.current, { scale: 1, duration: 0.3 }); }
      else { gsap.to(ring.current, { scale: 1, duration: 0.4 }); gsap.to(label.current, { opacity: 0, duration: 0.2 }); gsap.to(dot.current, { scale: 1, duration: 0.3 }); }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, []);
  return html`<div><div ref=${ring} className="cursor"><span ref=${label} className="cursor-label"></span></div><div ref=${dot} className="cursor-dot"></div></div>`;
}

/* ------------------------------------------------------------------ */
/* nav / menu                                                          */
/* ------------------------------------------------------------------ */
const LINKS = [["New", "#collection"], ["Shop", "#shop"], ["Story", "#story"], ["Campaign", "#campaign"], ["Contact", "#contact"]];

function Nav({ go, openMenu, ready }) {
  const { count, setCartOpen } = useStore();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!lenis) return;
    const on = ({ scroll, direction }) => { setSolid(scroll > 80); setHidden(scroll > 400 && direction === 1); };
    lenis.on("scroll", on);
    return () => lenis.off("scroll", on);
  }, [ready]);
  const logo = useMagnetic(0.2);
  return html`
    <motion.header className=${`nav ${solid ? "solid" : ""} ${hidden ? "hidden" : ""}`} initial=${{ y: -80, opacity: 0 }} animate=${ready ? { y: 0, opacity: 1 } : {}} transition=${{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}>
      <nav className="nav-links" aria-label="Primary">
        ${LINKS.slice(0, 3).map(([l, h]) => html`<a key=${l} href=${h} onClick=${(e) => { e.preventDefault(); go(h); }}>${l}</a>`)}
      </nav>
      <button className="burger" aria-label="Open menu" onClick=${openMenu}><i></i><i></i></button>
      <a ref=${logo} href="#top" className="logo" aria-label="NOIRÉ home" onClick=${(e) => { e.preventDefault(); go("#top"); }}>NOIRÉ</a>
      <div className="nav-right">
        <nav className="nav-links" aria-label="Secondary">
          ${LINKS.slice(3).map(([l, h]) => html`<a key=${l} href=${h} onClick=${(e) => { e.preventDefault(); go(h); }}>${l}</a>`)}
        </nav>
        <button className="nav-btn" onClick=${() => setCartOpen(true)} aria-label="Open cart">Cart (${count})</button>
      </div>
    </motion.header>`;
}

function Menu({ open, close, go }) {
  return html`
    <${AnimatePresence}>
      ${open && html`
        <motion.div key="menu" className="menu" initial=${{ clipPath: "inset(0 0 100% 0)" }} animate=${{ clipPath: "inset(0 0 0% 0)" }} exit=${{ clipPath: "inset(100% 0 0 0)" }} transition=${{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }} role="dialog" aria-modal="true" aria-label="Menu">
          <button className="menu-close" onClick=${close}>Close ✕</button>
          <ul className="menu-list">
            ${[["Home", "#top"], ...LINKS].map(([l, h], i) => html`
              <li key=${l}>
                <motion.a href=${h} initial=${{ y: "110%" }} animate=${{ y: 0 }} exit=${{ y: "-110%" }} transition=${{ duration: 0.9, ease: [0.76, 0, 0.24, 1], delay: 0.25 + i * 0.07 }} onClick=${(e) => { e.preventDefault(); close(); go(h); }}>${l}</motion.a>
              </li>`)}
          </ul>
          <motion.div className="menu-foot" initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }} transition=${{ delay: 0.8 }}>
            <span>Instagram · TikTok · Pinterest</span><span>hello@noire.studio</span>
          </motion.div>
        </motion.div>`}
    <//>`;
}

/* ------------------------------------------------------------------ */
/* hero                                                                */
/* ------------------------------------------------------------------ */
function Hero({ ready, go }) {
  const root = useRef(null);
  const media = useRef(null);
  const follow = useRef(null);
  const title = useRef(null);
  const [vid, setVid] = useState(true);
  const [fi, setFi] = useState(0);
  const FOLLOW = [P.maroon, P.blazer, P.girlYellow];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(media.current, { yPercent: 12, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(title.current, { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: root.current, start: "20% top", end: "bottom top", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const fx = gsap.quickTo(follow.current, "x", { duration: 0.9, ease: "power3" });
    const fy = gsap.quickTo(follow.current, "y", { duration: 0.9, ease: "power3" });
    const tx = gsap.quickTo(title.current, "x", { duration: 1.2, ease: "power3" });
    const el = root.current;
    let last = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      fx(e.clientX - r.left); fy(e.clientY - r.top);
      tx(((e.clientX / window.innerWidth) - 0.5) * -30);
      gsap.to(follow.current, { opacity: 1, rotate: (e.movementX || 0) * 0.4, duration: 0.5, overwrite: "auto" });
      const now = performance.now();
      if (now - last > 700) { last = now; setFi((i) => (i + 1) % FOLLOW.length); }
    };
    const leave = () => gsap.to(follow.current, { opacity: 0, duration: 0.5 });
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, []);

  return html`
    <section ref=${root} className="hero" id="top">
      <div ref=${media} className="hero-media">
        <img src=${u(P.milan, 2000)} alt="" />
        ${vid && html`<video src=${VIDEO} autoPlay muted loop playsInline preload="auto" onError=${() => setVid(false)} onLoadedData=${(e) => { e.target.style.opacity = 1; }} style=${{ opacity: 0, transition: "opacity 1.5s" }}></video>`}
      </div>
      <div ref=${follow} className="hero-follow"><img src=${u(FOLLOW[fi], 500)} alt="" /></div>
      <div className="hero-scroll"><i></i>Scroll</div>
      <div className="hero-inner">
        <h1 ref=${title} className="display" aria-label="Define your own style">
          <${Split} className="line" text="DEFINE YOUR" scroll=${false} active=${ready} delay=${0.9} />
          <${Split} className="line" text="OWN *style*" scroll=${false} active=${ready} delay=${1.1} />
        </h1>
        <div className="hero-row">
          <motion.p className="hero-sub" initial=${{ opacity: 0, y: 20 }} animate=${ready ? { opacity: 0.85, y: 0 } : {}} transition=${{ delay: 1.6, duration: 1 }}>Discover the new collection.<br />Season 04 — Autumn / Winter.</motion.p>
          <motion.div initial=${{ opacity: 0, y: 30 }} animate=${ready ? { opacity: 1, y: 0 } : {}} transition=${{ delay: 1.8, duration: 1 }}>
            <${Magnetic} as="a" href="#shop" className="btn-light btn-pulse" strength=${0.4} onClick=${(e) => { e.preventDefault(); go("#shop"); }}>Shop now <span className="arrow">→</span><//>
          </motion.div>
        </div>
      </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* collection                                                          */
/* ------------------------------------------------------------------ */
function Collection({ go }) {
  return html`
    <section className="section" id="collection">
      <div className="sec-head">
        <div>
          <p className="eyebrow" style=${{ marginBottom: 24 }}>(01) — New collection</p>
          <${Split} as="h2" className="display" text="The *new* season" />
        </div>
        <p className="eyebrow" style=${{ maxWidth: 260, lineHeight: 1.8 }}>Four silhouettes. One uncompromising point of view. Drop 04 — AW / 25.</p>
      </div>
      <div className="collection-grid">
        ${COLLECTION.map((c, i) => html`
          <a key=${c.no} className="c-card" href="#shop" data-cursor="View" onClick=${(e) => { e.preventDefault(); go("#shop"); }}>
            <${Pic} className="c-media" src=${u(c.a, 1200)} swap=${u(c.b, 1200)} parallax=${6} distort=${true} alt=${c.name} />
            <div className="c-info">
              <div>
                <div className="c-no">${c.no} / 04</div>
                <${Split} as="div" className="c-name" text=${c.name} />
              </div>
              <motion.span className="c-price" initial=${{ opacity: 0, x: 20 }} whileInView=${{ opacity: 1, x: 0 }} viewport=${{ once: true }} transition=${{ duration: 0.9, delay: 0.2 }}>${fmt(c.price)}</motion.span>
            </div>
          </a>`)}
      </div>
      <div className="collection-cta">
        <${Magnetic} as="a" href="#shop" className="btn-dark" onClick=${(e) => { e.preventDefault(); go("#shop"); }}>View collection <span className="arrow">→</span><//>
      </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* marquee                                                             */
/* ------------------------------------------------------------------ */
function Marquee({ light }) {
  const items = ["NOIRÉ", "BE DIFFERENT", "OWN YOUR *style*", "NOIRÉ"];
  const track = (k) => html`
    <div key=${k} className="marquee-track" aria-hidden=${k > 0}>
      ${[0, 1].map((rep) => items.map((t, i) => html`
        <span key=${rep + "-" + i} className="marquee-item">
          ${t.split("*").map((p, j) => (j === 1 ? html`<i key=${j}>${p}</i>` : p))}
          <span className="dash"></span>
        </span>`))}
    </div>`;
  return html`<div className=${`marquee ${light ? "light" : ""}`}>${track(0)}${track(1)}</div>`;
}

/* ------------------------------------------------------------------ */
/* products                                                            */
/* ------------------------------------------------------------------ */
function Swatches({ colors, value, onChange }) {
  return html`<div className="swatches" role="radiogroup" aria-label="Colour">
    ${colors.map(([n, c], i) => html`<button key=${n} role="radio" aria-checked=${value === i} aria-label=${n} title=${n} className=${`swatch ${value === i ? "on" : ""}`} style=${{ background: c }} onClick=${() => onChange(i)}></button>`)}
  </div>`;
}

function ProductCard({ p, i }) {
  const { add, setQuick } = useStore();
  const [ci, setCi] = useState(0);
  const ref = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".p-info", { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", delay: (i % 3) * 0.12, scrollTrigger: { trigger: ref.current, start: "top 90%", once: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return html`
    <motion.article ref=${ref} layout className="p-card" initial=${{ opacity: 0, scale: 0.96 }} animate=${{ opacity: 1, scale: 1 }} exit=${{ opacity: 0, scale: 0.94 }} transition=${{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>
      <${Pic} className="p-media" src=${u(p.a, 900)} swap=${u(p.b, 900)} alt=${p.name} reveal=${true} distort=${true}>
        ${p.tag && html`<span className="p-tag">${p.tag}</span>`}
        <div className="p-actions">
          <button className="qv" onClick=${() => setQuick({ p, ci })}>Quick view</button>
          <button className="add" onClick=${() => add(p, p.colors[ci][0])}>Add to cart</button>
        </div>
      <//>
      <div className="p-info">
        <div>
          <div className="p-cat">${p.cat}</div>
          <h3 className="p-name">${p.name}</h3>
          <${Swatches} colors=${p.colors} value=${ci} onChange=${setCi} />
        </div>
        <span className="p-price">${fmt(p.price)}</span>
      </div>
    </motion.article>`;
}

function Products() {
  const [cat, setCat] = useState("All");
  const list = PRODUCTS.filter((p) => cat === "All" || p.cat === cat);
  useEffect(() => { const t = setTimeout(() => ScrollTrigger.refresh(), 800); return () => clearTimeout(t); }, [cat]);
  return html`
    <section className="section products" id="shop">
      <div className="sec-head">
        <div>
          <p className="eyebrow" style=${{ marginBottom: 24 }}>(02) — Featured</p>
          <${Split} as="h2" className="display" text="Wear the *edit*" />
        </div>
        <p className="eyebrow" style=${{ maxWidth: 260, lineHeight: 1.8 }}>Complimentary shipping over ${fmt(FREE_SHIP)}. Free returns within 30 days.</p>
      </div>
      <div className="filters" role="tablist">
        ${CATS.map((c) => html`<button key=${c} role="tab" aria-selected=${cat === c} className=${`filter ${cat === c ? "on" : ""}`} onClick=${() => setCat(c)}>${c}</button>`)}
      </div>
      <motion.div layout className="product-grid">
        <${AnimatePresence}>
          ${list.map((p, i) => html`<${ProductCard} key=${p.id} p=${p} i=${i} />`)}
        <//>
      </motion.div>
    </section>`;
}

function QuickView() {
  const { quick, setQuick, add } = useStore();
  const [size, setSize] = useState("M");
  const [ci, setCi] = useState(0);
  useEffect(() => { if (quick) { setCi(quick.ci); setSize("M"); } }, [quick]);
  const p = quick && quick.p;
  const close = () => setQuick(null);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return html`
    <${AnimatePresence}>
      ${p && html`<motion.div key="ov" className="overlay" initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }} onClick=${close} />`}
      ${p && html`
        <div key="wrap" className="qv-wrap">
          <motion.div className="qv-modal" role="dialog" aria-modal="true" aria-label=${p.name} initial=${{ opacity: 0, y: 60, scale: 0.97 }} animate=${{ opacity: 1, y: 0, scale: 1 }} exit=${{ opacity: 0, y: 40, scale: 0.97 }} transition=${{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}>
            <button className="qv-close" onClick=${close}>Close ✕</button>
            <div className="qv-img"><img src=${u(p.a, 1000)} alt=${p.name} /></div>
            <div className="qv-body">
              <span className="eyebrow" style=${{ color: "var(--grey)" }}>${p.cat}</span>
              <h3>${p.name}</h3>
              <strong style=${{ fontWeight: 500, letterSpacing: ".08em" }}>${fmt(p.price)}</strong>
              <p>${p.blurb}</p>
              <div><span className="eyebrow">Colour — ${p.colors[ci][0]}</span><${Swatches} colors=${p.colors} value=${ci} onChange=${setCi} /></div>
              <div><span className="eyebrow">Size</span><div className="sizes" style=${{ marginTop: 10 }}>${["XS", "S", "M", "L", "XL"].map((s) => html`<button key=${s} className=${`size ${size === s ? "on" : ""}`} onClick=${() => setSize(s)}>${s}</button>`)}</div></div>
              <${Magnetic} className="btn-solid" onClick=${() => { add(p, p.colors[ci][0], size); close(); }}>Add to cart — ${fmt(p.price)}<//>
            </div>
          </motion.div>
        </div>`}
    <//>`;
}

/* ------------------------------------------------------------------ */
/* cart drawer                                                         */
/* ------------------------------------------------------------------ */
function CartDrawer() {
  const { cartOpen, setCartOpen, items, setQty, remove, subtotal } = useStore();
  const pct = Math.min(subtotal / FREE_SHIP, 1);
  const close = () => setCartOpen(false);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return html`
    <${AnimatePresence}>
      ${cartOpen && html`<motion.div key="ov" className="overlay" initial=${{ opacity: 0 }} animate=${{ opacity: 1 }} exit=${{ opacity: 0 }} onClick=${close} />`}
      ${cartOpen && html`
        <motion.aside key="dr" className="drawer" role="dialog" aria-modal="true" aria-label="Shopping cart" initial=${{ x: "100%" }} animate=${{ x: 0 }} exit=${{ x: "100%" }} transition=${{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}>
          <div className="drawer-head"><h3>Your bag</h3><button className="eyebrow" onClick=${close}>Close ✕</button></div>
          <div className="drawer-body" data-lenis-prevent>
            ${items.length === 0 ? html`<div className="drawer-empty">Your bag is empty.</div>` : html`
              <${AnimatePresence} initial=${false}>
                ${items.map((it) => html`
                  <motion.div key=${it.key} layout className="line-item" initial=${{ opacity: 0, x: 40 }} animate=${{ opacity: 1, x: 0 }} exit=${{ opacity: 0, x: 60, height: 0, paddingTop: 0, paddingBottom: 0 }} transition=${{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}>
                    <${Pic} reveal=${false} src=${u(it.p.a, 300)} alt=${it.p.name} />
                    <div>
                      <h4>${it.p.name}</h4>
                      <small>${it.color} · ${it.size}</small>
                      <div className="qty"><button aria-label="Decrease" onClick=${() => setQty(it.key, it.qty - 1)}>−</button><span>${it.qty}</span><button aria-label="Increase" onClick=${() => setQty(it.key, it.qty + 1)}>+</button></div>
                    </div>
                    <div style=${{ textAlign: "right", display: "grid", alignContent: "space-between" }}>
                      <span style=${{ fontSize: 13 }}>${fmt(it.p.price * it.qty)}</span>
                      <button className="rm" onClick=${() => remove(it.key)}>Remove</button>
                    </div>
                  </motion.div>`)}
              <//>`}
          </div>
          <div className="drawer-foot">
            <div><div className="freebar"><motion.i initial=${false} animate=${{ scaleX: pct }} transition=${{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} /></div>
              <p className="freenote" style=${{ marginTop: 8 }}>${pct >= 1 ? "You've unlocked complimentary shipping." : `${fmt(FREE_SHIP - subtotal)} away from complimentary shipping`}</p></div>
            <div className="total"><span>Subtotal</span><b>${fmt(subtotal)}</b></div>
            <${Magnetic} className="btn-solid" strength=${0.15} onClick=${() => alert("Demo store — checkout is not connected.")}>Checkout <span className="arrow">→</span><//>
          </div>
        </motion.aside>`}
    <//>`;
}

function Toast({ msg }) {
  return html`<${AnimatePresence}>${msg && html`<motion.div key=${msg} className="toast" style=${{ x: "-50%" }} initial=${{ y: 80, opacity: 0 }} animate=${{ y: 0, opacity: 1 }} exit=${{ y: 80, opacity: 0 }} transition=${{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>${msg}</motion.div>`}<//>`;
}

/* ------------------------------------------------------------------ */
/* story                                                               */
/* ------------------------------------------------------------------ */
function Story() {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".story-copy p", { y: 40, opacity: 0, stagger: 0.18, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".story-copy", start: "top 85%", once: true } });
      gsap.utils.toArray(".stat b").forEach((el) => {
        const end = +el.dataset.n; const o = { v: 0 };
        gsap.to(o, { v: end, duration: 2.2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%", once: true }, onUpdate: () => { el.textContent = Math.round(o.v) + (el.dataset.s || ""); } });
      });
      gsap.to(".story-imgs .b", { y: -60, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);
  return html`
    <section ref=${root} className="section story" id="story">
      <div className="story-grid">
        <div>
          <p className="eyebrow" style=${{ marginBottom: 28 }}>(03) — The house</p>
          <${Split} as="h2" className="display" text="More than fashion. It's an *attitude.*" />
          <div className="story-copy">
            <p>NOIRÉ was founded on a simple refusal: to dress the way we were told to. Born in the back rooms of Paris and cut in small Portuguese ateliers, every piece is a study in proportion — oversized without excess, tailored without restraint.</p>
            <p>We make fewer things, in better materials, for people who would rather set the tone than follow it. Dark by nature, warm by design.</p>
          </div>
          <div className="stats">
            <div className="stat"><b data-n="12" data-s="">0</b><span>Ateliers</span></div>
            <div className="stat"><b data-n="100" data-s="%">0</b><span>Organic cotton</span></div>
            <div className="stat"><b data-n="48" data-s="k">0</b><span>Community</span></div>
          </div>
        </div>
        <div className="story-imgs">
          <${Pic} className="a" src=${u(P.suit, 1400)} parallax=${8} alt="Editorial portrait" />
          <${Pic} className="b" src=${u(P.watch, 900)} alt="Detail" />
        </div>
      </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* campaign                                                            */
/* ------------------------------------------------------------------ */
function Campaign({ go }) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 1 };
      gsap.fromTo(".campaign-bg", { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: st });
      gsap.fromTo(".camp-l1", { xPercent: -14 }, { xPercent: 10, ease: "none", scrollTrigger: st });
      gsap.fromTo(".camp-l2", { xPercent: 14 }, { xPercent: -10, ease: "none", scrollTrigger: st });
      gsap.from(".campaign-inner p, .campaign-inner .btn", { y: 40, opacity: 0, stagger: 0.15, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".campaign-inner p", start: "top 90%", once: true } });
    }, root);
    return () => ctx.revert();
  }, []);
  return html`
    <section ref=${root} className="campaign" id="campaign">
      <div className="campaign-bg"><img src=${u(P.circle, 2000)} alt="" loading="lazy" /></div>
      <span className="camp-tag tl">Campaign — AW/25</span>
      <span className="camp-tag bl">Shot in Lisbon</span>
      <span className="camp-tag br">Film 01 / 03</span>
      <div className="campaign-inner">
        <h2 className="display">
          <span className="camp-l1" style=${{ display: "block" }}>After <em>dark</em></span>
          <span className="camp-l2 outline" style=${{ display: "block" }}>we shine</span>
        </h2>
        <p>The Autumn / Winter campaign — a love letter to the hours between midnight and morning.</p>
        <${Magnetic} as="a" href="#shop" className="btn-light" onClick=${(e) => { e.preventDefault(); go("#shop"); }}>Watch the film <span className="arrow">→</span><//>
      </div>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* newsletter & footer                                                 */
/* ------------------------------------------------------------------ */
function Newsletter() {
  const [v, setV] = useState("");
  const [done, setDone] = useState(false);
  const [focus, setFocus] = useState(false);
  const submit = (e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(v)) setDone(true); };
  return html`
    <section className="section news" id="newsletter">
      <p className="eyebrow" style=${{ marginBottom: 28 }}>(04) — The list</p>
      <${Split} as="h2" className="display" text="Join the *inner* circle" />
      <p>Early access to drops, private sales and stories from the studio. No noise — only noir.</p>
      <${AnimatePresence} mode="wait">
        ${done ? html`<motion.div key="ok" className="news-ok" initial=${{ opacity: 0, y: 30 }} animate=${{ opacity: 1, y: 0 }} transition=${{ duration: 0.9 }}>Welcome to NOIRÉ.</motion.div>` : html`
          <motion.form key="f" className="field" onSubmit=${submit} noValidate exit=${{ opacity: 0, y: -20 }}>
            <div className=${`field-wrap ${focus || v ? "up" : ""}`}>
              <label htmlFor="nl-email">Your email address</label>
              <input id="nl-email" type="email" value=${v} onChange=${(e) => setV(e.target.value)} onFocus=${() => setFocus(true)} onBlur=${() => setFocus(false)} autoComplete="email" />
              <span className="ul"></span>
            </div>
            <${Magnetic} type="submit" className="btn-solid">Subscribe <span className="arrow">→</span><//>
          </motion.form>`}
      <//>
    </section>`;
}

function Footer({ go }) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".foot-big", { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);
  const [em, setEm] = useState("");
  const [sent, setSent] = useState(false);
  const col = (title, arr) => html`<div><h5>${title}</h5><ul>${arr.map(([l, h]) => html`<li key=${l}><a href=${h} onClick=${(e) => { if (h.startsWith("#")) { e.preventDefault(); go(h); } }}>${l}</a></li>`)}</ul></div>`;
  return html`
    <footer ref=${root} className="footer" id="contact">
      <div className="foot-grid">
        <div>
          <h5>Contact</h5>
          <p>14 Rue des Archives<br />75003 Paris, France<br /><br />hello@noire.studio<br />+33 1 00 00 00 00</p>
        </div>
        ${col("Navigate", [["New collection", "#collection"], ["Shop", "#shop"], ["Story", "#story"], ["Campaign", "#campaign"]])}
        ${col("Follow", [["Instagram", "https://instagram.com"], ["TikTok", "https://tiktok.com"], ["Pinterest", "https://pinterest.com"], ["YouTube", "https://youtube.com"]])}
        <div>
          <h5>Newsletter</h5>
          <p>${sent ? "Thank you — see you inside." : "New drops, first."}</p>
          ${!sent && html`<form className="foot-mini" onSubmit=${(e) => { e.preventDefault(); if (/\S+@\S+\.\S+/.test(em)) setSent(true); }}><input type="email" placeholder="Email address" aria-label="Email address" value=${em} onChange=${(e) => setEm(e.target.value)} /><button type="submit" aria-label="Subscribe">→</button></form>`}
        </div>
      </div>
      <div className="foot-big" aria-hidden="true">NOIRÉ</div>
      <div className="foot-bottom"><span>© 2025 NOIRÉ Studio</span><span>Privacy · Terms · Shipping</span><span>Define your own style</span></div>
    </footer>`;
}

/* ------------------------------------------------------------------ */
/* app                                                                 */
/* ------------------------------------------------------------------ */
function App() {
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quick, setQuick] = useState(null);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState("");
  const curtain = useAnimationControls();

  // smooth scroll
  useEffect(() => {
    lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); lenis = null; };
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (!ready || menu || cartOpen || quick) lenis.stop(); else lenis.start();
  }, [ready, menu, cartOpen, quick]);

  const onDone = useCallback(() => { setReady(true); setTimeout(() => ScrollTrigger.refresh(), 300); }, []);

  // page transition: curtain wipes in, jump, wipes out
  const go = useCallback(async (hash) => {
    curtain.set({ transformOrigin: "bottom" });
    await curtain.start({ scaleY: 1, transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } });
    if (lenis) lenis.scrollTo(hash === "#top" ? 0 : hash, { immediate: true, offset: hash === "#top" ? 0 : -10, force: true });
    await new Promise((r) => setTimeout(r, 120));
    curtain.set({ transformOrigin: "top" });
    await curtain.start({ scaleY: 0, transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } });
    ScrollTrigger.refresh();
  }, []);

  const add = (p, color, size = "M") => {
    const key = `${p.id}-${color}-${size}`;
    setItems((cur) => (cur.find((i) => i.key === key) ? cur.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)) : [...cur, { key, p, color, size, qty: 1 }]));
    setToast(`${p.name} added`);
    setTimeout(() => setToast(""), 2200);
  };
  const setQty = (key, q) => setItems((cur) => (q < 1 ? cur.filter((i) => i.key !== key) : cur.map((i) => (i.key === key ? { ...i, qty: q } : i))));
  const remove = (key) => setItems((cur) => cur.filter((i) => i.key !== key));
  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.p.price * i.qty, 0);

  const store = { items, add, setQty, remove, count, subtotal, cartOpen, setCartOpen, quick, setQuick };

  return html`
    <${Store.Provider} value=${store}>
      <svg width="0" height="0" style=${{ position: "absolute" }} aria-hidden="true">
        <filter id="distort" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap id="disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      ${!ready && html`<${Loader} onDone=${onDone} />`}
      <${Cursor} />
      <${motion.div} className="curtain" initial=${{ scaleY: 0 }} animate=${curtain} style=${{ transformOrigin: "bottom" }} />
      <${Nav} go=${go} openMenu=${() => setMenu(true)} ready=${ready} />
      <${Menu} open=${menu} close=${() => setMenu(false)} go=${go} />
      <main>
        <${Hero} ready=${ready} go=${go} />
        <${Collection} go=${go} />
        <${Marquee} />
        <${Products} />
        <${Marquee} light=${true} />
        <${Story} />
        <${Campaign} go=${go} />
        <${Newsletter} />
      </main>
      <${Footer} go=${go} />
      <${QuickView} />
      <${CartDrawer} />
      <${Toast} msg=${toast} />
    <//>`;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);
