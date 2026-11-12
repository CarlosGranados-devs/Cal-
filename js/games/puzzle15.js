(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var MODES = { a: 3, b: 4 };
  var SLIDE_MS = 120;

  function injectCss() {
    if (document.getElementById('nitro-style-puzzle15')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-puzzle15';
    s.textContent =
      '.p15-board{position:relative;width:min(100%,400px,62vh);aspect-ratio:1;container-type:inline-size;background:var(--panel);border:1px solid var(--line);border-radius:12px;user-select:none;-webkit-user-select:none;touch-action:manipulation}' +
      '.p15-tile{position:absolute;padding:1.2cqw;box-sizing:border-box;border:0;background:none;cursor:pointer;transition:left ' + SLIDE_MS + 'ms ease-out,top ' + SLIDE_MS + 'ms ease-out;-webkit-tap-highlight-color:transparent}' +
      '.p15-tile b{display:grid;place-items:center;width:100%;height:100%;border-radius:8px;background:var(--panel2);border:1px solid var(--line);font-family:var(--pix);font-weight:400;color:var(--fg);transition:border-color .15s,color .15s}' +
      '.p15-tile.ok b{border-color:var(--red-dim);color:var(--red2)}' +
      '.p15-tile:active b{background:var(--red-dim)}' +
      '.p15-board.s3 .p15-tile b{font-size:10cqw}' +
      '.p15-board.s4 .p15-tile b{font-size:8cqw}' +
      '.p15-board.won .p15-tile b{border-color:var(--c3);color:var(--c3)}';
    document.head.appendChild(s);
  }

  function play(ctx, n) {
    injectCss();
    var total = n * n;
    var cellPct = 100 / n;
    var grid = [];
    var i;
    for (i = 0; i < total; i++) grid.push(i + 1 === total ? 0 : i + 1);
    var blank = total - 1;
    var moves = 0;
    var won = false;

    function neigh(idx) {
      var out = [];
      var x = idx % n;
      if (x > 0) out.push(idx - 1);
      if (x < n - 1) out.push(idx + 1);
      if (idx - n >= 0) out.push(idx - n);
      if (idx + n < total) out.push(idx + n);
      return out;
    }

    var prev = -1;
    var steps = n === 3 ? 60 : 160;
    for (i = 0; i < steps || isSolved(); i++) {
      var opts = neigh(blank).filter(function (q) { return q !== prev; });
      var q = U.pick(opts);
      grid[blank] = grid[q];
      grid[q] = 0;
      prev = blank;
      blank = q;
    }

    function isSolved() {
      for (var k = 0; k < total - 1; k++) if (grid[k] !== k + 1) return false;
      return grid[total - 1] === 0;
    }

    var board = h('div', { class: 'p15-board s' + n });
    var tiles = {};
    for (i = 1; i < total; i++) {
      (function (v) {
        var t = h('button', { class: 'p15-tile', 'aria-label': 'ficha ' + v, style: { width: cellPct + '%', height: cellPct + '%' } }, h('b', { text: String(v) }));
        t.addEventListener('click', function () { tapTile(v); });
        tiles[v] = t;
        board.appendChild(t);
      })(i);
    }
    var msg = h('p', { class: 'g-msg', text: 'ordena las fichas del 1 al ' + (total - 1) });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, board, msg));
    ctx.status('movimientos: 0');
    ctx.score('');

    function layout() {
      for (var k = 0; k < total; k++) {
        var v = grid[k];
        if (!v) continue;
        var t = tiles[v];
        t.style.left = (k % n) * cellPct + '%';
        t.style.top = Math.floor(k / n) * cellPct + '%';
        t.classList.toggle('ok', v === k + 1);
      }
    }

    function slideLine(idx) {
      var bx = blank % n;
      var by = Math.floor(blank / n);
      var x = idx % n;
      var y = Math.floor(idx / n);
      if (x !== bx && y !== by) return 0;
      var step = x === bx ? (y < by ? n : -n) : (x < bx ? 1 : -1);
      var count = 0;
      var cur = blank;
      while (cur !== idx) {
        var from = cur - step;
        grid[cur] = grid[from];
        grid[from] = 0;
        cur = from;
        count++;
      }
      blank = idx;
      return count;
    }

    function afterMove(count) {
      moves += count;
      ctx.status('movimientos: ' + moves);
      ctx.sfx('tick');
      ctx.vibrate(8);
      layout();
      if (isSolved()) {
        won = true;
        board.classList.add('won');
        ctx.sfx('good');
        msg.textContent = 'ordenado';
        ctx.after(SLIDE_MS + 450, function () {
          ctx.finish({
            win: true,
            score: moves,
            scoreText: moves + ' mov',
            better: 'low',
            title: '¡puzzle resuelto!',
            msg: 'tablero de ' + n + 'x' + n + ' en ' + moves + ' movimientos'
          });
        });
      }
    }

    function tapTile(v) {
      if (won || ctx.isDone()) return;
      var idx = grid.indexOf(v);
      var c = slideLine(idx);
      if (!c) {
        ctx.sfx('bad');
        tiles[v].classList.add('g-shake');
        ctx.after(280, function () { tiles[v].classList.remove('g-shake'); });
        return;
      }
      afterMove(c);
    }

    function arrow(dir) {
      if (won || ctx.isDone()) return;
      var bx = blank % n;
      var by = Math.floor(blank / n);
      var from = -1;
      if (dir === 'up' && by < n - 1) from = blank + n;
      else if (dir === 'down' && by > 0) from = blank - n;
      else if (dir === 'left' && bx < n - 1) from = blank + 1;
      else if (dir === 'right' && bx > 0) from = blank - 1;
      if (from < 0) { ctx.sfx('bad'); return; }
      grid[blank] = grid[from];
      grid[from] = 0;
      blank = from;
      afterMove(1);
    }

    ctx.onKey(function (e) {
      var k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') arrow('up');
      else if (k === 'ArrowDown' || k === 's' || k === 'S') arrow('down');
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') arrow('left');
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') arrow('right');
    });

    layout();
    board.__p15 = { grid: grid, tapTile: tapTile, arrow: arrow };
  }

  C.register({
    id: 'puzzle15',
    name: 'Puzzle 15',
    desc: 'Desliza las fichas hasta dejarlas en orden.',
    tag: 'estrategia',
    color: '#ff5a2a',
    unit: 'mov',
    icon: ['########', '#.#.#.##', '########', '#.#.#.##', '########', '#.#.#.##', '########', '#.#.#...'],
    how: 'Toca una ficha junto al hueco para deslizarla (si hay varias en fila, se mueven juntas).\nEn laptop usa las flechas.\nOrdénalas del 1 en adelante con el menor número de movimientos.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué tamaño?',
          options: [
            { id: 'a', label: '3x3', desc: '8 fichas' },
            { id: 'b', label: '4x4', desc: '15 fichas · el clásico' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
