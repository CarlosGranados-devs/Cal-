(function () {
  'use strict';
  var C = window.Nitro;
  var U = C.util;

  var W = 320;
  var H = 480;
  var GROUND = H - 58;
  var PX = 74;
  var PR = 15;
  var GRAV = 1350;
  var JUMP = -455;
  var GOAL = 50;

  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function play(ctx) {
    var cv = ctx.canvas(W, H);
    var g = cv.g;

    var py = GROUND - 20;
    var vy = 0;
    var onGround = true;
    var started = false;
    var over = false;
    var t = 0;
    var speed = 160;
    var dist = 0;
    var rings = 0;
    var hearts = 3;
    var inv = 0;
    var shake = 0;
    var spin = 0;
    var obsT = 1.1;
    var ringT = 0.7;
    var obstacles = [];
    var coins = [];
    var parts = [];
    var clouds = [];
    var hills = [];

    for (var i = 0; i < 7; i++) {
      clouds.push({ x: U.rand(0, W), y: U.rand(30, 150), s: U.rand(10, 24), v: U.rand(4, 12) });
    }
    for (var j = 0; j < 5; j++) hills.push({ x: j * 90, r: U.rand(46, 78) });

    function hud() {
      ctx.status('♥'.repeat(hearts) + ' · anillos ' + rings + '/' + GOAL);
      ctx.score((rings * 10 + Math.floor(dist / 10)) + ' pts');
    }
    hud();

    function jump() {
      if (over) return;
      if (!started) {
        started = true;
        ctx.sfx('jump');
      }
      if (!onGround) return;
      vy = JUMP;
      onGround = false;
      spin = 0;
      ctx.sfx('jump');
      ctx.vibrate(8);
    }

    ctx.root.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('button')) return;
      jump();
    });
    ctx.onKey(function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') jump();
    });

    function burst(x, y, color, n) {
      for (var i = 0; i < n; i++) {
        parts.push({ x: x, y: y, vx: U.rand(-130, 130), vy: U.rand(-170, 30), t: 0.5, c: color });
      }
    }

    function spawnObstacle() {
      var kind = Math.random() < 0.7 ? 'spike' : 'bot';
      var w = kind === 'spike' ? 24 : 28;
      obstacles.push({ x: W + 30, w: w, h: kind === 'spike' ? 20 : 28, kind: kind });
      obsT = Math.max(0.58, 1.15 - t * 0.012) * U.rand(0.82, 1.3);
    }

    function spawnRings() {
      var n = U.rand(4, 7);
      var baseY = GROUND - U.rand(34, 92);
      var arc = Math.random() < 0.45;
      for (var i = 0; i < n; i++) {
        var y = arc ? baseY - Math.sin((i / (n - 1)) * Math.PI) * 26 : baseY;
        coins.push({ x: W + 34 + i * 26, y: y, ph: Math.random() * 6 });
      }
      ringT = U.rand(1.1, 2.2);
    }

    function hurt() {
      if (inv > 0 || over) return;
      hearts--;
      inv = 1.5;
      shake = 0.3;
      var lost = Math.min(rings, 8);
      rings -= lost;
      ctx.sfx('bad');
      ctx.vibrate(60);
      burst(PX, py, '#ffcf33', 10);
      hud();
      if (hearts <= 0) {
        over = true;
        ctx.mood('sad');
        ctx.sfx('lose');
        ctx.after(650, function () {
          var score = rings * 10 + Math.floor(dist / 10);
          ctx.finish({
            win: false,
            score: score,
            scoreText: rings + ' anillos · ' + Math.floor(dist / 10) + ' m',
            title: 'Nitro se quedó sin vidas',
            msg: 'llegaste a ' + Math.floor(dist / 10) + ' m · objetivo: ' + GOAL + ' anillos',
            rings: rings
          });
        });
      }
    }

    function win() {
      if (over) return;
      over = true;
      ctx.mood('happy');
      ctx.sfx('win');
      var score = rings * 10 + Math.floor(dist / 10) + 100;
      ctx.after(600, function () {
        ctx.finish({
          win: true,
          score: score,
          scoreText: rings + ' anillos · ' + Math.floor(dist / 10) + ' m',
          title: '¡zona completada!',
          msg: 'meta de ' + GOAL + ' anillos · ' + Math.floor(dist / 10) + ' m recorridos',
          rings: rings
        });
      });
    }

    function update(dt) {
      if (over) return;
      if (shake > 0) shake -= dt;
      if (inv > 0) inv -= dt;
      spin += dt * 12;

      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p];
        q.t -= dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 420 * dt;
        if (q.t <= 0) parts.splice(p, 1);
      }

      if (!started) return;

      t += dt;
      speed = 160 + Math.min(170, t * 4.5);
      dist += speed * dt;
      vy += GRAV * dt;
      py += vy * dt;
      if (py >= GROUND - 20) {
        py = GROUND - 20;
        vy = 0;
        onGround = true;
      }

      obsT -= dt;
      if (obsT <= 0) spawnObstacle();
      ringT -= dt;
      if (ringT <= 0) spawnRings();

      for (var i = obstacles.length - 1; i >= 0; i--) {
        var o = obstacles[i];
        o.x -= speed * dt;
        if (o.x + o.w < -20) {
          obstacles.splice(i, 1);
          continue;
        }
        var top = GROUND - o.h;
        if (PX + PR * 0.65 > o.x && PX - PR * 0.65 < o.x + o.w && py + PR * 0.75 > top) hurt();
      }

      for (var k = coins.length - 1; k >= 0; k--) {
        var c = coins[k];
        c.x -= speed * dt;
        if (c.x < -20) {
          coins.splice(k, 1);
          continue;
        }
        var dx = c.x - PX;
        var dy = c.y - py;
        if (dx * dx + dy * dy < (PR + 11) * (PR + 11)) {
          coins.splice(k, 1);
          rings++;
          ctx.sfx('ring');
          burst(c.x, c.y, '#ffcf33', 4);
          hud();
          if (rings >= GOAL) {
            win();
            return;
          }
        }
      }
      hud();
    }

    function drawRing(x, y, phase) {
      var w = Math.abs(Math.cos(t * 5 + phase));
      var rx = 2 + w * 5;
      g.save();
      g.translate(x, y);
      g.strokeStyle = '#ffcf33';
      g.lineWidth = 3;
      g.shadowColor = '#ffcf33';
      g.shadowBlur = 10;
      g.beginPath();
      g.ellipse(0, 0, rx, 8, 0, 0, Math.PI * 2);
      g.stroke();
      g.shadowBlur = 0;
      g.strokeStyle = '#fff3b0';
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(-1, -2, Math.max(1, rx * 0.55), 3.5, 0, Math.PI, Math.PI * 1.9);
      g.stroke();
      g.restore();
    }

    function drawHedgehog(x, y, air) {
      g.save();
      g.translate(x, y);
      if (air) {
        g.rotate(spin);
        g.fillStyle = '#2f9bff';
        g.strokeStyle = '#0b3d91';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(0, 0, PR + 2, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = '#1b6fd6';
        for (var i = 0; i < 5; i++) {
          var a = (i / 5) * Math.PI * 2;
          g.beginPath();
          g.moveTo(Math.cos(a) * (PR - 2), Math.sin(a) * (PR - 2));
          g.lineTo(Math.cos(a + 0.35) * (PR + 9), Math.sin(a + 0.35) * (PR + 9));
          g.lineTo(Math.cos(a + 0.7) * (PR - 2), Math.sin(a + 0.7) * (PR - 2));
          g.closePath();
          g.fill();
        }
        g.fillStyle = '#f7c98b';
        g.beginPath();
        g.arc(3, 2, 6, 0, Math.PI * 2);
        g.fill();
        g.restore();
        return;
      }
      var run = Math.sin(t * 18) * 3;
      g.fillStyle = '#1b6fd6';
      g.strokeStyle = '#0b3d91';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-10, -12);
      g.lineTo(-27, -18);
      g.lineTo(-13, -4);
      g.lineTo(-29, 1);
      g.lineTo(-12, 7);
      g.lineTo(-24, 17);
      g.lineTo(-6, 13);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#2f9bff';
      g.beginPath();
      g.arc(0, 0, PR, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#f7c98b';
      g.beginPath();
      g.ellipse(7, 4, 9, 8, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(5, -3, 5, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#071426';
      g.beginPath();
      g.ellipse(7, -2, 2, 3.5, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(14, 5, 2.5, 2, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8323c';
      g.strokeStyle = '#a81722';
      g.lineWidth = 1.5;
      rr(g, -8, 14 + run, 20, 7, 3);
      g.fill();
      g.stroke();
      g.fillStyle = '#fff';
      g.fillRect(-5, 15 + run, 15, 2);
      g.restore();
    }

    function draw() {
      g.save();
      if (shake > 0) g.translate(U.rand(-3, 3), U.rand(-3, 3));

      var sky = g.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, '#0a1c38');
      sky.addColorStop(0.55, '#1b5fb8');
      sky.addColorStop(1, '#38d9ff');
      g.fillStyle = sky;
      g.fillRect(-6, -6, W + 12, H + 12);

      g.fillStyle = 'rgba(255,255,255,.16)';
      clouds.forEach(function (c) {
        var cx = ((c.x - dist * 0.06) % (W + 60) + W + 60) % (W + 60) - 30;
        g.beginPath();
        g.arc(cx, c.y, c.s, 0, Math.PI * 2);
        g.arc(cx + c.s, c.y + 2, c.s * 0.8, 0, Math.PI * 2);
        g.arc(cx - c.s, c.y + 3, c.s * 0.7, 0, Math.PI * 2);
        g.fill();
      });

      g.fillStyle = '#14524a';
      hills.forEach(function (h) {
        var hx = ((h.x - dist * 0.16) % (W + 120) + W + 120) % (W + 120) - 60;
        g.beginPath();
        g.arc(hx, GROUND + 18, h.r, Math.PI, 0);
        g.fill();
      });
      g.fillStyle = '#1d7a52';
      hills.forEach(function (h) {
        var hx = ((h.x * 1.6 - dist * 0.3) % (W + 120) + W + 120) % (W + 120) - 60;
        g.beginPath();
        g.arc(hx, GROUND + 26, h.r * 0.8, Math.PI, 0);
        g.fill();
      });

      g.fillStyle = '#2f8f4e';
      g.fillRect(0, GROUND, W, 8);
      g.fillStyle = '#6b4b1f';
      g.fillRect(0, GROUND + 8, W, H - GROUND - 8);
      var off = Math.floor(dist) % 48;
      g.fillStyle = '#4a3314';
      for (var x = -off; x < W + 48; x += 48) {
        for (var y = GROUND + 8; y < H; y += 24) {
          if (((x + y) / 24) % 2 < 1) g.fillRect(x, y, 24, 24);
        }
      }

      obstacles.forEach(function (o) {
        if (o.kind === 'spike') {
          g.fillStyle = '#c9d8e8';
          g.strokeStyle = '#7d93a8';
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(o.x, GROUND);
          g.lineTo(o.x + o.w / 2, GROUND - o.h);
          g.lineTo(o.x + o.w, GROUND);
          g.closePath();
          g.fill();
          g.stroke();
          g.fillStyle = '#fff';
          g.beginPath();
          g.moveTo(o.x + o.w / 2, GROUND - o.h + 4);
          g.lineTo(o.x + o.w / 2 + 3, GROUND - 4);
          g.lineTo(o.x + o.w / 2 - 1, GROUND - 4);
          g.closePath();
          g.fill();
        } else {
          var top = GROUND - o.h;
          g.fillStyle = '#c92a3a';
          g.strokeStyle = '#7a1420';
          g.lineWidth = 2;
          rr(g, o.x, top, o.w, o.h, 8);
          g.fill();
          g.stroke();
          g.fillStyle = '#fff';
          g.beginPath();
          g.arc(o.x + 9, top + 11, 4.5, 0, Math.PI * 2);
          g.arc(o.x + 19, top + 11, 4.5, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#071426';
          g.beginPath();
          g.arc(o.x + 10, top + 11, 2, 0, Math.PI * 2);
          g.arc(o.x + 20, top + 11, 2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#7a1420';
          g.fillRect(o.x + 4, top + o.h - 5, o.w - 8, 4);
        }
      });

      coins.forEach(function (c) { drawRing(c.x, c.y, c.ph); });

      parts.forEach(function (q) {
        g.globalAlpha = Math.max(0, q.t / 0.5);
        g.fillStyle = q.c;
        g.fillRect(q.x - 2, q.y - 2, 4, 4);
      });
      g.globalAlpha = 1;

      if (!(inv > 0 && Math.floor(inv * 14) % 2 === 0)) drawHedgehog(PX, py, !onGround);

      if (!started) {
        g.fillStyle = 'rgba(7,17,32,.72)';
        g.fillRect(0, H / 2 - 54, W, 108);
        g.textAlign = 'center';
        g.fillStyle = '#ffcf33';
        g.font = 'bold 15px monospace';
        g.fillText('ANILLOS', W / 2, H / 2 - 24);
        g.fillStyle = '#f2f8ff';
        g.font = 'bold 13px monospace';
        g.fillText('toca o pulsa espacio para saltar', W / 2, H / 2 + 2);
        g.fillStyle = '#8fb3d9';
        g.font = '12px monospace';
        g.fillText('junta ' + GOAL + ' anillos y evita los pinchos', W / 2, H / 2 + 26);
      }
      g.restore();
    }

    ctx.loop(function (dt) {
      update(dt);
      draw();
    });
  }

  C.register({
    id: 'anillos',
    name: 'Anillos',
    desc: 'Corre, salta y junta 50 anillos esquivando pinchos y badniks.',
    tag: 'arcade',
    color: '#ffcf33',
    unit: 'anillos',
    icon: ['..####..', '.##..##.', '##....##', '##....##', '##....##', '.##..##.', '..####..', '........'],
    how: 'Toca la pantalla, haz clic o pulsa espacio/flecha arriba para saltar.\nJunta 50 anillos para completar la zona. Los pinchos y los badniks te quitan una vida y algunos anillos.\nCuanto más corras, más rápido va todo.',
    start: function (ctx) { play(ctx); }
  });
})();
