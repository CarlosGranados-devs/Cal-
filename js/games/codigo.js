(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var TRIES = 10;
  var LEN = 4;
  var COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  var NAMES = ['rojo', 'ámbar', 'verde', 'cian', 'violeta', 'rosa'];
  var SHAPES = [
    '<circle cx="12" cy="12" r="6"/>',
    '<path d="M12 5 L19 18 L5 18 Z"/>',
    '<rect x="6" y="6" width="12" height="12"/>',
    '<path d="M12 4 L20 12 L12 20 L4 12 Z"/>',
    '<path d="M12 4 L14.5 9.5 L20 10 L16 14 L17 20 L12 17 L7 20 L8 14 L4 10 L9.5 9.5 Z"/>',
    '<path d="M9 4 H15 V9 H20 V15 H15 V20 H9 V15 H4 V9 H9 Z"/>'
  ];

  function injectStyle() {
    if (document.getElementById('calo-style-codigo')) return;
    var s = document.createElement('style');
    s.id = 'calo-style-codigo';
    s.textContent =
      '.cd-board{display:flex;flex-direction:column;gap:4px;width:100%;max-width:340px;}' +
      '.cd-row{display:flex;align-items:center;gap:8px;padding:3px 8px;border:1px solid var(--line);border-radius:10px;background:var(--panel);}' +
      '.cd-row.cur{border-color:var(--red);}' +
      '.cd-row.cur .cd-n{color:var(--red);}' +
      '.cd-n{width:18px;font-size:11px;color:var(--dim);text-align:right;}' +
      '.cd-slots{display:flex;gap:6px;flex:1;justify-content:center;}' +
      '.cd-peg{width:clamp(30px,5vh,38px);height:clamp(30px,5vh,38px);border-radius:50%;border:2px solid var(--line);background:var(--bg);display:grid;place-items:center;padding:0;color:#0a0a0c;}' +
      '.cd-peg svg{width:78%;height:78%;fill:currentColor;}' +
      '.cd-peg.full{border-color:rgba(0,0,0,.35);}' +
      'button.cd-peg{cursor:pointer;}' +
      '.cd-pins{display:grid;grid-template-columns:repeat(2,12px);gap:3px;width:27px;}' +
      '.cd-pin{width:12px;height:12px;box-sizing:border-box;border:2px solid var(--line);border-radius:50%;}' +
      '.cd-pin.ex{background:var(--fg);border-color:var(--fg);border-radius:2px;}' +
      '.cd-pin.mv{background:transparent;border-color:var(--fg);}' +
      '.cd-pal{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;width:100%;max-width:340px;}' +
      '.cd-col{height:clamp(48px,7.5vh,60px);border-radius:12px;border:2px solid rgba(0,0,0,.35);display:grid;place-items:center;cursor:pointer;color:#0a0a0c;padding:0;position:relative;}' +
      '.cd-col:active{transform:scale(.93);}' +
      '.cd-col svg{width:62%;height:62%;fill:currentColor;}' +
      '.cd-col small{position:absolute;right:4px;bottom:1px;font-size:10px;font-weight:700;color:#0a0a0c;}' +
      '.cd-legend{font-size:12px;color:var(--dim);display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;}' +
      '.cd-legend .cd-pin{display:inline-block;vertical-align:middle;margin-right:4px;}';
    document.head.appendChild(s);
  }

  function shape(i) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + SHAPES[i] + '</svg>';
  }

  function makeSecret(repeat) {
    if (repeat) {
      var r = [];
      for (var i = 0; i < LEN; i++) r.push(U.rand(0, 5));
      return r;
    }
    return U.shuffle([0, 1, 2, 3, 4, 5]).slice(0, LEN);
  }

  function score(secret, guess) {
    var ex = 0, mv = 0, i;
    var cs = [0, 0, 0, 0, 0, 0], cg = [0, 0, 0, 0, 0, 0];
    for (i = 0; i < LEN; i++) {
      if (secret[i] === guess[i]) ex++;
      else { cs[secret[i]]++; cg[guess[i]]++; }
    }
    for (i = 0; i < 6; i++) mv += Math.min(cs[i], cg[i]);
    return { ex: ex, mv: mv };
  }

  function play(ctx, repeat) {
    injectStyle();
    var secret = makeSecret(repeat);
    var attempt = 0;
    var cur = [];
    var rows = [];

    var msg = h('p', { class: 'g-msg', text: 'elige 4 colores y pulsa probar' });
    var board = h('div', { class: 'cd-board' });
    for (var r = 0; r < TRIES; r++) {
      var slots = h('div', { class: 'cd-slots' });
      var pegs = [];
      for (var k = 0; k < LEN; k++) {
        (function (kk) {
          var p = h('button', { class: 'cd-peg', 'aria-label': 'hueco ' + (kk + 1), tabindex: '-1' });
          p.addEventListener('click', function () { removeAt(kk); });
          pegs.push(p);
          slots.appendChild(p);
        })(k);
      }
      var pins = h('div', { class: 'cd-pins' });
      var row = h('div', { class: 'cd-row' }, h('span', { class: 'cd-n', text: String(r + 1) }), slots, pins);
      rows.push({ el: row, pegs: pegs, pins: pins });
      board.appendChild(row);
    }
    var pal = h('div', { class: 'cd-pal' });
    COLORS.forEach(function (c, i) {
      pal.appendChild(h('button', { class: 'cd-col', style: { background: c }, 'aria-label': NAMES[i] + ' (tecla ' + (i + 1) + ')', html: shape(i) + '<small>' + (i + 1) + '</small>', onclick: function () { add(i); } }));
    });
    var btnDel = h('button', { class: 'g-btn ghost', text: 'borrar', onclick: function () { removeLast(); } });
    var btnOk = h('button', { class: 'g-btn primary', text: 'probar', onclick: function () { submit(); } });
    var legend = h('div', { class: 'cd-legend' },
      h('span', {}, h('i', { class: 'cd-pin ex' }), 'cuadrado: color y lugar'),
      h('span', {}, h('i', { class: 'cd-pin mv' }), 'aro: color en otro lugar'));

    ctx.root.appendChild(h('div', { class: 'g-wrap', style: { gap: '8px' } }, msg, board, pal, h('div', { class: 'g-row' }, btnDel, btnOk), legend));

    function render() {
      rows.forEach(function (row, i) { row.el.classList.toggle('cur', i === attempt && !ctx.isDone()); });
      if (attempt < TRIES) {
        var rw = rows[attempt];
        for (var k = 0; k < LEN; k++) paint(rw.pegs[k], cur[k]);
      }
      btnOk.disabled = cur.length < LEN;
      btnDel.disabled = cur.length === 0;
      ctx.status('intento ' + Math.min(attempt + 1, TRIES) + '/' + TRIES);
      ctx.score(repeat ? 'con repetidos' : 'sin repetidos');
    }

    function paint(p, v) {
      if (v == null) {
        p.className = 'cd-peg';
        p.style.background = '';
        p.innerHTML = '';
        p.setAttribute('aria-label', 'hueco vacío');
      } else {
        p.className = 'cd-peg full';
        p.style.background = COLORS[v];
        p.innerHTML = shape(v);
        p.setAttribute('aria-label', NAMES[v]);
      }
    }

    function add(i) {
      if (ctx.isDone()) return;
      if (cur.length >= LEN) { ctx.sfx('bad'); return; }
      cur.push(i);
      ctx.sfx('tick');
      ctx.vibrate(8);
      msg.textContent = cur.length < LEN ? 'faltan ' + (LEN - cur.length) : 'listo, pulsa probar (enter)';
      render();
    }

    function removeLast() {
      if (ctx.isDone() || !cur.length) return;
      cur.pop();
      ctx.sfx('click');
      render();
    }

    function removeAt(k) {
      if (ctx.isDone() || k >= cur.length) return;
      cur.splice(k, 1);
      ctx.sfx('click');
      render();
    }

    function submit() {
      if (ctx.isDone()) return;
      if (cur.length < LEN) {
        ctx.sfx('bad');
        msg.textContent = 'completa los 4 colores';
        return;
      }
      var res = score(secret, cur);
      var rw = rows[attempt];
      var i;
      for (i = 0; i < res.ex; i++) rw.pins.appendChild(h('i', { class: 'cd-pin ex' }));
      for (i = 0; i < res.mv; i++) rw.pins.appendChild(h('i', { class: 'cd-pin mv' }));
      for (i = res.ex + res.mv; i < LEN; i++) rw.pins.appendChild(h('i', { class: 'cd-pin' }));
      rw.pins.setAttribute('aria-label', res.ex + ' exactos, ' + res.mv + ' en otro lugar');
      rw.pegs.forEach(function (p) { p.disabled = true; });
      attempt++;
      cur = [];
      if (res.ex === LEN) {
        render();
        ctx.sfx('win');
        ctx.mood('happy');
        var pts = (TRIES - attempt) * 10 + 10;
        ctx.finish({ win: true, score: pts, scoreText: pts + ' pts', better: 'high', title: '¡código roto!', msg: 'lo descifraste en ' + attempt + (attempt === 1 ? ' intento' : ' intentos') });
        return;
      }
      ctx.vibrate(15);
      if (attempt >= TRIES) {
        render();
        ctx.sfx('lose');
        ctx.mood('sad');
        ctx.finish({ win: false, title: 'sin intentos', msg: 'el código era: ' + secret.map(function (c) { return NAMES[c]; }).join(', ') });
        return;
      }
      ctx.sfx(res.ex + res.mv > 0 ? 'good' : 'tick');
      msg.textContent = res.ex + ' exactos · ' + res.mv + ' en otro lugar';
      render();
      rows[attempt].el.scrollIntoView({ block: 'nearest' });
    }

    ctx.onKey(function (e) {
      var k = e.key;
      if (k >= '1' && k <= '6') add(parseInt(k, 10) - 1);
      else if (k === 'Backspace') removeLast();
      else if (k === 'Enter') submit();
    });
    render();
  }

  C.register({
    id: 'codigo',
    name: 'Código',
    desc: 'Descifra el código secreto de 4 colores en 10 intentos.',
    tag: 'mente',
    color: '#a78bfa',
    unit: 'pts',
    icon: ['.######.', '#......#', '#.#..#.#', '#......#', '#.#..#.#', '#......#', '.######.', '...##...'],
    how: 'Calo esconde 4 colores. Arma tu intento y pulsa probar.\nCuadrado = color y lugar correctos. Aro = color correcto en otro lugar.\nTeclas 1 a 6 para colores, borrar y enter.',
    start: function (ctx) {
      ctx.choose({
        title: '¿qué código?',
        options: [
          { id: 'r', label: 'con repetidos', desc: 'un color puede salir varias veces' },
          { id: 'n', label: 'sin repetidos', desc: '4 colores distintos entre 6' }
        ]
      }, function (id) { play(ctx, id === 'r'); });
    }
  });
})();
