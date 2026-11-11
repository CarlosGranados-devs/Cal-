(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var W = 360;
  var H = 520;
  var COLS = 8;
  var BW = 40;
  var BH = 16;
  var GAP = 4;
  var X0 = (W - (COLS * (BW + GAP) - GAP)) / 2;
  var Y0 = 52;
  var PY = 486;
  var PH = 10;
  var BR = 5;

  var ROW_COLORS = ['#ff2c2c', '#ff4a2a', '#ff6a26', '#ff8a22', '#ffa31e', '#ffb020'];

  var LEVELS = [
    ['11111111', '11111111', '11111111', '22222222', '22222222'],
    ['00211200', '02222220', '22111122', '02222220', '00211200', '00022000'],
    ['33333333', '20000002', '21111112', '20300302', '21111112', '23333332']
  ];

  var POWERS = {
    G: { label: 'G', color: '#38d9ff' },
    L: { label: 'L', color: '#a78bfa' },
    M: { label: 'M', color: '#7bd957' }
  };

  function play(ctx) {
    var cv = ctx.canvas(W, H);
    var g = cv.g;

    var level = 0, lives = 3, score = 0;
    var bricks = [], balls = [], caps = [], parts = [];
    var padX = W / 2, padW = 64, padTarget = null;
    var bigT = 0, slowT = 0;
    var stuck = true;
    var banner = '', bannerT = 0;
    var over = false;
    var keyL = false, keyR = false;
    var dragOff = null;

    function status() { ctx.status('vidas ' + lives + ' · nivel ' + (level + 1) + '/3'); ctx.score(score + ' pts'); }

    function loadLevel() {
      bricks = [];
      LEVELS[level].forEach(function (row, r) {
        for (var c = 0; c < COLS; c++) {
          var hp = parseInt(row[c], 10);
          if (hp > 0) bricks.push({ x: X0 + c * (BW + GAP), y: Y0 + r * (BH + GAP), hp: hp, max: hp, row: r });
        }
      });
      caps = [];
      resetBall();
      banner = 'nivel ' + (level + 1);
      bannerT = 1.4;
      status();
    }

    function baseSpeed() { return 290 + level * 35; }

    function resetBall() {
      stuck = true;
      balls = [{ x: padX, y: PY - PH / 2 - BR - 1, vx: 0, vy: 0 }];
    }

    function launch() {
      if (!stuck || over) return;
      stuck = false;
      var a = (Math.random() * 40 - 20) * Math.PI / 180;
      var sp = baseSpeed();
      balls[0].vx = Math.sin(a) * sp;
      balls[0].vy = -Math.cos(a) * sp;
      ctx.sfx('click');
    }

    function clampPad() { padX = U.clamp(padX, padW / 2, W - padW / 2); }

    cv.canvas.addEventListener('pointerdown', function (e) {
      try { cv.canvas.setPointerCapture(e.pointerId); } catch (x) {}
      dragOff = padX - cv.pos(e).x;
      launch();
    });
    cv.canvas.addEventListener('pointermove', function (e) {
      if (dragOff === null) {
        if (e.pointerType === 'mouse') { padX = cv.pos(e).x; clampPad(); }
        return;
      }
      padX = cv.pos(e).x + dragOff;
      clampPad();
    });
    var rel = function () { dragOff = null; };
    cv.canvas.addEventListener('pointerup', rel);
    cv.canvas.addEventListener('pointercancel', rel);

    ctx.onKey(function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyL = true;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') keyR = true;
      else if (k === ' ' || k === 'ArrowUp' || k === 'Enter') launch();
    });
    ctx.onKeyUp(function (e) {
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keyL = false;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') keyR = false;
    });

    function burst(x, y, color) {
      for (var i = 0; i < 7; i++) {
        parts.push({ x: x, y: y, vx: U.rand(-90, 90), vy: U.rand(-110, 40), t: 0.4, c: color });
      }
    }

    function dropPower(b) {
      if (Math.random() > 0.2) return;
      var k = U.pick(['G', 'L', 'M', 'G', 'L', 'M']);
      caps.push({ x: b.x + BW / 2, y: b.y + BH / 2, k: k });
    }

    function hitBrick(b) {
      b.hp--;
      if (b.hp <= 0) {
        score += 10 * b.max;
        burst(b.x + BW / 2, b.y + BH / 2, ROW_COLORS[b.row % ROW_COLORS.length]);
        dropPower(b);
        ctx.sfx('pop');
        ctx.vibrate(8);
      } else {
        score += 5;
        ctx.sfx('tick');
      }
      status();
    }

    function applyPower(k) {
      score += 25;
      ctx.sfx('good');
      ctx.vibrate(15);
      if (k === 'G') { bigT = 12; }
      else if (k === 'L') { slowT = 10; }
      else if (k === 'M') {
        var src = balls[0];
        if (src && !stuck) {
          var sp = Math.hypot(src.vx, src.vy);
          var a = Math.atan2(src.vy, src.vx);
          [-0.5, 0.5].forEach(function (d) {
            balls.push({ x: src.x, y: src.y, vx: Math.cos(a + d) * sp, vy: Math.sin(a + d) * sp });
          });
        }
      }
      status();
    }

    function loseLife() {
      lives--;
      ctx.sfx('bad');
      ctx.vibrate(50);
      bigT = 0;
      slowT = 0;
      caps = [];
      status();
      if (lives <= 0) {
        over = true;
        ctx.mood('sad');
        ctx.after(400, function () {
          ctx.finish({ win: false, score: score, scoreText: score + ' pts', title: 'sin vidas', msg: 'llegaste al nivel ' + (level + 1) + ' de 3' });
        });
        return;
      }
      resetBall();
    }

    function levelDone() {
      if (level >= LEVELS.length - 1) {
        over = true;
        score += lives * 50;
        ctx.mood('happy');
        ctx.sfx('win');
        status();
        ctx.finish({ win: true, score: score, scoreText: score + ' pts', title: '¡limpiaste los 3 niveles!', msg: 'bonus de vidas: ' + lives * 50 });
        return;
      }
      level++;
      ctx.sfx('level');
      padW = 64;
      bigT = 0;
      slowT = 0;
      loadLevel();
    }

    function stepBall(b, dt) {
      var mult = slowT > 0 ? 0.65 : 1;
      b.x += b.vx * dt * mult;
      b.y += b.vy * dt * mult;
      if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx); }
      if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx); }
      if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy); }
      var sp = Math.hypot(b.vx, b.vy);
      if (Math.abs(b.vy) < sp * 0.22) {
        b.vy = (b.vy < 0 ? -1 : 1) * sp * 0.22;
        var sx = Math.sqrt(sp * sp - b.vy * b.vy);
        b.vx = (b.vx < 0 ? -1 : 1) * sx;
      }
      if (b.vy > 0 && b.y + BR >= PY - PH / 2 && b.y - BR <= PY + PH / 2 && Math.abs(b.x - padX) <= padW / 2 + BR) {
        var r = U.clamp((b.x - padX) / (padW / 2), -1, 1);
        var ang = r * 62 * Math.PI / 180;
        var s2 = Math.min(520, Math.max(baseSpeed(), sp) + 4);
        b.vx = Math.sin(ang) * s2;
        b.vy = -Math.cos(ang) * s2;
        b.y = PY - PH / 2 - BR - 0.5;
        ctx.sfx('tick');
      }
      for (var i = 0; i < bricks.length; i++) {
        var k = bricks[i];
        if (k.hp <= 0) continue;
        var cx = U.clamp(b.x, k.x, k.x + BW);
        var cy = U.clamp(b.y, k.y, k.y + BH);
        var dx = b.x - cx, dy = b.y - cy;
        if (dx * dx + dy * dy < BR * BR) {
          var ox = BR - Math.abs(b.x - (k.x + BW / 2)) + BW / 2;
          var oy = BR - Math.abs(b.y - (k.y + BH / 2)) + BH / 2;
          if (ox < oy) {
            b.vx = (b.x < k.x + BW / 2 ? -1 : 1) * Math.abs(b.vx);
            b.x += b.vx > 0 ? 1.5 : -1.5;
          } else {
            b.vy = (b.y < k.y + BH / 2 ? -1 : 1) * Math.abs(b.vy);
            b.y += b.vy > 0 ? 1.5 : -1.5;
          }
          hitBrick(k);
          break;
        }
      }
    }

    function update(dt) {
      var kv = (keyR ? 1 : 0) - (keyL ? 1 : 0);
      if (kv) { padX += kv * 400 * dt; clampPad(); }
      if (bigT > 0) { bigT -= dt; padW += (96 - padW) * Math.min(1, dt * 12); }
      else padW += (64 - padW) * Math.min(1, dt * 12);
      clampPad();
      if (slowT > 0) slowT -= dt;
      if (bannerT > 0) bannerT -= dt;

      if (stuck) {
        balls[0].x = padX;
        balls[0].y = PY - PH / 2 - BR - 1;
      } else {
        for (var n = 0; n < 3; n++) {
          for (var i = 0; i < balls.length; i++) stepBall(balls[i], dt / 3);
        }
        balls = balls.filter(function (b) { return b.y < H + 20; });
        if (!balls.length) { loseLife(); return; }
        var alive = bricks.some(function (k) { return k.hp > 0; });
        if (!alive) { levelDone(); return; }
      }
      for (var c = caps.length - 1; c >= 0; c--) {
        var cp = caps[c];
        cp.y += 110 * dt;
        if (cp.y > PY - PH && cp.y < PY + PH + 8 && Math.abs(cp.x - padX) < padW / 2 + 10) {
          applyPower(cp.k);
          caps.splice(c, 1);
        } else if (cp.y > H + 20) caps.splice(c, 1);
      }
      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p];
        q.t -= dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 300 * dt;
        if (q.t <= 0) parts.splice(p, 1);
      }
    }

    function draw() {
      g.fillStyle = '#0d0d11';
      g.fillRect(0, 0, W, H);
      bricks.forEach(function (k) {
        if (k.hp <= 0) return;
        var col = ROW_COLORS[k.row % ROW_COLORS.length];
        g.fillStyle = col;
        g.fillRect(k.x, k.y, BW, BH);
        g.fillStyle = 'rgba(255,255,255,0.18)';
        g.fillRect(k.x, k.y, BW, 3);
        g.fillStyle = 'rgba(0,0,0,0.35)';
        g.fillRect(k.x, k.y + BH - 3, BW, 3);
        if (k.max > 1) {
          g.fillStyle = '#0a0a0c';
          for (var d = 0; d < k.hp; d++) g.fillRect(k.x + BW / 2 - (k.hp * 6 - 2) / 2 + d * 6, k.y + 6, 4, 4);
        }
      });
      caps.forEach(function (cp) {
        var pw = POWERS[cp.k];
        g.fillStyle = pw.color;
        g.fillRect(cp.x - 10, cp.y - 7, 20, 14);
        g.fillStyle = '#0a0a0c';
        g.font = 'bold 11px monospace';
        g.textAlign = 'center';
        g.fillText(pw.label, cp.x, cp.y + 4);
      });
      parts.forEach(function (q) {
        g.fillStyle = q.c;
        g.globalAlpha = Math.max(0, q.t / 0.4);
        g.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
      });
      g.globalAlpha = 1;
      g.fillStyle = bigT > 0 ? '#38d9ff' : '#ececf0';
      g.fillRect(padX - padW / 2, PY - PH / 2, padW, PH);
      balls.forEach(function (b) {
        g.fillStyle = slowT > 0 ? '#a78bfa' : '#ffffff';
        g.fillRect(b.x - BR, b.y - BR, BR * 2, BR * 2);
      });
      g.textAlign = 'center';
      if (bannerT > 0) {
        g.fillStyle = 'rgba(10,10,12,0.7)';
        g.fillRect(0, H / 2 - 22, W, 44);
        g.fillStyle = '#ff2c2c';
        g.font = 'bold 20px monospace';
        g.fillText(banner, W / 2, H / 2 + 7);
      } else if (stuck && !over) {
        g.fillStyle = '#8a8a94';
        g.font = '13px monospace';
        g.fillText('toca o pulsa espacio para lanzar', W / 2, PY - 40);
      }
    }

    loadLevel();
    ctx.loop(function (dt) {
      if (!over) update(dt);
      draw();
    });
  }

  C.register({
    id: 'ladrillos',
    name: 'Ladrillos',
    desc: 'Rompe el muro con la bola. 3 niveles, 3 vidas.',
    tag: 'arcade',
    color: '#ffb020',
    unit: 'pts',
    icon: ['########', '#.#.#.#.', '.#.#.#.#', '........', '....##..', '....##..', '........', '..####..'],
    how: 'Mueve la paleta con el mouse, arrastrando el dedo o con las flechas. Toca o pulsa espacio para lanzar.\nLos ladrillos con puntos negros aguantan varios golpes. Atrapa cápsulas: G paleta grande, L bola lenta, M multibola.\nLimpia los 3 niveles sin quedarte sin vidas.',
    start: function (ctx) { play(ctx); }
  });
})();
