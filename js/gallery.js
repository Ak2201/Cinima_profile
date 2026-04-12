/* ============================================
   GALLERY — Filtering & Lightbox
   Handles both Acting & Direction galleries
   ============================================ */

const Gallery = {
  currentItems: [],
  currentIndex: 0,
  lightbox: null,

  init() {
    this.lightbox = document.getElementById('lightbox');
    this.initFilters();
    this.initLightbox();
  },

  initFilters() {
    // Acting portfolio filters
    const actingFilters = document.querySelector('#portfolio .portfolio__filters');
    if (actingFilters) {
      actingFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.portfolio__filter-btn');
        if (!btn || btn.dataset.gallery === 'direction') return;
        this.filterGallery(btn, '#acting-gallery', '.portfolio__item');
      });
    }

    // Direction portfolio filters
    const directionFilters = document.querySelector('#direction .portfolio__filters');
    if (directionFilters) {
      directionFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.portfolio__filter-btn');
        if (!btn) return;
        this.filterGallery(btn, '#direction-gallery', '.direction__card');
      });
    }

    // Anchoring filters
    const anchoringFilters = document.querySelector('#anchoring .portfolio__filters');
    if (anchoringFilters) {
      anchoringFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.portfolio__filter-btn');
        if (!btn) return;
        this.filterGallery(btn, '#anchoring-gallery', '.anchoring__card');
      });
    }
  },

  filterGallery(activeBtn, gridSelector, itemSelector) {
    const filter = activeBtn.dataset.filter;
    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    // Update active button
    const siblings = activeBtn.parentElement.querySelectorAll('.portfolio__filter-btn');
    siblings.forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');

    // Filter items
    const items = grid.querySelectorAll(itemSelector);
    items.forEach(item => {
      if (filter === 'all' || item.dataset.category === filter) {
        item.classList.remove('hidden');
        item.style.position = '';
        item.style.width = '';
        item.style.height = '';
        item.style.overflow = '';
      } else {
        item.classList.add('hidden');
        // Delay hiding from layout
        setTimeout(() => {
          if (item.classList.contains('hidden')) {
            item.style.position = 'absolute';
            item.style.width = '0';
            item.style.height = '0';
            item.style.overflow = 'hidden';
          }
        }, 300);
      }
    });
  },

  initLightbox() {
    // Open lightbox on gallery item click
    const actingItems = document.querySelectorAll('#acting-gallery .portfolio__item');
    actingItems.forEach((item, i) => {
      item.addEventListener('click', () => this.openLightbox(actingItems, i));
    });

    // Close handlers
    if (!this.lightbox) return;

    this.lightbox.querySelector('.lightbox__close').addEventListener('click', () => this.closeLightbox());
    this.lightbox.querySelector('.lightbox__prev').addEventListener('click', () => this.navigate(-1));
    this.lightbox.querySelector('.lightbox__next').addEventListener('click', () => this.navigate(1));

    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.navigate(-1);
      if (e.key === 'ArrowRight') this.navigate(1);
    });
  },

  openLightbox(items, index) {
    this.currentItems = Array.from(items).filter(el => !el.classList.contains('hidden'));
    this.currentIndex = Math.min(index, this.currentItems.length - 1);
    this.showItem();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  },

  navigate(dir) {
    this.currentIndex = (this.currentIndex + dir + this.currentItems.length) % this.currentItems.length;
    this.showItem();
  },

  showItem() {
    const item = this.currentItems[this.currentIndex];
    if (!item) return;

    const category = item.querySelector('.portfolio__item-category')?.textContent || '';
    const title = item.querySelector('.portfolio__item-title')?.textContent || '';

    const content = document.getElementById('lightbox-content');
    content.innerHTML = `
      <div class="lightbox__card">
        <p class="lightbox__card-category">${category}</p>
        <h3 class="lightbox__card-title">${title}</h3>
      </div>
    `;
  }
};
