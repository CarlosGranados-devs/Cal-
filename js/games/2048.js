(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var N = 4;
  var SLIDE_MS = 110;

  var TILE_COLORS = {
    2: ['#2b2327', '#d9c9cc'],
    4: ['#3d2328', '#f0d9dc'],
    8: ['#66202a', '#ffe9e9'],
    16: ['#8f1f26', '#fff0f0'],
    32: ['#b8231f', '#fff0ec'],
    64: ['#e0301f', '#ffffff'],
    128: ['#ff4a24', '#ffffff'],
    256: ['#ff6a1c', '#fff6ec'],
    512: ['#ff8a14', '#2a1200'],
    1024: ['#ffa918', '#2a1600'],
    2048: ['#ffcb3d', '#2a1a00']
  };

  function injectCss() {
    if (document.getElementById('nitro-style-2048')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-2048';
    s.textContent =
      '.t48-board{position:relative;width:min(100%,400px,62vh);aspect-ratio:1;container-type:inline-size;background:var(--panel);border:1px solid var(--line);border-radius:12px;touch-action:none;user-select:none;-webkit-user-select:none}' +
      '.t48-cell,.t48-tile{position:absolute;width:25%;height:25%;padding:1.3cqw;box-sizing:border-box}' +
      '.t48-cell i{display:block;width:100%;height:100%;background:var(--bg);border-radius:6px}' +
      '.t48-tile{transition:left ' + SLIDE_MS + 'ms ease-out,top ' + SLIDE_MS + 'ms ease-out;z-index:2}' +
      '.t48-tile.up{z-index:3}' +
      '.t48-tile b{display:grid;place-items:center;width:100%;height:100%;border-radius:6px;font-family:var(--pix);font-size:7.5cqw;font-weight:400}' +
      '.t48-tile.d3 b{font-size:6cqw}' +
      '.t48-tile.d4 b{font-size:4.6cqw}' +
      '.t48-tile.d5 b{font-size:3.6cqw}' +
      '.t48-new b{animation:t48-in .16s ease-out}' +
      '.t48-merge b{animation:t48-pop .16s ease-out}' +
      '@keyframes t48-in{from{transform:scale(.3);opacity:0}}' +
      '@keyframes t48-pop{50%{transform:scale(1.18)}}';
    document.head.appendChild(s);
  }

  function colorFor(v) {
    var c = TILE_COLORS[v] || ['#fff0b0', '#2a1a00'];
    return c;
  }

  function play(ctx) {
    injectCss();
    var board = h('div', { class: 't48-board' });
    var i;
    for (i = 0; i < N * N; i++) {
      board.appendChild(h('div', { class: 't48-cell', style: { left: (i % N) * 25 + '%', top: Math.floor(i / N) * 25 + '%' } }, h('i')));
    }
    var msg = h('p', { class: 'g-msg', text: 'desliza o usa las flechas' });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, board, msg));

    var grid = [];
    var r, c;
    for (r = 0; r < N; r++) grid.push([null, null, null, null]);
    var points = 0;
    var busy = false;

    function paint(t) {
      var col = colorFor(t.v);
      var b = t.el.firstChild;
      b.textContent = String(t.v);
      b.style.background = col[0];
      b.style.color = col[1];
      t.el.className = 't48-tile d' + Math.min(5, String(t.v).length) + (t.v >= 128 ? ' up' : '');
    }

    function place(t) {
      t.el.style.left = t.c * 25 + '%';
      t.el.style.top = t.r * 25 + '%';
    }

    function spawn() {
      var empty = [];
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!grid[y][x]) empty.push([y, x]);
      if (!empty.length) return;
      var p = U.pick(empty);
      var t = { v: Math.random() < 0.9 ? 2 : 4, r: p[0], c: p[1], el: h('div', null, h('b')) };
      paint(t);
      t.el.classList.add('t48-new');
      place(t);
      board.appendChild(t.el);
      grid[p[0]][p[1]] = t;
    }

    function canMove() {
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          if (!grid[y][x]) return true;
          if (x < N - 1 && (!grid[y][x + 1] || grid[y][x + 1].v === grid[y][x].v)) return true;
          if (y < N - 1 && (!grid[y + 1][x] || grid[y + 1][x].v === grid[y][x].v)) return true;
        }
      }
      return false;
    }

    function updateHud() {
      ctx.status('puntos: ' + points);
      ctx.score(ctx.best != null ? 'mejor: ' + ctx.best : '');
    }

    function move(dir) {
      if (busy || ctx.isDone()) return;
      var dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      var dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      var moved = false;
      var merges = [];
      var gained = 0;
      var maxMade = 0;
      var order = [];
      for (var k = 0; k < N; k++) order.push(k);
      if (dr > 0 || dc > 0) order.reverse();
      var removed = [];

      var mergedFlag = [];
      for (r = 0; r < N; r++) mergedFlag.push([false, false, false, false]);

      order.forEach(function (a) {
        order.forEach(function (b) {
          var y = dc !== 0 ? a : b;
          var x = dc !== 0 ? b : a;
          var t = grid[y][x];
          if (!t) return;
          var ny = y;
          var nx = x;
          while (true) {
            var py = ny + dr;
            var px = nx + dc;
            if (py < 0 || py >= N || px < 0 || px >= N) break;
            var o = grid[py][px];
            if (!o) {
              ny = py;
              nx = px;
              continue;
            }
            if (o.v === t.v && !mergedFlag[py][px]) {
              ny = py;
              nx = px;
            }
            break;
          }
          if (ny === y && nx === x) return;
          moved = true;
          grid[y][x] = null;
          var target = grid[ny][nx];
          if (target) {
            mergedFlag[ny][nx] = true;
            removed.push(t);
            t.r = ny;
            t.c = nx;
            target.v *= 2;
            gained += target.v;
            if (target.v > maxMade) maxMade = target.v;
            merges.push(target);
          } else {
            grid[ny][nx] = t;
            t.r = ny;
            t.c = nx;
          }
        });
      });

      if (!moved) {
        ctx.sfx('tick');
        board.classList.add('g-shake');
        ctx.after(280, function () { board.classList.remove('g-shake'); });
        return;
      }

      busy = true;
      removed.forEach(place);
      grid.forEach(function (row) { row.forEach(function (t) { if (t) place(t); }); });
      ctx.sfx(merges.length ? 'pop' : 'tick');
      ctx.vibrate(merges.length ? 12 : 6);

      ctx.after(SLIDE_MS + 10, function () {
        removed.forEach(function (t) { if (t.el.parentNode) t.el.parentNode.removeChild(t.el); });
        merges.forEach(function (t) {
          paint(t);
          t.el.classList.add('t48-merge');
        });
        grid.forEach(function (row) { row.forEach(function (t) { if (t && merges.indexOf(t) < 0) t.el.classList.remove('t48-new'); }); });
        points += gained;
        updateHud();
        if (gained) msg.textContent = '+' + gained;
        spawn();
        if (maxMade >= 2048) {
          ctx.after(450, function () {
            ctx.finish({ win: true, score: points, scoreText: points + ' pts', title: '¡2048!', msg: 'llegaste a la ficha dorada. ya eres leyenda' });
          });
          return;
        }
        if (!canMove()) {
          ctx.after(350, function () {
            var top = 0;
            grid.forEach(function (row) { row.forEach(function (t) { if (t && t.v > top) top = t.v; }); });
            ctx.finish({ win: false, score: points, scoreText: points + ' pts', title: 'sin movimientos', msg: 'tu ficha más alta fue ' + top });
          });
          return;
        }
        busy = false;
      });
    }

    ctx.onKey(function (e) {
      var k = e.key;
      var d = null;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') d = 'up';
      else if (k === 'ArrowDown' || k === 's' || k === 'S') d = 'down';
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') d = 'left';
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') d = 'right';
      if (d) move(d);
    });
    ctx.swipe(board, move, 20);

    spawn();
    spawn();
    updateHud();
    board.__t48 = { grid: grid, move: move };
  }

  C.register({
    id: '2048',
    name: '2048',
    desc: 'Une fichas iguales hasta llegar a 2048.',
    tag: 'estrategia',
    color: '#ff8a14',
    unit: 'pts',
    icon: ['########', '#......#', '#.##.##.', '#..#.#..', '#.##.##.', '#.#....#', '#.##.##.', '########'],
    how: 'Desliza el tablero (o usa flechas / WASD).\nDos fichas iguales se funden en una del doble.\nLlega a 2048; si te quedas sin movimientos, pierdes.',
    start: function (ctx) { play(ctx); }
  });
})();
