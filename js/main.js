(function () {
  'use strict';
  var OWNER = 'JhonDuque365';
  var REPO = 'alejo-analista-landing';
  var BRANCH = 'main';
  var IMAGE = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
  function listAssets(directory) {
    var endpoint = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + directory + '?ref=' + BRANCH;
    return fetch(endpoint).then(function (response) { if (!response.ok) throw new Error('No se pudo cargar ' + directory); return response.json(); }).then(function (files) { return files.filter(function (file) { return file.type === 'file' && IMAGE.test(file.name); }); });
  }
  function setLogo() {
    listAssets('assets/logo').then(function (files) {
      if (!files.length) return;
      var file = files.sort(function (a, b) { return a.name.localeCompare(b.name); })[0];
      ['logo-nav', 'logo-hero'].forEach(function (id) { var image = document.getElementById(id); if (image) { image.src = file.path; image.hidden = false; } });
      var fallback = document.getElementById('fallback-mark'); if (fallback) fallback.hidden = true;
    }).catch(function () {});
  }
  var lightbox = document.getElementById('lightbox'); var lightboxImage = document.getElementById('lb-img'); var closeButton = document.getElementById('lb-close');
  function closeLightbox() { if (!lightbox) return; lightbox.hidden = true; lightboxImage.src = ''; document.body.style.overflow = ''; }
  function openLightbox(src, alt) { if (!lightbox) return; lightboxImage.src = src; lightboxImage.alt = alt || 'Pick acertado ampliado'; lightbox.hidden = false; document.body.style.overflow = 'hidden'; if (closeButton) closeButton.focus(); }
  var observer;
  function observeReveal(element) {
    if (!('IntersectionObserver' in window)) { element.classList.add('is-visible'); return; }
    if (!observer) observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .12, rootMargin: '0px 0px -30px' });
    observer.observe(element);
  }
  function setPicks() {
    var grid = document.getElementById('picks-grid'); var empty = document.getElementById('picks-empty'); if (!grid || !empty) return;
    listAssets('assets/picks').then(function (files) {
      if (!files.length) { empty.hidden = false; return; }
      files.sort(function (a, b) { return b.name.localeCompare(a.name, undefined, { numeric: true }); });
      files.forEach(function (file, index) {
        var button = document.createElement('button'); var image = document.createElement('img');
        button.className = 'pick reveal'; button.type = 'button'; button.setAttribute('aria-label', 'Ampliar pick ' + (index + 1));
        image.src = file.path; image.alt = 'Pick acertado ' + (index + 1); image.loading = index > 2 ? 'lazy' : 'eager'; image.decoding = 'async';
        button.appendChild(image); button.addEventListener('click', function () { openLightbox(file.path, image.alt); }); grid.appendChild(button); observeReveal(button);
      });
    }).catch(function () { empty.hidden = false; });
  }
  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle'); var menu = document.getElementById('mobile-menu'); if (!toggle || !menu) return;
    function closeMenu() { menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menú'); }
    toggle.addEventListener('click', function () { var isOpen = !menu.hidden; menu.hidden = isOpen; toggle.setAttribute('aria-expanded', String(!isOpen)); toggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú'); });
    menu.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
  }
  if (closeButton) closeButton.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeLightbox(); });
  var year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
  setupMenu(); document.querySelectorAll('.reveal').forEach(observeReveal); setLogo(); setPicks();
})();
