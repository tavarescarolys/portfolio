(function () {
  // ---- Header ----
  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function updateHeader() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', updateHeader);
  updateHeader();

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  // ---- Typewriter do hero ----
  var heroType = document.getElementById('heroType');
  if (heroType) {
    var phrases = JSON.parse(heroType.getAttribute('data-phrases') || '[]');
    var i = 0, char = 0, deleting = false;
    var typeSpeed = 55, deleteSpeed = 30, pause = 1700;

    var tick = function () {
      var phrase = phrases[i];
      if (!deleting) {
        char++;
        heroType.textContent = phrase.slice(0, char);
        if (char === phrase.length) { deleting = true; setTimeout(tick, pause); return; }
        setTimeout(tick, typeSpeed);
      } else {
        char--;
        heroType.textContent = phrase.slice(0, char);
        if (char === 0) { deleting = false; i = (i + 1) % phrases.length; setTimeout(tick, 400); return; }
        setTimeout(tick, deleteSpeed);
      }
    };
    // a 1ª frase já vem escrita no HTML (para o Google e para quem não roda JS): mostra, pausa e começa apagando
    if (phrases.length && heroType.textContent.trim() === phrases[0]) {
      char = phrases[0].length; deleting = true;
      setTimeout(tick, pause);
    } else if (phrases.length) tick();
  }

  // ---- Ordem aleatória dos trabalhos a cada visita ----
  function shuffle(list) {
    for (var k = list.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = list[k]; list[k] = list[r]; list[r] = tmp;
    }
    return list;
  }
  var carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    // Home: os 3 destaques abrem o carrossel (em ordem aleatória); os demais vêm depois
    var track = carousel.querySelector('.carousel-track');
    var cards = Array.prototype.slice.call(track.children);
    var featured = shuffle(cards.filter(function (c) { return c.hasAttribute('data-featured'); }));
    var others = shuffle(cards.filter(function (c) { return !c.hasAttribute('data-featured'); }));
    featured.concat(others).forEach(function (c) { track.appendChild(c); });
    track.scrollLeft = 0;

    var section = carousel.parentNode;
    var prev = section.querySelector('.carousel-btn[data-dir="-1"]');
    var next = section.querySelector('.carousel-btn[data-dir="1"]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var updateNav = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    var go = function (dir) {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: dir * (track.clientWidth + gap), behavior: reduce ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);
    updateNav();
  } else {
    // Portfólio: embaralha todos os cards
    var list = document.querySelector('.work-list');
    if (list) shuffle(Array.prototype.slice.call(list.children)).forEach(function (c) { list.appendChild(c); });
  }

  // ---- Filtro de nicho (Portfólio) ----
  var filterBar = document.getElementById('filterBar');
  if (filterBar) {
    var links = filterBar.querySelectorAll('.filter-link');
    var rows = document.querySelectorAll('.work-list .work-card');
    var applyFilter = function (filter) {
      links.forEach(function (l) {
        var on = l.getAttribute('data-filter') === filter;
        l.classList.toggle('active', on);
        // no celular os filtros deslizam: traz o escolhido para o meio da fileira
        if (on && filterBar.scrollWidth > filterBar.clientWidth) {
          filterBar.scrollTo({ left: l.offsetLeft - (filterBar.clientWidth - l.offsetWidth) / 2, behavior: 'auto' });
        }
      });
      rows.forEach(function (row) {
        var match = filter === 'todas' || (row.getAttribute('data-category') || '').split(' ').indexOf(filter) > -1;
        row.classList.toggle('is-hidden', !match);
      });
    };
    filterBar.addEventListener('click', function (e) {
      var link = e.target.closest('.filter-link');
      if (!link) return;
      var filter = link.getAttribute('data-filter');
      applyFilter(filter);
      if (history.replaceState) history.replaceState(null, '', filter === 'todas' ? location.pathname : '#' + filter);
    });
    // link direto para um filtro: portfolio.html#naming, #identidade, #rebranding...
    var fromHash = function () {
      var h = (location.hash || '').replace('#', '');
      if (h && filterBar.querySelector('[data-filter="' + h + '"]')) applyFilter(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  // ---- Slider de abertura (Serviços): ordem aleatória, troca a cada 5 s, bolinhas ----
  document.querySelectorAll('[data-hero-slider]').forEach(function (hero) {
    var strack = hero.querySelector('.svc-hero-track');
    var dotsBox = hero.querySelector('.svc-dots');
    if (!strack || !dotsBox) return;
    var slides = shuffle(Array.prototype.slice.call(strack.children));
    slides.forEach(function (s) { strack.appendChild(s); });
    var n = slides.length;
    var clone = slides[0].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelector('img').alt = '';
    strack.appendChild(clone);
    var idx = 0, timer = null, busy = false;
    var reduceHero = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = slides.map(function (s, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'svc-dot'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Slide ' + (k + 1) + ' de ' + n);
      b.addEventListener('click', function () { show(k); restart(); });
      dotsBox.appendChild(b);
      return b;
    });
    function paint() {
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === idx % n ? 'true' : 'false'); });
    }
    function show(k) { idx = k; strack.style.transform = 'translateX(' + (-100 * idx) + '%)'; paint(); }
    function next() {
      if (idx >= n) return;
      idx += 1; strack.style.transform = 'translateX(' + (-100 * idx) + '%)';
      paint();
    }
    strack.addEventListener('transitionend', function () {
      if (idx === n) {
        strack.classList.add('no-anim'); idx = 0;
        strack.style.transform = 'translateX(0)';
        void strack.offsetWidth; strack.classList.remove('no-anim');
      }
    });
    function start() { if (!reduceHero && !timer) timer = setInterval(next, 5000); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    paint(); start();
  });

  // ---- Timeline deslizante (Serviços): setas + arrastar com o mouse ----
  document.querySelectorAll('[data-slider]').forEach(function (wrap) {
    var track = wrap.querySelector('.tl-track');
    var prev = wrap.querySelector('[data-dir="-1"]');
    var next = wrap.querySelector('[data-dir="1"]');
    if (!track) return;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var update = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      wrap.style.setProperty('--p', Math.min(1, (track.scrollLeft + track.clientWidth) / track.scrollWidth).toFixed(3));
    };
    // entrada animada dos blocos quando a seção aparece na tela
    if (!reduceMotion && 'IntersectionObserver' in window) {
      wrap.classList.add('tl-ready');
      var tlIo = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { wrap.classList.add('is-in'); tlIo.disconnect(); } });
      }, { threshold: 0.25 });
      tlIo.observe(wrap);
    }
    var go = function (dir) {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: dir * (track.clientWidth + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
    });
    // arrastar com o mouse (no toque, o próprio navegador já desliza)
    var down = false, startX = 0, startLeft = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      track.scrollLeft = startLeft - (e.clientX - startX);
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; track.classList.remove('is-dragging');
      var card = track.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0) : 0;
      if (step) track.scrollTo({ left: Math.round(track.scrollLeft / step) * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    update();
  });

  // ---- Sanfona (Estratégia) ----
  document.querySelectorAll('[data-accordion]').forEach(function (acc) {
    var items = acc.querySelectorAll('.acc-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.acc-head');
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        items.forEach(function (it) {
          it.classList.remove('is-open');
          it.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
        });
        if (!open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  });

  // ---- Animação de surgir ao rolar ----
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal');
      child.style.setProperty('--d', (i * 90) + 'ms');
    });
  });
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---- Formulário: "Ainda não sei" não combina com as outras opções ----
  document.querySelectorAll('.choice-group').forEach(function (group) {
    var boxes = group.querySelectorAll('input[type="checkbox"]');
    var unsure = group.querySelector('.chip-unsure input');
    boxes.forEach(function (box) {
      box.addEventListener('change', function () {
        if (!box.checked || !unsure) return;
        boxes.forEach(function (other) {
          if (other !== box && ((box === unsure) || other === unsure)) other.checked = false;
        });
      });
    });
  });

  // ---- Formulário de contato: envia para o Google Forms e abre a página "recebido" ----
  document.querySelectorAll('form[data-gform]').forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var err = form.querySelector('.form-error');
    var loadedAt = Date.now();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (err) err.hidden = true;
      // proteção contra robôs: campo-isca preenchido ou envio rápido demais viram "sucesso" de mentira, sem enviar nada
      var trap = form.querySelector('[name="url_confirm"]');
      if ((trap && trap.value) || Date.now() - loadedAt < 2500) {
        window.location.href = form.getAttribute('data-success') || 'recebido.html';
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
      var data = new FormData(form); data.delete('url_confirm');
      var body = new URLSearchParams(data);
      fetch(form.action, { method: 'POST', mode: 'no-cors', body: body })
        .then(function () { window.location.href = form.getAttribute('data-success') || 'recebido.html'; })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Enviar'; }
          if (err) err.hidden = false;
        });
    });
  });

  // ---- Vídeos que começam sozinhos: respeitam "reduzir movimento" ----
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  }
})();
