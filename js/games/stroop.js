(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var TOTAL = 30;
  var PENALTY = 2;
  var INKS = [
    { name: 'ROJO', color: '#ff2c2c' },
    { name: 'AZUL', color: '#4d8dff' },
    { name: 'VERDE', color: '#7bd957' },
    { name: 'AMARILLO', color: '#ffe14a' }
  ];

  function injectStyle() {
    if (document.getElementById('calo-style-stroop')) return;
    var s = document.createElement('style');
    s.id = 'calo-style-stroop';
    s.textContent =
      '.st-bar{width:100%;height:10px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;overflow:hidden;}' +
      '.st-bar i{display:block;height:100%;width:100%;background:var(--red);transform-origin:left;}' +
      '.st-bar.thin{height:5px;}' +
      '.st-bar.thin i{background:var(--dim);}' +
      '.st-word{font-family:var(--pix);font-size:clamp(26px,9vw,52px);min-height:90px;display:grid;place-items:center;text-align:center;padding:6px 0;}' +
      '.st-word.bad{animation:shake .28s;}' +
      '.st-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;}' +
      '.st-btn{display:flex;align-items:center;gap:10px;justify-content:center;min-height:clamp(64px,13vh,96px);background:var(--panel2);border:2px solid var(--line);border-radius:14px;color:var(--fg);font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;}' +
      '.st-btn:active{transform:scale(.95);border-color:var(--red);}' +
      '.st-btn:focus-visible{border-color:var(--red);outline:none;}' +
      '.st-sw{width:22px;height:22px;border-radius:5px;border:2px solid rgba(255,255,255,.25);flex:none;}' +
      '.st-k{color:var(--dim);font-size:12px;}' +
      '.st-flash{animation:stflash .35s;}' +
      '@keyframes stflash{0%{background:rgba(255,44,44,.35);}100%{background:transparent;}}';
    document.head.appendChild(s);
  }

  function play(ctx) {
    injectStyle();
    var left = TOTAL;
    var hits = 0;
    var misses = 0;
    var streak = 0;
    var cur = null;
    var wordLeft = 0;
    var wordMax = 3;

    var timeBar = h('i');
    var wordBar = h('i');
    var word = h('div', { class: 'st-word', text: '...', 'aria-live': 'polite' });
    var msg = h('p', { class: 'g-msg', text: 'pulsa el color de la TINTA, no lo que dice' });
    var grid = h('div', { class: 'st-grid' });
    INKS.forEach(function (ink, i) {
      grid.appendChild(h('button', { class: 'st-btn', 'aria-label': ink.name.toLowerCase() + ' (tecla ' + (i + 1) + ')', onclick: function () { answer(i); } },
        h('span', { class: 'st-sw', style: { background: ink.color } }),
        h('span', { text: ink.name.toLowerCase() }),
        h('span', { class: 'st-k', text: String(i + 1) })));
    });
    var wrap = h('div', { class: 'g-wrap', style: { gap: '10px' } },
      h('div', { class: 'st-bar' }, timeBar), h('div', { class: 'st-bar thin' }, wordBar), word, msg, grid);
    ctx.root.appendChild(wrap);

    function nextWord() {
      var pCongr = Math.max(0.05, 0.3 - hits * 0.012);
      var w = U.rand(0, 3);
      var ink;
      if (Math.random() < pCongr) ink = w;
      else { do { ink = U.rand(0, 3); } while (ink === w); }
      if (cur && w === cur.word && ink === cur.ink) ink = (ink + 1) % 4;
      cur = { word: w, ink: ink };
      word.textContent = INKS[w].name;
      word.style.color = INKS[ink].color;
      wordMax = Math.max(1.3, 3.2 - hits * 0.07);
      wordLeft = wordMax;
    }

    function hud() {
      ctx.status('tiempo: ' + Math.max(0, left).toFixed(1) + ' s');
      ctx.score('aciertos: ' + hits);
      timeBar.style.transform = 'scaleX(' + U.clamp(left / TOTAL, 0, 1) + ')';
      wordBar.style.transform = 'scaleX(' + U.clamp(wordLeft / wordMax, 0, 1) + ')';
    }

    function fail(reason) {
      misses++;
      streak = 0;
      left -= PENALTY;
      ctx.sfx('bad');
      ctx.vibrate(40);
      msg.textContent = reason + ' · -' + PENALTY + ' s';
      word.classList.remove('bad');
      void word.offsetWidth;
      word.classList.add('bad');
      wrap.classList.remove('st-flash');
      void wrap.offsetWidth;
      wrap.classList.add('st-flash');
    }

    function answer(i) {
      if (ctx.isDone() || !cur) return;
      if (i === cur.ink) {
        hits++;
        streak++;
        ctx.sfx('good');
        ctx.vibrate(8);
        msg.textContent = streak >= 5 ? 'racha de ' + streak + '!' : 'bien';
      } else {
        fail('era ' + INKS[cur.ink].name.toLowerCase());
      }
      if (left <= 0) { end(); return; }
      nextWord();
      hud();
    }

    function end() {
      if (ctx.isDone()) return;
      left = 0;
      hud();
      var win = hits >= 15;
      ctx.sfx(win ? 'win' : 'lose');
      ctx.mood(win ? 'happy' : 'sad');
      ctx.finish({
        win: win,
        score: hits,
        scoreText: hits + ' aciertos',
        better: 'high',
        title: win ? '¡cerebro veloz!' : 'se acabó el tiempo',
        msg: hits + ' aciertos y ' + misses + (misses === 1 ? ' fallo' : ' fallos')
      });
    }

    ctx.onKey(function (e) {
      if (e.key >= '1' && e.key <= '4') answer(parseInt(e.key, 10) - 1);
    });

    nextWord();
    hud();
    ctx.loop(function (dt) {
      if (ctx.isDone()) return;
      left -= dt;
      wordLeft -= dt;
      if (left <= 0) { end(); return; }
      if (wordLeft <= 0) {
        fail('muy lento');
        if (left <= 0) { end(); return; }
        nextWord();
      }
      hud();
    });
  }

  C.register({
    id: 'stroop',
    name: 'Stroop',
    desc: 'Pulsa el color de la tinta, no la palabra. 30 segundos.',
    tag: 'mente',
    color: '#ffe14a',
    unit: 'aciertos',
    icon: ['########', '#......#', '#.####.#', '#.#..#.#', '#.#..#.#', '#.####.#', '#......#', '########'],
    how: 'Aparece una palabra de color escrita con otra tinta.\nPulsa el botón del color de la TINTA (teclas 1 a 4).\nFallar o ir lento resta 2 segundos, y cada vez va más rápido.',
    start: function (ctx) { play(ctx); }
  });
})();
