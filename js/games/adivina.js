(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var MODES = {
    f: { max: 20, tries: 6, mult: 10 },
    m: { max: 100, tries: 7, mult: 25 },
    d: { max: 1000, tries: 10, mult: 50 }
  };

  function play(ctx, mode) {
    var secret = U.rand(1, mode.max);
    var left = mode.tries;
    var guesses = [];

    var info = h('p', { class: 'g-msg', text: 'adivina un número del 1 al ' + mode.max });
    var input = h('input', { class: 'g-input', type: 'number', inputmode: 'numeric', min: '1', max: String(mode.max), placeholder: '1 - ' + mode.max, 'aria-label': 'tu número' });
    var btn = h('button', { class: 'g-btn primary', text: 'probar' });
    var hist = h('div', { class: 'g-row' });
    var heat = h('div', { class: 'g-big', text: '?' });

    ctx.root.appendChild(h('div', { class: 'g-wrap' }, heat, info, h('div', { class: 'g-row' }, input, btn), hist));
    ctx.status('intentos: ' + left);
    ctx.score('1-' + mode.max);

    function submit() {
      if (ctx.isDone()) return;
      var v = parseInt(input.value, 10);
      if (isNaN(v) || v < 1 || v > mode.max) {
        ctx.sfx('bad');
        input.classList.add('g-shake');
        setTimeout(function () { input.classList.remove('g-shake'); }, 300);
        info.textContent = 'escribe un número entre 1 y ' + mode.max;
        return;
      }
      input.value = '';
      left--;
      var dist = Math.abs(v - secret);
      if (v === secret) {
        ctx.sfx('win');
        ctx.mood('happy');
        ctx.finish({
          win: true,
          score: (left + 1) * mode.mult,
          scoreText: (left + 1) * mode.mult + ' pts',
          title: '¡era el ' + secret + '!',
          msg: 'lo lograste en ' + (mode.tries - left) + (mode.tries - left === 1 ? ' intento' : ' intentos')
        });
        return;
      }
      var ratio = dist / mode.max;
      var word = ratio < 0.04 ? 'ardiendo' : ratio < 0.1 ? 'caliente' : ratio < 0.25 ? 'tibio' : 'frío';
      heat.textContent = word;
      heat.style.color = ratio < 0.1 ? 'var(--red)' : ratio < 0.25 ? 'var(--c2)' : 'var(--c4)';
      var up = v < secret;
      info.textContent = up ? 'mi número es MAYOR' : 'mi número es MENOR';
      hist.appendChild(h('span', { class: 'chip', text: (up ? '▲ ' : '▼ ') + v }));
      guesses.push(v);
      ctx.status('intentos: ' + left);
      ctx.sfx('tick');
      ctx.vibrate(10);
      if (left <= 0) {
        ctx.finish({ win: false, title: 'se acabaron los intentos', msg: 'el número era ' + secret });
      } else {
        input.focus();
      }
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    setTimeout(function () { if (!('ontouchstart' in window)) input.focus(); }, 50);
  }

  C.register({
    id: 'adivina',
    name: 'Adivina',
    desc: 'Encuentra el número secreto con pistas de frío y caliente.',
    tag: 'mente',
    color: '#ff5ea8',
    unit: 'pts',
    icon: ['..####..', '.##..##.', '....###.', '...##...', '...##...', '........', '...##...', '...##...'],
    how: 'Nitro piensa un número.\nEscribe tu intento y te diré si el mío es mayor o menor, y qué tan cerca estás.\nMenos intentos usados = más puntos.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué tan difícil?',
          options: [
            { id: 'f', label: 'fácil', desc: '1 a 20 · 6 intentos' },
            { id: 'm', label: 'medio', desc: '1 a 100 · 7 intentos' },
            { id: 'd', label: 'difícil', desc: '1 a 1000 · 10 intentos' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
