(function () {
  'use strict';
  var OWNER = 'JhonDuque365';
  var REPO = 'alejo-analista-landing';
  var BRANCH = 'main';
  var IMAGE = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
  function list(directory) {
    var url = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + directory + '?ref=' + BRANCH;
    return fetch(url).then(function (response) { if (!response.ok) throw new Error('No se pudo leer ' + directory); return response.json(); }).then(function (items) { return items.filter(function (file) { return file.type === 'file' && IMAGE.test(file.name); }); });
  }
  function loadLogo() {
    list('assets/logo').then(function (files) {
      if (!files.length) return;
      var file = files.sort(function (a, b) { return a.name.localeCompare(b.name); })[0];
      ['logo-nav','logo-hero'].forEach(function (id) { var image = document.getElementById(id); if (image) { image.src = file.path; image.hidden = false; } });
      var crown = document.getElementById('crown'); if (crown) crown.hidden = true;
    }).catch(function () {});
  }
  var lightbox = document.getElementById('lightbox'); var lightboxImage = document.getElementById('lb-img'); var close = document.getElementById('lb-close');
  function closeLightbox() { lightbox.hidden = true; lightboxImage.src = ''; document.body.style.overflow = ''; }
  function openLightbox(src, alt) { lightboxImage.src = src; lightboxImage.alt = alt; lightbox.hidden = false; document.body.style.overflow = 'hidden'; if (close) close.focus(); }
  function loadPicks() {
    var grid = document.getElementById('picks-grid'); var empty = document.getElementById('picks-empty');
    list('assets/picks').then(function (files) {
      if (!files.length) { empty.hidden = false; return; }
      files.sort(function (a,b) { return b.name.localeCompare(a.name, undefined, {numeric:true}); });
      files.forEach(function (file, index) {
        var button = document.createElement('button'); var image = document.createElement('img');
        button.className = 'pick reveal'; button.type = 'button'; button.setAttribute('aria-label','Ampliar pick ' + (index + 1));
        image.src = file.path; image.alt = 'Pick acertado ' + (index + 1); image.loading = index > 2 ? 'lazy' : 'eager'; image.decoding = 'async';
        button.appendChild(image); button.addEventListener('click', function () { openLightbox(file.path, image.alt); }); grid.appendChild(button); observe(button);
      });
    }).catch(function () { empty.hidden = false; });
  }
  var observer;
  function observe(element) {
    if (!('IntersectionObserver' in window)) { element.classList.add('is-visible'); return; }
    if (!observer) observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, {threshold:.12});
    observer.observe(element);
  }
  function menu() {
    var button = document.querySelector('.menu-toggle'); var panel = document.getElementById('mobile-menu'); if (!button || !panel) return;
    function closeMenu() { panel.hidden = true; button.setAttribute('aria-expanded','false'); button.setAttribute('aria-label','Abrir menú'); }
    button.addEventListener('click', function () { var open = !panel.hidden; panel.hidden = open; button.setAttribute('aria-expanded', String(!open)); button.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú'); });
    panel.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
  }
  if (close) close.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox(); });
  var year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
  document.querySelectorAll('.reveal').forEach(observe); menu(); loadLogo(); loadPicks();
})();
