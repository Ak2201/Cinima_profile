/* ============================================
   SCROLL REVEAL ANIMATIONS
   IntersectionObserver-based reveal system
   ============================================ */

const ScrollAnimations = {
  init() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');

          // Animate skill rings when visible
          this.animateSkills(entry.target);
          // Animate language bars
          this.animateLanguages(entry.target);

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));

    // Active nav link tracking
    this.initNavTracking();
  },

  animateSkills(target) {
    const rings = target.querySelectorAll('.skills__ring');
    if (!rings.length && !target.classList.contains('skills__category')) return;

    const container = target.closest('.skills__category') || target;
    const allRings = container.querySelectorAll('.skills__ring');

    allRings.forEach(ring => {
      const percent = parseInt(ring.dataset.percent || 0);
      const circumference = 2 * Math.PI * 45; // r=45
      const offset = circumference - (percent / 100) * circumference;
      ring.style.setProperty('--ring-offset', offset);
      ring.classList.add('animated');
    });
  },

  animateLanguages(target) {
    const langs = target.querySelectorAll('.skills__lang');
    if (!langs.length && !target.classList.contains('skills__category')) return;

    const container = target.closest('.skills__category') || target;
    container.querySelectorAll('.skills__lang').forEach(lang => {
      lang.classList.add('animated');
    });
  },

  initNavTracking() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__links a');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--nav-height')} 0px -50% 0px`
    });

    sections.forEach(section => observer.observe(section));
  }
};
