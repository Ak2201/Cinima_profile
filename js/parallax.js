/* ============================================
   PARALLAX — Scroll-driven depth effects
   ============================================ */

const Parallax = {
  elements: [],
  ticking: false,

  init() {
    // Disable on mobile
    if (window.matchMedia('(max-width: 768px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.elements = document.querySelectorAll('[data-parallax-speed]');
    if (!this.elements.length) return;

    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  },

  onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.pageYOffset;
        this.elements.forEach(el => {
          const speed = parseFloat(el.dataset.parallaxSpeed);
          el.style.transform = `translateY(${scrollY * speed}px)`;
        });
        this.ticking = false;
      });
      this.ticking = true;
    }
  }
};
