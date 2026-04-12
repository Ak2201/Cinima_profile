/* ============================================
   CUSTOM CURSOR — Dot + trailing ring
   ============================================ */

const Cursor = {
  dot: null,
  ring: null,
  mouse: { x: 0, y: 0 },
  ringPos: { x: 0, y: 0 },
  lerpSpeed: 0.15,

  init() {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.dot = document.createElement('div');
    this.dot.className = 'cursor-dot';
    document.body.appendChild(this.dot);

    this.ring = document.createElement('div');
    this.ring.className = 'cursor-ring';
    document.body.appendChild(this.ring);

    document.body.classList.add('custom-cursor');

    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.dot.style.left = e.clientX + 'px';
      this.dot.style.top = e.clientY + 'px';
    });

    // Hover effect on interactive elements
    const interactives = 'a, button, .portfolio__item, .direction__card, .showreel__player, .portfolio__filter-btn, input, textarea';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactives)) {
        this.ring.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactives)) {
        this.ring.classList.remove('hover');
      }
    });

    // Click pulse
    document.addEventListener('mousedown', () => {
      this.dot.classList.add('click');
    });
    document.addEventListener('mouseup', () => {
      this.dot.classList.remove('click');
    });

    this.animate();
  },

  animate() {
    // Lerp ring position for trailing effect
    this.ringPos.x += (this.mouse.x - this.ringPos.x) * this.lerpSpeed;
    this.ringPos.y += (this.mouse.y - this.ringPos.y) * this.lerpSpeed;

    this.ring.style.left = this.ringPos.x + 'px';
    this.ring.style.top = this.ringPos.y + 'px';

    requestAnimationFrame(() => this.animate());
  }
};
