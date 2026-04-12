/* ============================================
   FILM GRAIN — Canvas noise overlay
   ============================================ */

const Grain = {
  canvas: null,
  ctx: null,
  frame: 0,
  running: true,

  init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'grain-canvas';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());
    this.animate();
  },

  resize() {
    // Use lower resolution on mobile for performance
    const scale = window.innerWidth < 768 ? 0.5 : 1;
    this.canvas.width = window.innerWidth * scale;
    this.canvas.height = window.innerHeight * scale;
  },

  animate() {
    if (!this.running) return;

    this.frame++;
    // Only update every 3rd frame for performance
    if (this.frame % 3 === 0) {
      this.render();
    }

    requestAnimationFrame(() => this.animate());
  },

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imageData = this.ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;       // R
      data[i + 1] = v;   // G
      data[i + 2] = v;   // B
      data[i + 3] = 12;  // Alpha (very subtle)
    }

    this.ctx.putImageData(imageData, 0, 0);
  },

  toggle() {
    this.running = !this.running;
    if (this.running) this.animate();
  }
};
