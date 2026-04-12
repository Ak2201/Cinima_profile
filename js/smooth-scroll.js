/* ============================================
   SMOOTH SCROLL — Anchor navigation
   ============================================ */

const SmoothScroll = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        // Close mobile nav if open
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle && navToggle.checked) {
          navToggle.checked = false;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update URL without jump
        history.pushState(null, '', link.getAttribute('href'));
      });
    });
  }
};
