(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var MODES = {
    f: { cols: 8, rows: 8, mines: 10 },
    m: { cols: 8, rows: 10, mines: 16 },
    d: { cols: 9, rows: 11, mines: 22 }
  };
  var NUM_COLORS = ['', 'var(--c4)', 'var(--c3)', 'var(--c1)', 'var(--c5)', 'var(--c2)', 'var(--c6)', 'var(--fg)', 'var(--dim)'];
  var FLAG = ['..##....', '..####..', '..#####.', '..####..', '..##....', '..#.....', '.###....', '.####...'];
  var MINE = ['...##...', '.#.##.#.', '..####..', '########', '########', '..####..', '.#.##.#.', '...##...'];
  var LONG_MS = 420;

  function injectCss() {
    if (document.getElementById('nitro-style-buscaminas')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-buscaminas';
    s.textContent =
      '.bm-board{display:grid;gap:3px;width:100%;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}' +
      '.bm-cell{aspect-ratio:1;padding:0;display:grid;place-items:center;background:var(--panel2);border:1px solid var(--line);border-radius:6px;font-family:var(--pix);font-size:14px;color:var(--fg);cursor:pointer;min-width:0}' +
      '.bm-cell:hover{border-color:var(--red-dim)}' +
      '.bm-cell.open{background:var(--bg);cursor:default;border-color:#1b1b21}' +
      '.bm-cell.open:hover{border-color:#1b1b21}' +
      '.bm-cell.boom{background:var(--red-dim);border-color:var(--red)}' +
      '.bm-cell.wrong{border-color:var(--red);color:var(--red)}' +
      '.bm-cell .pxicon{width:60%;height:60%}' +
      '.bm-flag{color:var(--red)}' +
      '.bm-mine{color:var(--fg)}' +
      '.bm-tog{display:flex;gap:6px;width:100%;max-width:300px}' +
      '.bm-tog .g-btn{flex:1;padding:8px 10px}' +
      '.bm-tog .g-btn.on{background:var(--red);border-color:var(--red);color:#0a0a0c;font-weight:700}';
    document.head.appendChild(s);
  }

  function play(ctx, mode) {
    injectCss();
    var cols = mode.cols;
    var rows = mode.rows;
    var total = cols * rows;
    var mines = [];
    var adj = [];
    var open = [];
    var flag = [];
    var cells = [];
    var placed = false;
    var over = false;
    var opened = 0;
    var flags = 0;
    var started = 0;
    var seconds = 0;
    var flagMode = false;
    var lastTouch = 0;
    var i;
    for (i = 0; i < total; i++) { mines.push(false); adj.push(0); open.push(false); flag.push(false); }

    function neighbors(idx) {
      var x = idx % cols;
      var y = Math.floor(idx / cols);
      var out = [];
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var nx = x + dx;
          var ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) out.push(ny * cols + nx);
        }
      }
      return out;
    }

    var board = h('div', { class: 'bm-board', style: { gridTemplateColumns: 'repeat(' + cols + ', 1fr)', maxWidth: cols * 46 + 'px' } });
    board.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    for (i = 0; i < total; i++) {
      (function (idx) {
        var b = h('button', { class: 'bm-cell', 'aria-label': 'casilla ' + (idx + 1) });
        var timer = null;
        var long = false;
        var isTouch = false;
        var sx = 0;
        var sy = 0;
        b.addEventListener('pointerdown', function (e) {
          isTouch = e.pointerType !== 'mouse';
          if (e.button !== 0 || !isTouch) return;
          long = false;
          sx = e.clientX;
          sy = e.clientY;
          clearTimeout(timer);
          timer = ctx.after(LONG_MS, function () {
            timer = null;
            long = true;
            toggleFlag(idx);
            ctx.vibrate(25);
          });
        });
        b.addEventListener('pointermove', function (e) {
          if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) {
            clearTimeout(timer);
            timer = null;
            long = true;
          }
        });
        b.addEventListener('pointercancel', function () { clearTimeout(timer); timer = null; long = true; });
        b.addEventListener('pointerup', function (e) {
          if (!isTouch || e.button !== 0) return;
          clearTimeout(timer);
          timer = null;
          lastTouch = Date.now();
          if (long) { long = false; return; }
          tap(idx);
        });
        b.addEventListener('click', function () {
          if (Date.now() - lastTouch < 700) return;
          tap(idx);
        });
        b.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          if (isTouch) return;
          toggleFlag(idx);
        });
        cells.push(b);
        board.appendChild(b);
      })(i);
    }

    var btnDig = h('button', { class: 'g-btn on', text: 'cavar', onclick: function () { setMode(false); } });
    var btnFlag = h('button', { class: 'g-btn', text: 'bandera', onclick: function () { setMode(true); } });
    var tog = h('div', { class: 'bm-tog' }, btnDig, btnFlag);
    var msg = h('p', { class: 'g-msg', text: 'primer toque seguro. mantén pulsado para bandera' });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, board, tog, msg));
    ctx.status('minas: ' + mode.mines);
    ctx.score('tiempo: 0s');

    function setMode(f) {
      flagMode = f;
      btnDig.classList.toggle('on', !f);
      btnFlag.classList.toggle('on', f);
      ctx.sfx('click');
    }

    function placeMines(safe) {
      var banned = neighbors(safe);
      banned.push(safe);
      var pool = [];
      for (var k = 0; k < total; k++) if (banned.indexOf(k) < 0) pool.push(k);
      U.shuffle(pool).slice(0, mode.mines).forEach(function (m) { mines[m] = true; });
      for (var j = 0; j < total; j++) {
        var n = 0;
        neighbors(j).forEach(function (q) { if (mines[q]) n++; });
        adj[j] = n;
      }
      placed = true;
      started = Date.now();
      ctx.every(250, function () {
        seconds = Math.floor((Date.now() - started) / 1000);
        ctx.score('tiempo: ' + seconds + 's');
      });
    }

    function draw(idx) {
      var b = cells[idx];
      b.className = 'bm-cell';
      b.innerHTML = '';
      b.style.color = '';
      if (open[idx]) {
        b.classList.add('open');
        if (adj[idx] > 0 && !mines[idx]) {
          b.textContent = String(adj[idx]);
          b.style.color = NUM_COLORS[adj[idx]];
        }
      } else if (flag[idx]) {
        b.innerHTML = C.pixicon(FLAG);
        b.classList.add('bm-flag');
      }
    }

    function toggleFlag(idx) {
      if (over || ctx.isDone() || open[idx]) return;
      flag[idx] = !flag[idx];
      flags += flag[idx] ? 1 : -1;
      ctx.status('minas: ' + (mode.mines - flags));
      ctx.sfx(flag[idx] ? 'pop' : 'tick');
      ctx.vibrate(12);
      draw(idx);
    }

    function reveal(idx) {
      var stack = [idx];
      while (stack.length) {
        var c = stack.pop();
        if (open[c] || flag[c]) continue;
        open[c] = true;
        opened++;
        draw(c);
        if (adj[c] === 0) neighbors(c).forEach(function (q) { if (!open[q] && !flag[q]) stack.push(q); });
      }
    }

    function lose(idx) {
      over = true;
      for (var k = 0; k < total; k++) {
        if (mines[k] && !flag[k]) {
          cells[k].className = 'bm-cell open bm-mine';
          cells[k].innerHTML = C.pixicon(MINE);
        } else if (!mines[k] && flag[k]) {
          cells[k].classList.add('wrong');
        }
      }
      cells[idx].classList.add('boom', 'g-shake');
      ctx.sfx('bad');
      ctx.vibrate([30, 40, 60]);
      ctx.mood('sad');
      msg.textContent = 'boom. esa casilla tenía mina';
      ctx.after(1100, function () {
        ctx.finish({ win: false, title: '¡boom!', msg: 'despejaste ' + opened + ' de ' + (total - mode.mines) + ' casillas seguras' });
      });
    }

    function win() {
      over = true;
      seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      for (var k = 0; k < total; k++) {
        if (mines[k] && !flag[k]) { flag[k] = true; draw(k); }
      }
      ctx.after(500, function () {
        ctx.finish({
          win: true,
          score: seconds,
          scoreText: seconds + ' s',
          better: 'low',
          title: '¡campo despejado!',
          msg: 'sin explotar en ' + seconds + ' segundos'
        });
      });
    }

    function checkWin() {
      if (opened >= total - mode.mines) win();
    }

    function tap(idx) {
      if (over || ctx.isDone()) return;
      if (flagMode) { toggleFlag(idx); return; }
      if (open[idx]) {
        var fl = 0;
        var nb = neighbors(idx);
        nb.forEach(function (q) { if (flag[q]) fl++; });
        if (adj[idx] > 0 && fl === adj[idx]) {
          var hit = -1;
          nb.forEach(function (q) { if (!flag[q] && !open[q]) { if (mines[q]) hit = q; else reveal(q); } });
          if (hit >= 0) return lose(hit);
          ctx.sfx('tick');
          checkWin();
        }
        return;
      }
      if (flag[idx]) return;
      if (!placed) placeMines(idx);
      if (mines[idx]) return lose(idx);
      var before = opened;
      reveal(idx);
      ctx.sfx(opened - before > 3 ? 'pop' : 'tick');
      ctx.vibrate(8);
      checkWin();
    }

    board.__bm = { mines: mines, tap: tap, total: total };
  }

  C.register({
    id: 'buscaminas',
    name: 'Buscaminas',
    desc: 'Despeja el campo sin pisar ninguna mina.',
    tag: 'estrategia',
    color: '#4fd1e8',
    fmt: function (v) { return v + ' s'; },
    icon: ['...##...', '.#.##.#.', '..####..', '########', '########', '..####..', '.#.##.#.', '...##...'],
    how: 'Cava casillas: el número dice cuántas minas tocan esa casilla.\nEn celular usa el interruptor bandera/cavar o mantén pulsado. En laptop, clic derecho para bandera.\nEl primer toque siempre es seguro. Gana el menor tiempo.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué campo?',
          options: [
            { id: 'f', label: 'fácil', desc: '8x8 · 10 minas' },
            { id: 'm', label: 'medio', desc: '8x10 · 16 minas' },
            { id: 'd', label: 'difícil', desc: '9x11 · 22 minas' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
