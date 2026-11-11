(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;

  var MODES = { '3': 3, '4': 4, '5': 5, '6': 6 };

  function injectStyle() {
    if (document.getElementById('calo-style-hanoi')) return;
    var s = document.createElement('style');
    s.id = 'calo-style-hanoi';
    s.textContent =
      '.hn-board{display:flex;gap:8px;width:100%;max-width:520px;}' +
      '.hn-tower{flex:1;position:relative;display:flex;flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:3px;' +
      'height:clamp(170px,38vh,260px);padding:0 2px 8px;background:var(--panel);border:1px solid var(--line);border-radius:10px;cursor:pointer;color:var(--fg);font-family:inherit;transition:border-color .12s,background .12s;}' +
      '.hn-tower:focus-visible,.hn-tower:hover{border-color:var(--red);outline:none;}' +
      '.hn-tower.sel{border-color:var(--red);background:#1a1013;}' +
      '.hn-tower.dst:hover{background:#1a1013;}' +
      '.hn-pole{position:absolute;left:50%;bottom:0;top:12px;width:8px;margin-left:-4px;background:var(--line);border-radius:4px 4px 0 0;}' +
      '.hn-tower.sel .hn-pole{background:var(--red-dim);}' +
      '.hn-num{position:absolute;top:-1px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--dim);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:0 6px;z-index:2;}' +
      '.hn-disc{position:relative;z-index:1;height:clamp(20px,4.6vh,30px);border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:700;color:#0a0a0c;border:2px solid rgba(0,0,0,.35);box-shadow:inset 0 -4px 0 rgba(0,0,0,.25);transition:transform .12s;}' +
      '.hn-disc.lift{transform:translateY(-10px);box-shadow:0 0 0 2px var(--fg),inset 0 -4px 0 rgba(0,0,0,.25);}' +
      '.hn-info{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}';
    document.head.appendChild(s);
  }

  function play(ctx, n) {
    injectStyle();
    var towers = [[], [], []];
    var i;
    for (i = n; i >= 1; i--) towers[0].push(i);
    var moves = 0;
    var minimum = Math.pow(2, n) - 1;
    var sel = -1;

    var msg = h('p', { class: 'g-msg', text: 'toca una torre de origen y luego la de destino' });
    var els = [];
    var board = h('div', { class: 'hn-board' });
    for (i = 0; i < 3; i++) {
      (function (idx) {
        var t = h('button', { class: 'hn-tower', 'aria-label': 'torre ' + (idx + 1), onclick: function () { pick(idx); } },
          h('span', { class: 'hn-pole' }), h('span', { class: 'hn-num', text: String(idx + 1) }));
        els.push(t);
        board.appendChild(t);
      })(i);
    }
    var minChip = h('span', { class: 'chip', text: 'mínimo: ' + minimum });
    var movChip = h('span', { class: 'chip', text: 'movimientos: 0' });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, h('div', { class: 'hn-info' }, movChip, minChip), board, msg,
      h('button', { class: 'g-btn ghost', text: 'deseleccionar', onclick: function () { sel = -1; render(); } })));

    function discColor(size) {
      var t = (size - 1) / Math.max(1, n - 1);
      return 'hsl(0,' + Math.round(100 - t * 25) + '%,' + Math.round(72 - t * 30) + '%)';
    }

    function render() {
      for (var t = 0; t < 3; t++) {
        var el = els[t];
        while (el.children.length > 2) el.removeChild(el.lastChild);
        towers[t].forEach(function (size, k) {
          var d = h('span', { class: 'hn-disc' + (t === sel && k === towers[t].length - 1 ? ' lift' : ''), text: String(size),
            style: { width: (24 + (size / n) * 70) + '%', background: discColor(size) } });
          el.appendChild(d);
        });
        el.classList.toggle('sel', t === sel);
        el.classList.toggle('dst', sel >= 0 && t !== sel);
      }
      movChip.textContent = 'movimientos: ' + moves;
      ctx.status('mov: ' + moves);
      ctx.score('mín: ' + minimum);
    }

    function shake(t) {
      var el = els[t];
      el.classList.remove('g-shake');
      void el.offsetWidth;
      el.classList.add('g-shake');
      ctx.after(300, function () { el.classList.remove('g-shake'); });
    }

    function pick(t) {
      if (ctx.isDone()) return;
      if (sel < 0) {
        if (!towers[t].length) {
          ctx.sfx('bad'); shake(t); msg.textContent = 'la torre ' + (t + 1) + ' está vacía';
          return;
        }
        sel = t;
        ctx.sfx('tick');
        msg.textContent = 'ahora elige el destino';
        render();
        return;
      }
      if (sel === t) { sel = -1; ctx.sfx('click'); msg.textContent = 'soltado'; render(); return; }
      var from = towers[sel];
      var to = towers[t];
      var disc = from[from.length - 1];
      if (to.length && to[to.length - 1] < disc) {
        ctx.sfx('bad'); ctx.vibrate(40); shake(t);
        msg.textContent = 'no puedes poner un disco grande sobre uno pequeño';
        return;
      }
      to.push(from.pop());
      moves++;
      sel = -1;
      ctx.sfx('pop'); ctx.vibrate(10);
      msg.textContent = 'disco ' + disc + ' a la torre ' + (t + 1);
      render();
      if (towers[2].length === n) {
        ctx.sfx('win');
        ctx.mood('happy');
        var perfect = moves === minimum;
        ctx.finish({
          win: true,
          score: moves,
          scoreText: moves + ' mov',
          better: 'low',
          title: perfect ? '¡perfecto!' : '¡torre armada!',
          msg: perfect ? 'lo hiciste en el mínimo posible: ' + minimum : 'mínimo posible: ' + minimum + ' · tú: ' + moves
        });
      }
    }

    ctx.onKey(function (e) {
      if (e.key === '1' || e.key === '2' || e.key === '3') pick(parseInt(e.key, 10) - 1);
    });
    render();
  }

  C.register({
    id: 'hanoi',
    name: 'Hanói',
    desc: 'Pasa todos los discos a la torre 3 en el menor número de movimientos.',
    tag: 'mente',
    color: '#ff2c2c',
    unit: 'mov',
    icon: ['...##...', '..####..', '........', '.######.', '........', '########', '########', '........'],
    how: 'Mueve todos los discos de la torre 1 a la torre 3.\nSolo un disco a la vez, y nunca uno grande sobre uno pequeño.\nToca origen y destino, o usa las teclas 1, 2 y 3.',
    start: function (ctx) {
      ctx.choose({
        title: '¿cuántos discos?',
        options: [
          { id: '3', label: '3 discos', desc: 'mínimo 7 movimientos' },
          { id: '4', label: '4 discos', desc: 'mínimo 15 movimientos' },
          { id: '5', label: '5 discos', desc: 'mínimo 31 movimientos' },
          { id: '6', label: '6 discos', desc: 'mínimo 63 movimientos' }
        ]
      }, function (id) { play(ctx, MODES[id]); });
    }
  });
})();
