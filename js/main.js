(function () {
  "use strict";

  var OWNER = "JhonDuque365";
  var REPO = "alejo-analista-landing";
  var BRANCH = "main";
  var IMAGE = /\.(png|jpe?g|webp|svg|gif|avif)$/i;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var lightboxOpen = false;
  var previousFocus = null;

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

  function loadImageSafely(image, source, frame) {
    if (!image) {
      return;
    }

    image.hidden = true;

    image.onload = function () {
      image.hidden = false;

      if (frame) {
        frame.classList.add("has-logo");
      }
    };

    image.onerror = function () {
      image.removeAttribute("src");
      image.hidden = true;

      if (frame) {
        frame.classList.remove("has-logo");
      }
    };

    image.src = source;
  }

  function loadLogo() {
    list("assets/logo")
      .then(function (files) {
        if (!files.length) {
          return;
        }

        files.sort(function (a, b) {
          return a.name.localeCompare(b.name);
        });

        var logoUrl = files[0].download_url || files[0].path;

        loadImageSafely(
          document.getElementById("logo-nav"),
          logoUrl,
          document.querySelector(".logo-frame-nav")
        );

        loadImageSafely(
          document.getElementById("logo-hero"),
          logoUrl,
          document.querySelector(".logo-frame-hero")
        );
      })
      .catch(function () {
        /* No se muestra nada si assets/logo no existe o está vacío. */
      });
  }

  /* Modal */

  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lb-img");
  var closeButton = document.getElementById("lb-close");

  function openLightbox(source, alt) {
    if (!lightbox || !lightboxImage) {
      return;
    }

    previousFocus = document.activeElement;
    lightboxImage.src = source;
    lightboxImage.alt = alt || "Resultado ampliado";
    lightbox.hidden = false;
    lightboxOpen = true;
    document.body.style.overflow = "hidden";

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImage) {
      return;
    }

    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.style.overflow = "";
    lightboxOpen = false;

    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  /* Menú móvil */

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.getElementById("mobile-menu");

    if (!button || !panel) {
      return;
    }

    function setMenu(open) {
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute(
        "aria-label",
        open ? "Cerrar menú" : "Abrir menú"
      );
    }

    button.addEventListener("click", function () {
      setMenu(panel.hidden);
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }

  /* Apariciones suaves */

  var revealObserver;

  function observeReveal(element) {
    if (!("IntersectionObserver" in window)) {
      element.classList.add("is-visible");
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12
        }
      );
    }

    revealObserver.observe(element);
  }

  /* Ruleta 3D */

  function setupRoulette(files) {
    var stage = document.getElementById("roulette-stage");
    var track = document.getElementById("roulette-track");
    var empty = document.getElementById("picks-empty");

    if (!stage || !track) {
      return;
    }

    if (!files.length) {
      stage.hidden = true;

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

    var total = files.length;
    var activeIndex = 0;
    var cards = [];
    var stageVisible = false;
    var mouseInside = false;
    var fingerDown = false;
    var touchStartX = 0;
    var restartTimer = null;
    var lastFrame = 0;
    var speed = 0.42;
    var pauseUntil = 0;

    function circularOffset(index) {
      var offset = (index - activeIndex + total) % total;

      if (offset > total / 2) {
        offset -= total;
      }

      return offset;
    }

    function applyCardPosition(card, index) {
      var offset = circularOffset(index);
      var distance = Math.abs(offset);
      var active = offset === 0;

      var x = offset * 148;
      var z = active ? 115 : Math.max(-240, 45 - distance * 110);
      var rotate = offset * 28;
      var scale = active ? 1 : Math.max(0.62, 0.95 - distance * 0.12);
      var opacity = distance > 2 ? 0 : Math.max(0.16, 1 - distance * 0.28);
      var brightness = active ? 1 : Math.max(0.48, 0.78 - distance * 0.1);

      card.classList.toggle("is-active", active);
      card.style.zIndex = String(100 - distance);
      card.style.setProperty("--x", x + "px");
      card.style.setProperty("--z", z + "px");
      card.style.setProperty("--rotate", rotate + "deg");
      card.style.setProperty("--scale", String(scale));
      card.style.setProperty("--opacity", String(opacity));
      card.style.setProperty("--brightness", String(brightness));
      card.tabIndex = distance > 2 ? -1 : 0;

      card.setAttribute(
        "aria-label",
        active
          ? "Ampliar resultado " + (index + 1)
          : "Ver resultado " + (index + 1)
      );
    }

    function render() {
      cards.forEach(function (card, index) {
        applyCardPosition(card, index);
      });
    }

    function move(step) {
      activeIndex = (activeIndex + step + total) % total;
      render();
    }

    function pauseFor(milliseconds) {
      pauseUntil = Date.now() + milliseconds;

      if (restartTimer) {
        clearTimeout(restartTimer);
      }

      restartTimer = setTimeout(function () {
        pauseUntil = 0;
      }, milliseconds);
    }

    files.forEach(function (file, index) {
      var card = document.createElement("button");
      var image = document.createElement("img");

      card.type = "button";
      card.className = "result-card";

      image.src = file.download_url || file.path;
      image.alt = "Resultado " + (index + 1);
      image.loading = index < 4 ? "eager" : "lazy";
      image.decoding = "async";

      card.appendChild(image);

      card.addEventListener("click", function () {
        if (index === activeIndex) {
          openLightbox(image.src, image.alt);
          return;
        }

        activeIndex = index;
        render();
        pauseFor(3500);
      });

      track.appendChild(card);
      cards.push(card);
    });

    stage.addEventListener("mouseenter", function () {
      mouseInside = true;
    });

    stage.addEventListener("mouseleave", function () {
      mouseInside = false;
      pauseFor(700);
    });

    stage.addEventListener("focusin", function () {
      mouseInside = true;
    });

    stage.addEventListener("focusout", function () {
      mouseInside = false;
    });

    stage.addEventListener(
      "touchstart",
      function (event) {
        fingerDown = true;
        touchStartX = event.touches[0].clientX;

        if (restartTimer) {
          clearTimeout(restartTimer);
        }
      },
      {
        passive: true
      }
    );

    stage.addEventListener(
      "touchmove",
      function () {
        fingerDown = true;
      },
      {
        passive: true
      }
    );

    stage.addEventListener(
      "touchend",
      function (event) {
        fingerDown = false;

        var touchEndX = event.changedTouches[0].clientX;
        var difference = touchEndX - touchStartX;

        if (Math.abs(difference) >= 35) {
          move(difference < 0 ? 1 : -1);
        }

        pauseFor(2800);
      },
      {
        passive: true
      }
    );

    stage.addEventListener(
      "touchcancel",
      function () {
        fingerDown = false;
        pauseFor(1800);
      },
      {
        passive: true
      }
    );

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          stageVisible = entries[0].isIntersecting;
        },
        {
          threshold: 0.25
        }
      ).observe(stage);
    } else {
      stageVisible = true;
    }

    function animate(timestamp) {
      if (!lastFrame) {
        lastFrame = timestamp;
      }

      var delta = timestamp - lastFrame;
      lastFrame = timestamp;

      var shouldMove =
        !reduceMotion &&
        total > 1 &&
        stageVisible &&
        !document.hidden &&
        !lightboxOpen &&
        !mouseInside &&
        !fingerDown &&
        Date.now() > pauseUntil;

      if (shouldMove && delta > 0) {
        var progress = delta * speed;

        if (progress >= 1700) {
          move(1);
        }
      }

      window.requestAnimationFrame(animate);
    }

    render();
    window.requestAnimationFrame(animate);

    setInterval(function () {
      var shouldAdvance =
        !reduceMotion &&
        total > 1 &&
        stageVisible &&
        !document.hidden &&
        !lightboxOpen &&
        !mouseInside &&
        !fingerDown &&
        Date.now() > pauseUntil;

      if (shouldAdvance) {
        move(1);
      }
    }, 3600);
  }

  function loadResults() {
    list("assets/picks")
      .then(setupRoulette)
      .catch(function () {
        var stage = document.getElementById("roulette-stage");
        var empty = document.getElementById("picks-empty");

        if (stage) {
          stage.hidden = true;
        }

        if (empty) {
          empty.hidden = false;
        }
      });
  }

  /* Medición de clics opcional */

  function trackTelegramClicks() {
    document.querySelectorAll("[data-cta]").forEach(function (link) {
      link.addEventListener("click", function () {
        var location = link.getAttribute("data-cta");

        if (typeof window.gtag === "function") {
          window.gtag("event", "telegram_click", {
            cta_location: location
          });
        }

        if (window.dataLayer && window.dataLayer.push) {
          window.dataLayer.push({
            event: "telegram_click",
            cta_location: location
          });
        }
      });
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
    if (event.key === "Escape" && lightboxOpen) {
      closeLightbox();
    }
  });

  var year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  document.querySelectorAll(".reveal").forEach(observeReveal);

  setupMenu();
  trackTelegramClicks();
  loadLogo();
  loadResults();
})();