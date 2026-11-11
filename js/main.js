(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;
  var S = C.store;

  var $app;
  var current = null;
  var fromHub = false;
  var bubbleTimer = null;
  var idleTimer = null;
  var filter = 'todos';

  var TAGS = [
    ['todos', 'todos'],
    ['mente', 'mente'],
    ['reflejos', 'reflejos'],
    ['arcade', 'arcade'],
    ['palabras', 'palabras'],
    ['estrategia', 'estrategia']
  ];

  var ICONS = {
    back: '<path d="M15 5 8 12l7 7"/>',
    restart: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1 1-1.1 1.8M12 17.2v.1"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8"/>',
    on: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    off: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9l5 6M21 9l-5 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>'
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }
  C.icon = icon;

  /* ------------------------------------------------------------------ badges */
  C.badges = [
    { id: 'first', name: 'Primer paso', desc: 'Juega tu primer juego', test: function (s, x) { return x.plays >= 1; } },
    { id: 'win1', name: 'Primera victoria', desc: 'Gana una partida', test: function (s, x) { return x.wins >= 1; } },
    { id: 'win10', name: 'Imparable', desc: 'Gana 10 partidas', test: function (s, x) { return x.wins >= 10; } },
    { id: 'win50', name: 'Leyenda', desc: 'Gana 50 partidas', test: function (s, x) { return x.wins >= 50; } },
    { id: 'ex5', name: 'Explorador', desc: 'Prueba 5 juegos distintos', test: function (s, x) { return x.played >= 5; } },
    { id: 'ex15', name: 'Curioso', desc: 'Prueba 15 juegos distintos', test: function (s, x) { return x.played >= 15; } },
    { id: 'exall', name: 'Coleccionista', desc: 'Prueba todos los juegos', test: function (s, x) { return x.played >= C.games.length && C.games.length > 0; } },
    { id: 'streak3', name: 'Constante', desc: 'Racha de 3 días', test: function (s) { return s.streak >= 3; } },
    { id: 'streak7', name: 'Hábito', desc: 'Racha de 7 días', test: function (s) { return s.streak >= 7; } },
    { id: 'lvl5', name: 'Nivel 5', desc: 'Llega al nivel 5', test: function (s) { return S.levelInfo(s.xp).level >= 5; } },
    { id: 'lvl10', name: 'Nivel 10', desc: 'Llega al nivel 10', test: function (s) { return S.levelInfo(s.xp).level >= 10; } },
    { id: 'poke', name: 'Cosquillas', desc: 'Toca a Calo 25 veces', test: function (s) { return s.pokes >= 25; } },
    { id: 'owl', name: 'Búho', desc: 'Juega entre las 0:00 y las 5:00', test: function (s, x, ev) { var hr = new Date().getHours(); return ev === 'game' && hr < 5; } }
  ];

  function checkBadges(ev) {
    var st = S.get();
    var x = S.stats();
    var got = [];
    C.badges.forEach(function (b) {
      if (!st.badges[b.id] && b.test(st, x, ev) && S.badge(b.id)) got.push(b);
    });
    got.forEach(function (b, i) {
      setTimeout(function () { C.toast('logro: ' + b.name, 'badge'); C.audio.play('level'); }, 900 + i * 1400);
    });
    return got;
  }

  /* ------------------------------------------------------------------- toast */
  C.toast = function (msg, cls) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = h('div', { class: 'toast ' + (cls || ''), text: msg });
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3100);
  };

  /* ------------------------------------------------------------------ modals */
  function openModal(title, bodyEl, opts) {
    opts = opts || {};
    closeModal();
    var m = h('div', { class: 'modal-back', id: 'modal' },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('div', { class: 'modal-head' },
          h('h2', { text: title }),
          opts.noClose ? null : h('button', { class: 'icon-btn', 'aria-label': 'cerrar', html: icon('close'), onclick: closeModal })
        ),
        bodyEl
      )
    );
    if (!opts.noClose) {
      m.addEventListener('pointerdown', function (e) { if (e.target === m) closeModal(); });
    }
    document.body.appendChild(m);
    var f = m.querySelector('input,button.primary');
    if (f && !('ontouchstart' in window)) f.focus();
    return m;
  }
  function closeModal() {
    var m = document.getElementById('modal');
    if (m) m.parentNode.removeChild(m);
  }

  /* ------------------------------------------------------------------ bubble */
  function say(el, text, speed) {
    clearInterval(bubbleTimer);
    el.textContent = '';
    var i = 0;
    var cur = h('span', { class: 'caret', text: '▌' });
    el.appendChild(document.createTextNode(''));
    el.appendChild(cur);
    bubbleTimer = setInterval(function () {
      if (i >= text.length) {
        clearInterval(bubbleTimer);
        if (cur.parentNode) cur.parentNode.removeChild(cur);
        return;
      }
      el.firstChild.nodeValue += text[i++];
    }, speed || 18);
  }

  function setMood(el, mood, ms) {
    var s = el.querySelector('.calo');
    if (!s) return;
    s.setAttribute('data-mood', mood);
    if (ms) {
      clearTimeout(s._mt);
      s._mt = setTimeout(function () { s.setAttribute('data-mood', 'idle'); }, ms);
    }
  }

  /* --------------------------------------------------------------------- hub */
  function bestText(def) {
    var b = S.bestOf(def.id);
    if (b == null) return null;
    return def.fmt ? def.fmt(b) : b + (def.unit ? ' ' + def.unit : '');
  }

  function renderHub() {
    stopGame(true);
    var st = S.get();
    var lv = S.levelInfo(st.xp);
    var stats = S.stats();
    $app.innerHTML = '';
    document.body.classList.remove('in-game');

    var mascotBox = h('button', { class: 'hero-mascot', 'aria-label': 'tocar a Calo', html: C.mascot.html(lv.level, 'idle') });
    var bubble = h('p', { class: 'bubble-text' });
    var pokeFx = function () {
      st = S.get();
      st.pokes = (st.pokes || 0) + 1;
      S.save();
      var moods = ['happy', 'wow', 'wink', 'think'];
      setMood(mascotBox, U.pick(moods), 1400);
      C.audio.play('pop');
      var line = st.pokes === 10 ? C.say.line('poke10', { name: st.name }) : C.say.line('poke', { name: st.name });
      say(bubble, line);
      checkBadges('poke');
      resetIdle();
    };
    mascotBox.addEventListener('click', pokeFx);

    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        setMood(mascotBox, 'sleep');
        say(bubble, 'zzz… despiértame si quieres jugar.');
      }, 50000);
    }
    resetIdle();

    var header = h('header', { class: 'top' },
      h('a', { class: 'logo', href: '#/', 'aria-label': 'calo' }, 'calo', h('span', { class: 'logo-cur', text: '_' })),
      h('div', { class: 'top-actions' },
        h('button', { class: 'icon-btn', 'aria-label': 'perfil y logros', html: icon('trophy'), onclick: openProfile }),
        h('button', { class: 'icon-btn', id: 'mute', 'aria-label': 'sonido', html: icon(st.muted ? 'off' : 'on'), onclick: toggleMute })
      )
    );

    var hero = h('section', { class: 'hero' },
      mascotBox,
      h('div', { class: 'hero-info' },
        h('div', { class: 'bubble' }, bubble),
        h('div', { class: 'lvl' },
          h('div', { class: 'lvl-top' },
            h('span', { class: 'lvl-name', text: 'nivel ' + lv.level + ' · ' + (st.name || 'viajero') }),
            h('span', { class: 'lvl-xp', text: lv.cur + '/' + lv.need + ' xp' })
          ),
          h('div', { class: 'bar' }, h('i', { style: { width: Math.round(lv.pct * 100) + '%' } }))
        ),
        h('div', { class: 'chips' },
          h('span', { class: 'chip', text: 'racha ' + st.streak + 'd' }),
          h('span', { class: 'chip', text: stats.played + '/' + C.games.length + ' juegos' }),
          h('span', { class: 'chip', text: stats.wins + ' victorias' })
        )
      )
    );

    var filters = h('nav', { class: 'filters', 'aria-label': 'categorías' });
    TAGS.forEach(function (t) {
      filters.appendChild(h('button', {
        class: 'filter' + (filter === t[0] ? ' on' : ''),
        text: t[1],
        onclick: function () { filter = t[0]; C.audio.play('tick'); renderGrid(); [].forEach.call(filters.children, function (b) { b.classList.toggle('on', b.textContent === t[1]); }); }
      }));
    });

    var grid = h('div', { class: 'grid', id: 'grid' });

    var footer = h('footer', { class: 'foot' },
      h('p', {},
        'hecho por ',
        h('a', { href: 'https://github.com/CarlosGranados-devs', target: '_blank', rel: 'noopener', text: 'Carlos Granados' }),
        ' · inspirado en ',
        h('a', { href: 'https://github.com/YonaZakkart/yoro', target: '_blank', rel: 'noopener', text: 'yoro' }),
        ' de YonaZakkart'
      )
    );

    $app.appendChild(h('div', { class: 'wrap' }, header, hero, filters, grid, footer));
    renderGrid();

    var first = !st.greeted;
    st.greeted = true;
    S.save();
    say(bubble, C.say.greet(st, first && st.visits <= 1));
  }

  function renderGrid() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';
    var list = C.games.filter(function (g) { return filter === 'todos' || g.tag === filter; });
    list.forEach(function (def, i) {
      var best = bestText(def);
      var rec = S.get().games[def.id];
      var card = h('a', {
        class: 'card',
        href: '#/g/' + def.id,
        style: { '--i': i, '--c': def.color || '#ff2c2c' },
        onclick: function () { fromHub = true; C.audio.play('click'); }
      },
        h('span', { class: 'card-ico', html: C.pixicon(def.icon || ['#.#', '.#.', '#.#']) }),
        h('span', { class: 'card-name', text: def.name }),
        h('span', { class: 'card-desc', text: def.desc }),
        h('span', { class: 'card-meta' },
          h('span', { class: 'card-tag', text: def.tag }),
          !rec ? h('span', { class: 'new', text: 'nuevo' }) : (best ? h('span', { class: 'best', text: 'mejor ' + best }) : h('span', { class: 'best', text: rec.plays + (rec.plays === 1 ? ' partida' : ' partidas') }))
        )
      );
      grid.appendChild(card);
    });
  }

  function toggleMute() {
    var st = S.get();
    S.set({ muted: !st.muted });
    var b = document.getElementById('mute');
    if (b) b.innerHTML = icon(S.get().muted ? 'off' : 'on');
    var g = document.getElementById('gmute');
    if (g) g.innerHTML = icon(S.get().muted ? 'off' : 'on');
    if (!S.get().muted) C.audio.play('pop');
  }

  /* ----------------------------------------------------------------- profile */
  function openProfile() {
    var st = S.get();
    var lv = S.levelInfo(st.xp);
    var x = S.stats();
    var body = h('div', { class: 'profile' });

    var nameIn = h('input', { class: 'g-input', type: 'text', maxlength: '16', value: st.name || '', placeholder: 'tu nombre', 'aria-label': 'tu nombre' });
    body.appendChild(h('div', { class: 'prof-row' },
      h('label', { text: 'nombre' }),
      nameIn,
      h('button', { class: 'g-btn', text: 'guardar', onclick: function () { S.set({ name: nameIn.value.trim().slice(0, 16) }); C.toast('guardado'); renderHub(); closeModal(); } })
    ));

    body.appendChild(h('div', { class: 'prof-stats' },
      h('div', {}, h('b', { text: lv.level }), h('span', { text: 'nivel' })),
      h('div', {}, h('b', { text: st.visits }), h('span', { text: 'visitas' })),
      h('div', {}, h('b', { text: st.streak }), h('span', { text: 'racha' })),
      h('div', {}, h('b', { text: x.plays }), h('span', { text: 'partidas' })),
      h('div', {}, h('b', { text: x.wins }), h('span', { text: 'victorias' }))
    ));

    var bg = h('div', { class: 'badge-grid' });
    C.badges.forEach(function (b) {
      var ok = !!st.badges[b.id];
      bg.appendChild(h('div', { class: 'badge' + (ok ? ' on' : '') },
        h('b', { text: ok ? b.name : '???' }),
        h('span', { text: b.desc })
      ));
    });
    body.appendChild(h('h3', { text: 'logros ' + Object.keys(st.badges).length + '/' + C.badges.length }));
    body.appendChild(bg);

    body.appendChild(h('h3', { text: 'ajustes' }));
    var vib = h('button', { class: 'g-btn', text: 'vibración: ' + (st.vibrate ? 'sí' : 'no'), onclick: function () { S.set({ vibrate: !S.get().vibrate }); vib.textContent = 'vibración: ' + (S.get().vibrate ? 'sí' : 'no'); } });
    var snd = h('button', { class: 'g-btn', text: 'sonido: ' + (st.muted ? 'no' : 'sí'), onclick: function () { toggleMute(); snd.textContent = 'sonido: ' + (S.get().muted ? 'no' : 'sí'); } });
    var rst = h('button', { class: 'g-btn danger', text: 'borrar todo', onclick: function () {
      if (rst.dataset.sure) {
        S.reset();
        closeModal();
        renderHub();
        askName();
      } else {
        rst.dataset.sure = '1';
        rst.textContent = '¿seguro? toca otra vez';
        setTimeout(function () { rst.dataset.sure = ''; rst.textContent = 'borrar todo'; }, 3000);
      }
    } });
    body.appendChild(h('div', { class: 'g-row' }, snd, vib, rst));
    openModal('perfil', body);
  }

  function askName() {
    var inp = h('input', { class: 'g-input', type: 'text', maxlength: '16', placeholder: 'tu nombre', 'aria-label': 'tu nombre', autocomplete: 'off' });
    var go = function () {
      S.set({ name: inp.value.trim().slice(0, 16) || 'viajero' });
      closeModal();
      C.audio.play('good');
      renderHub();
    };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    var body = h('div', { class: 'ask' },
      h('div', { class: 'ask-mascot', html: C.mascot.html(1, 'wink') }),
      h('p', { text: 'hola. soy calo, un fantasma que vive en tu navegador y guarda récords. ¿cómo te llamas?' }),
      inp,
      h('button', { class: 'g-btn primary', text: 'listo', onclick: go })
    );
    openModal('bienvenido', body, { noClose: true });
  }

  /* -------------------------------------------------------------------- game */
  function makeCtx(def, ui) {
    var cleanups = [];
    var loops = [];
    var done = false;
    var root = ui.root;

    var ctx = {
      def: def,
      root: root,
      h: h,
      util: U,
      best: S.bestOf(def.id),
      sfx: function (n) { C.audio.play(n); },
      tone: function (f, d, t, v) { C.audio.tone(f, d, t, v); },
      vibrate: function (ms) { if (S.get().vibrate && navigator.vibrate) { try { navigator.vibrate(ms || 15); } catch (e) {} } },
      status: function (t) { ui.status.textContent = t == null ? '' : t; },
      score: function (t) { ui.score.textContent = t == null ? '' : t; },
      mood: function (m, ms) { ui.setMood && ui.setMood(m, ms); },
      cleanup: function (fn) { cleanups.push(fn); },
      after: function (ms, fn) {
        var id = setTimeout(function () { if (!done) fn(); }, ms);
        cleanups.push(function () { clearTimeout(id); });
        return id;
      },
      every: function (ms, fn) {
        var id = setInterval(function () { if (!done) fn(); }, ms);
        cleanups.push(function () { clearInterval(id); });
        return function () { clearInterval(id); };
      },
      loop: function (fn) {
        var raf = 0;
        var last = performance.now();
        var alive = true;
        function frame(now) {
          if (!alive) return;
          var dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          fn(dt, now);
          raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);
        var stop = function () { alive = false; cancelAnimationFrame(raf); };
        loops.push(stop);
        cleanups.push(stop);
        return stop;
      },
      onKey: function (fn) {
        var f = function (e) {
          if (done) return;
          var tg = e.target && e.target.tagName;
          if (tg === 'INPUT' || tg === 'TEXTAREA') return fn(e);
          if (e.key && (e.key.indexOf('Arrow') === 0 || e.key === ' ')) e.preventDefault();
          fn(e);
        };
        window.addEventListener('keydown', f);
        cleanups.push(function () { window.removeEventListener('keydown', f); });
      },
      onKeyUp: function (fn) {
        var f = function (e) { if (!done) fn(e); };
        window.addEventListener('keyup', f);
        cleanups.push(function () { window.removeEventListener('keyup', f); });
      },
      swipe: function (el, cb, min) {
        min = min || 24;
        el.style.touchAction = 'none';
        var sx = 0, sy = 0, on = false;
        el.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; on = true; });
        el.addEventListener('pointerup', function (e) {
          if (!on || done) return;
          on = false;
          var dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return;
          if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? 'right' : 'left');
          else cb(dy > 0 ? 'down' : 'up');
        });
        el.addEventListener('pointercancel', function () { on = false; });
      },
      dpad: function (parent, cb, opt) {
        opt = opt || {};
        var wrap = h('div', { class: 'g-dpad' });
        [['up', '▲'], ['left', '◀'], ['down', '▼'], ['right', '▶']].forEach(function (d) {
          var b = h('button', { class: 'g-dpad-' + d[0], 'aria-label': d[0], text: d[1] });
          var rep = null;
          var fire = function () { if (!done) cb(d[0]); };
          b.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            fire();
            if (opt.repeat) { clearInterval(rep); rep = setInterval(fire, opt.repeat); }
          });
          ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { b.addEventListener(n, function () { clearInterval(rep); }); });
          cleanups.push(function () { clearInterval(rep); });
          wrap.appendChild(b);
        });
        (parent || root).appendChild(wrap);
        return wrap;
      },
      canvas: function (W, H, opt) {
        opt = opt || {};
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var box = h('div', { class: 'g-canvas-box' });
        var cv = h('canvas', { class: 'g-canvas', width: Math.round(W * dpr), height: Math.round(H * dpr) });
        var g = cv.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        box.appendChild(cv);
        (opt.parent || root).appendChild(box);
        function fit() {
          var aw = box.clientWidth;
          var ah = box.clientHeight;
          if (!aw || !ah) return;
          var s = Math.min(aw / W, ah / H);
          if (opt.maxScale) s = Math.min(s, opt.maxScale);
          cv.style.width = Math.floor(W * s) + 'px';
          cv.style.height = Math.floor(H * s) + 'px';
        }
        fit();
        requestAnimationFrame(fit);
        if (window.ResizeObserver) {
          var ro = new ResizeObserver(fit);
          ro.observe(box);
          cleanups.push(function () { ro.disconnect(); });
        } else {
          window.addEventListener('resize', fit);
          cleanups.push(function () { window.removeEventListener('resize', fit); });
        }
        return {
          canvas: cv,
          g: g,
          W: W,
          H: H,
          box: box,
          fit: fit,
          pos: function (e) {
            var r = cv.getBoundingClientRect();
            return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
          }
        };
      },
      choose: function (o, cb) {
        var layer = h('div', { class: 'g-choose' });
        var panel = h('div', { class: 'g-choose-panel' }, h('h3', { text: o.title || 'elige' }));
        if (o.sub) panel.appendChild(h('p', { class: 'g-msg', text: o.sub }));
        o.options.forEach(function (op) {
          panel.appendChild(h('button', {
            class: 'g-btn big',
            onclick: function () {
              C.audio.play('click');
              if (layer.parentNode) layer.parentNode.removeChild(layer);
              cb(op.id);
            }
          }, h('b', { text: op.label }), op.desc ? h('small', { text: op.desc }) : null));
        });
        layer.appendChild(panel);
        root.appendChild(layer);
      },
      finish: function (o) {
        if (done) return;
        done = true;
        loops.forEach(function (f) { f(); });
        runCleanups(cleanups);
        o = o || {};
        var rec = S.recordGame(def.id, { win: !!o.win, score: o.score, better: o.better || 'high' });
        var xp = (o.win ? 12 : 4) + (rec.isRecord && o.score != null && !rec.first ? 6 : 0) + (rec.first ? 5 : 0);
        var lvl = S.addXp(xp);
        var st = S.get();
        var x = S.stats();
        var newBadges = checkBadges('game');
        var rm = o.win ? (rec.isRecord && !rec.first ? 'wow' : 'happy') : 'sad';
        var lines = rec.isRecord && !rec.first ? 'record' : o.win ? 'win' : 'lose';
        var overlay = h('div', { class: 'result' },
          h('div', { class: 'result-card' },
            h('div', { class: 'result-mascot', html: C.mascot.html(lvl.after, rm) }),
            h('h2', { class: o.win ? 'ok' : 'ko', text: o.title || (o.win ? '¡victoria!' : 'fin del juego') }),
            o.scoreText ? h('div', { class: 'result-score', text: o.scoreText }) : null,
            rec.isRecord && o.score != null ? h('div', { class: 'result-rec', text: rec.first ? 'primer registro' : '¡nuevo récord!' }) : null,
            o.msg ? h('p', { class: 'result-msg', text: o.msg }) : null,
            h('p', { class: 'result-say', text: C.say.line(lines, { name: st.name }) }),
            h('p', { class: 'result-xp', text: '+' + xp + ' xp' + (lvl.up ? ' · ¡nivel ' + lvl.after + '!' : '') }),
            h('div', { class: 'g-row' },
              h('button', { class: 'g-btn primary', text: 'otra vez', onclick: function () { startGame(def); } }),
              h('button', { class: 'g-btn', text: 'menú', onclick: function () { goHub(); } })
            )
          )
        );
        ui.stage.appendChild(overlay);
        C.audio.play(lvl.up ? 'level' : o.win ? 'win' : 'lose');
        ctx.vibrate(o.win ? [20, 40, 20] : 40);
        if (lvl.up) setTimeout(function () { C.toast('¡subiste al nivel ' + lvl.after + '!', 'badge'); }, 600);
      },
      isDone: function () { return done; }
    };

    ctx._destroy = function () {
      done = true;
      loops.forEach(function (f) { f(); });
      runCleanups(cleanups);
    };
    return ctx;
  }

  function runCleanups(list) {
    while (list.length) {
      try { list.pop()(); } catch (e) {}
    }
  }

  function stopGame(silent) {
    if (!current) return;
    try { if (current.destroy) current.destroy(); } catch (e) {}
    current.ctx._destroy();
    current = null;
    if (!silent) document.body.classList.remove('in-game');
  }

  function startGame(def) {
    stopGame(true);
    clearTimeout(idleTimer);
    clearInterval(bubbleTimer);
    document.body.classList.add('in-game');
    closeModal();
    $app.innerHTML = '';

    var status = h('span', { class: 'hud-status' });
    var score = h('span', { class: 'hud-score' });
    var root = h('div', { class: 'g-root' });
    var stage = h('div', { class: 'stage' }, root);
    var best = bestText(def);

    var bar = h('header', { class: 'gbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'volver al menú', html: icon('back'), onclick: goHub }),
      h('div', { class: 'gtitle' }, h('b', { text: def.name }), h('small', { text: best ? 'mejor ' + best : def.tag })),
      h('div', { class: 'top-actions' },
        def.how ? h('button', { class: 'icon-btn', 'aria-label': 'cómo se juega', html: icon('help'), onclick: function () { showHow(def); } }) : null,
        h('button', { class: 'icon-btn', 'aria-label': 'reiniciar', html: icon('restart'), onclick: function () { C.audio.play('click'); startGame(def); } }),
        h('button', { class: 'icon-btn', id: 'gmute', 'aria-label': 'sonido', html: icon(S.get().muted ? 'off' : 'on'), onclick: toggleMute })
      )
    );
    var hud = h('div', { class: 'hud' }, status, score);
    $app.appendChild(h('div', { class: 'gscreen' }, bar, hud, stage));

    var ui = { root: root, stage: stage, status: status, score: score };
    var ctx = makeCtx(def, ui);
    current = { def: def, ctx: ctx, destroy: null };
    try {
      var d = def.start(ctx);
      if (typeof d === 'function') current.destroy = d;
    } catch (err) {
      console.error('[calo] error en juego', def.id, err);
      root.appendChild(h('p', { class: 'g-msg', text: 'este juego tuvo un error. vuelve al menú.' }));
    }
    if (!S.get().seen) S.get().seen = {};
    if (def.how && !S.get().seen[def.id]) {
      S.get().seen[def.id] = 1;
      S.save();
      showHow(def);
    }
  }

  function showHow(def) {
    var body = h('div', { class: 'how' }, h('p', { text: def.how }), h('button', { class: 'g-btn primary', text: 'entendido', onclick: closeModal }));
    openModal(def.name, body);
  }

  function goHub() {
    C.audio.play('click');
    if (fromHub) {
      fromHub = false;
      history.back();
    } else {
      location.replace('#/');
      route();
    }
  }

  /* ------------------------------------------------------------------ router */
  function route() {
    var m = /^#\/g\/([\w-]+)/.exec(location.hash);
    if (m) {
      var def = C.games.filter(function (g) { return g.id === m[1]; })[0];
      if (def) {
        if (current && current.def === def) return;
        return startGame(def);
      }
    }
    renderHub();
  }

  /* -------------------------------------------------------------------- boot */
  function boot() {
    $app = document.getElementById('app');
    S.load();
    S.visit();
    window.addEventListener('hashchange', route);
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (document.getElementById('modal')) closeModal();
        else if (current) goHub();
      }
    });
    var title = document.title;
    document.addEventListener('visibilitychange', function () {
      document.title = document.hidden ? '¿a dónde vas? · calo' : title;
    });
    route();
    if (!S.get().name) askName();
    checkBadges('boot');
    if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.protocol + '//' + location.host)) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
