(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var TOTAL = 45;
  var BUG = ['..#....#..', '...#..#...', '....##....', '..######..', '.##.##.##.', '#########.', '.########.', '#########.', '..######..', '.#..##..#.', '#...##...#'];
  var GHOST = ['..#####..', '.#######.', '#########', '##..#..##', '#########', '#########', '#########', '#########', '##.###.##', '#..###..#'];
  var MODES = {
    n: { spawn0: 950, spawn1: 420, life0: 1500, life1: 760, decoy: 0.18, multi: 1, label: 'normal', goal: 150 },
    f: { spawn0: 650, spawn1: 260, life0: 1100, life1: 520, decoy: 0.28, multi: 2, label: 'frenético', goal: 220 }
  };

  function injectStyle() {
    if (document.getElementById('calo-style-bugs')) return;
    var s = document.createElement('style');
    s.id = 'calo-style-bugs';
    s.textContent =
      '.bg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(100%,420px);}' +
      '.bg-hole{position:relative;aspect-ratio:1;border:0;padding:0;background:transparent;cursor:pointer;overflow:hidden;border-radius:14px;color:var(--fg);}' +
      '.bg-hole:before{content:"";position:absolute;left:8%;right:8%;bottom:8%;height:34%;background:#050507;border:2px solid var(--line);border-radius:50%;}' +
      '.bg-k{position:absolute;left:8px;top:4px;font-size:11px;color:var(--dim);z-index:3;}' +
      '.bg-item{position:absolute;left:14%;right:14%;top:8%;bottom:20%;display:grid;place-items:center;transform:translateY(110%);transition:transform .09s ease-out;z-index:2;pointer-events:none;}' +
      '.bg-hole.up .bg-item{transform:translateY(0);}' +
      '.bg-hole.hit .bg-item{transform:translateY(0) scale(1.25);opacity:0;transition:transform .2s,opacity .2s;}' +
      '.bg-item svg{width:100%;height:100%;display:block;}' +
      '.bg-hole.bug{color:var(--red);}' +
      '.bg-hole.ghost{color:var(--c4);}' +
      '.bg-hole.up:active{filter:brightness(1.4);}' +
      '.bg-hole.bad{animation:shake .28s;background:rgba(255,44,44,.18);}' +
      '.bg-pop{position:absolute;left:50%;top:34%;transform:translateX(-50%);font-family:var(--pix);font-size:14px;z-index:4;pointer-events:none;animation:bgpop .6s forwards;}' +
      '@keyframes bgpop{to{transform:translate(-50%,-28px);opacity:0;}}';
    document.head.appendChild(s);
  }

  function play(ctx, mode) {
    injectStyle();
    var holes = [];
    var t = 0;
    var points = 0;
    var combo = 0;
    var best = 0;
    var killed = 0;
    var nextSpawn = 0.6;
    var msg = h('p', { class: 'g-msg', text: 'toca los bugs rojos, no a calo (el fantasma cian)' });
    var grid = h('div', { class: 'bg-grid' });

    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var hl = { el: null, kind: null, until: 0, life: 0 };
        hl.el = h('button', { class: 'bg-hole', 'aria-label': 'agujero ' + (idx + 1) },
          h('span', { class: 'bg-k', text: String(idx + 1) }),
          h('span', { class: 'bg-item', html: C.pixicon(BUG, 'bg-svg-bug') }));
        hl.el.addEventListener('pointerdown', function (e) { e.preventDefault(); whack(idx); });
        holes.push(hl);
        grid.appendChild(hl.el);
      })(i);
    }
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, msg, grid));

    function progress() { return U.clamp(t / TOTAL, 0, 1); }
    function lerp(a, b) { return a + (b - a) * progress(); }
    function mult() { return Math.min(5, 1 + Math.floor(combo / 4)); }

    function hud() {
      ctx.status('tiempo: ' + Math.max(0, Math.ceil(TOTAL - t)) + ' s');
      ctx.score(points + ' pts' + (mult() > 1 ? ' x' + mult() : ''));
    }

    function popText(hl, txt, color) {
      var p = h('span', { class: 'bg-pop', text: txt, style: { color: color } });
      hl.el.appendChild(p);
      ctx.after(620, function () { if (p.parentNode) p.parentNode.removeChild(p); });
    }

    function hide(hl) {
      hl.kind = null;
      hl.el.classList.remove('up', 'bug', 'ghost');
      hl.el.setAttribute('aria-label', 'agujero vacío');
    }

    function show(idx, kind) {
      var hl = holes[idx];
      var item = hl.el.querySelector('.bg-item');
      item.innerHTML = C.pixicon(kind === 'bug' ? BUG : GHOST);
      hl.kind = kind;
      hl.life = lerp(mode.life0, mode.life1) / 1000;
      hl.until = t + hl.life;
      hl.el.classList.remove('hit', 'bad');
      hl.el.classList.add(kind);
      void hl.el.offsetWidth;
      hl.el.classList.add('up');
      hl.el.setAttribute('aria-label', kind === 'bug' ? 'bug, tócalo' : 'calo, no lo toques');
    }

    function whack(idx) {
      if (ctx.isDone()) return;
      var hl = holes[idx];
      if (!hl.kind) {
        combo = 0;
        ctx.sfx('tick');
        hud();
        return;
      }
      var kind = hl.kind;
      hl.kind = null;
      hl.el.classList.remove('up');
      if (kind === 'bug') {
        var gain = 10 * mult();
        combo++;
        killed++;
        best = Math.max(best, combo);
        points += gain;
        hl.el.classList.add('hit');
        ctx.after(220, function () { hl.el.classList.remove('hit', 'bug', 'ghost'); });
        popText(hl, '+' + gain, 'var(--c3)');
        ctx.sfx('pop');
        ctx.vibrate(10);
      } else {
        combo = 0;
        points = Math.max(0, points - 20);
        hl.el.classList.remove('bug', 'ghost');
        hl.el.classList.add('bad');
        ctx.after(300, function () { hl.el.classList.remove('bad'); });
        popText(hl, '-20', 'var(--red)');
        ctx.sfx('bad');
        ctx.vibrate(60);
        msg.textContent = 'ese era calo. no lo toques';
      }
      hud();
    }

    function spawn() {
      var free = [];
      holes.forEach(function (hl, i) { if (!hl.kind && !hl.el.classList.contains('hit')) free.push(i); });
      if (!free.length) return;
      var n = mode.multi > 1 && progress() > 0.35 && Math.random() < 0.4 ? 2 : 1;
      free = U.shuffle(free);
      for (var k = 0; k < n && k < free.length; k++) {
        show(free[k], Math.random() < mode.decoy * (0.6 + progress()) ? 'ghost' : 'bug');
      }
    }

    function end() {
      if (ctx.isDone()) return;
      t = TOTAL;
      hud();
      var win = points >= mode.goal;
      ctx.sfx(win ? 'win' : 'lose');
      ctx.mood(win ? 'happy' : 'sad');
      ctx.finish({
        win: win,
        score: points,
        scoreText: points + ' pts',
        better: 'high',
        title: win ? '¡código limpio!' : 'quedan bugs en producción',
        msg: killed + ' bugs aplastados · mejor combo ' + best + ' · modo ' + mode.label
      });
    }

    ctx.onKey(function (e) {
      if (e.key >= '1' && e.key <= '9') whack(parseInt(e.key, 10) - 1);
    });

    hud();
    ctx.loop(function (dt) {
      if (ctx.isDone()) return;
      t += dt;
      if (t >= TOTAL) { end(); return; }
      holes.forEach(function (hl) {
        if (hl.kind && t >= hl.until) {
          if (hl.kind === 'bug') {
            combo = 0;
            ctx.sfx('tick');
          }
          hide(hl);
        }
      });
      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawn();
        nextSpawn = lerp(mode.spawn0, mode.spawn1) / 1000;
      }
      hud();
    });
  }

  C.register({
    id: 'bugs',
    name: 'Caza bugs',
    desc: 'Aplasta los bugs antes de que se escondan. 45 segundos.',
    tag: 'reflejos',
    color: '#ff2c2c',
    unit: 'pts',
    icon: ['..#..#..', '...##...', '..####..', '.######.', '#.####.#', '..####..', '.#.##.#.', '#..##..#'],
    how: 'Los bugs (rojos) salen de los agujeros: tócalos antes de que se escondan.\nNo toques a calo, el fantasma cian: resta puntos y rompe el combo.\nTeclas 1 a 9 funcionan como los agujeros.',
    start: function (ctx) {
      ctx.choose({
        title: '¿qué ritmo?',
        options: [
          { id: 'n', label: 'normal', desc: 'sube la velocidad poco a poco' },
          { id: 'f', label: 'frenético', desc: 'más bugs, más calo, dobles' }
        ]
      }, function (id) { play(ctx, MODES[id]); });
    }
  });
})();
