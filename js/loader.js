/* ============================================
   CINEMATIC LOADER
   ============================================ */

const Loader = {
  init() {
    // Skip loader on repeat visits in same session
    if (sessionStorage.getItem('loaderShown')) {
      const loader = document.getElementById('loader');
      if (loader) {
        loader.style.display = 'none';
        document.body.classList.remove('loading');
      }
      document.dispatchEvent(new CustomEvent('loaderDone'));
      return;
    }

    document.body.classList.add('loading');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    const loader = document.getElementById('loader');

    // Start progress bar animation
    requestAnimationFrame(() => {
      loaderBar.classList.add('loading');
    });

    // After bar fills, reveal name
    setTimeout(() => {
      loaderText.classList.add('name-reveal');
      loaderText.textContent = 'AARON ARUN';
    }, 2200);

    // Slide loader away
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.remove('loading');
      sessionStorage.setItem('loaderShown', 'true');

      // Dispatch event for other modules
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('loaderDone'));
      }, 800);
    }, 3200);
  }
};
