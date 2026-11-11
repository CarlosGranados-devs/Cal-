(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var N = 20;
  var CELL = 20;
  var SIZE = N * CELL;

  var MODES = {
    clasico: { walls: true, start: 140, min: 75 },
    libre: { walls: false, start: 140, min: 75 },
    rapido: { walls: true, start: 95, min: 50 }
  };

  var VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };

  function isTouch() {
    return ('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function play(ctx, mode) {
    var cv = ctx.canvas(SIZE, SIZE);
    var g = cv.g;
    if (isTouch()) ctx.dpad(ctx.root, function (d) { turn(d); });

    var snake, dir, queue, food, eaten, started, over, acc, tickMs, pulse;

    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = 'right';
    queue = [];
    eaten = 0;
    started = false;
    over = false;
    acc = 0;
    pulse = 0;
    tickMs = mode.start;
    food = placeFood();

    ctx.status('bits: 0');
    ctx.score('0 pts');

    function placeFood() {
      var taken = {};
      snake.forEach(function (s) { taken[s.x + ',' + s.y] = 1; });
      var free = [];
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) if (!taken[x + ',' + y]) free.push({ x: x, y: y });
      }
      return free.length ? U.pick(free) : null;
    }

    function opposite(a, b) {
      return VEC[a][0] + VEC[b][0] === 0 && VEC[a][1] + VEC[b][1] === 0;
    }

    function turn(d) {
      if (over || !VEC[d]) return;
      var last = queue.length ? queue[queue.length - 1] : dir;
      if (d === last || opposite(d, last)) {
        if (!started && !queue.length) started = true;
        return;
      }
      if (queue.length >= 2) return;
      queue.push(d);
      started = true;
    }

    function die(why) {
      if (over) return;
      over = true;
      ctx.sfx('lose');
      ctx.vibrate(60);
      ctx.mood('sad');
      ctx.after(550, function () {
        ctx.finish({
          win: false,
          score: eaten * 10,
          scoreText: eaten * 10 + ' pts',
          title: why,
          msg: eaten + (eaten === 1 ? ' bit comido' : ' bits comidos') + ' · largo ' + snake.length
        });
      });
    }

    function step() {
      if (queue.length) dir = queue.shift();
      var v = VEC[dir];
      var head = snake[0];
      var nx = head.x + v[0];
      var ny = head.y + v[1];
      if (mode.walls) {
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return die('chocaste con la pared');
      } else {
        nx = (nx + N) % N;
        ny = (ny + N) % N;
      }
      var grow = food && nx === food.x && ny === food.y;
      var body = grow ? snake : snake.slice(0, snake.length - 1);
      for (var i = 0; i < body.length; i++) {
        if (body[i].x === nx && body[i].y === ny) return die('te mordiste la cola');
      }
      snake.unshift({ x: nx, y: ny });
      if (grow) {
        eaten++;
        ctx.sfx('good');
        ctx.vibrate(12);
        tickMs = Math.max(mode.min, mode.start - eaten * 2.5);
        ctx.status('bits: ' + eaten);
        ctx.score(eaten * 10 + ' pts');
        food = placeFood();
        if (!food) {
          over = true;
          ctx.finish({ win: true, score: eaten * 10, scoreText: eaten * 10 + ' pts', title: '¡llenaste el tablero!', msg: 'eso ya es ser un dios del snake' });
        }
      } else {
        snake.pop();
        ctx.sfx('tick');
      }
    }

    ctx.onKey(function (e) {
      var d = KEYMAP[e.key];
      if (d) turn(d);
    });
    ctx.swipe(cv.canvas, turn, 18);

    function cellRect(x, y, pad) {
      g.fillRect(x * CELL + pad, y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
    }

    function draw() {
      g.fillStyle = '#0d0d11';
      g.fillRect(0, 0, SIZE, SIZE);
      g.fillStyle = '#1a1a21';
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) g.fillRect(x * CELL + 9, y * CELL + 9, 2, 2);
      }
      if (!mode.walls) {
        g.strokeStyle = '#3a1414';
        g.setLineDash([4, 4]);
        g.strokeRect(1, 1, SIZE - 2, SIZE - 2);
        g.setLineDash([]);
      }
      if (food) {
        var p = 1 + Math.sin(pulse * 6) * 1;
        g.fillStyle = '#ff2c2c';
        cellRect(food.x, food.y, 4 - p * 0.5);
        g.fillStyle = '#ff7a7a';
        g.fillRect(food.x * CELL + 7, food.y * CELL + 7, 3, 3);
      }
      for (var i = snake.length - 1; i >= 0; i--) {
        var s = snake[i];
        if (i === 0) g.fillStyle = over ? '#ff2c2c' : '#ececf0';
        else g.fillStyle = i % 2 ? '#b8b8c0' : '#9c9ca6';
        cellRect(s.x, s.y, 1);
      }
      var hd = snake[0];
      g.fillStyle = '#0a0a0c';
      var v = VEC[dir];
      var ex = hd.x * CELL + 10 + v[0] * 3;
      var ey = hd.y * CELL + 10 + v[1] * 3;
      var px = -v[1] * 4, py = v[0] * 4;
      g.fillRect(ex + px - 1.5, ey + py - 1.5, 3, 3);
      g.fillRect(ex - px - 1.5, ey - py - 1.5, 3, 3);
      if (!started && !over) {
        g.fillStyle = 'rgba(10,10,12,0.72)';
        g.fillRect(0, SIZE / 2 - 28, SIZE, 56);
        g.fillStyle = '#ececf0';
        g.font = '14px monospace';
        g.textAlign = 'center';
        g.fillText('desliza o pulsa una flecha', SIZE / 2, SIZE / 2 + 5);
      }
    }

    ctx.loop(function (dt) {
      pulse += dt;
      if (started && !over) {
        acc += dt * 1000;
        while (acc >= tickMs && !over) {
          acc -= tickMs;
          step();
        }
      }
      draw();
    });
  }

  C.register({
    id: 'snake',
    name: 'Snake',
    desc: 'Come bits, crece y no te muerdas la cola.',
    tag: 'arcade',
    color: '#7bd957',
    unit: 'pts',
    icon: ['........', '.######.', '.#....#.', '.#.##.#.', '.#.#..#.', '.#.####.', '.#......', '.####...'],
    how: 'Mueve la serpiente con flechas, WASD, deslizando el dedo o la cruceta.\nCome los bits rojos: cada uno suma 10 y te hace más rápido.\nNo choques con paredes (según el modo) ni con tu cola.',
    start: function (ctx) {
      ctx.choose(
        {
          title: 'elige modo',
          options: [
            { id: 'clasico', label: 'clásico', desc: 'las paredes matan' },
            { id: 'libre', label: 'sin paredes', desc: 'sales por un lado y entras por el otro' },
            { id: 'rapido', label: 'rápido', desc: 'paredes mortales y arranca veloz' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
