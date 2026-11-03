
const W = 320, H = 180, GY = 148, N = 6, WORLD = N * W;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = a => `rgb(${a.map(Math.round)})`;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const KEYS = [[0, '#8fd0ff', '#ffe9b0'], [.3, '#4fb3f5', '#b9e6ff'], [.6, '#6aa8e8', '#ffd9a0'],
  [.78, '#ff8a4c', '#ffd27a'], [.88, '#4a3a7a', '#ff8a6a'], [1, '#070b25', '#1a2455']]
  .map(k => [k[0], hex(k[1]), hex(k[2])]);
function skyAt(p) {
  for (let i = 1; i < KEYS.length; i++) if (p <= KEYS[i][0]) {
    const t = (p - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]);
    return [mixA(KEYS[i - 1][1], KEYS[i][1], t), mixA(KEYS[i - 1][2], KEYS[i][2], t)];
  }
  return [KEYS[5][1], KEYS[5][2]];
}

let p = 0, target = 0, t = 0, face = 1, moving = false, started = false, keyDir = 0, btnDir = 0;
let cam = 0, charX = 40, sky;

const files = ['bird', 'sprinklertruck', 'market', 'motorcycle', 'guzheng', 'river'];
const sounds = files.map(f => { const a = document.getElementById(f); a.volume = 0; a.fade = 0; return a; });
let master = 0.8, muted = false;
function updateAudio() {
  if (!started) return;
  const s = p * N;
  sounds.forEach((a, i) => {
    const goal = clamp(1 - Math.abs(s - (i + .5)) / .75);
    a.fade += (goal - a.fade) * 0.06;
    a.volume = clamp(a.fade * master);
    a.muted = muted;
  });
}

function bird(x, y) { R(x, y, 4, 2, '#222'); Math.floor(t * 8) % 2 ? R(x, y - 2, 2, 2, '#222') : R(x + 1, y + 2, 2, 2, '#222'); }
function tree(x) { R(x, GY - 22, 4, 22, '#6b4423'); R(x - 8, GY - 40, 20, 18, '#3b8b3b'); R(x - 4, GY - 46, 12, 8, '#4aa84a'); }
function buildings(ox, off) {
  for (let k = 0; k < 5; k++) {
    const bx = ox + k * 66 - 6, bh = 56 + ((k + off) * 23 % 44);
    R(bx, GY - bh, 60, bh, ['#8d99ae', '#b8b8d1', '#a3b18a'][(k + off) % 3]);
    for (let wy = GY - bh + 8; wy < GY - 14; wy += 14) for (let wx = 0; wx < 44; wx += 14) R(bx + 8 + wx, wy, 6, 8, '#fff6c9');
  }
}
function roof(x, y, w) {
  for (let i = 0; i < 8; i++) { const inset = (7 - i) * 3; R(x + inset, y + i, w - inset * 2, 1, i % 2 ? '#3d4a52' : '#4d5d66'); }
  R(x - 2, y + 6, 6, 2, '#3d4a52'); R(x + w - 4, y + 6, 6, 2, '#3d4a52');
}
function moto(x, y, c) {
  R(x, y + 8, 6, 6, '#111'); R(x + 16, y + 8, 6, 6, '#111'); R(x + 4, y + 3, 14, 6, c);
  R(x + 17, y, 2, 5, '#555'); R(x + 8, y - 8, 5, 10, '#333'); R(x + 8, y - 12, 5, 5, '#f1c27d'); R(x + 8, y - 12, 5, 2, c);
}
function water(ox, c1, c2) {
  R(ox, GY + 8, W, H - GY - 8, c1);
  for (let k = 0; k < 14; k++) R(ox + (k * 47 + Math.floor(t * 8)) % W, GY + 14 + (k * 13 % 24), 10, 1, c2);
}

function s0(ox) {
  R(ox, 0, W, GY, '#f0d9b5');
  for (let x = 0; x < W; x += 16) R(ox + x, 0, 2, GY, '#e6cba0');
  R(ox, GY, W, H - GY, '#9a6b3f'); R(ox, GY + 12, W, 1, '#7d5530'); R(ox, GY + 24, W, 1, '#7d5530');
  R(ox + 130, 28, 64, 52, '#6b4423'); R(ox + 134, 32, 56, 44, rgb(sky[0]));
  ctx.save(); ctx.beginPath(); ctx.rect(ox + 134, 32, 56, 44); ctx.clip();
  for (let k = 0; k < 2; k++) bird(ox + 134 + ((t * 20 + k * 30) % 70) - 8, 45 + k * 14 + Math.sin(t * 3 + k) * 3);
  ctx.restore();
  R(ox + 160, 32, 2, 44, '#6b4423'); R(ox + 134, 52, 56, 2, '#6b4423');
  R(ox + 60, 40, 22, 28, '#f4a261'); R(ox + 64, 44, 14, 20, '#fff3');
  R(ox + 14, 98, 6, 50, '#6b4423'); R(ox + 14, 118, 92, 30, '#8b5a2b'); R(ox + 20, 112, 84, 14, '#fff');
  R(ox + 22, 106, 18, 8, '#fdf6e3');
  if (p < 0.03) { R(ox + 25, 102, 10, 8, '#f1c27d'); R(ox + 24, 99, 12, 4, '#6b3e1d'); R(ox + 24, 99, 3, 12, '#6b3e1d'); R(ox + 30, 106, 3, 1, '#222'); }
  R(ox + 40, 108, 66, 20, '#5b8def'); R(ox + 40, 114, 66, 3, '#8fb3ff');
  R(ox + 282, 86, 30, 62, '#6b4423'); R(ox + 304, 118, 3, 3, '#ffd166');
}
function s1(ox) {
  buildings(ox, 0); tree(ox + 36); tree(ox + 160); tree(ox + 270);
  R(ox, GY, W, 8, '#c9c9c9'); R(ox, GY + 8, W, H - GY - 8, '#4a4e57');
  for (let x = 0; x < W; x += 32) R(ox + x, GY + 26, 16, 2, '#e9e9e9');
  const tx = ox + ((t * 18) % 420) - 60, ty = GY + 4;
  R(tx, ty, 34, 18, '#2a9df4'); R(tx + 34, ty + 6, 14, 12, '#f2f2f2'); R(tx + 40, ty + 8, 6, 4, '#8ecae6');
  R(tx + 6, ty + 16, 8, 8, '#222'); R(tx + 34, ty + 16, 8, 8, '#222');
  for (let k = 0; k < 14; k++) R(tx - 2 - k * 2.5, ty + 8 - Math.sin(k / 14 * Math.PI) * 12 + ((k * 7 + Math.floor(t * 10)) % 3), 2, 2, '#bfe9ff');
}
function s2(ox) {
  R(ox, GY - 70, W, 70, '#d4a373'); R(ox, GY, W, 8, '#b08968'); R(ox, GY + 8, W, H, '#8a6a4f');
  const cols = [['#e63946', '#f4a261'], ['#fff', '#f1faee'], ['#52b788', '#95d5b2']];
  for (let k = 0; k < 3; k++) {
    const x = ox + 14 + k * 104;
    R(x, GY - 30, 72, 30, '#7f5539'); R(x, GY - 62, 3, 34, '#4a2c17'); R(x + 69, GY - 62, 3, 34, '#4a2c17');
    for (let j = 0; j < 9; j++) R(x + j * 8, GY - 62, 8, 14, j % 2 ? '#e63946' : '#fff');
    for (let j = 0; j < 6; j++) {
      R(x + 6 + j * 11, GY - 36, 8, 6, cols[k][j % 2]);
      if (k === 1) R(x + 8 + j * 11, GY - 44 - ((t * 10 + j * 5) % 12), 2, 3, '#fffb');
    }
  }
  for (let k = 0; k < 4; k++) { const lx = ox + 40 + k * 80; R(lx + 4, 0, 1, 14 + Math.sin(t * 2 + k), '#333'); R(lx, 14, 10, 13, '#e63946'); R(lx + 2, 27, 6, 3, '#ffd166'); }
}
function s3(ox) {
  buildings(ox, 2);
  R(ox, GY - 4, W, H - GY + 4, '#3d4048');
  for (let j = 0; j < 12; j++) R(ox + 90 + j * 12, GY - 2, 7, 10, '#f1f1f1');
  R(ox + 70, GY - 50, 3, 50, '#222'); R(ox + 66, GY - 62, 11, 18, '#222');
  const red = Math.floor(t / 2) % 2 === 0;
  R(ox + 69, GY - 59, 5, 5, red ? '#ff3b3b' : '#522'); R(ox + 69, GY - 51, 5, 5, red ? '#252' : '#3bff5b');
  [['#e63946', 0, GY + 14], ['#ffd166', 110, GY + 28], ['#2a9df4', 230, GY + 14], ['#52b788', 330, GY + 28]]
    .forEach(([c, off, y]) => moto(ox + W + 40 - ((t * 70 + off) % (W + 120)), y, c));
}
function s4(ox) {
  R(ox, GY, W, 8, '#b7a99a'); water(ox, '#5f7f8c', '#8fb0bc');
  R(ox + 10, GY - 64, 90, 64, '#f3efe6'); roof(ox + 4, GY - 72, 102);
  for (let k = 0; k < 3; k++) R(ox + 20 + k * 26, GY - 48, 12, 18, '#5a3e2b');
  R(ox + 126, GY - 50, 108, 50, '#a1452e'); roof(ox + 116, GY - 68, 128); roof(ox + 126, GY - 84, 108);
  for (let k = 0; k < 4; k++) R(ox + 134 + k * 26, GY - 46, 5, 46, '#b5252b');
  R(ox + 250, GY - 48, 60, 48, '#f3efe6'); roof(ox + 244, GY - 56, 72); R(ox + 266, GY - 34, 14, 20, '#5a3e2b');
  for (let k = 0; k < 6; k++) { const x = ox + 20 + k * 50; R(x, 82 + Math.sin(t * 2 + k), 8, 11, '#e63946'); R(x + 2, 85, 4, 4, '#ffd166'); }
  R(ox + ((t * 6) % 360) - 20, GY + 16, 28, 5, '#6b4423'); R(ox + ((t * 6) % 360) - 12, GY + 10, 10, 6, '#e63946');
}
function s5(ox) {
  R(ox, GY - 30, W, 30, '#14213d'); for (let k = 0; k < 8; k++) R(ox + k * 42, GY - 40 + (k * 7 % 12), 30, 14, '#14213d');
  R(ox, GY, W, 8, '#2d6a4f'); water(ox, '#1d3a6b', '#5c7fc0');
  R(ox + 250 - 50, 40, 70, GY - 40, '#3a3f4b'); R(ox + 214, 40, 70, 6, '#4a505e');
  for (let j = 0; j < 7; j++) for (let y = 46; y < GY; y += 6)
    R(ox + 216 + j * 8, y + (Math.floor(t * 14) + j * 2) % 6, 6, 4, j % 2 ? '#cfeeff' : '#8fd3ff');
  for (let k = 0; k < 8; k++) R(ox + 208 + k * 9 + Math.sin(t * 4 + k) * 2, GY - 4 + Math.sin(t * 5 + k) * 2, 6, 4, '#ffffff99');
  for (let k = 0; k < 12; k++) if (Math.sin(t * 3 + k) > -0.3)
    R(ox + (k * 53 + Math.sin(t + k) * 10 + 300) % 200, GY - 20 - (k * 17 % 50) + Math.sin(t * 1.3 + k) * 6, 2, 2, '#e9ff70');
}

function girl(x, y, walking) {
  const f = walking ? Math.floor(t * 8) % 2 : 0, yy = y - f;
  ctx.save(); ctx.translate(Math.round(x), 0); if (face < 0) ctx.scale(-1, 1);
  R(-7, yy - 12, 4, 8, '#3a7bd5'); R(-7, yy - 12, 4, 2, '#2a5db0');
  R(-5, yy - 20, 10, 3, '#6b3e1d'); R(-5, yy - 18, 3, 9, '#6b3e1d');
  R(-3, yy - 17, 7, 6, '#f1c27d'); R(2, yy - 15, 1, 2, '#222');
  R(-3, yy - 11, 7, 7, '#e8556d'); R(-3, yy - 5, 7, 2, '#334');
  R(-3, y - 4 + 0, 2, f ? 4 : 3, '#f1c27d'); R(1, y - 4, 2, f ? 3 : 4, '#f1c27d');
  ctx.restore();
  const s = p * N; if (s > 2.35 && s < 2.65) { R(x - 4, yy - 32, 8, 6, '#fff'); R(x - 2, yy - 34, 4, 2, '#fff'); }
}

function draw() {
  sky = skyAt(p);
  for (let i = 0; i < 12; i++) R(0, i * 13, W, 14, rgb(mixA(sky[0], sky[1], i / 11)));
  R(0, GY, W, H - GY, '#222');
  const nightf = clamp((p - 0.78) / 0.15);
  if (p < 0.9) { const sx = 30 + p / 0.9 * 260, sy = GY + 8 - Math.sin(Math.PI * (0.05 + 0.9 * p / 0.9)) * 110;
    const c = p > 0.7 ? '#ff7b3a' : '#ffd23f'; R(sx - 6, sy - 7, 12, 14, c); R(sx - 7, sy - 6, 14, 12, c); }
  ctx.globalAlpha = nightf;
  for (let k = 0; k < 40; k++) if ((k + Math.floor(t * 2)) % 7) R((k * 97) % W, (k * 53) % 100, 1, 1, '#fff');
  R(250, 24, 10, 10, '#fff6c9'); R(254, 23, 8, 10, rgb(sky[0]));
  ctx.globalAlpha = 0.8 * (1 - nightf);
  for (let k = 0; k < 4; k++) { const cx = ((k * 110 - cam * 0.2 + t * 3) % 440 + 440) % 440 - 60; R(cx, 20 + k * 14, 28, 6, '#fff'); R(cx + 6, 16 + k * 14, 16, 4, '#fff'); }
  ctx.globalAlpha = 1;
  [s0, s1, s2, s3, s4, s5].forEach((fn, i) => { const ox = i * W - cam; if (ox < W && ox + W > 0) fn(ox); });
  girl(charX - cam, GY, moving);
  ctx.fillStyle = `rgba(8,10,50,${nightf * 0.4})`; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(255,120,40,${clamp(1 - Math.abs(p - 0.78) / 0.12) * 0.18})`; ctx.fillRect(0, 0, W, H);
}

function hud() {
  const mins = 420 + p * 870, h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  document.getElementById('clock').textContent =
    String(h % 12 || 12).padStart(2, '0') + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM');
  document.getElementById('bar').style.width = p * 100 + '%';
}

function loop(ts) {
  t = ts / 1000;
  target = clamp(target + (keyDir + btnDir) * 0.0018);
  const d = target - p; p += d * 0.12; moving = Math.abs(d) > 0.0003; if (moving) face = d > 0 ? 1 : -1;
  charX = 40 + p * (WORLD - 80); cam = clamp(charX - 110, 0, WORLD - W);
  draw(); updateAudio(); hud();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const hint = document.getElementById('hint');
const nudge = v => { if (!started) return; target = clamp(target + v); hint.style.display = 'none'; };
window.addEventListener('wheel', e => { e.preventDefault(); nudge(e.deltaY * 0.0003); }, { passive: false });
window.addEventListener('keydown', e => {
  if (['ArrowRight', 'ArrowDown', 'd'].includes(e.key)) keyDir = 1;
  if (['ArrowLeft', 'ArrowUp', 'a'].includes(e.key)) keyDir = -1;
  if (keyDir) hint.style.display = 'none';
});
window.addEventListener('keyup', () => keyDir = 0);
let ly = 0;
cv.addEventListener('touchstart', e => ly = e.touches[0].clientY);
cv.addEventListener('touchmove', e => { const y = e.touches[0].clientY; nudge((ly - y) * 0.002); ly = y; });
[['left', -1], ['right', 1]].forEach(([id, v]) => {
  const b = document.getElementById(id);
  ['mousedown', 'touchstart'].forEach(ev => b.addEventListener(ev, e => { e.preventDefault(); btnDir = v; hint.style.display = 'none'; }));
  ['mouseup', 'mouseleave', 'touchend'].forEach(ev => b.addEventListener(ev, () => btnDir = 0));
});
document.getElementById('mute').onclick = e => { muted = !muted; e.target.textContent = muted ? 'MUTED' : 'SOUND ON'; };
document.getElementById('pp').onclick = e => {
  if (!started) return;
  const anyPlaying = sounds.some(a => !a.paused);
  sounds.forEach(a => anyPlaying ? a.pause() : a.play().catch(() => {}));
  e.target.textContent = anyPlaying ? 'PLAY' : 'PAUSE';
};
document.getElementById('vol').oninput = e => master = +e.target.value;
document.getElementById('start').onclick = () => {
  started = true; document.getElementById('overlay').style.display = 'none';
  sounds.forEach(a => a.play().catch(() => {}));
  document.getElementById('pp').textContent = 'PAUSE';
};
