(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var SYMBOLS = [
    ['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...'],
    ['...##...', '...##...', '########', '.######.', '..####..', '.######.', '.##..##.', '##....##'],
    ['...##...', '..####..', '.######.', '########', '.######.', '..####..', '...##...'],
    ['..####..', '..####..', '########', '########', '########', '########', '..####..', '..####..'],
    ['....###.', '...###..', '..###...', '.#######', '....##..', '...##...', '..##....', '..#.....'],
    ['..####..', '.######.', '##.##.##', '########', '########', '########', '########', '##.##.##'],
    ['.######.', '##....##', '#......#', '#......#', '#......#', '#......#', '##....##', '.######.'],
    ['...##...', '...##...', '..####..', '..####..', '.######.', '.######.', '########', '########'],
    ['.######.', '########', '##.##.##', '########', '########', '#.####.#', '##....##', '.######.'],
    ['########', '#......#', '#.####.#', '#.#..#.#', '#.#..#.#', '#.####.#', '#......#', '########']
  ];
  var COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  var BACK = ['.#.#.#.#', '#.#.#.#.', '.#.#.#.#', '#.#.#.#.', '.#.#.#.#', '#.#.#.#.', '.#.#.#.#', '#.#.#.#.'];

  var MODES = {
    a: { cols: 4, rows: 3, label: '4x3' },
    b: { cols: 4, rows: 4, label: '4x4' },
    c: { cols: 5, rows: 4, label: '5x4' }
  };

  function injectCss() {
    if (document.getElementById('nitro-style-memoria')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-memoria';
    s.textContent =
      '.mem-board{display:grid;gap:8px;width:100%;perspective:800px}' +
      '.mem-card{position:relative;aspect-ratio:1;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '.mem-in{position:absolute;inset:0;transition:transform .35s;transform-style:preserve-3d}' +
      '.mem-card.open .mem-in{transform:rotateY(180deg)}' +
      '.mem-face{position:absolute;inset:0;display:grid;place-items:center;border-radius:10px;border:1px solid var(--line);backface-visibility:hidden;-webkit-backface-visibility:hidden}' +
      '.mem-front{background:var(--panel2);color:var(--red-dim)}' +
      '.mem-card:hover .mem-front{border-color:var(--red)}' +
      '.mem-back{background:var(--panel);transform:rotateY(180deg)}' +
      '.mem-card.ok .mem-back{border-color:var(--c3);box-shadow:0 0 0 1px var(--c3) inset}' +
      '.mem-card.ok{cursor:default}' +
      '.mem-face .pxicon{width:56%;height:56%}' +
      '.mem-front .pxicon{width:40%;height:40%;opacity:.55}'
    ;
    document.head.appendChild(s);
  }

  function play(ctx, mode) {
    injectCss();
    var total = mode.cols * mode.rows;
    var pairs = total / 2;
    var ids = [];
    for (var i = 0; i < pairs; i++) ids.push(i, i);
    ids = U.shuffle(ids);
    var moves = 0;
    var found = 0;
    var open = [];
    var lock = false;

    var board = h('div', { class: 'mem-board', style: { gridTemplateColumns: 'repeat(' + mode.cols + ', 1fr)', maxWidth: mode.cols * 88 + 'px' } });
    var cards = ids.map(function (sym, idx) {
      var c = h('button', { class: 'mem-card', 'aria-label': 'carta ' + (idx + 1) },
        h('div', { class: 'mem-in' },
          h('div', { class: 'mem-face mem-front', html: C.pixicon(BACK) }),
          h('div', { class: 'mem-face mem-back', style: { color: COLORS[sym % COLORS.length] }, html: C.pixicon(SYMBOLS[sym]) })
        )
      );
      c.addEventListener('click', function () { flip(idx); });
      board.appendChild(c);
      return c;
    });
    var info = h('p', { class: 'g-msg', text: 'encuentra las ' + pairs + ' parejas' });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, board, info));
    ctx.status('movimientos: 0');
    ctx.score('parejas: 0/' + pairs);

    function flip(idx) {
      if (lock || ctx.isDone()) return;
      var c = cards[idx];
      if (c.classList.contains('open')) return;
      c.classList.add('open');
      ctx.sfx('tick');
      ctx.vibrate(8);
      open.push(idx);
      if (open.length < 2) return;
      moves++;
      ctx.status('movimientos: ' + moves);
      lock = true;
      var a = open[0];
      var b = open[1];
      open = [];
      if (ids[a] === ids[b]) {
        ctx.after(380, function () {
          cards[a].classList.add('ok', 'g-pop');
          cards[b].classList.add('ok', 'g-pop');
          found++;
          ctx.score('parejas: ' + found + '/' + pairs);
          ctx.sfx('good');
          ctx.vibrate(20);
          ctx.mood('happy', 800);
          info.textContent = 'pareja. sigue así';
          lock = false;
          if (found === pairs) {
            lock = true;
            ctx.after(500, function () {
              ctx.finish({
                win: true,
                score: moves,
                scoreText: moves + ' mov',
                better: 'low',
                title: '¡memoria de elefante!',
                msg: 'mínimo posible: ' + pairs + ' movimientos. tú hiciste ' + moves
              });
            });
          }
        });
      } else {
        ctx.after(850, function () {
          cards[a].classList.remove('open');
          cards[b].classList.remove('open');
          ctx.sfx('bad');
          info.textContent = 'no coinciden, memoriza';
          ctx.after(300, function () { lock = false; });
        });
      }
    }
  }

  C.register({
    id: 'memoria',
    name: 'Memoria',
    desc: 'Encuentra las parejas con el menor número de movimientos.',
    tag: 'mente',
    color: '#b57bff',
    unit: 'mov',
    icon: ['########', '#.####.#', '#.#..#.#', '#.#..#.#', '#.####.#', '#......#', '########', '.######.'],
    how: 'Toca dos cartas para voltearlas.\nSi son iguales se quedan; si no, se tapan de nuevo.\nMenos movimientos = mejor récord.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué tamaño?',
          options: [
            { id: 'a', label: 'pequeño 4x3', desc: '6 parejas' },
            { id: 'b', label: 'medio 4x4', desc: '8 parejas' },
            { id: 'c', label: 'grande 5x4', desc: '10 parejas' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
