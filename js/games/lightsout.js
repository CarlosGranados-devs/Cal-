(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var MODES = { a: 3, b: 4, c: 5 };

  function injectCss() {
    if (document.getElementById('nitro-style-lightsout')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-lightsout';
    s.textContent =
      '.lo-board{display:grid;gap:8px;width:100%;touch-action:manipulation}' +
      '.lo-cell{aspect-ratio:1;padding:0;background:var(--panel2);border:1px solid var(--line);border-radius:10px;cursor:pointer;transition:background .12s,box-shadow .12s,transform .08s,border-color .12s;-webkit-tap-highlight-color:transparent}' +
      '.lo-cell:active{transform:scale(.94)}' +
      '.lo-cell.on{background:var(--red);border-color:var(--red2);box-shadow:0 0 14px rgba(255,44,44,.55),inset 0 0 0 4px rgba(255,255,255,.18)}' +
      '.lo-cell:focus-visible{outline:2px solid var(--fg);outline-offset:2px}' +
      '.lo-board.won .lo-cell{background:var(--panel2);border-color:var(--c3);box-shadow:none}';
    document.head.appendChild(s);
  }

  function play(ctx, n) {
    injectCss();
    var total = n * n;
    var state = [];
    var i;
    for (i = 0; i < total; i++) state.push(false);
    var moves = 0;
    var won = false;

    function press(idx, st) {
      var x = idx % n;
      var y = Math.floor(idx / n);
      st[idx] = !st[idx];
      if (x > 0) st[idx - 1] = !st[idx - 1];
      if (x < n - 1) st[idx + 1] = !st[idx + 1];
      if (y > 0) st[idx - n] = !st[idx - n];
      if (y < n - 1) st[idx + n] = !st[idx + n];
    }

    var par = 0;
    var any = false;
    while (!any) {
      for (i = 0; i < total; i++) state[i] = false;
      par = 0;
      for (i = 0; i < total; i++) {
        if (Math.random() < 0.5) { press(i, state); par++; }
      }
      any = state.some(function (v) { return v; });
    }

    var board = h('div', { class: 'lo-board', style: { gridTemplateColumns: 'repeat(' + n + ', 1fr)', maxWidth: Math.min(360, n * 76) + 'px' } });
    var cells = [];
    for (i = 0; i < total; i++) {
      (function (idx) {
        var b = h('button', { class: 'lo-cell', 'aria-label': 'luz ' + (idx + 1) });
        b.addEventListener('click', function () { tap(idx); });
        cells.push(b);
        board.appendChild(b);
      })(i);
    }
    var msg = h('p', { class: 'g-msg', text: 'apaga todas las luces' });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, board, msg));
    ctx.status('movimientos: 0');
    ctx.score('par: ' + par);

    function render() {
      var lit = 0;
      for (var k = 0; k < total; k++) {
        cells[k].classList.toggle('on', state[k]);
        if (state[k]) lit++;
      }
      return lit;
    }

    function tap(idx) {
      if (won || ctx.isDone()) return;
      press(idx, state);
      moves++;
      ctx.status('movimientos: ' + moves);
      ctx.vibrate(8);
      var lit = render();
      if (lit === 0) {
        won = true;
        board.classList.add('won');
        ctx.sfx('good');
        ctx.mood('happy');
        msg.textContent = 'todo apagado';
        ctx.after(650, function () {
          ctx.finish({
            win: true,
            score: moves,
            scoreText: moves + ' mov',
            better: 'low',
            title: '¡apagón total!',
            msg: moves <= par ? 'igualaste o superaste el par (' + par + ')' : 'el par era ' + par + ' movimientos'
          });
        });
      } else {
        ctx.sfx('tick');
        msg.textContent = 'luces encendidas: ' + lit;
      }
    }

    ctx.onKey(function (e) {
      var a = document.activeElement;
      var idx = cells.indexOf(a);
      var d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -n, ArrowDown: n, a: -1, d: 1, w: -n, s: n };
      var step = d[e.key];
      if (step === undefined) return;
      if (idx < 0) { cells[0].focus(); return; }
      var x = idx % n;
      var t = idx + step;
      if (t < 0 || t >= total) return;
      if ((step === -1 && x === 0) || (step === 1 && x === n - 1)) return;
      cells[t].focus();
    });

    render();
  }

  C.register({
    id: 'lightsout',
    name: 'Apagones',
    desc: 'Apaga todas las luces; cada toque cambia a sus vecinas.',
    tag: 'mente',
    color: '#38d9ff',
    unit: 'mov',
    icon: ['...##...', '..####..', '.######.', '.######.', '.######.', '..####..', '..####..', '...##...', '..####..'],
    how: 'Tocar una luz la cambia a ella y a sus 4 vecinas.\nApaga todas las luces.\nCada nivel se puede resolver. Menos movimientos = mejor.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué tamaño?',
          options: [
            { id: 'a', label: '3x3', desc: 'calentamiento' },
            { id: 'b', label: '4x4', desc: 'ya piensa un poco' },
            { id: 'c', label: '5x5', desc: 'el clásico' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
