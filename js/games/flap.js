(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var W = 320;
  var H = 480;
  var GROUND = 44;
  var CX = 88;
  var R = 12;
  var GRAV = 1500;
  var IMPULSE = -400;
  var PIPE_W = 54;
  var SPACING = 190;

  function play(ctx) {
    var cv = ctx.canvas(W, H);
    var g = cv.g;

    var y = H / 2 - 30, vy = 0;
    var pipes = [];
    var started = false, dead = false;
    var score = 0;
    var speed = 130;
    var gap = 156;
    var nextX = W + 60;
    var lastCy = H / 2 - GROUND / 2;
    var t = 0, scroll = 0, shake = 0;
    var stars = [];
    for (var i = 0; i < 24; i++) stars.push({ x: U.rand(0, W), y: U.rand(0, H - GROUND - 10), s: U.rand(1, 2) });

    ctx.status('tubos: 0');
    ctx.score('récord ' + (ctx.best == null ? '-' : ctx.best));

    function spawn() {
      var margin = 60;
      var lo = Math.max(margin + gap / 2, lastCy - 130);
      var hi = Math.min(H - GROUND - margin - gap / 2, lastCy + 130);
      var cy = U.rand(Math.round(lo), Math.round(hi));
      lastCy = cy;
      pipes.push({ x: nextX, cy: cy, gap: gap, passed: false });
      nextX += SPACING;
      gap = Math.max(112, gap - 3);
    }

    function flap() {
      if (dead) return;
      if (!started) {
        started = true;
        while (nextX < W + 300) spawn();
      }
      vy = IMPULSE;
      ctx.sfx('tick');
      ctx.vibrate(6);
    }

    function die() {
      if (dead) return;
      dead = true;
      shake = 0.3;
      ctx.sfx('lose');
      ctx.vibrate(60);
      ctx.mood('sad');
      ctx.after(650, function () {
        ctx.finish({
          win: false,
          score: score,
          scoreText: score + (score === 1 ? ' tubo' : ' tubos'),
          title: 'calo se estrelló',
          msg: score === 0 ? 'ni un tubo. toca más suave' : 'pasaste ' + score + (score === 1 ? ' tubo' : ' tubos')
        });
      });
    }

    ctx.root.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('button')) return;
      flap();
    });
    ctx.onKey(function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'Enter') flap();
    });

    function hitsPipe(p) {
      var inX = CX + R * 0.8 > p.x && CX - R * 0.8 < p.x + PIPE_W;
      if (!inX) return false;
      return y - R * 0.8 < p.cy - p.gap / 2 || y + R * 0.8 > p.cy + p.gap / 2;
    }

    function update(dt) {
      t += dt;
      if (!started) {
        y = H / 2 - 30 + Math.sin(t * 4) * 8;
        return;
      }
      vy += GRAV * dt;
      if (vy > 620) vy = 620;
      y += vy * dt;
      if (y < R) { y = R; if (vy < 0) vy = 0; }
      if (dead) {
        if (y > H - GROUND - R) y = H - GROUND - R;
        return;
      }
      speed = Math.min(190, 130 + score * 2);
      scroll += speed * dt;
      for (var i = pipes.length - 1; i >= 0; i--) {
        var p = pipes[i];
        p.x -= speed * dt;
        nextX -= speed * dt * (i === pipes.length - 1 ? 1 : 0);
        if (!p.passed && p.x + PIPE_W < CX - R) {
          p.passed = true;
          score++;
          ctx.sfx('good');
          ctx.status('tubos: ' + score);
        }
        if (hitsPipe(p)) die();
        if (p.x + PIPE_W < -10) pipes.splice(i, 1);
      }
      var lastP = pipes[pipes.length - 1];
      if (lastP && lastP.x + SPACING < W + 60) { nextX = lastP.x + SPACING; spawn(); }
      if (y + R * 0.9 > H - GROUND) { y = H - GROUND - R * 0.9; die(); }
    }

    function drawCalo() {
      var tilt = U.clamp(vy / 700, -0.5, 0.9);
      g.save();
      g.translate(CX, y);
      g.rotate(tilt);
      g.fillStyle = dead ? '#ff7a7a' : '#ececf0';
      g.beginPath();
      g.arc(0, -2, R, Math.PI, 0);
      g.lineTo(R, R);
      var wv = Math.sin(t * 14) * 1.5;
      g.lineTo(R * 0.55, R - 4 + wv);
      g.lineTo(R * 0.1, R);
      g.lineTo(-R * 0.4, R - 4 - wv);
      g.lineTo(-R, R);
      g.closePath();
      g.fill();
      g.fillStyle = '#ff2c2c';
      g.fillRect(-6, -6, 4, 5);
      g.fillRect(2, -6, 4, 5);
      g.restore();
    }

    function drawPipe(p) {
      var top = p.cy - p.gap / 2;
      var bot = p.cy + p.gap / 2;
      g.fillStyle = '#b01818';
      g.fillRect(p.x, 0, PIPE_W, top);
      g.fillRect(p.x, bot, PIPE_W, H - GROUND - bot);
      g.fillStyle = '#ff2c2c';
      g.fillRect(p.x + 4, 0, 10, top);
      g.fillRect(p.x + 4, bot, 10, H - GROUND - bot);
      g.fillStyle = '#8f1c1c';
      g.fillRect(p.x - 4, top - 16, PIPE_W + 8, 16);
      g.fillRect(p.x - 4, bot, PIPE_W + 8, 16);
      g.fillStyle = '#ff2c2c';
      g.fillRect(p.x - 4, top - 16, 10, 16);
      g.fillRect(p.x - 4, bot, 10, 16);
    }

    function draw() {
      g.save();
      if (shake > 0) g.translate(U.rand(-3, 3), U.rand(-3, 3));
      g.fillStyle = '#0d0d11';
      g.fillRect(-4, -4, W + 8, H + 8);
      g.fillStyle = '#2a2a33';
      stars.forEach(function (s) {
        var sx = ((s.x - scroll * 0.1 * s.s) % W + W) % W;
        g.fillRect(sx, s.y, s.s, s.s);
      });
      pipes.forEach(drawPipe);
      g.fillStyle = '#16161c';
      g.fillRect(0, H - GROUND, W, GROUND);
      g.fillStyle = '#ff2c2c';
      g.fillRect(0, H - GROUND, W, 3);
      g.fillStyle = '#26262e';
      for (var x = -((scroll) % 24); x < W; x += 24) g.fillRect(x, H - GROUND + 14, 12, 3);
      drawCalo();
      g.textAlign = 'center';
      if (started) {
        g.fillStyle = 'rgba(236,236,240,0.9)';
        g.font = 'bold 34px monospace';
        g.fillText(String(score), W / 2, 56);
      } else {
        g.fillStyle = '#ececf0';
        g.font = 'bold 18px monospace';
        g.fillText('toca para empezar', W / 2, 150);
        g.fillStyle = '#8a8a94';
        g.font = '13px monospace';
        g.fillText('clic, toque o espacio = impulso', W / 2, 176);
      }
      g.restore();
    }

    ctx.loop(function (dt) {
      if (shake > 0) shake -= dt;
      update(dt);
      draw();
    });
  }

  C.register({
    id: 'flap',
    name: 'Flap Calo',
    desc: 'Vuela entre las columnas rojas sin chocar.',
    tag: 'arcade',
    color: '#ff2c2c',
    unit: 'tubos',
    icon: ['..##..##', '..##..##', '..##..##', '..##..##', '........', '.####.##', '.####.##', '..##..##'],
    how: 'Toca la pantalla, haz clic o pulsa espacio para dar un impulso a Calo.\nCruza entre las columnas rojas sin tocarlas ni caer al suelo.\nCada columna pasada suma 1; el hueco se va cerrando despacio.',
    start: function (ctx) { play(ctx); }
  });
})();
