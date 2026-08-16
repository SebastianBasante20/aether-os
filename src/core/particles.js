/**
 * AETHER OS — Ambient Particle Constellation & Gravitational Physics Canvas
 */

export class ParticleField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0 };
    this.particleCount = 65;
    this.maxDistance = 140;
    this.animId = null;

    this.resize = this.resize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.animate = this.animate.bind(this);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('mousemove', this.onMouseMove);

    this.createParticles();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 0.8,
        baseAlpha: Math.random() * 0.4 + 0.2
      });
    }
  }

  onMouseMove(e) {
    this.mouse.vx = e.clientX - this.mouse.lastX;
    this.mouse.vy = e.clientY - this.mouse.lastY;
    this.mouse.lastX = e.clientX;
    this.mouse.lastY = e.clientY;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    // Update spotlight CSS variables
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Get current accent color from CSS
    const isCyber = document.documentElement.getAttribute('data-theme') === 'cyber';
    const isMono = document.documentElement.getAttribute('data-theme') === 'monochrome';
    const r = isMono ? 255 : (isCyber ? 99 : 0);
    const g = isMono ? 255 : (isCyber ? 102 : 240);
    const b = isMono ? 255 : (isCyber ? 241 : 255);

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Physics integration
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse interactive gravitational repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mouseDistThreshold = 130;

      if (dist < mouseDistThreshold) {
        const force = (1 - dist / mouseDistThreshold) * 1.5;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Draw particle dot
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.baseAlpha})`;
      this.ctx.fill();

      // Connect near particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const djx = p.x - p2.x;
        const djy = p.y - p2.y;
        const d = Math.sqrt(djx * djx + djy * djy);

        if (d < this.maxDistance) {
          const alpha = (1 - d / this.maxDistance) * 0.18;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }
    }

    this.animId = requestAnimationFrame(this.animate);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}
