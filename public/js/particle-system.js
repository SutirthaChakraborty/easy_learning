/**
 * Easy Learn — Particle System
 * Futuresight Analytics Limited
 *
 * Canvas-based floating particles for hero backgrounds.
 * Themes: stars (space), bubbles (underwater), leaves (forest)
 */

export class ParticleSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {'stars'|'bubbles'|'leaves'|'confetti'} theme
   */
  constructor(canvas, theme = 'stars') {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.theme   = theme;
    this.particles = [];
    this.animId  = null;
    this.running = false;

    this._resize = this._resize.bind(this);
    this._loop   = this._loop.bind(this);

    window.addEventListener('resize', this._resize);
    this._resize();
    this._populate();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animId);
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resize);
  }

  setTheme(theme) {
    this.theme = theme;
    this.particles = [];
    this._populate();
  }

  // ─── Canvas Sizing ────────────────────────────────────────────────────────

  _resize() {
    this.canvas.width  = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.particles = [];
    this._populate();
  }

  // ─── Particle Factory ─────────────────────────────────────────────────────

  _populate() {
    const count = this.theme === 'confetti' ? 120 : 60;
    for (let i = 0; i < count; i++) {
      this.particles.push(this._createParticle(true));
    }
  }

  _createParticle(scatter = false) {
    const { width, height } = this.canvas;
    const base = {
      x    : Math.random() * width,
      y    : scatter ? Math.random() * height : height + 10,
      alpha: Math.random() * 0.6 + 0.2,
    };

    switch (this.theme) {
      case 'stars':
        return {
          ...base,
          type  : 'star',
          size  : Math.random() * 2.5 + 0.5,
          speed : Math.random() * 0.3 + 0.1,
          drift : (Math.random() - 0.5) * 0.2,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          color : `hsl(${220 + Math.random() * 60}, 80%, ${75 + Math.random() * 25}%)`,
        };

      case 'bubbles':
        return {
          ...base,
          type  : 'bubble',
          size  : Math.random() * 18 + 5,
          speed : Math.random() * 0.5 + 0.2,
          drift : (Math.random() - 0.5) * 0.4,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.04 + 0.01,
          color : `hsla(${180 + Math.random() * 40}, 70%, 70%, 0.25)`,
        };

      case 'leaves':
        return {
          ...base,
          type  : 'leaf',
          size  : Math.random() * 12 + 6,
          speed : Math.random() * 0.8 + 0.3,
          drift : (Math.random() - 0.5) * 1.2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed : (Math.random() - 0.5) * 0.04,
          color : `hsl(${90 + Math.random() * 60}, ${50 + Math.random() * 30}%, ${30 + Math.random() * 30}%)`,
        };

      case 'confetti':
        return {
          ...base,
          y     : scatter ? Math.random() * -height : -20,
          type  : 'confetti',
          size  : Math.random() * 10 + 5,
          speed : Math.random() * 4 + 2,
          drift : (Math.random() - 0.5) * 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed : (Math.random() - 0.5) * 0.15,
          color : `hsl(${Math.random() * 360}, 85%, 65%)`,
          shape : Math.random() > 0.5 ? 'rect' : 'circle',
        };

      default:
        return base;
    }
  }

  // ─── Animation Loop ───────────────────────────────────────────────────────

  _loop() {
    if (!this.running) return;
    this._update();
    this._draw();
    this.animId = requestAnimationFrame(this._loop);
  }

  _update() {
    const { width, height } = this.canvas;

    this.particles.forEach((p, i) => {
      switch (p.type) {
        case 'star':
          p.y -= p.speed;
          p.x += p.drift;
          p.twinkle += p.twinkleSpeed;
          p.alpha = 0.4 + Math.sin(p.twinkle) * 0.4;
          break;

        case 'bubble':
          p.y -= p.speed;
          p.wobble += p.wobbleSpeed;
          p.x += p.drift + Math.sin(p.wobble) * 0.5;
          break;

        case 'leaf':
          p.y -= p.speed;
          p.x += p.drift;
          p.rotation += p.rotSpeed;
          break;

        case 'confetti':
          p.y += p.speed;
          p.x += p.drift;
          p.rotation += p.rotSpeed;
          break;
      }

      // Recycle off-screen particles
      if (p.y < -20 && p.type !== 'confetti') {
        this.particles[i] = this._createParticle(false);
        this.particles[i].x = Math.random() * width;
      }
      if (p.y > height + 20 && p.type === 'confetti') {
        this.particles[i] = this._createParticle(false);
      }
    });
  }

  _draw() {
    const { ctx, canvas: { width, height } } = this;
    ctx.clearRect(0, 0, width, height);

    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha ?? 0.5;
      ctx.translate(p.x, p.y);

      switch (p.type) {
        case 'star':
          ctx.rotate(p.rotation ?? 0);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          // Glow
          ctx.shadowColor = p.color;
          ctx.shadowBlur  = p.size * 3;
          ctx.fill();
          break;

        case 'bubble':
          ctx.strokeStyle = `rgba(100, 220, 255, 0.6)`;
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.25, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'leaf':
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'confetti':
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
      }

      ctx.restore();
    });
  }

  // ─── One-Shot Confetti Burst ──────────────────────────────────────────────

  /**
   * Launch a confetti celebration burst.
   * @param {number} duration — ms to run (default 3000)
   */
  static burst(canvas, duration = 3000) {
    const sys = new ParticleSystem(canvas, 'confetti');
    sys.start();
    setTimeout(() => sys.destroy(), duration);
  }
}
