(function () {
  "use strict";

  var OWNER = "JhonDuque365";
  var REPO = "alejo-analista-landing";
  var BRANCH = "main";
  var IMAGE = /\.(png|jpe?g|webp|svg|gif|avif)$/i;

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  var lightbox = document.getElementById("lightbox");
  var lightboxImage = document.getElementById("lb-img");
  var closeButton = document.getElementById("lb-close");
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

  /* Logo */

  function loadImage(image, source, frame) {
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
      image.hidden = true;
      image.removeAttribute("src");

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

        var source = files[0].download_url || files[0].path;

        loadImage(
          document.getElementById("logo-nav"),
          source,
          document.querySelector(".logo-frame-nav")
        );

        loadImage(
          document.getElementById("logo-hero"),
          source,
          document.querySelector(".logo-frame-hero")
        );
      })
      .catch(function () {
        /* Si no hay logo, no se muestra nada. */
      });
  }

  /* Modal */

  function openLightbox(source, alt) {
    if (!lightbox || !lightboxImage) {
      return;
    }

    previousFocus = document.activeElement;
    lightboxImage.src = source;
    lightboxImage.alt = alt || "Resultado ampliado";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) {
      return;
    }

    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.style.overflow = "";

    if (previousFocus && previousFocus.focus) {
      previousFocus.focus({
        preventScroll: true
      });
    }
  }

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
    if (event.key === "Escape") {
      closeLightbox();
    }
  });

  /* Menú móvil */

  function setupMenu() {
    var button = document.querySelector(".menu-toggle");
    var menu = document.getElementById("mobile-menu");

    if (!button || !menu) {
      return;
    }

    function toggle(open) {
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute(
        "aria-label",
        open ? "Cerrar menú" : "Abrir menú"
      );
    }

    button.addEventListener("click", function () {
      toggle(menu.hidden);
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle(false);
      });
    });
  }

  /* Ruleta horizontal 3D */

  function setupRoulette(files) {
    var stage = document.getElementById("roulette-stage");
    var track = document.getElementById("roulette-track");
    var empty = document.getElementById("picks-empty");
    var hint = document.querySelector(".roulette-hint");

    if (!stage || !track) {
      return;
    }

    if (!files.length) {
      stage.hidden = true;

      if (empty) {
        empty.hidden = false;
      }

      if (hint) {
        hint.hidden = true;
      }

      return;
    }

    files.sort(function (a, b) {
      return b.name.localeCompare(a.name, undefined, {
        numeric: true
      });
    });

    var cards = [];
    var total = files.length;
    var rotation = 0;
    var speed = 0.28;
    var lastFrame = 0;
    var pausedByMouse = false;
    var pausedByTouch = false;
    var resumeAt = 0;
    var visible = true;
    var currentCenter = 0;

    var startX = 0;
    var startY = 0;
    var dragged = false;

    track.replaceChildren();

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
      track.appendChild(card);

      card.addEventListener("click", function () {
        if (dragged) {
          return;
        }

        if (index === currentCenter) {
          openLightbox(image.src, image.alt);
          return;
        }

        var itemAngle = (Math.PI * 2) / total;

        rotation = -index * itemAngle;
        resumeAt = performance.now() + 2500;
        draw();
      });

      cards.push(card);
    });

    function draw() {
      var itemAngle = (Math.PI * 2) / total;
      var viewportWidth = stage.clientWidth;
      var mobile = viewportWidth <= 640;

      /*
        En móviles reducimos la distancia horizontal y profundidad
        para que la tarjeta central nunca salga del área visible.
      */
      var radius = mobile
        ? Math.min(viewportWidth * 0.24, 105)
        : Math.min(viewportWidth * 0.32, 340);

      var depth = mobile ? 75 : 170;
      var bestDepth = -Infinity;

      var positions = cards.map(function (card, index) {
        var angle = rotation + index * itemAngle;
        var x = Math.sin(angle);
        var z = Math.cos(angle);

        if (z > bestDepth) {
          bestDepth = z;
          currentCenter = index;
        }

        return {
          x: x,
          z: z
        };
      });

      cards.forEach(function (card, index) {
        var position = positions[index];
        var front = (position.z + 1) / 2;
        var isVisible = position.z > -0.72;
        var translateX = position.x * radius;
        var translateZ = position.z * depth;
        var rotateY = -position.x * (mobile ? 35 : 48);
        var scale = mobile
          ? 0.7 + front * 0.3
          : 0.68 + front * 0.32;

        var opacity = 0.2 + front * 0.8;
        var brightness = 0.48 + front * 0.52;

        card.style.transform =
          "translate(-50%, -50%) " +
          "translateX(" + translateX + "px) " +
          "translateZ(" + translateZ + "px) " +
          "rotateY(" + rotateY + "deg) " +
          "scale(" + scale + ")";

        card.style.opacity = String(opacity);
        card.style.filter = "brightness(" + brightness + ")";
        card.style.zIndex = String(Math.round(100 + position.z * 100));
        card.style.pointerEvents = isVisible ? "auto" : "none";
        card.tabIndex = isVisible ? 0 : -1;

        card.classList.toggle("is-active", index === currentCenter);

        card.setAttribute(
          "aria-label",
          index === currentCenter
            ? "Ampliar resultado " + (index + 1)
            : "Centrar resultado " + (index + 1)
        );
      });
    }

    function animate(now) {
      var delta = lastFrame
        ? Math.min((now - lastFrame) / 1000, 0.05)
        : 0;

      lastFrame = now;

      var modalIsOpen = lightbox && !lightbox.hidden;
      var canMove =
        total > 1 &&
        visible &&
        !reducedMotion.matches &&
        !pausedByMouse &&
        !pausedByTouch &&
        !modalIsOpen &&
        !document.hidden &&
        now >= resumeAt;

      if (canMove) {
        rotation += delta * speed;
        draw();
      }

      window.requestAnimationFrame(animate);
    }

    stage.addEventListener("mouseenter", function () {
      pausedByMouse = true;
    });

    stage.addEventListener("mouseleave", function () {
      pausedByMouse = false;
      resumeAt = performance.now() + 350;
    });

    stage.addEventListener(
      "pointerdown",
      function (event) {
        if (event.pointerType === "mouse") {
          return;
        }

        pausedByTouch = true;
        dragged = false;
        startX = event.clientX;
        startY = event.clientY;
      },
      {
        passive: true
      }
    );

    stage.addEventListener(
      "pointermove",
      function (event) {
        if (!pausedByTouch) {
          return;
        }

        var movedX = Math.abs(event.clientX - startX);
        var movedY = Math.abs(event.clientY - startY);

        if (movedX > 12 || movedY > 12) {
          dragged = true;
        }
      },
      {
        passive: true
      }
    );

    function releaseTouch(event) {
      if (event.pointerType === "mouse") {
        return;
      }

      pausedByTouch = false;
      resumeAt = performance.now() + 2500;

      window.setTimeout(function () {
        dragged = false;
      }, 300);
    }

    window.addEventListener("pointerup", releaseTouch);
    window.addEventListener("pointercancel", releaseTouch);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
        },
        {
          threshold: 0.15
        }
      ).observe(stage);
    }

    window.addEventListener("resize", draw);

    reducedMotion.addEventListener("change", draw);

    draw();
    window.requestAnimationFrame(animate);
  }

  function loadResults() {
    list("assets/picks")
      .then(setupRoulette)
      .catch(function () {
        var stage = document.getElementById("roulette-stage");
        var empty = document.getElementById("picks-empty");
        var hint = document.querySelector(".roulette-hint");

        if (stage) {
          stage.hidden = true;
        }

        if (empty) {
          empty.hidden = false;
        }

        if (hint) {
          hint.hidden = true;
        }
      });
  }

  /* Analítica */

  function trackTelegramClicks() {
    document.querySelectorAll("[data-cta]").forEach(function (link) {
      link.addEventListener("click", function () {
        var location = link.getAttribute("data-cta");
        var buttonText = link.textContent.trim().replace(/\s+/g, " ");

        if (typeof window.gtag === "function") {
          window.gtag("event", "telegram_click", {
            cta_location: location,
            cta_text: buttonText,
            destination: "telegram"
          });
        }
      });
    });
  }

  var year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  setupMenu();
  loadLogo();
  loadResults();
  trackTelegramClicks();
})();