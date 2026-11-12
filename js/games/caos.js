(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var TOTAL = 30;
  var GOAL = 220;
  var COLORS = [
    { id: 'azul', name: 'azul', sym: '◆', hex: '#2f9bff' },
    { id: 'dorado', name: 'dorado', sym: '★', hex: '#ffcf33' },
    { id: 'verde', name: 'verde', sym: '▲', hex: '#43d17a' },
    { id: 'cian', name: 'cian', sym: '●', hex: '#38d9ff' },
    { id: 'rosa', name: 'rosa', sym: '✦', hex: '#ff5ea8' }
  ];

  function injectCss() {
    if (document.getElementById('nitro-style-caos')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-caos';
    s.textContent =
      '.cs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;width:min(100%,360px);}' +
      '.cs-tile{position:relative;aspect-ratio:1;border-radius:16px;border:2px solid rgba(255,255,255,.16);' +
        'background:#0b1e36;color:#081426;font-family:var(--mono);font-weight:700;font-size:clamp(20px,7vw,30px);' +
        'display:grid;place-items:center;cursor:pointer;transition:transform .08s,opacity .2s,filter .12s;' +
        'text-shadow:0 1px 0 rgba(255,255,255,.35);user-select:none;}' +
      '.cs-tile:active{transform:scale(.94);}' +
      '.cs-tile.gone{opacity:.14;pointer-events:none;background:#0b1e36!important;color:transparent;border-color:var(--line);}' +
      '.cs-tile.bad{animation:shake .3s;}' +
      '.cs-target{display:flex;align-items:center;gap:8px;font-family:var(--pix);font-size:11px;color:var(--fg);' +
        'border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:rgba(8,20,38,.7);}' +
      '.cs-target b{font-size:18px;line-height:1;}' +
      '.cs-target .cs-dot{width:12px;height:12px;border-radius:50%;box-shadow:0 0 12px currentColor;}' +
      '.cs-bar{width:min(100%,360px);height:8px;border-radius:999px;background:#0b1e36;border:1px solid var(--line);overflow:hidden;}' +
      '.cs-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--gold),var(--red2));transition:width .12s linear;}';
    document.head.appendChild(s);
  }

  function play(ctx) {
    injectCss();
    var left = TOTAL;
    var score = 0;
    var combo = 0;
    var hits = 0;
    var misses = 0;
    var rounds = 0;
    var over = false;
    var target = COLORS[0];
    var need = 0;

    var targetDot = h('span', { class: 'cs-dot' });
    var targetSym = h('b', { text: '◆' });
    var targetName = h('span', { text: 'toca los azul' });
    var targetBox = h('div', { class: 'cs-target' }, targetDot, targetSym, targetName);
    var bar = h('div', { class: 'cs-bar' }, h('i'));
    var barFill = bar.firstChild;
    var msg = h('p', { class: 'g-msg', text: 'toca solo las fichas del color indicado' });
    var grid = h('div', { class: 'cs-grid' });
    var tiles = [];

    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var t = h('button', { class: 'cs-tile', 'aria-label': 'ficha ' + (idx + 1), text: '' });
        t.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(idx); });
        tiles.push(t);
        grid.appendChild(t);
      })(i);
    }

    ctx.root.appendChild(h('div', { class: 'g-wrap' }, targetBox, bar, msg, grid));

    function hud() {
      ctx.status('tiempo: ' + Math.max(0, Math.ceil(left)) + ' s');
      ctx.score(score + ' pts' + (combo > 1 ? ' x' + combo : ''));
    }

    function paint(tile, color) {
      tile.style.background = color ? color.hex : '';
      tile.textContent = color ? color.sym : '';
      tile.dataset.id = color ? color.id : '';
      tile.classList.toggle('gone', !color);
      tile.setAttribute('aria-label', color ? 'ficha ' + color.name : 'ficha vacía');
    }

    function newRound() {
      target = U.pick(COLORS);
      need = U.rand(2, 4);
      var others = COLORS.filter(function (c) { return c.id !== target.id; });
      var order = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      tiles.forEach(function (t) { t.classList.remove('bad', 'gone'); });
      order.forEach(function (pos, i) {
        paint(tiles[pos], i < need ? target : U.pick(others));
      });
      targetDot.style.background = target.hex;
      targetDot.style.color = target.hex;
      targetSym.textContent = target.sym;
      targetSym.style.color = target.hex;
      targetName.textContent = 'toca los ' + target.name;
      rounds++;
      hud();
    }

    function clearRound() {
      score += 15;
      ctx.sfx('good');
      ctx.vibrate(12);
      left = Math.min(TOTAL, left + 1.2);
      msg.textContent = '¡ronda limpia! +15 · tiempo extra';
      ctx.after(180, function () {
        if (!over) newRound();
      });
    }

    function tap(idx) {
      if (over || ctx.isDone()) return;
      var t = tiles[idx];
      if (!t.dataset.id || t.classList.contains('gone')) return;
      if (t.dataset.id === target.id) {
        t.classList.add('gone');
        hits++;
        combo++;
        var gain = 10 + Math.min(20, combo * 2);
        score += gain;
        need--;
        ctx.sfx('pop');
        ctx.vibrate(8);
        if (need <= 0) clearRound();
        else hud();
      } else {
        combo = 0;
        misses++;
        score = Math.max(0, score - 8);
        left = Math.max(0, left - 2);
        t.classList.remove('bad');
        void t.offsetWidth;
        t.classList.add('bad');
        msg.textContent = '¡esa no era! -8 pts y -2 s';
        ctx.sfx('bad');
        ctx.vibrate(40);
        hud();
      }
    }

    function end() {
      if (over) return;
      over = true;
      var win = score >= GOAL;
      ctx.mood(win ? 'happy' : 'sad');
      ctx.sfx(win ? 'win' : 'lose');
      ctx.finish({
        win: win,
        score: score,
        scoreText: score + ' pts',
        title: win ? '¡caos controlado!' : 'el caos te ganó',
        msg: rounds + ' rondas · ' + hits + ' aciertos · ' + misses + ' fallos'
      });
    }

    ctx.onKey(function (e) {
      if (e.key >= '1' && e.key <= '9') tap(parseInt(e.key, 10) - 1);
    });

    newRound();
    hud();

    ctx.loop(function (dt) {
      if (over || ctx.isDone()) return;
      left -= dt;
      barFill.style.width = Math.max(0, Math.min(100, (left / TOTAL) * 100)) + '%';
      hud();
      if (left <= 0) end();
    });
  }

  C.register({
    id: 'caos',
    name: 'Caos',
    desc: 'Toca solo las fichas del color indicado antes de que se acabe el tiempo.',
    tag: 'reflejos',
    color: '#ff5ea8',
    unit: 'pts',
    icon: ['..####..', '.#.##.#.', '##.##.##', '########', '##.##.##', '.#.##.#.', '..####..', '........'],
    how: 'Arriba verás un color y su símbolo. Toca únicamente las fichas de ese color.\nCada acierto suma puntos y sube el combo; cada fallo resta puntos y 2 segundos.\nCompletar una ronda da +15 puntos y un poco de tiempo extra. Meta: 220 puntos en 30 segundos.',
    start: function (ctx) { play(ctx); }
  });
})();
