(function () {
  'use strict';
  var C = window.Nitro;
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
          title: 'nitro se estrelló',
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

    function drawNitro() {
      var tilt = U.clamp(vy / 700, -0.5, 0.9);
      g.save();
      g.translate(CX, y);
      g.rotate(tilt);
      g.fillStyle = dead ? '#a81722' : '#1b6fd6';
      g.strokeStyle = '#0b3d91';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-4, -8);
      g.lineTo(-R - 12, -12);
      g.lineTo(-R - 2, 0);
      g.lineTo(-R - 11, 6);
      g.lineTo(-4, 8);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = dead ? '#ff8a8a' : '#2f9bff';
      g.beginPath();
      g.arc(0, 0, R, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#f7c98b';
      g.beginPath();
      g.ellipse(4, 4, 7, 5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#f7fbff';
      g.beginPath();
      g.ellipse(-1, -3, 4.5, 5.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#071426';
      g.beginPath();
      g.ellipse(0, -2, 1.8, 3, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(10, 4, 1.8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#e8323c';
      g.fillRect(-8, R - 1, 7, 4);
      g.fillRect(1, R - 1, 7, 4);
      g.restore();
    }

    function drawPipe(p) {
      var top = p.cy - p.gap / 2;
      var bot = p.cy + p.gap / 2;
      g.fillStyle = '#1d7a52';
      g.fillRect(p.x, 0, PIPE_W, top);
      g.fillRect(p.x, bot, PIPE_W, H - GROUND - bot);
      g.fillStyle = '#43d17a';
      g.fillRect(p.x + 4, 0, 10, top);
      g.fillRect(p.x + 4, bot, 10, H - GROUND - bot);
      g.fillStyle = '#14524a';
      g.fillRect(p.x - 4, top - 16, PIPE_W + 8, 16);
      g.fillRect(p.x - 4, bot, PIPE_W + 8, 16);
      g.fillStyle = '#43d17a';
      g.fillRect(p.x - 4, top - 16, 10, 16);
      g.fillRect(p.x - 4, bot, 10, 16);
    }

    function draw() {
      g.save();
      if (shake > 0) g.translate(U.rand(-3, 3), U.rand(-3, 3));
      g.fillStyle = '#081426';
      g.fillRect(-4, -4, W + 8, H + 8);
      g.fillStyle = '#1e4a7a';
      stars.forEach(function (s) {
        var sx = ((s.x - scroll * 0.1 * s.s) % W + W) % W;
        g.fillRect(sx, s.y, s.s, s.s);
      });
      pipes.forEach(drawPipe);
      g.fillStyle = '#0c2038';
      g.fillRect(0, H - GROUND, W, GROUND);
      g.fillStyle = '#ffcf33';
      g.fillRect(0, H - GROUND, W, 3);
      g.fillStyle = '#1e4a7a';
      for (var x = -((scroll) % 24); x < W; x += 24) g.fillRect(x, H - GROUND + 14, 12, 3);
      drawNitro();
      g.textAlign = 'center';
      if (started) {
        g.fillStyle = 'rgba(242,248,255,0.9)';
        g.font = 'bold 34px monospace';
        g.fillText(String(score), W / 2, 56);
      } else {
        g.fillStyle = '#f2f8ff';
        g.font = 'bold 18px monospace';
        g.fillText('toca para empezar', W / 2, 150);
        g.fillStyle = '#8fb3d9';
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
    name: 'Flap Nitro',
    desc: 'Vuela entre las columnas verdes sin chocar.',
    tag: 'arcade',
    color: '#43d17a',
    unit: 'tubos',
    icon: ['..##..##', '..##..##', '..##..##', '..##..##', '........', '.####.##', '.####.##', '..##..##'],
    how: 'Toca la pantalla, haz clic o pulsa espacio para dar un impulso a Nitro.\nCruza entre las columnas verdes sin tocarlas ni caer al suelo.\nCada columna pasada suma 1; el hueco se va cerrando despacio.',
    start: function (ctx) { play(ctx); }
  });
})();
