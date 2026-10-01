(function () {
  "use strict";

  var OWNER = "JhonDuque365";
  var REPO = "alejo-analista-landing";
  var BRANCH = "main";
  var IMAGE = /\.(png|jpe?g|webp|svg|gif|avif)$/i;

  function list(directory) {
    var url =
      "https://api.github.com/repos/" +
      OWNER +
      "/" +
      REPO +
      "/contents/" +
      directory +
      "?ref=" +
      BRANCH;

    return fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("No se pudo cargar " + directory);
        }

        return response.json();
      })
      .then(function (items) {
        return items.filter(function (file) {
          return file.type === "file" && IMAGE.test(file.name);
        });
      });
  }

  function loadLogo() {
    list("assets/logo")
      .then(function (files) {
        if (!files.length) {
          return;
        }

        var file = files.sort(function (a, b) {
          return a.name.localeCompare(b.name);
        })[0];

        ["logo-nav", "logo-hero"].forEach(function (id) {
          var image = document.getElementById(id);

          if (image) {
            image.src = file.path;
            image.hidden = false;
          }
        });

        var crown = document.getElementById("crown");

        if (crown) {
          crown.hidden = true;
        }
      })
      .catch(function () {
        /* Mantiene la corona si no hay logo */
      });
  }

  /* Modal */

  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lb-img");
  var closeButton = document.getElementById("lb-close");

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.hidden = true;
    lightboxImage.src = "";
    document.body.style.overflow = "";
  }

  function openLightbox(src, alt) {
    if (!lightbox) {
      return;
    }

    lightboxImage.src = src;
    lightboxImage.alt = alt || "Resultado ampliado";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";

    if (closeButton) {
      closeButton.focus();
    }
  }

  /* Menú móvil */

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.getElementById("mobile-menu");

    if (!button || !panel) {
      return;
    }

    function closeMenu() {
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Abrir menú");
    }

    button.addEventListener("click", function () {
      var isOpen = !panel.hidden;

      panel.hidden = isOpen;
      button.setAttribute("aria-expanded", String(!isOpen));
      button.setAttribute(
        "aria-label",
        isOpen ? "Abrir menú" : "Cerrar menú"
      );
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  /* Animaciones suaves */

  var observer;

  function observe(element) {
    if (!("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12
        }
      );
    }

    observer.observe(element);
  }

  /* Ruleta 3D con rotación automática */

  function setupRoulette(files) {
    var track = document.getElementById("roulette-track");
    var empty = document.getElementById("picks-empty");

    if (!track) {
      return;
    }

    if (!files.length) {
      if (empty) {
        empty.hidden = false;
      }

      return;
    }

    files.sort(function (a, b) {
      return b.name.localeCompare(a.name, undefined, {
        numeric: true
      });
    });

    var activeIndex = 0;
    var total = files.length;
    var touchStartX = 0;
    var autoTimer = null;
    var isPaused = false;
    var pauseTimeout = null;

    function getCircularOffset(itemIndex) {
      var offset = (itemIndex - activeIndex + total) % total;

      if (offset > total / 2) {
        offset -= total;
      }

      return offset;
    }

    function render() {
      track.innerHTML = "";

      files.forEach(function (file, index) {
        var offset = getCircularOffset(index);

        var card = document.createElement("button");
        var image = document.createElement("img");

        var isActive = offset === 0;
        var distance = Math.abs(offset);

        card.type = "button";
        card.className = "result-card" + (isActive ? " is-active" : "");
        card.setAttribute(
          "aria-label",
          "Abrir resultado " + (index + 1)
        );

        card.style.setProperty("--x", offset * 145 + "px");
        card.style.setProperty(
          "--z",
          isActive ? "90px" : Math.max(-180, 70 - distance * 95) + "px"
        );
        card.style.setProperty("--rotate", offset * 26 + "deg");
        card.style.setProperty(
          "--scale",
          isActive ? "1" : Math.max(0.68, 1 - distance * 0.12)
        );
        card.style.setProperty(
          "--opacity",
          distance > 2 ? "0" : Math.max(0.18, 1 - distance * 0.25)
        );
        card.style.setProperty(
          "--brightness",
          isActive ? "1" : "0.62"
        );

        image.src = file.path;
        image.alt = "Resultado " + (index + 1);
        image.loading = index < 3 ? "eager" : "lazy";
        image.decoding = "async";

        card.appendChild(image);

        card.addEventListener("click", function () {
          if (isActive) {
            openLightbox(file.path, image.alt);
            return;
          }

          activeIndex = index;
          render();
          resetAutoTimer();
        });

        track.appendChild(card);
      });
    }

    function move(step) {
      activeIndex = (activeIndex + step + total) % total;
      render();
    }

    function startAutoTimer() {
      if (autoTimer) {
        clearInterval(autoTimer);
      }

      autoTimer = setInterval(function () {
        if (!isPaused) {
          move(1);
        }
      }, 4000);
    }

    function resetAutoTimer() {
      startAutoTimer();
    }

    function pauseOnInteraction() {
      isPaused = true;

      if (pauseTimeout) {
        clearTimeout(pauseTimeout);
      }

      pauseTimeout = setTimeout(function () {
        isPaused = false;
      }, 8000);
    }

    track.addEventListener(
      "touchstart",
      function (event) {
        touchStartX = event.touches[0].clientX;
        pauseOnInteraction();
      },
      {
        passive: true
      }
    );

    track.addEventListener(
      "touchend",
      function (event) {
        var touchEndX = event.changedTouches[0].clientX;
        var difference = touchEndX - touchStartX;

        if (Math.abs(difference) < 35) {
          return;
        }

        if (difference < 0) {
          move(1);
        } else {
          move(-1);
        }

        resetAutoTimer();
      },
      {
        passive: true
      }
    );

    track.addEventListener(
      "mouseenter",
      function () {
        pauseOnInteraction();
      }
    );

    track.addEventListener(
      "mouseleave",
      function () {
        isPaused = false;
      }
    );

    render();
    startAutoTimer();
  }

  function loadResults() {
    list("assets/picks")
      .then(setupRoulette)
      .catch(function () {
        var empty = document.getElementById("picks-empty");

        if (empty) {
          empty.hidden = false;
        }
      });
  }

  /* Eventos globales */

  if (closeButton) {
    closeButton.addEventListener("click", closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  var year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.querySelectorAll(".reveal").forEach(observe);

  setupMenu();
  loadLogo();
  loadResults();
})();