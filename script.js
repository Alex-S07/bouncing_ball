'use strict';

// ─── Config ────────────────────────────────────────────────────────────────
const INITIAL_BALL_COUNT = 20;
const CANVAS_HEIGHT = 520;

const BALL_COLORS = [
  '#00e5ff', // cyan
  '#1e90ff', // dodger blue
  '#39ff14', // neon green
  '#a259ff', // purple
  '#ffaa00', // amber
  '#ff6b6b', // coral red
  '#00ffb3', // mint
  '#ffd700', // gold
  '#4fc3f7', // sky blue
  '#80cbc4', // teal
  '#aed581', // lime green
  '#7986cb', // indigo
  '#4db6ac', // teal accent
  '#9e9e9e', // grey
  '#546e7a', // dark grey-blue
  '#7c4dff', // deep purple
];

// ─── State ─────────────────────────────────────────────────────────────────
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const countEl = document.getElementById('ball-count');
const btnAdd  = document.getElementById('btn-add');
const btnClear= document.getElementById('btn-clear');
const btnPause= document.getElementById('btn-pause');

let balls   = [];
let paused  = false;
let animId  = null;

// ─── Utility ───────────────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function randColor() {
  return BALL_COLORS[randInt(0, BALL_COLORS.length - 1)];
}

// ─── Canvas Sizing ─────────────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width  = container.clientWidth;
  canvas.height = CANVAS_HEIGHT;
  container.style.height = CANVAS_HEIGHT + 'px';
}

// ─── Ball Class ────────────────────────────────────────────────────────────
class Ball {
  constructor(x, y) {
    this.r     = rand(12, 32);
    this.x     = x  ?? rand(this.r, canvas.width  - this.r);
    this.y     = y  ?? rand(this.r, canvas.height - this.r);
    this.vx    = rand(1.5, 4.5) * (Math.random() < 0.5 ? 1 : -1);
    this.vy    = rand(1.5, 4.5) * (Math.random() < 0.5 ? 1 : -1);
    this.color = randColor();
    // Glow color slightly lighter
    this.glowColor = this.color + 'aa';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off left / right
    if (this.x - this.r <= 0) {
      this.x = this.r;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.r >= canvas.width) {
      this.x = canvas.width - this.r;
      this.vx = -Math.abs(this.vx);
    }

    // Bounce off top / bottom
    if (this.y - this.r <= 0) {
      this.y = this.r;
      this.vy = Math.abs(this.vy);
    } else if (this.y + this.r >= canvas.height) {
      this.y = canvas.height - this.r;
      this.vy = -Math.abs(this.vy);
    }
  }

  draw() {
    // Outer glow
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 18;

    // Radial gradient fill for 3D sheen
    const grad = ctx.createRadialGradient(
      this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1,
      this.x, this.y, this.r
    );
    grad.addColorStop(0, lighten(this.color, 60));
    grad.addColorStop(0.5, this.color);
    grad.addColorStop(1, darken(this.color, 50));

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Specular highlight
    ctx.save();
    const spec = ctx.createRadialGradient(
      this.x - this.r * 0.35, this.y - this.r * 0.35, 0,
      this.x - this.r * 0.35, this.y - this.r * 0.35, this.r * 0.55
    );
    spec.addColorStop(0, 'rgba(255,255,255,0.35)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();
    ctx.restore();
  }
}

// ─── Color Helpers ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b];
}

function clamp(v) { return Math.max(0, Math.min(255, v)); }

function lighten(hex, amount) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${clamp(r+amount)},${clamp(g+amount)},${clamp(b+amount)})`;
}

function darken(hex, amount) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${clamp(r-amount)},${clamp(g-amount)},${clamp(b-amount)})`;
}

// ─── Init Balls ────────────────────────────────────────────────────────────
function initBalls(count) {
  balls = [];
  for (let i = 0; i < count; i++) {
    balls.push(new Ball());
  }
  updateCount();
}

function updateCount() {
  countEl.textContent = balls.length;
}

// ─── Animation Loop ────────────────────────────────────────────────────────
function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d1321';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(30, 144, 255, 0.04)';
  ctx.lineWidth   = 1;
  const step = 40;
  for (let x = 0; x <= canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function animate() {
  drawBackground();
  for (const ball of balls) {
    ball.update();
    ball.draw();
  }
  animId = requestAnimationFrame(animate);
}

// ─── Event Listeners ───────────────────────────────────────────────────────
// Click on canvas → add ball at click position
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top)  * scaleY;
  balls.push(new Ball(cx, cy));
  updateCount();
});

btnAdd.addEventListener('click', () => {
  balls.push(new Ball());
  updateCount();
});

btnClear.addEventListener('click', () => {
  balls = [];
  updateCount();
});

btnPause.addEventListener('click', () => {
  paused = !paused;
  if (paused) {
    cancelAnimationFrame(animId);
    btnPause.textContent = '▶ Resume';
    btnPause.style.background = '#39ff14';
    btnPause.style.color = '#111';
  } else {
    btnPause.textContent = '⏸ Pause';
    btnPause.style.background = '';
    btnPause.style.color = '';
    animate();
  }
});

// Resize canvas when window resizes
window.addEventListener('resize', () => {
  resizeCanvas();
});

// ─── Bootstrap ─────────────────────────────────────────────────────────────
resizeCanvas();
initBalls(INITIAL_BALL_COUNT);
animate();
