// Gemeinsame Kopfleiste: 🏠 .home-btn, 🔊 .mute-btn, ⛶ .fs-btn (🔄 verdrahtet jedes Spiel selbst).
// Ton ist anfangs aus und gilt für alle Spiele (gleicher Speicher-Schlüssel). Sound.tone() fragt SPG.muted ab.
const SPG = {
  muted: (() => { try { return localStorage.getItem('spg-muted') !== '0'; } catch (e) { return true; } })(),
  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('spg-muted', m ? '1' : '0'); } catch (e) {}
    this.render();
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
  if (e.key === 'spg-muted') { SPG.muted = e.newValue !== '0'; SPG.render(); }
});
// Zur Spieleübersicht nur online, die heruntergeladene Datei steht allein.
// Vollbild gibt es nicht überall (z. B. iPhone).
if (location.protocol === 'file:') for (const a of document.querySelectorAll('.home-btn')) a.hidden = true;
if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
  for (const b of document.querySelectorAll('.fs-btn')) b.hidden = true;
}
SPG.render();
