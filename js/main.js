(function () {
  var OWNER = 'JhonDuque365';
  var REPO = 'alejo-analista-landing';
  var BRANCH = 'main';
  var IMG = /\.(png|jpe?g|webp|svg|gif|avif)$/i;

  function list(dir) {
    var url = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + dir + '?ref=' + BRANCH;
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('No se pudo leer ' + dir);
      return r.json();
    }).then(function (items) {
      return items.filter(function (f) { return f.type === 'file' && IMG.test(f.name); });
    });
  }

  function loadLogo() {
    list('assets/logo').then(function (files) {
      if (!files.length) return;
      var src = files[0].path;
      ['logo-nav', 'logo-hero'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.src = src; el.hidden = false; }
      });
      var crown = document.getElementById('crown');
      if (crown) crown.style.display = 'none';
    }).catch(function () {});
  }

  function loadPicks() {
    var grid = document.getElementById('picks-grid');
    var empty = document.getElementById('picks-empty');
    list('assets/picks').then(function (files) {
      if (!files.length) { empty.hidden = false; return; }
      files.sort(function (a, b) { return b.name.localeCompare(a.name, undefined, { numeric: true }); });
      files.forEach(function (f) {
        var btn = document.createElement('button');
        btn.className = 'pick';
        btn.type = 'button';
        var img = document.createElement('img');
        img.src = f.path;
        img.loading = 'lazy';
        img.alt = 'Pick acertado';
        btn.appendChild(img);
        btn.addEventListener('click', function () { openLightbox(f.path); });
        grid.appendChild(btn);
      });
    }).catch(function () { empty.hidden = false; });
  }

  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  function openLightbox(src) { lbImg.src = src; lb.hidden = false; }
  function closeLightbox() { lb.hidden = true; lbImg.src = ''; }
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

  document.getElementById('year').textContent = new Date().getFullYear();
  loadLogo();
  loadPicks();
})();
