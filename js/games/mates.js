(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  function injectCss() {
    if (document.getElementById('calo-style-mates')) return;
    var s = document.createElement('style');
    s.id = 'calo-style-mates';
    s.textContent =
      '.mt-q{font-family:var(--pix);font-size:30px;color:var(--fg);text-align:center;min-height:44px;white-space:nowrap}' +
      '.mt-ans{width:100%;max-width:300px;min-height:56px;display:grid;place-items:center;background:var(--bg);border:1px solid var(--line);border-radius:10px;font-family:var(--pix);font-size:24px;color:var(--red)}' +
      '.mt-ans.empty{color:var(--dim);font-size:14px;font-family:inherit}' +
      '.mt-bar{width:100%;max-width:300px;height:6px;background:var(--panel2);border-radius:3px;overflow:hidden}' +
      '.mt-bar i{display:block;height:100%;width:100%;background:var(--red);transform-origin:left}' +
      '.mt-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:300px}' +
      '.mt-pad .g-key{height:52px;font-size:20px;text-transform:none;flex:none}' +
      '.mt-pad .mt-ok{background:var(--red);border-color:var(--red);color:#0a0a0c}' +
      '.mt-ok:active{background:var(--red2)}' +
      '.mt-good{color:var(--c3)!important}' +
      '.mt-bad{color:var(--red)!important}';
    document.head.appendChild(s);
  }

  var MODES = {
    r: { kind: 'relax', total: 10 },
    t: { kind: 'time', secs: 60 },
    i: { kind: 'endless', lives: 3 }
  };

  function makeQ(level) {
    var roll = Math.random();
    var op = '+';
    if (level >= 1 && roll > 0.66) op = '-';
    if (level >= 1 && roll > 0.82) op = '×';
    if (level === 0 && roll > 0.7) op = '-';
    var a, b;
    if (op === '+') {
      var m = 9 + level * 9;
      a = U.rand(2, m);
      b = U.rand(2, m);
      return { text: a + ' + ' + b, ans: a + b };
    }
    if (op === '-') {
      a = U.rand(6, 14 + level * 10);
      b = U.rand(1, a - 1);
      return { text: a + ' - ' + b, ans: a - b };
    }
    a = U.rand(2, Math.min(12, 4 + level));
    b = U.rand(2, Math.min(12, 3 + level));
    return { text: a + ' × ' + b, ans: a * b };
  }

  function play(ctx, mode) {
    injectCss();
    var correct = 0;
    var asked = 0;
    var wrong = 0;
    var timeLeft = mode.secs || 0;
    var typed = '';
    var q = null;
    var locked = false;

    var qEl = h('div', { class: 'mt-q' });
    var ans = h('div', { class: 'mt-ans empty', text: 'escribe tu respuesta' });
    var bar = h('div', { class: 'mt-bar' }, h('i'));
    var msg = h('p', { class: 'g-msg', text: '' });
    var pad = h('div', { class: 'mt-pad' });

    function addKey(label, fn, cls, aria) {
      var b = h('button', { class: 'g-key ' + (cls || ''), text: label, 'aria-label': aria || label });
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); fn(); });
      b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } });
      pad.appendChild(b);
      return b;
    }
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) { addKey(String(n), function () { press(String(n)); }); });
    addKey('←', back, '', 'borrar');
    addKey('0', function () { press('0'); });
    addKey('ok', submit, 'mt-ok', 'enviar');

    ctx.root.appendChild(h('div', { class: 'g-wrap' }, mode.kind === 'time' ? bar : null, qEl, ans, msg, pad));

    function level() {
      if (mode.kind === 'relax') return Math.floor(asked / 4);
      if (mode.kind === 'time') return Math.floor(correct / 4);
      return Math.floor(correct / 5);
    }

    function hud() {
      if (mode.kind === 'relax') {
        ctx.status('pregunta ' + Math.min(asked + 1, mode.total) + '/' + mode.total);
        ctx.score('aciertos: ' + correct);
      } else if (mode.kind === 'time') {
        ctx.status('tiempo: ' + Math.ceil(timeLeft) + 's');
        ctx.score('aciertos: ' + correct);
      } else {
        ctx.status('vidas: ' + (mode.lives - wrong));
        ctx.score('aciertos: ' + correct);
      }
    }

    function showTyped() {
      if (typed === '') {
        ans.textContent = 'escribe tu respuesta';
        ans.className = 'mt-ans empty';
      } else {
        ans.textContent = typed;
        ans.className = 'mt-ans';
      }
    }

    function next() {
      q = makeQ(level());
      qEl.textContent = q.text + ' = ?';
      typed = '';
      showTyped();
      locked = false;
      hud();
    }

    function press(d) {
      if (locked || ctx.isDone()) return;
      if (typed.length >= 5) return;
      if (typed === '0') typed = '';
      typed += d;
      ctx.sfx('tick');
      ctx.vibrate(5);
      showTyped();
    }

    function back() {
      if (locked || ctx.isDone()) return;
      typed = typed.slice(0, -1);
      ctx.sfx('tick');
      showTyped();
    }

    function end(win, title, extra) {
      locked = true;
      ctx.finish({
        win: win,
        score: correct,
        scoreText: correct + (correct === 1 ? ' acierto' : ' aciertos'),
        title: title,
        msg: extra
      });
    }

    function submit() {
      if (locked || ctx.isDone()) return;
      if (typed === '') {
        ctx.sfx('bad');
        ans.classList.add('g-shake');
        ctx.after(300, function () { ans.classList.remove('g-shake'); });
        msg.textContent = 'escribe algo primero';
        return;
      }
      var ok = parseInt(typed, 10) === q.ans;
      asked++;
      locked = true;
      if (ok) {
        correct++;
        ctx.sfx('good');
        ctx.vibrate(10);
        ans.classList.add('mt-good');
        msg.textContent = U.pick(['bien', 'exacto', 'limpio', 'así se hace', 'calculadora humana']);
      } else {
        wrong++;
        ctx.sfx('bad');
        ctx.vibrate(40);
        ans.classList.add('mt-bad', 'g-shake');
        ans.textContent = typed + ' ✗ ' + q.ans;
        msg.textContent = 'era ' + q.ans;
      }
      hud();
      var finished = false;
      if (mode.kind === 'relax' && asked >= mode.total) {
        finished = true;
        ctx.after(500, function () {
          end(correct >= 7, correct >= 7 ? '¡buen cálculo!' : 'a practicar', mode.total - correct === 0 ? 'diez de diez, perfecto' : 'fallaste ' + (mode.total - correct));
        });
      }
      if (mode.kind === 'endless' && wrong >= mode.lives) {
        finished = true;
        ctx.after(700, function () {
          end(correct >= 10, correct >= 10 ? '¡buena racha!' : 'tres fallos', 'llegaste a nivel ' + (level() + 1));
        });
      }
      if (!finished) {
        ctx.after(ok ? 220 : 800, function () {
          ans.classList.remove('mt-good', 'mt-bad', 'g-shake');
          next();
        });
      }
    }

    ctx.onKey(function (e) {
      if (e.key >= '0' && e.key <= '9' && e.key.length === 1) press(e.key);
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter') submit();
    });

    if (mode.kind === 'time') {
      ctx.loop(function (dt) {
        timeLeft -= dt;
        if (timeLeft <= 0) {
          timeLeft = 0;
          hud();
          end(correct >= 10, correct >= 10 ? '¡tiempo!' : 'se acabó el tiempo', 'sumaste ' + correct + ' en 60 s');
          return;
        }
        bar.firstChild.style.transform = 'scaleX(' + (timeLeft / mode.secs) + ')';
        hud();
      });
    }

    next();
  }

  C.register({
    id: 'mates',
    name: 'Cuenta conmigo',
    desc: 'Sumas, restas y multiplicaciones contra el reloj.',
    tag: 'mente',
    color: '#ffb02c',
    unit: 'aciertos',
    icon: ['...##...', '...##...', '########', '########', '...##...', '...##...', '........', '########', '########'],
    how: 'Resuelve la operación y escribe el resultado.\nUsa el teclado de pantalla o el de tu compu y confirma con ok o Enter.\nLa dificultad sube mientras aciertas.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué modo?',
          options: [
            { id: 'r', label: 'relajado', desc: '10 preguntas · sin tiempo' },
            { id: 't', label: 'contrarreloj', desc: '60 segundos · sube la dificultad' },
            { id: 'i', label: 'infinito', desc: 'hasta fallar 3 veces' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
