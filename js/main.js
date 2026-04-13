/* ============================================
   MAIN — Orchestrator
   Initializes all modules after loader completes
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Split hero name into individual characters for animation
  const heroName = document.getElementById('hero-name');
  if (heroName) {
    const text = heroName.textContent;
    heroName.innerHTML = text.split('').map((char, i) => {
      if (char === ' ') return ' ';
      return `<span class="char" style="animation-delay: ${0.8 + i * 0.05}s">${char}</span>`;
    }).join('');
  }

  // Register loaderDone listener BEFORE Loader.init() so we don't miss the
  // synchronous dispatch that happens when sessionStorage.loaderShown is set.
  document.addEventListener('loaderDone', () => {
    ScrollAnimations.init();
    Parallax.init();
    Gallery.init();
    Grain.init();
    Cursor.init();
    Music.init();
    SmoothScroll.init();
  });

  // Start loader
  Loader.init();

  // Contact form handler
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Show success message
      success.classList.add('visible');
      form.reset();

      // Hide after 5 seconds
      setTimeout(() => {
        success.classList.remove('visible');
      }, 5000);
    });
  }
});
