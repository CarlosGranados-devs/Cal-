(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var W = 320;
  var H = 480;
  var PY = H - 46;
  var PR = 13;
  var LABELS = ['404', 'bug', '500', 'NaN', 'null', 'err', '403', 'git!'];

  function play(ctx) {
    var cv = ctx.canvas(W, H);
    var g = cv.g;

    var px = W / 2, target = null;
    var blocks = [], bits = [], parts = [];
    var lives = 3, shield = false;
    var time = 0, got = 0;
    var started = false, over = false;
    var inv = 0, shake = 0;
    var blockT = 0.6, bitT = 1.2;
    var keyL = false, keyR = false;
    var dragOff = null;
    var stars = [];
    for (var i = 0; i < 26; i++) stars.push({ x: U.rand(0, W), y: U.rand(0, H), s: U.rand(1, 2) });

    function hud() {
      ctx.status('vidas ' + lives + (shield ? ' · escudo' : ''));
      ctx.score(score() + ' pts');
    }
    function score() { return Math.floor(time) * 10 + got; }
    hud();

    function clampX(v) { return U.clamp(v, PR, W - PR); }

    cv.canvas.addEventListener('pointerdown', function (e) {
      try { cv.canvas.setPointerCapture(e.pointerId); } catch (x) {}
      dragOff = px - cv.pos(e).x;
      started = true;
    });
    cv.canvas.addEventListener('pointermove', function (e) {
      if (dragOff === null) {
        if (e.pointerType === 'mouse') { target = clampX(cv.pos(e).x); started = true; }
        return;
      }
      px = clampX(cv.pos(e).x + dragOff);
      target = null;
    });
    var rel = function () { dragOff = null; };
    cv.canvas.addEventListener('pointerup', rel);
    cv.canvas.addEventListener('pointercancel', rel);

    function isL(k) { return k === 'ArrowLeft' || k === 'a' || k === 'A'; }
    function isR(k) { return k === 'ArrowRight' || k === 'd' || k === 'D'; }
    ctx.onKey(function (e) {
      if (isL(e.key)) { keyL = true; started = true; target = null; }
      else if (isR(e.key)) { keyR = true; started = true; target = null; }
    });
    ctx.onKeyUp(function (e) {
      if (isL(e.key)) keyL = false;
      else if (isR(e.key)) keyR = false;
    });

    function burst(x, y, c, n) {
      for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: U.rand(-120, 120), vy: U.rand(-140, 60), t: 0.45, c: c });
    }

    function hurt() {
      if (inv > 0 || over) return;
      if (shield) {
        shield = false;
        inv = 0.8;
        ctx.sfx('pop');
        burst(px, PY, '#38d9ff', 10);
        hud();
        return;
      }
      lives--;
      inv = 1.6;
      shake = 0.25;
      ctx.sfx('bad');
      ctx.vibrate(45);
      burst(px, PY, '#ff5a5f', 12);
      hud();
      if (lives <= 0) {
        over = true;
        ctx.mood('sad');
        ctx.sfx('lose');
        ctx.after(600, function () {
          var s = score();
          ctx.finish({
            win: false,
            score: s,
            scoreText: s + ' pts',
            title: 'nitro se llenó de bugs',
            msg: Math.floor(time) + ' s sobrevividos · ' + got + ' bits'
          });
        });
      }
    }

    function spawnBlock() {
      var w = U.rand(30, 52);
      var sp = Math.min(360, 130 + time * 4) * (0.85 + Math.random() * 0.4);
      blocks.push({ x: U.rand(0, W - w), y: -30, w: w, h: 26, vy: sp, t: U.pick(LABELS) });
    }

    function spawnBit() {
      var shd = Math.random() < 0.12 && !shield;
      bits.push({ x: U.rand(20, W - 20), y: -14, vy: 120 + Math.min(100, time * 2), shield: shd });
    }

    function update(dt) {
      var kv = (keyR ? 1 : 0) - (keyL ? 1 : 0);
      if (kv) px = clampX(px + kv * 330 * dt);
      else if (target !== null) {
        var d = target - px;
        px += Math.max(-420 * dt, Math.min(420 * dt, d));
      }
      if (inv > 0) inv -= dt;
      if (shake > 0) shake -= dt;
      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p];
        q.t -= dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 320 * dt;
        if (q.t <= 0) parts.splice(p, 1);
      }
      if (!started || over) return;

      var prev = Math.floor(time);
      time += dt;
      if (Math.floor(time) !== prev) ctx.score(score() + ' pts');

      blockT -= dt;
      if (blockT <= 0) {
        spawnBlock();
        blockT = Math.max(0.28, 0.72 - time * 0.007) * (0.7 + Math.random() * 0.6);
        if (time > 25 && Math.random() < 0.3) spawnBlock();
      }
      bitT -= dt;
      if (bitT <= 0) { spawnBit(); bitT = U.rand(10, 18) / 10; }

      for (var i = blocks.length - 1; i >= 0; i--) {
        var b = blocks[i];
        b.y += b.vy * dt;
        if (b.y > H + 40) { blocks.splice(i, 1); continue; }
        if (px + PR * 0.7 > b.x && px - PR * 0.7 < b.x + b.w && PY + PR * 0.8 > b.y && PY - PR * 0.8 < b.y + b.h) {
          hurt();
        }
      }
      for (var j = bits.length - 1; j >= 0; j--) {
        var c = bits[j];
        c.y += c.vy * dt;
        if (c.y > H + 20) { bits.splice(j, 1); continue; }
        var dx = c.x - px, dy = c.y - PY;
        if (dx * dx + dy * dy < (PR + 9) * (PR + 9)) {
          bits.splice(j, 1);
          if (c.shield) { shield = true; ctx.sfx('level'); burst(c.x, c.y, '#38d9ff', 8); }
          else { got++; ctx.sfx('good'); burst(c.x, c.y, '#ffb020', 5); }
          ctx.vibrate(8);
          hud();
        }
      }
    }

    function drawNitro() {
      if (inv > 0 && Math.floor(inv * 14) % 2 === 0) return;
      g.save();
      g.translate(px, PY);
      g.fillStyle = '#1b6fd6';
      g.strokeStyle = '#0b3d91';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-6, -8);
      g.lineTo(-PR - 12, -14);
      g.lineTo(-PR - 2, -2);
      g.lineTo(-PR - 13, 3);
      g.lineTo(-PR - 1, 7);
      g.lineTo(-PR - 9, 14);
      g.lineTo(-4, 10);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#2f9bff';
      g.beginPath();
      g.arc(0, -2, PR, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#f7c98b';
      g.beginPath();
      g.ellipse(5, 4, 8, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#f7fbff';
      g.beginPath();
      g.ellipse(-2, -6, 4.6, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(7, -6, 3.6, 5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#071426';
      g.beginPath();
      g.ellipse(-1, -5, 2, 3.2, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(8, -5, 1.6, 2.6, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(12, 4, 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8323c';
      g.fillRect(-9, PR - 1, 8, 4);
      g.fillRect(1, PR - 1, 8, 4);
      if (shield) {
        g.strokeStyle = '#38d9ff';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(0, 0, PR + 6, 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
    }

    function draw() {
      g.save();
      if (shake > 0) g.translate(U.rand(-3, 3), U.rand(-3, 3));
      g.fillStyle = '#081426';
      g.fillRect(-4, -4, W + 8, H + 8);
      g.fillStyle = '#1e4a7a';
      stars.forEach(function (s) {
        var sy = (s.y + time * 40 * s.s) % H;
        g.fillRect(s.x, sy, s.s, s.s * 3);
      });
      g.fillStyle = '#0c2038';
      g.fillRect(0, PY + PR + 6, W, H - PY - PR - 6);
      g.fillStyle = '#ffcf33';
      g.fillRect(0, PY + PR + 6, W, 2);
      blocks.forEach(function (b) {
        g.fillStyle = '#8f1c3a';
        g.fillRect(b.x, b.y, b.w, b.h);
        g.fillStyle = '#ff5a5f';
        g.fillRect(b.x, b.y, b.w, 4);
        g.fillStyle = '#f2f8ff';
        g.font = 'bold 12px monospace';
        g.textAlign = 'center';
        g.fillText(b.t, b.x + b.w / 2, b.y + 19);
      });
      bits.forEach(function (c) {
        if (c.shield) {
          g.strokeStyle = '#38d9ff';
          g.lineWidth = 2;
          g.beginPath();
          g.arc(c.x, c.y, 9, 0, Math.PI * 2);
          g.stroke();
          g.fillStyle = '#38d9ff';
          g.font = 'bold 11px monospace';
          g.textAlign = 'center';
          g.fillText('S', c.x, c.y + 4);
        } else {
          g.fillStyle = '#ffcf33';
          g.fillRect(c.x - 6, c.y - 6, 12, 12);
          g.fillStyle = '#081426';
          g.font = 'bold 10px monospace';
          g.textAlign = 'center';
          g.fillText('1', c.x, c.y + 4);
        }
      });
      parts.forEach(function (q) {
        g.fillStyle = q.c;
        g.globalAlpha = Math.max(0, q.t / 0.45);
        g.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
      });
      g.globalAlpha = 1;
      drawNitro();
      g.textAlign = 'center';
      if (!started) {
        g.fillStyle = 'rgba(8,20,38,0.78)';
        g.fillRect(0, H / 2 - 40, W, 80);
        g.fillStyle = '#f2f8ff';
        g.font = 'bold 16px monospace';
        g.fillText('arrastra para esquivar', W / 2, H / 2 - 8);
        g.fillStyle = '#8fb3d9';
        g.font = '13px monospace';
        g.fillText('mouse, dedo, A/D o flechas', W / 2, H / 2 + 16);
      }
      g.restore();
    }

    ctx.loop(function (dt) {
      update(dt);
      draw();
    });
  }

  C.register({
    id: 'esquiva',
    name: 'Esquiva',
    desc: 'Esquiva errores que caen y junta bits.',
    tag: 'arcade',
    color: '#ff5a5f',
    unit: 'pts',
    icon: ['.######.', '.#.##.#.', '.######.', '........', '...##...', '..####..', '..#..#..', '........'],
    how: 'Mueve a Nitro con el dedo, el mouse, A/D o las flechas.\nEvita los bloques de error (404, bug...). Junta bits para sumar; el círculo azul da escudo.\nTienes 3 vidas. Puntos: segundos x 10 + bits.',
    start: function (ctx) { play(ctx); }
  });
})();
