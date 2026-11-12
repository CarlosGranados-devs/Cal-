(function () {
  'use strict';
  var C = window.Nitro;
  var U = C.util;

  var COLS = 15;
  var ROWS = 15;
  var CELL = 20;
  var W = 320;
  var H = 380;
  var OX = 10;
  var OY = 40;
  var TIME = 90;
  var RINGS = 3;

  function makeMaze() {
    var grid = [];
    for (var y = 0; y < ROWS; y++) {
      var row = [];
      for (var x = 0; x < COLS; x++) row.push(1);
      grid.push(row);
    }
    var stack = [[1, 1]];
    grid[1][1] = 0;
    var dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
    while (stack.length) {
      var cur = stack[stack.length - 1];
      var cx = cur[0], cy = cur[1];
      var opts = [];
      for (var i = 0; i < dirs.length; i++) {
        var nx = cx + dirs[i][0];
        var ny = cy + dirs[i][1];
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && grid[ny][nx] === 1) {
          opts.push(dirs[i]);
        }
      }
      if (!opts.length) {
        stack.pop();
        continue;
      }
      var d = U.pick(opts);
      grid[cy + d[1] / 2][cx + d[0] / 2] = 0;
      grid[cy + d[1]][cx + d[0]] = 0;
      stack.push([cx + d[0], cy + d[1]]);
    }
    return grid;
  }

  function play(ctx) {
    var cv = ctx.canvas(W, H);
    var g = cv.g;
    var maze = makeMaze();
    var exit = [COLS - 2, ROWS - 2];
    var px = 1, py = 1;
    var moves = 0;
    var time = 0;
    var got = 0;
    var over = false;
    var t = 0;

    var open = [];
    for (var y = 1; y < ROWS - 1; y++) {
      for (var x = 1; x < COLS - 1; x++) {
        if (maze[y][x] !== 0) continue;
        if (x === 1 && y === 1) continue;
        if (x === exit[0] && y === exit[1]) continue;
        if (Math.abs(x - 1) + Math.abs(y - 1) < 4) continue;
        open.push([x, y]);
      }
    }
    open = U.shuffle(open);
    var rings = open.slice(0, RINGS).map(function (p) {
      return { x: p[0], y: p[1], ph: Math.random() * 6, on: true };
    });

    function hud() {
      ctx.status('anillos ' + got + '/' + RINGS + ' · salida ' + (got >= RINGS ? 'abierta' : 'cerrada'));
      ctx.score('mov ' + moves + ' · ' + Math.max(0, Math.ceil(TIME - time)) + ' s');
    }
    hud();

    function cellCenter(cx, cy) {
      return { x: OX + cx * CELL + CELL / 2, y: OY + cy * CELL + CELL / 2 };
    }

    function move(dir) {
      if (over || ctx.isDone()) return;
      var dx = 0, dy = 0;
      if (dir === 'up') dy = -1;
      else if (dir === 'down') dy = 1;
      else if (dir === 'left') dx = -1;
      else if (dir === 'right') dx = 1;
      var nx = px + dx, ny = py + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || maze[ny][nx] === 1) {
        ctx.sfx('tick');
        ctx.vibrate(6);
        return;
      }
      px = nx;
      py = ny;
      moves++;
      ctx.sfx('tick');
      ctx.vibrate(5);

      for (var i = 0; i < rings.length; i++) {
        var r = rings[i];
        if (r.on && r.x === px && r.y === py) {
          r.on = false;
          got++;
          ctx.sfx('ring');
          ctx.vibrate(12);
          if (got >= RINGS) {
            ctx.mood('wow');
            ctx.sfx('level');
          }
        }
      }

      if (px === exit[0] && py === exit[1]) {
        if (got >= RINGS) win();
        else {
          ctx.sfx('bad');
          ctx.status('faltan ' + (RINGS - got) + ' anillos');
        }
      }
      hud();
    }

    function win() {
      if (over) return;
      over = true;
      ctx.mood('happy');
      ctx.sfx('win');
      var score = Math.max(100, 1500 - moves * 10 - Math.floor(time) * 5);
      ctx.after(450, function () {
        ctx.finish({
          win: true,
          score: score,
          scoreText: score + ' pts',
          title: '¡salida encontrada!',
          msg: moves + ' movimientos · ' + Math.floor(time) + ' s · ' + RINGS + ' anillos'
        });
      });
    }

    function lose() {
      if (over) return;
      over = true;
      ctx.mood('sad');
      ctx.sfx('lose');
      ctx.after(400, function () {
        ctx.finish({
          win: false,
          score: got * 20,
          scoreText: got * 20 + ' pts',
          title: 'se acabó el tiempo',
          msg: 'juntaste ' + got + '/' + RINGS + ' anillos · ' + moves + ' movimientos'
        });
      });
    }

    function isL(k) { return k === 'ArrowLeft' || k === 'a' || k === 'A'; }
    function isR(k) { return k === 'ArrowRight' || k === 'd' || k === 'D'; }
    function isU(k) { return k === 'ArrowUp' || k === 'w' || k === 'W'; }
    function isD(k) { return k === 'ArrowDown' || k === 's' || k === 'S'; }

    ctx.onKey(function (e) {
      if (isL(e.key)) move('left');
      else if (isR(e.key)) move('right');
      else if (isU(e.key)) move('up');
      else if (isD(e.key)) move('down');
    });
    ctx.swipe(cv.canvas, function (dir) { move(dir); }, 18);
    ctx.dpad(ctx.root, function (dir) { move(dir); }, { repeat: 140 });

    function drawRing(x, y, phase) {
      var w = 0.55 + Math.abs(Math.cos(t * 4 + phase)) * 0.45;
      g.save();
      g.translate(x, y);
      g.strokeStyle = '#ffcf33';
      g.lineWidth = 2.5;
      g.shadowColor = '#ffcf33';
      g.shadowBlur = 8;
      g.beginPath();
      g.ellipse(0, 0, 6 * w, 6, 0, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }

    function drawExit() {
      var c = cellCenter(exit[0], exit[1]);
      var ready = got >= RINGS;
      g.save();
      g.translate(c.x, c.y);
      g.globalAlpha = ready ? 1 : 0.35;
      g.strokeStyle = ready ? '#ffcf33' : '#8fb3d9';
      g.lineWidth = 3;
      g.shadowColor = ready ? '#ffcf33' : 'transparent';
      g.shadowBlur = ready ? 14 : 0;
      g.beginPath();
      g.arc(0, 0, 7 + Math.sin(t * 4) * 1.2, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(0, 0, 3, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }

    function drawNitro() {
      var c = cellCenter(px, py);
      g.save();
      g.translate(c.x, c.y);
      g.fillStyle = '#1b6fd6';
      g.strokeStyle = '#0b3d91';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(-4, -3);
      g.lineTo(-11, -7);
      g.lineTo(-6, 0);
      g.lineTo(-11, 4);
      g.lineTo(-3, 4);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#2f9bff';
      g.beginPath();
      g.arc(0, 0, 7, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#f7c98b';
      g.beginPath();
      g.ellipse(2.5, 2.5, 4, 3.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#f7fbff';
      g.beginPath();
      g.ellipse(-1.5, -2.5, 2.6, 3.2, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#071426';
      g.beginPath();
      g.ellipse(-0.5, -2, 1.2, 2, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    function draw() {
      g.fillStyle = '#081426';
      g.fillRect(0, 0, W, H);

      var sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0a1c38');
      sky.addColorStop(1, '#07111f');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);

      g.fillStyle = '#0c2038';
      g.fillRect(OX, OY, COLS * CELL, ROWS * CELL);

      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          if (maze[y][x] !== 1) continue;
          var wx = OX + x * CELL;
          var wy = OY + y * CELL;
          g.fillStyle = '#123a63';
          g.fillRect(wx + 1, wy + 1, CELL - 2, CELL - 2);
          g.fillStyle = '#1e4a7a';
          g.fillRect(wx + 1, wy + 1, CELL - 2, 2);
        }
      }

      g.strokeStyle = '#1e4a7a';
      g.lineWidth = 2;
      g.strokeRect(OX - 1, OY - 1, COLS * CELL + 2, ROWS * CELL + 2);

      drawExit();
      for (var i = 0; i < rings.length; i++) {
        if (!rings[i].on) continue;
        var c = cellCenter(rings[i].x, rings[i].y);
        drawRing(c.x, c.y, rings[i].ph);
      }
      drawNitro();

      g.fillStyle = '#8fb3d9';
      g.font = '11px monospace';
      g.textAlign = 'center';
      g.fillText('junta 3 anillos y llega al portal', W / 2, H - 8);
    }

    ctx.loop(function (dt) {
      t += dt;
      if (!over) {
        time += dt;
        hud();
        if (time >= TIME) lose();
      }
      draw();
    });
  }

  C.register({
    id: 'laberinto',
    name: 'Laberinto',
    desc: 'Recorre el laberinto, junta 3 anillos y escapa por el portal.',
    tag: 'estrategia',
    color: '#43d17a',
    unit: 'pts',
    icon: ['########', '#......#', '#.####.#', '#.#..#.#', '#.#.##.#', '#.#....#', '#.####.#', '#......#'],
    how: 'Mueve a Nitro con las flechas, WASD, el pad táctil o deslizando el dedo.\nJunta los 3 anillos dorados y luego llega al portal de la esquina inferior derecha.\nMenos movimientos y menos tiempo = más puntos. Tienes 90 segundos.',
    start: function (ctx) { play(ctx); }
  });
})();
