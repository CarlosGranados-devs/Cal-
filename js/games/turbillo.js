(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;

  var ROUNDS = 8;
  var WIN_SCORE = 500;

  function play(ctx, mode) {
    var round = 0;
    var score = 0;
    var bestPts = 0;
    var pos = 0;
    var dir = 1;
    var speed = mode.speed;
    var locked = false;
    var ended = false;

    var marker = h('div', { class: 'tb-marker' });
    var meter = h('div', { class: 'tb-meter' },
      h('div', { class: 'tb-zone' }),
      h('div', { class: 'tb-zone perfect' }),
      marker
    );
    var readout = h('div', { class: 'tb-readout', text: 'pulsa cuando el marcador esté en el centro' });
    var dots = h('div', { class: 'tb-rounds' });
    var dotEls = [];
    for (var i = 0; i < ROUNDS; i++) {
      var d = h('span', { class: 'tb-dot' });
      dotEls.push(d);
      dots.appendChild(d);
    }
    var btn = h('button', { class: 'g-btn primary', text: '¡spin dash!' });
    btn.addEventListener('click', launch);

    ctx.root.appendChild(h('div', { class: 'tb-wrap' },
      h('p', { class: 'g-msg', text: 'detén la carga en la zona dorada' }),
      meter,
      readout,
      dots,
      btn
    ));

    function hud() {
      ctx.status('ronda ' + Math.min(ROUNDS, round + 1) + '/' + ROUNDS);
      ctx.score(score + ' pts');
    }
    hud();

    function launch() {
      if (locked || ended || ctx.isDone()) return;
      locked = true;
      var dist = Math.abs(pos - 50);
      var pts;
      var label;
      if (dist <= 3) {
        pts = 100;
        label = '¡PERFECTO! +100';
        ctx.sfx('level');
        ctx.mood('wow');
      } else if (dist <= 10) {
        pts = 70;
        label = 'buena carga +70';
        ctx.sfx('good');
      } else if (dist <= 25) {
        pts = 40;
        label = 'carga aceptable +40';
        ctx.sfx('tick');
      } else {
        pts = 10;
        label = 'carga floja +10';
        ctx.sfx('bad');
      }
      score += pts;
      if (pts > bestPts) bestPts = pts;
      dotEls[round].classList.add('on');
      readout.textContent = label;
      ctx.vibrate(pts >= 70 ? 20 : 8);
      round++;
      hud();
      if (round >= ROUNDS) {
        ended = true;
        ctx.after(850, function () {
          var win = score >= WIN_SCORE;
          ctx.mood(win ? 'happy' : 'sad');
          ctx.finish({
            win: win,
            score: score,
            scoreText: score + ' pts',
            title: win ? '¡velocidad supersónica!' : 'te faltó carga',
            msg: 'mejor carga: +' + bestPts + ' · modo ' + mode.label + ' · ' + ROUNDS + ' intentos'
          });
        });
      } else {
        ctx.after(780, function () {
          if (ctx.isDone()) return;
          locked = false;
          pos = 0;
          dir = 1;
          speed += 4;
          readout.textContent = 'ronda ' + (round + 1) + ' de ' + ROUNDS;
          btn.textContent = '¡otra carga!';
          hud();
        });
      }
    }

    ctx.onKey(function (e) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') launch();
    });

    ctx.loop(function (dt) {
      if (!locked && !ended) {
        pos += dir * speed * dt;
        if (pos >= 100) { pos = 100; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        marker.style.left = pos + '%';
      }
    });
  }

  C.register({
    id: 'turbillo',
    name: 'Turbillo',
    desc: 'Detén la carga del spin dash en el centro y suma velocidad.',
    tag: 'reflejos',
    color: '#ffcf33',
    unit: 'pts',
    icon: ['........', '..####..', '.##..##.', '##....##', '##....##', '.##..##.', '..####..', '........'],
    how: 'El marcador sube y baja por la barra. Pulsa el botón o espacio cuando esté en la zona dorada.\nCentro exacto = 100 puntos; cuanto más lejos, menos carga.\nSon 8 intentos. Consigue 500 puntos para completar el reto.',
    start: function (ctx) {
      ctx.choose({
        title: '¿qué tan rápido?',
        options: [
          { id: 'n', label: 'normal', desc: 'marcador tranquilo' },
          { id: 'f', label: 'turbo', desc: 'marcador veloz, pulso firme' }
        ]
      }, function (id) {
        play(ctx, id === 'f' ? { speed: 135, label: 'turbo' } : { speed: 88, label: 'normal' });
      });
    }
  });
})();
