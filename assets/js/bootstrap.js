(() => {
  'use strict';

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.body.append(script);
  });

  async function loadPartials() {
    let slots = [...document.querySelectorAll('[data-include]')];
    while (slots.length) {
      await Promise.all(slots.map(async slot => {
        const path = slot.dataset.include;
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Gagal memuat ${path}`);
        slot.outerHTML = await response.text();
      }));
      slots = [...document.querySelectorAll('[data-include]')];
    }
  }

  (async () => {
    try {
      await loadPartials();
      document.querySelector('#app-loading')?.remove();
      await loadScript('data/catalog.js?v=2');
      await loadScript('assets/js/app.js?v=20');
    } catch (error) {
      const loading = document.querySelector('#app-loading');
      if (loading) loading.innerHTML = `<strong>Website gagal dimuat.</strong><span>${error.message}</span>`;
    }
  })();
})();
