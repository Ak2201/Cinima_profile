/* ============================================
   BACKGROUND MUSIC TOGGLE
   ============================================ */

const Music = {
  audio: null,
  btn: null,
  playing: false,

  init() {
    this.audio = document.getElementById('bg-music');
    this.btn = document.getElementById('music-toggle');
    if (!this.btn || !this.audio) return;

    this.btn.addEventListener('click', () => this.toggle());
  },

  toggle() {
    if (this.playing) {
      this.audio.pause();
      this.btn.classList.remove('playing');
    } else {
      this.audio.play().catch(() => {
        // Autoplay blocked — user will need to click again
      });
      this.btn.classList.add('playing');
    }
    this.playing = !this.playing;
  }
};
