/* ==========================================================
   Deck engine: navigation, progress, XP, outline, fullscreen
   ========================================================== */
(function () {
  'use strict';

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var current = Math.max(0, slides.findIndex(function (s) {
    return '#' + s.dataset.key === location.hash;
  }));

  var els = {
    fill: document.getElementById('progressFill'),
    label: document.getElementById('progressLabel'),
    counter: document.getElementById('navCounter'),
    dots: document.getElementById('navDots'),
    prev: document.getElementById('prevBtn'),
    next: document.getElementById('nextBtn'),
    xp: document.getElementById('xpValue'),
    xpPill: document.getElementById('xpPill'),
    star: document.querySelector('.progress-star'),
    toast: document.getElementById('toast'),
    confetti: document.getElementById('confetti'),
    outline: document.getElementById('outline'),
    outlineBody: document.getElementById('outlineBody'),
    outlineClose: document.getElementById('outlineClose'),
    menuBtn: document.getElementById('menuBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    finalXP: document.getElementById('finalXP')
  };

  var AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function ar(n) {
    return String(n).replace(/\d/g, function (d) { return AR_DIGITS[+d]; });
  }

  /* ---------- dots ---------- */
  slides.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'الشريحة ' + ar(i + 1) + ' — ' + s.dataset.title);
    b.addEventListener('click', function () { go(i); });
    els.dots.appendChild(b);
  });

  /* ---------- outline ---------- */
  (function buildOutline() {
    var groups = [];
    var map = {};
    slides.forEach(function (s, i) {
      var unit = s.dataset.unit || 'عام';
      if (!map[unit]) { map[unit] = { name: unit, items: [] }; groups.push(map[unit]); }
      map[unit].items.push({ i: i, title: s.dataset.title });
    });
    groups.forEach(function (g) {
      var box = document.createElement('div');
      box.className = 'outline-group';
      var h = document.createElement('h4');
      h.textContent = g.name;
      box.appendChild(h);
      g.items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'outline-link';
        b.dataset.go = it.i;
        b.innerHTML = '<b>' + ar(it.i + 1) + '</b><span>' + it.title + '</span>';
        b.addEventListener('click', function () { go(it.i); closeOutline(); });
        box.appendChild(b);
      });
      els.outlineBody.appendChild(box);
    });
  })();

  /* ---------- top-level navigation ---------- */
  function render() {
    slides.forEach(function (s, i) {
      var on = i === current;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    var pct = ((current + 1) / total) * 100;
    els.fill.style.width = pct + '%';
    els.star.style.right = 'calc(' + Math.min(pct, 97) + '% - 13px)';
    els.label.textContent = ar(current + 1) + ' من ' + ar(total);
    els.counter.textContent = ar(current + 1) + ' من ' + ar(total);
    Array.prototype.forEach.call(els.dots.children, function (d, i) {
      d.classList.toggle('is-on', i === current);
      d.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
    els.prev.disabled = current === 0;
    els.next.disabled = current === total - 1;

    var links = els.outlineBody.querySelectorAll('.outline-link');
    Array.prototype.forEach.call(links, function (l) {
      l.classList.toggle('is-on', +l.dataset.go === current);
    });
  }

  function go(index) {
    if (typeof index === 'string') {
      index = slides.findIndex(function (s) { return s.dataset.key === index; });
    }
    if (index < 0 || index >= total || index === current) return;
    var old = current;
    var fromKey = slides[old].dataset.key;

    document.dispatchEvent(new CustomEvent('slide:leave', {
      detail: { key: fromKey, index: old }
    }));

    current = index;
    render();
    slides[index].scrollTop = 0;

    /* restart the entrance animation reliably */
    var active = slides[index];
    if (active.querySelector('.reveal')) {
      active.classList.remove('is-active');
      void active.offsetWidth;
      active.classList.add('is-active');
    }

    try { history.replaceState(null, '', '#' + slides[index].dataset.key); } catch (err) { /* file:// may refuse */ }
    document.dispatchEvent(new CustomEvent('slide:enter', {
      detail: { key: slides[index].dataset.key, index: index, from: fromKey }
    }));
  }
  function next() { go(Math.min(current + 1, total - 1)); }
  function prev() { go(Math.max(current - 1, 0)); }

  /* ---------- buttons ---------- */
  document.addEventListener('click', function (e) {
    var goto = e.target.closest('[data-goto]');
    if (!goto) return;
    var i = slides.findIndex(function (s) { return s.dataset.key === goto.dataset.goto; });
    if (i >= 0) go(i);
  });
  els.prev.addEventListener('click', prev);
  els.next.addEventListener('click', next);

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'Escape') { closeOutline(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
    else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    else if (e.key === 'e' || e.key === 'E') { toggleOutline(); }
  });

  /* ---------- swipe ---------- */
  var touchX = 0, touchY = 0, tracking = false;
  document.addEventListener('touchstart', function (e) {
    if (e.target.closest('.subjects, .learn-rail, .chat-body, .paper, .recipe, .quiz')) { tracking = false; return; }
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) < 55 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });

  /* ---------- outline ---------- */
  function openOutline() {
    els.outline.classList.add('is-open');
    els.outline.setAttribute('aria-hidden', 'false');
  }
  function closeOutline() {
    els.outline.classList.remove('is-open');
    els.outline.setAttribute('aria-hidden', 'true');
  }
  function toggleOutline() {
    if (els.outline.classList.contains('is-open')) closeOutline(); else openOutline();
  }
  els.menuBtn.addEventListener('click', toggleOutline);
  els.outlineClose.addEventListener('click', closeOutline);

  /* ---------- fullscreen ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else {
      document.exitFullscreen();
    }
  }
  els.fullscreenBtn.addEventListener('click', toggleFullscreen);

  /* ---------- XP ---------- */
  var xp = 0;
  try { xp = +(sessionStorage.getItem('ai-deck-xp') || 0) || 0; } catch (err) { xp = 0; }
  function paintXP() {
    els.xp.textContent = ar(xp);
    if (els.finalXP) els.finalXP.textContent = ar(xp) + ' XP';
  }
  function addXP(n, label) {
    if (!n) return;
    xp += n;
    try { sessionStorage.setItem('ai-deck-xp', xp); } catch (err) {}
    paintXP();
    els.xpPill.classList.remove('bump');
    void els.xpPill.offsetWidth;
    els.xpPill.classList.add('bump');
    toast('+' + ar(n) + ' XP' + (label ? ' · ' + label : ''));
  }
  paintXP();

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(text) {
    els.toast.textContent = text;
    els.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('is-on'); }, 1900);
  }

  /* ---------- confetti ---------- */
  var COLORS = ['#58cc02', '#1cb0f6', '#ce82ff', '#ffc800', '#ff9600', '#ff4b4b', '#7c5cff'];
  function confetti(count) {
    var n = count || 44;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      p.style.animationDuration = (1.7 + Math.random() * 1.2) + 's';
      p.style.animationDelay = (Math.random() * 0.35) + 's';
      p.style.width = (6 + Math.random() * 7) + 'px';
      p.style.height = (9 + Math.random() * 9) + 'px';
      p.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      els.confetti.appendChild(p);
      (function (node) {
        setTimeout(function () { node.remove(); }, 3600);
      })(p);
    }
  }

  /* ---------- boot ---------- */
  render();
  document.dispatchEvent(new CustomEvent('slide:enter', {
    detail: { key: slides[current].dataset.key, index: current, from: null }
  }));

  window.Deck = {
    go: go,
    next: next,
    prev: prev,
    addXP: addXP,
    toast: toast,
    confetti: confetti,
    ar: ar,
    get xp() { return xp; }
  };
})();
