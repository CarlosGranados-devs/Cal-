(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var L = 480;
  var T = 320;
  var PH = 58;
  var PW = 8;
  var BR = 6;
  var WIN_AT = 7;
  var PX = 18;

  var LEVELS = {
    facil: { speed: 150, err: 46, think: 0.35 },
    normal: { speed: 240, err: 24, think: 0.22 },
    dificil: { speed: 330, err: 10, think: 0.12 }
  };

  function play(ctx, lvl) {
    var portrait = ctx.root.clientHeight > ctx.root.clientWidth * 1.05;
    var cv = ctx.canvas(portrait ? T : L, portrait ? L : T);
    var g = cv.g;
    var SW = cv.W;
    var SH = cv.H;

    var py = T / 2, ay = T / 2;
    var ps = 0, as = 0;
    var ball = { x: L / 2, y: T / 2, vx: 0, vy: 0, sp: 270 };
    var serveWait = 1;
    var serveDir = 1;
    var keyUp = false, keyDown = false;
    var aiTarget = T / 2, aiTimer = 0, aiErr = 0;
    var flash = 0;
    var trail = [];
    var over = false;
    var dragOff = null;
    var hits = 0;

    ctx.status('tú ' + ps + ' - ' + as + ' calo');
    ctx.score('a ' + WIN_AT);

    function resetBall(dir) {
      ball.x = L / 2;
      ball.y = T / 2;
      ball.vx = 0;
      ball.vy = 0;
      ball.sp = 270;
      serveWait = 0.9;
      serveDir = dir;
      hits = 0;
      trail = [];
    }

    function launch() {
      var a = (Math.random() * 40 - 20) * Math.PI / 180;
      ball.vx = Math.cos(a) * ball.sp * serveDir;
      ball.vy = Math.sin(a) * ball.sp;
    }

    function point(playerScored) {
      if (playerScored) ps++; else as++;
      ctx.status('tú ' + ps + ' - ' + as + ' calo');
      ctx.sfx(playerScored ? 'good' : 'bad');
      ctx.vibrate(playerScored ? 15 : 35);
      flash = 0.25;
      if (ps >= WIN_AT || as >= WIN_AT) return end();
      resetBall(playerScored ? 1 : -1);
    }

    function end() {
      if (over) return;
      over = true;
      var won = ps > as;
      var diff = ps - as;
      if (won) {
        ctx.mood('happy');
        ctx.finish({
          win: true,
          score: diff * 10 + 10,
          better: 'high',
          scoreText: diff * 10 + 10 + ' pts',
          title: '¡le ganaste a calo!',
          msg: ps + ' - ' + as + ' en el marcador'
        });
      } else {
        ctx.mood('sad');
        ctx.finish({ win: false, title: 'calo te ganó', msg: ps + ' - ' + as + '. la próxima la remontas' });
      }
    }

    function clampP(v) { return U.clamp(v, PH / 2, T - PH / 2); }

    function axisOf(e) {
      var p = cv.pos(e);
      return portrait ? p.x : p.y;
    }

    cv.canvas.addEventListener('pointerdown', function (e) {
      try { cv.canvas.setPointerCapture(e.pointerId); } catch (x) {}
      dragOff = py - axisOf(e);
    });
    cv.canvas.addEventListener('pointermove', function (e) {
      if (dragOff === null && e.pointerType === 'mouse') { py = clampP(axisOf(e)); return; }
      if (dragOff === null) return;
      py = clampP(axisOf(e) + dragOff);
    });
    var release = function () { dragOff = null; };
    cv.canvas.addEventListener('pointerup', release);
    cv.canvas.addEventListener('pointercancel', release);

    function keyDir(k) {
      if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'w' || k === 'a' || k === 'W' || k === 'A') return -1;
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 's' || k === 'd' || k === 'S' || k === 'D') return 1;
      return 0;
    }
    ctx.onKey(function (e) {
      var d = keyDir(e.key);
      if (d < 0) keyUp = true;
      if (d > 0) keyDown = true;
    });
    ctx.onKeyUp(function (e) {
      var d = keyDir(e.key);
      if (d < 0) keyUp = false;
      if (d > 0) keyDown = false;
    });

    function bounceOff(paddleY, dirX) {
      var rel = U.clamp((ball.y - paddleY) / (PH / 2), -1, 1);
      var ang = rel * 58 * Math.PI / 180;
      hits++;
      ball.sp = Math.min(620, ball.sp * 1.06);
      ball.vx = Math.cos(ang) * ball.sp * dirX;
      ball.vy = Math.sin(ang) * ball.sp;
      ctx.sfx('tick');
      ctx.vibrate(8);
    }

    function stepBall(dt) {
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }
      if (ball.y > T - BR) { ball.y = T - BR; ball.vy = -Math.abs(ball.vy); }
      if (ball.vx < 0 && ball.x - BR <= PX + PW / 2 && ball.x > PX - PW) {
        if (Math.abs(ball.y - py) <= PH / 2 + BR) {
          ball.x = PX + PW / 2 + BR;
          bounceOff(py, 1);
        }
      }
      var ax = L - PX;
      if (ball.vx > 0 && ball.x + BR >= ax - PW / 2 && ball.x < ax + PW) {
        if (Math.abs(ball.y - ay) <= PH / 2 + BR) {
          ball.x = ax - PW / 2 - BR;
          bounceOff(ay, -1);
          aiErr = (Math.random() * 2 - 1) * lvl.err;
        }
      }
      if (ball.x < -BR * 2) point(false);
      else if (ball.x > L + BR * 2) point(true);
    }

    function updateAI(dt) {
      aiTimer -= dt;
      if (aiTimer <= 0) {
        aiTimer = lvl.think;
        if (ball.vx > 0) {
          var t = (L - PX - ball.x) / Math.max(1, ball.vx);
          var yy = ball.y + ball.vy * t * (lvl === LEVELS.dificil ? 1 : 0.7);
          var m = T * 2;
          yy = ((yy % m) + m) % m;
          if (yy > T) yy = m - yy;
          aiTarget = yy + aiErr;
        } else {
          aiTarget = T / 2 + (aiTarget - T / 2) * 0.3;
        }
      }
      var d = aiTarget - ay;
      var mv = lvl.speed * dt;
      if (Math.abs(d) > 3) ay += Math.max(-mv, Math.min(mv, d));
      ay = clampP(ay);
    }

    function update(dt) {
      var kv = (keyDown ? 1 : 0) - (keyUp ? 1 : 0);
      if (kv) py = clampP(py + kv * 380 * dt);
      updateAI(dt);
      if (serveWait > 0) {
        serveWait -= dt;
        if (serveWait <= 0) launch();
        return;
      }
      var steps = Math.ceil(Math.abs(ball.vx * dt) / 4) || 1;
      for (var i = 0; i < steps && !over; i++) stepBall(dt / steps);
      if (!over) {
        trail.push({ x: ball.x, y: ball.y });
        if (trail.length > 8) trail.shift();
      }
    }

    function draw() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      var dpr = cv.canvas.width / SW;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = '#0d0d11';
      g.fillRect(0, 0, SW, SH);
      g.save();
      if (portrait) g.transform(0, -1, 1, 0, 0, SH);
      g.fillStyle = flash > 0 ? '#2a1010' : '#0d0d11';
      g.fillRect(0, 0, L, T);
      g.fillStyle = '#26262e';
      for (var y = 6; y < T; y += 20) g.fillRect(L / 2 - 1.5, y, 3, 10);
      for (var i = 0; i < trail.length; i++) {
        g.fillStyle = 'rgba(255,44,44,' + (i / trail.length) * 0.35 + ')';
        g.fillRect(trail[i].x - BR * 0.6, trail[i].y - BR * 0.6, BR * 1.2, BR * 1.2);
      }
      g.fillStyle = '#ececf0';
      g.fillRect(PX - PW / 2, py - PH / 2, PW, PH);
      g.fillStyle = '#ff2c2c';
      g.fillRect(L - PX - PW / 2, ay - PH / 2, PW, PH);
      g.fillStyle = '#ececf0';
      g.fillRect(ball.x - BR, ball.y - BR, BR * 2, BR * 2);
      g.restore();
      g.fillStyle = 'rgba(236,236,240,0.16)';
      g.font = 'bold 40px monospace';
      g.textAlign = 'center';
      if (portrait) {
        g.fillText(String(as), SW / 2, SH / 2 - 26);
        g.fillText(String(ps), SW / 2, SH / 2 + 50);
      } else {
        g.fillText(String(ps), SW / 2 - 50, 54);
        g.fillText(String(as), SW / 2 + 50, 54);
      }
      if (serveWait > 0 && ps + as === 0) {
        g.fillStyle = '#8a8a94';
        g.font = '13px monospace';
        g.fillText(portrait ? 'arrastra para mover tu paleta' : 'mouse, toque o flechas', SW / 2, SH - 14);
      }
    }

    ctx.loop(function (dt) {
      if (flash > 0) flash -= dt;
      if (!over) update(dt);
      draw();
    });
  }

  C.register({
    id: 'pong',
    name: 'Pong',
    desc: 'El clásico contra Calo. Primero a 7 gana.',
    tag: 'arcade',
    color: '#ff2c2c',
    unit: 'pts',
    icon: ['........', '#......#', '#..##..#', '#......#', '#......#', '#......#', '#......#', '........'],
    how: 'Mueve tu paleta (blanca) con el mouse, arrastrando el dedo o con las flechas.\nLa pelota acelera con cada golpe; pega con la orilla de la paleta para cambiar el ángulo.\nEl primero en llegar a 7 gana.',
    start: function (ctx) {
      ctx.choose(
        {
          title: 'dificultad de calo',
          options: [
            { id: 'facil', label: 'fácil', desc: 'calo se distrae seguido' },
            { id: 'normal', label: 'normal', desc: 'justo y parejo' },
            { id: 'dificil', label: 'difícil', desc: 'calo casi no falla' }
          ]
        },
        function (id) { play(ctx, LEVELS[id]); }
      );
    }
  });
})();
