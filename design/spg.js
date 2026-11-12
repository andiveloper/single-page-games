// Gemeinsame Bausteine aller Spiele (DESIGN.md „Verhalten“), nicht in den Spielen kopieren:
//  - Kopfleiste: 🏠 .home-btn, 🔊 .mute-btn, ⛶ .fs-btn (🔄 verdrahtet jedes Spiel selbst)
//  - SPG.muted: Ton ist anfangs aus und gilt für alle Spiele; Änderungen melden sich als Event 'spg-mute' am document
//  - SPG.sound.tone(…) / .noise(…) / .win(): Web Audio, schweigt von selbst bei Ton aus
//  - SPG.buzz(ms), SPG.confetti.start(ms) / .stop(), SPG.store.get(key, fallback) / .set(key, value)
//  - SPG.later(fn, ms) / SPG.clearLater(): verzögerte Spielschritte, die ein neues Spiel abbricht
//  - $(id) = document.getElementById(id)
const $ = (id) => document.getElementById(id);
const SPG = {
  muted: (() => { try { return localStorage.getItem('spg-muted') !== '0'; } catch (e) { return true; } })(),
  setMuted(m) {
    this.muted = m;
    this.store.set('spg-muted', m ? 1 : 0);
    this.render();
    document.dispatchEvent(new Event('spg-mute'));
  },
  // Speichern (Highscore, Einstellungen) als JSON; ohne localStorage (privat, voll) einfach nichts.
  store: {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
  },
  // Verzögerte Schritte (Gewinn-Dialog, nächste Runde …). clearLater() bei neuem Spiel, damit nichts
  // aus dem alten Spiel über dem neuen auftaucht.
  timers: new Set(),
  later(fn, ms) {
    const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.add(id);
    return id;
  },
  clearLater() {
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
  },
  buzz(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  },
  // Töne ohne Dateien. ready() vor eigenen Klängen mit SPG.sound.ctx; tone/noise/win prüfen es selbst.
  sound: {
    ctx: null,
    ready() {
      if (SPG.muted) return false;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        try { this.ctx = new AC(); } catch (e) { return false; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },
    tone(freq, start, dur, type = 'sine', vol = 0.3, endFreq) {
      if (!this.ready()) return;
      const t = this.ctx.currentTime + start;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur * 0.8);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    // Kurzes, ausklingendes Rauschen (Plopp, Klatschen), hochpassgefiltert
    noise(start, dur, vol, freq = 1500) {
      if (!this.ready()) return;
      const ctx = this.ctx;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'highpass';
      filter.frequency.value = freq;
      gain.gain.value = vol;
      src.buffer = buf;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(ctx.currentTime + start);
    },
    // Gemeinsame Gewinn-Fanfare
    win() {
      [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, i * 0.1, 0.38, 'triangle', 0.28));
    }
  },
  // Konfetti über allem (canvas.confetti); ms = wie lange neues nachfällt. Bei reduzierter Bewegung keins.
  confetti: {
    raf: null,
    canvas() {
      let c = document.querySelector('canvas.confetti');
      if (!c) { c = document.createElement('canvas'); c.className = 'confetti'; c.hidden = true; document.body.appendChild(c); }
      return c;
    },
    start(ms = 7000) {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const c = this.canvas();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px';
      c.style.height = innerHeight + 'px';
      c.hidden = false;
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const n = Math.round(Math.min(160, innerWidth / 5));
      const parts = Array.from({ length: n }, () => ({
        x: Math.random() * innerWidth,
        y: -Math.random() * innerHeight,
        s: Math.random() * 10 + 6,
        c: colors[(Math.random() * colors.length) | 0],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2.5,
        r: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10
      }));
      const end = performance.now() + ms;
      const loop = (now) => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (const p of parts) {
          p.x += p.vx; p.y += p.vy; p.r += p.vr;
          if (p.y > innerHeight + 20 && now < end) p.y = -20;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r * Math.PI / 180);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        }
        if (now < end + 4000) this.raf = requestAnimationFrame(loop);
        else this.stop();
      };
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(this.raf);
      this.raf = null;
      const c = document.querySelector('canvas.confetti');
      if (c) c.hidden = true;
    }
  },
  isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
  toggleFullscreen() {
    const root = document.documentElement;
    try {
      if (this.isFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else Promise.resolve((root.requestFullscreen || root.webkitRequestFullscreen).call(root)).catch(() => {});
    } catch (e) {}
  },
  render() {
    for (const b of document.querySelectorAll('.mute-btn')) {
      b.textContent = this.muted ? '🔇' : '🔊';
      b.setAttribute('aria-pressed', String(this.muted));
    }
    for (const b of document.querySelectorAll('.fs-btn')) {
      b.classList.toggle('active', this.isFullscreen());
      b.setAttribute('aria-pressed', String(this.isFullscreen()));
    }
  }
};
document.addEventListener('click', (e) => {
  if (!e.target.closest) return;
  if (e.target.closest('.mute-btn')) SPG.setMuted(!SPG.muted);
  if (e.target.closest('.fs-btn')) SPG.toggleFullscreen();
});
document.addEventListener('fullscreenchange', () => SPG.render());
document.addEventListener('webkitfullscreenchange', () => SPG.render());
window.addEventListener('storage', (e) => {
  if (e.key === 'spg-muted') { SPG.muted = e.newValue !== '0'; SPG.render(); document.dispatchEvent(new Event('spg-mute')); }
});
// Zur Spieleübersicht nur online, die heruntergeladene Datei steht allein.
// Vollbild gibt es nicht überall (z. B. iPhone).
if (location.protocol === 'file:') for (const a of document.querySelectorAll('.home-btn')) a.hidden = true;
if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
  for (const b of document.querySelectorAll('.fs-btn')) b.hidden = true;
}
// Dialoge beginnen unter der Kopfleiste, die am schmalen Handy zweireihig ist.
const spgTop = document.querySelector('.topbar');
if (spgTop) {
  const setTop = () => document.documentElement.style.setProperty('--spg-top', Math.ceil(spgTop.getBoundingClientRect().bottom) + 'px');
  setTop();
  if (window.ResizeObserver) new ResizeObserver(setTop).observe(spgTop);
  window.addEventListener('resize', setTop);
}
SPG.render();
