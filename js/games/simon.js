(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var PADS = [
    { name: 'rojo', color: '#ff2c2c', freq: 262, key: 'ArrowUp', shape: '<path d="M12 5 L20 19 L4 19 Z"/>' },
    { name: 'ámbar', color: '#ffb020', freq: 330, key: 'ArrowRight', shape: '<circle cx="12" cy="12" r="7"/>' },
    { name: 'verde', color: '#7bd957', freq: 392, key: 'ArrowLeft', shape: '<rect x="5" y="5" width="14" height="14"/>' },
    { name: 'cian', color: '#38d9ff', freq: 523, key: 'ArrowDown', shape: '<path d="M12 3 L21 12 L12 21 L3 12 Z"/>' }
  ];
  var MODES = {
    n: { on: 560, gap: 220, min: 300, label: 'normal' },
    f: { on: 320, gap: 130, min: 170, label: 'rápido' }
  };

  function injectStyle() {
    if (document.getElementById('nitro-style-simon')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-simon';
    s.textContent =
      '.sm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(100%,420px);aspect-ratio:1;max-height:62vh;}' +
      '.sm-pad{position:relative;border-radius:18px;border:3px solid rgba(255,255,255,.08);cursor:pointer;display:grid;place-items:center;color:#0a0a0c;padding:0;' +
      'background:color-mix(in srgb,var(--pc) 28%,#0a0a0c);transition:transform .06s;}' +
      '.sm-pad svg{width:42%;height:42%;fill:currentColor;opacity:.5;}' +
      '.sm-pad b{position:absolute;left:10px;top:6px;font-size:13px;color:rgba(255,255,255,.55);}' +
      '.sm-pad.on{background:var(--pc);border-color:#fff;box-shadow:0 0 0 3px var(--pc),0 0 26px var(--pc);transform:scale(1.04);}' +
      '.sm-pad.on svg{opacity:1;}' +
      '.sm-pad.on b{color:#0a0a0c;}' +
      '.sm-pad:disabled{cursor:default;}' +
      '.sm-grid.lock .sm-pad{cursor:default;}';
    document.head.appendChild(s);
  }

  function play(ctx, mode) {
    injectStyle();
    var seq = [];
    var pos = 0;
    var inputOn = false;
    var rounds = 0;
    var msg = h('p', { class: 'g-msg', text: 'mira la secuencia' });
    var grid = h('div', { class: 'sm-grid lock' });
    var els = PADS.map(function (p, i) {
      var b = h('button', { class: 'sm-pad', style: { '--pc': p.color }, 'aria-label': p.name + ' (tecla ' + (i + 1) + ')', html: '<b>' + (i + 1) + '</b><svg viewBox="0 0 24 24" aria-hidden="true">' + p.shape + '</svg>' });
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); press(i); });
      grid.appendChild(b);
      return b;
    });
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, msg, grid));

    function hud() {
      ctx.status('ronda: ' + (seq.length || 1));
      ctx.score('completadas: ' + rounds);
    }

    function light(i, ms) {
      var p = PADS[i];
      els[i].classList.add('on');
      ctx.tone(p.freq, ms / 1000, 'square', 0.18);
      ctx.vibrate(10);
      ctx.after(ms, function () { els[i].classList.remove('on'); });
    }

    function speed() {
      var f = Math.max(0, 1 - seq.length * 0.04);
      return {
        on: Math.max(mode.min, Math.round(mode.on * f)),
        gap: Math.max(80, Math.round(mode.gap * f))
      };
    }

    function showSeq() {
      inputOn = false;
      grid.classList.add('lock');
      msg.textContent = 'mira la secuencia (' + seq.length + ')';
      hud();
      var sp = speed();
      var t = 600;
      seq.forEach(function (n) {
        ctx.after(t, function () { light(n, sp.on); });
        t += sp.on + sp.gap;
      });
      ctx.after(t, function () {
        inputOn = true;
        pos = 0;
        grid.classList.remove('lock');
        msg.textContent = 'tu turno';
      });
    }

    function addStep() {
      seq.push(U.rand(0, 3));
      showSeq();
    }

    function press(i) {
      if (ctx.isDone() || !inputOn) return;
      light(i, 200);
      if (seq[pos] !== i) {
        inputOn = false;
        ctx.sfx('lose');
        ctx.vibrate(120);
        els[i].classList.add('g-shake');
        ctx.mood('sad');
        var win = rounds >= 8;
        ctx.finish({
          win: win,
          score: rounds,
          scoreText: rounds + (rounds === 1 ? ' ronda' : ' rondas'),
          better: 'high',
          title: win ? '¡qué memoria!' : '¡fallaste!',
          msg: 'era ' + PADS[seq[pos]].name + ' · modo ' + mode.label
        });
        return;
      }
      pos++;
      if (pos >= seq.length) {
        inputOn = false;
        rounds++;
        hud();
        msg.textContent = 'ronda ' + rounds + ' completa';
        ctx.after(350, function () { ctx.sfx('good'); });
        ctx.after(900, addStep);
      }
    }

    ctx.onKey(function (e) {
      if (e.key >= '1' && e.key <= '4') { press(parseInt(e.key, 10) - 1); return; }
      for (var i = 0; i < 4; i++) if (PADS[i].key === e.key) { press(i); return; }
    });

    hud();
    addStep();
  }

  C.register({
    id: 'simon',
    name: 'Simon',
    desc: 'Repite la secuencia de luces y sonidos que se alarga.',
    tag: 'reflejos',
    color: '#38d9ff',
    unit: 'rondas',
    icon: ['.##..##.', '.##..##.', '........', '........', '.##..##.', '.##..##.', '........', '........'],
    how: 'Nitro ilumina los pads (rojo, ámbar, verde, cian) en orden.\nRepite la secuencia tocándolos o con las teclas 1-4 / flechas.\nCada ronda añade un paso. Se ve y se oye, pero funciona en silencio.',
    start: function (ctx) {
      ctx.choose({
        title: '¿qué velocidad?',
        options: [
          { id: 'n', label: 'normal', desc: 'secuencia tranquila' },
          { id: 'f', label: 'rápido', desc: 'luces veloces, memoria al límite' }
        ]
      }, function (id) { play(ctx, MODES[id]); });
    }
  });
})();
