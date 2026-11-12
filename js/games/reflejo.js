(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var ROUNDS = 5;
  var MAX_FALSE = 3;

  function injectStyle() {
    if (document.getElementById('nitro-style-reflejo')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-reflejo';
    s.textContent =
      '.rf-pad{width:100%;max-width:560px;flex:1;min-height:200px;border-radius:18px;border:3px solid var(--red-dim);background:#3a0d0d;color:var(--fg);' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;font-family:inherit;padding:16px;text-align:center;}' +
      '.rf-pad.wait{background:#3a0d0d;border-color:var(--red);}' +
      '.rf-pad.go{background:#7bd957;border-color:#fff;color:#0a0a0c;}' +
      '.rf-pad.res{background:var(--panel);border-color:var(--line);}' +
      '.rf-pad.fs{background:#5a1a00;border-color:var(--c2);}' +
      '.rf-big{font-family:var(--pix);font-size:clamp(20px,6.5vw,40px);line-height:1.4;}' +
      '.rf-sub{font-size:14px;opacity:.8;}' +
      '.rf-times{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;min-height:32px;}';
    document.head.appendChild(s);
  }

  function rating(avg) {
    if (avg < 190) return 'reflejos de rayo. ¿seguro que eres humano?';
    if (avg < 240) return 'reflejos de gato. nitro aplaude';
    if (avg < 300) return 'tiempo de humano sano. bien ahí';
    if (avg < 400) return 'calentando motores. otra y mejoras';
    return 'nitro se durmió esperando. ¡despierta!';
  }

  function play(ctx) {
    injectStyle();
    var times = [];
    var falseStarts = 0;
    var state = 'idle';
    var readyAt = 0;
    var waitId = null;

    var big = h('div', { class: 'rf-big' });
    var sub = h('div', { class: 'rf-sub' });
    var pad = h('button', { class: 'rf-pad wait', 'aria-live': 'polite' }, big, sub);
    var chips = h('div', { class: 'rf-times' });
    ctx.root.appendChild(h('div', { class: 'g-wrap', style: { flex: '1', minHeight: '0' } }, chips, pad));

    function hud() {
      ctx.status('ronda ' + Math.min(times.length + 1, ROUNDS) + '/' + ROUNDS);
      ctx.score(falseStarts ? 'falsos: ' + falseStarts + '/' + MAX_FALSE : '');
    }

    function setPad(cls, b, s) {
      pad.className = 'rf-pad ' + cls;
      big.textContent = b;
      sub.textContent = s || '';
    }

    function startWait() {
      state = 'wait';
      setPad('wait', 'espera...', 'no toques hasta que cambie');
      hud();
      waitId = ctx.after(U.rand(1500, 4500), function () {
        state = 'go';
        setPad('go', '¡YA!', 'toca, clic o espacio');
        readyAt = performance.now();
        ctx.tone(660, 0.08, 'square', 0.15);
      });
    }

    function press() {
      var now = performance.now();
      if (ctx.isDone()) return;
      if (state === 'wait') {
        clearTimeout(waitId);
        state = 'between';
        falseStarts++;
        ctx.sfx('bad');
        ctx.vibrate(60);
        hud();
        if (falseStarts >= MAX_FALSE) {
          setPad('fs', 'falso inicio', 'demasiados. nitro se rinde');
          ctx.after(700, function () {
            ctx.mood('sad');
            ctx.finish({ win: false, title: 'demasiado ansioso', msg: 'tres falsos inicios. respira y vuelve a intentar' });
          });
          return;
        }
        setPad('fs', 'falso inicio', 'tocaste antes de tiempo, repetimos (' + falseStarts + '/' + MAX_FALSE + ')');
        ctx.after(1400, startWait);
      } else if (state === 'go') {
        var ms = Math.max(1, Math.round(now - readyAt));
        times.push(ms);
        state = 'between';
        ctx.sfx(ms < 300 ? 'good' : 'tick');
        ctx.vibrate(15);
        chips.appendChild(h('span', { class: 'chip', text: ms + ' ms' }));
        hud();
        if (times.length >= ROUNDS) {
          setPad('res', ms + ' ms', 'última ronda');
          ctx.after(900, finish);
        } else {
          setPad('res', ms + ' ms', 'siguiente en un momento...');
          ctx.after(1200, startWait);
        }
      }
    }

    function finish() {
      var sum = 0;
      times.forEach(function (t) { sum += t; });
      var avg = Math.round(sum / times.length);
      var win = avg < 350;
      ctx.sfx(win ? 'win' : 'lose');
      ctx.mood(win ? 'happy' : 'sleep');
      ctx.finish({
        win: win,
        score: avg,
        scoreText: avg + ' ms',
        better: 'low',
        title: rating(avg),
        msg: 'tiempos: ' + times.join(', ') + ' ms · mejor ' + Math.min.apply(null, times) + ' ms'
      });
    }

    pad.addEventListener('pointerdown', function (e) { e.preventDefault(); press(); });
    pad.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
    ctx.onKey(function (e) { if (e.key === ' ' && !e.repeat) press(); });
    startWait();
  }

  C.register({
    id: 'reflejo',
    name: 'Reacción',
    desc: 'Toca en cuanto la pantalla cambie. Mide tus reflejos en ms.',
    tag: 'reflejos',
    color: '#7bd957',
    unit: 'ms',
    fmt: function (v) { return v + ' ms'; },
    icon: ['...##...', '..####..', '.######.', '...##...', '..##....', '...##...', '..##....', '.##.....'],
    how: 'La pantalla está roja: espera.\nCuando cambie a verde, toca, haz clic o pulsa espacio lo más rápido posible.\nTocar antes es falso inicio. Son 5 rondas y cuenta el promedio.',
    start: function (ctx) { play(ctx); }
  });
})();
