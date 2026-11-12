(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var WORDS = {
    f: {
      tech: ['byte', 'wifi', 'chip', 'nube', 'pixel', 'mouse', 'login', 'email', 'bugs', 'linux', 'ruta', 'array', 'video', 'audio', 'icono', 'menu', 'tecla', 'robot', 'datos', 'redes', 'clave', 'juego', 'web', 'app', 'cable', 'texto', 'nodo', 'clic', 'bit', 'dato'],
      daily: ['casa', 'perro', 'gato', 'mesa', 'silla', 'pan', 'agua', 'cafe', 'libro', 'lapiz', 'sol', 'luna', 'playa', 'cielo', 'fuego', 'tierra', 'verde', 'rojo', 'ropa', 'zapato', 'mano', 'cama', 'plato', 'vaso', 'reloj', 'puerta', 'flor', 'arbol', 'mundo', 'queso']
    },
    m: {
      tech: ['teclado', 'pantalla', 'memoria', 'archivo', 'carpeta', 'internet', 'servidor', 'variable', 'funcion', 'consola', 'usuario', 'router', 'backup', 'sistema', 'programa', 'software', 'hardware', 'lenguaje', 'binario', 'compilar', 'depurar', 'cursor', 'ventana', 'descarga', 'mensaje', 'buscador', 'bateria', 'puerto', 'codigo', 'dominio'],
      daily: ['cocina', 'escuela', 'camino', 'bicicleta', 'cuaderno', 'mochila', 'comida', 'familia', 'amigos', 'ciudad', 'semana', 'hermano', 'caminar', 'musica', 'cancion', 'pelicula', 'almuerzo', 'desayuno', 'tormenta', 'paraguas', 'zapatos', 'cartera', 'espejo', 'cortina', 'almohada', 'telefono', 'jardin', 'cerveza', 'verano', 'invierno']
    },
    d: {
      tech: ['navegador', 'algoritmo', 'repositorio', 'programacion', 'inteligencia', 'ciberseguridad', 'desarrollador', 'microprocesador', 'almacenamiento', 'framework', 'componente', 'javascript', 'typescript', 'compilador', 'encriptacion', 'aplicacion', 'conectividad', 'arquitectura', 'automatizacion', 'procesador', 'resolucion', 'contenedor', 'depuracion', 'protocolo', 'virtualizacion'],
      daily: ['electrodomestico', 'supermercado', 'refrigerador', 'biblioteca', 'estacionamiento', 'universidad', 'computadora', 'construccion', 'entretenimiento', 'extraordinario', 'herramienta', 'temperatura', 'calculadora', 'ferreteria', 'panaderia', 'aeropuerto', 'rascacielos', 'murcielago', 'helicoptero', 'chocolate', 'ventilador', 'mariposa', 'estrellas', 'cocodrilo', 'restaurante']
    }
  };

  var MODES = {
    f: { key: 'f', max: 8, hint: false },
    m: { key: 'm', max: 6, hint: false },
    d: { key: 'd', max: 6, hint: true }
  };

  // Nitro pixel hedgehog. Digits = part id (1 vanishes first, 6 last).
  // e = eye, p = pupil, m = muzzle, s = shoe.
  var HEDGEHOG = [
    '...6....6...',
    '..666..666..',
    '..66666666..',
    '.6666666666.',
    '.66ee66ee66.',
    '.66ep66ep66.',
    '.66mmmmmm66.',
    '.66mmmmmm66.',
    '.6666666666.',
    '.5555555555.',
    '.5555555555.',
    '.4444444444.',
    '.22.22.22.2.',
    '.ss.ss.ss.s.'
  ];

  var KEYROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  function injectCss() {
    if (document.getElementById('nitro-style-ahorcado')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-ahorcado';
    s.textContent =
      '.ah-ghost{width:112px;height:130px;flex:none}' +
      '.ah-ghost svg{width:100%;height:100%;display:block;shape-rendering:crispEdges;animation:ah-float 2.4s ease-in-out infinite}' +
      '.ah-ghost rect{transition:opacity .45s,transform .45s;fill:#2f9bff}' +
      '.ah-ghost rect.ah-eye{fill:#f7fbff}' +
      '.ah-ghost rect.ah-pupil{fill:#071426}' +
      '.ah-ghost rect.ah-muzzle{fill:#f7c98b}' +
      '.ah-ghost rect.ah-shoe{fill:#e8323c}' +
      '.ah-ghost.ah-hurt svg{animation:ah-hurt .35s}' +
      '.ah-ghost.ah-win rect{fill:var(--gold)}' +
      '.ah-word{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-width:100%}' +
      '.ah-l{display:grid;place-items:center;border-bottom:3px solid var(--line);font-family:var(--pix);color:var(--fg);height:34px}' +
      '.ah-l.on{border-color:var(--red);animation:pop .22s}' +
      '.ah-l.miss{color:var(--red);border-color:var(--red-dim)}' +
      '.ah-kb{display:flex;flex-direction:column;gap:5px;width:100%;max-width:440px}' +
      '.ah-kr{display:flex;gap:4px;justify-content:center}' +
      '.ah-kr .g-key{padding:0;min-width:0}' +
      '.ah-kr .g-key.hit{background:var(--red-dim);border-color:var(--red)}' +
      '.ah-kr .g-key.miss{opacity:.3}' +
      '@keyframes ah-float{50%{transform:translateY(-5px)}}' +
      '@keyframes ah-hurt{25%{transform:translateX(-6px) rotate(-4deg)}75%{transform:translateX(6px) rotate(4deg)}}' +
      '@media (max-height:700px){.ah-ghost{width:84px;height:98px}}';
    document.head.appendChild(s);
  }

  function ghostSvg() {
    var r = '';
    var meta = {
      e: { p: 6, cls: 'ah-eye' },
      p: { p: 6, cls: 'ah-pupil' },
      m: { p: 5, cls: 'ah-muzzle' },
      s: { p: 1, cls: 'ah-shoe' }
    };
    for (var y = 0; y < HEDGEHOG.length; y++) {
      for (var x = 0; x < HEDGEHOG[y].length; x++) {
        var ch = HEDGEHOG[y][x];
        if (ch === '.') continue;
        var info = meta[ch] || { p: +ch, cls: '' };
        r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" data-p="' + info.p + '"' + (info.cls ? ' class="' + info.cls + '"' : '') + '/>';
      }
    }
    return '<svg viewBox="0 0 12 14" aria-hidden="true">' + r + '</svg>';
  }

  function play(ctx, mode) {
    injectCss();
    var pools = WORDS[mode.key];
    var cat = U.pick(['tech', 'daily']);
    var word = U.pick(pools[cat]).toLowerCase();
    var errors = 0;
    var used = {};
    var ended = false;
    var hintUsed = false;

    var ghost = h('div', { class: 'ah-ghost', html: ghostSvg() });
    var cells = [];
    var wordEl = h('div', { class: 'ah-word', 'aria-label': 'palabra secreta' });
    var avail = '(100vw - 48px - ' + (4 * (word.length - 1)) + 'px) / ' + word.length;
    var cw = 'min(28px, calc(' + avail + '))';
    for (var i = 0; i < word.length; i++) {
      var c = h('div', { class: 'ah-l', text: '', style: { width: cw, fontSize: 'min(20px, calc((' + avail + ') * 0.8))' } });
      cells.push(c);
      wordEl.appendChild(c);
    }
    var msg = h('p', { class: 'g-msg', text: cat === 'tech' ? 'pista: tema tech' : 'pista: cosa cotidiana' });
    var keys = {};
    var kb = h('div', { class: 'ah-kb' });
    KEYROWS.forEach(function (row) {
      var r = h('div', { class: 'ah-kr' });
      row.split('').forEach(function (l) {
        var k = h('button', { class: 'g-key', text: l, 'aria-label': 'letra ' + l, onclick: function () { guess(l); } });
        keys[l] = k;
        r.appendChild(k);
      });
      kb.appendChild(r);
    });
    var hintBtn = null;
    if (mode.hint) {
      hintBtn = h('button', { class: 'g-btn ghost', text: 'pista (cuesta 1 vida)', onclick: useHint });
    }
    ctx.root.appendChild(h('div', { class: 'g-wrap' }, ghost, wordEl, msg, kb, hintBtn));

    function lives() { return mode.max - errors; }
    function refresh() {
      ctx.status('vidas: ' + lives() + '/' + mode.max);
      ctx.score(cat === 'tech' ? 'tech' : 'cotidiano');
      var gone = errors === 0 ? 0 : Math.ceil(errors * 6 / mode.max);
      var rects = ghost.querySelectorAll('rect');
      for (var i = 0; i < rects.length; i++) {
        var p = +rects[i].getAttribute('data-p');
        var vis = p > gone;
        rects[i].style.opacity = vis ? '1' : '0';
        rects[i].style.transform = vis ? 'none' : 'translateY(2px)';
      }
    }
    function allRevealed() {
      for (var i = 0; i < word.length; i++) if (!used[word[i]]) return false;
      return true;
    }
    function reveal(l) {
      for (var i = 0; i < word.length; i++) {
        if (word[i] === l) {
          cells[i].textContent = l.toUpperCase();
          cells[i].classList.add('on');
        }
      }
    }
    function markKey(l, hit) {
      keys[l].disabled = true;
      keys[l].classList.add(hit ? 'hit' : 'miss');
    }
    function endGame(win) {
      ended = true;
      var k;
      for (k in keys) keys[k].disabled = true;
      if (hintBtn) hintBtn.disabled = true;
      var score = (lives() + 1) * word.length;
      if (win) {
        ghost.classList.add('ah-win');
        ctx.sfx('good');
        ctx.mood('happy');
        msg.textContent = '¡salvado!';
      } else {
        for (var i = 0; i < word.length; i++) {
          if (!used[word[i]]) {
            cells[i].textContent = word[i].toUpperCase();
            cells[i].classList.add('miss');
          }
        }
        ctx.mood('sad');
        msg.textContent = 'nitro se desvaneció...';
      }
      ctx.after(1100, function () {
        if (win) {
          ctx.finish({ win: true, score: score, scoreText: score + ' pts', title: '¡salvaste a nitro!', msg: 'palabra: ' + word.toUpperCase() + ' · errores: ' + errors });
        } else {
          ctx.finish({ win: false, title: 'nitro se desvaneció', msg: 'la palabra era ' + word.toUpperCase() });
        }
      });
    }
    function guess(raw) {
      if (ended || ctx.isDone()) return;
      var l = String(raw).toLowerCase();
      if (!/^[a-z]$/.test(l) || used[l]) return;
      used[l] = true;
      if (word.indexOf(l) >= 0) {
        markKey(l, true);
        reveal(l);
        ctx.sfx('pop');
        ctx.vibrate(8);
        msg.textContent = 'bien, hay ' + l.toUpperCase();
        if (allRevealed()) endGame(true);
      } else {
        markKey(l, false);
        errors++;
        ctx.sfx('bad');
        ctx.vibrate(30);
        msg.textContent = 'no hay ' + l.toUpperCase();
        ghost.classList.remove('ah-hurt');
        void ghost.offsetWidth;
        ghost.classList.add('ah-hurt');
        refresh();
        if (errors >= mode.max) endGame(false);
      }
    }
    function useHint() {
      if (ended || hintUsed) return;
      if (lives() <= 1) {
        msg.textContent = 'no te queda vida para pagar la pista';
        ctx.sfx('bad');
        return;
      }
      var pending = [];
      for (var i = 0; i < word.length; i++) if (!used[word[i]] && pending.indexOf(word[i]) < 0) pending.push(word[i]);
      if (!pending.length) return;
      hintUsed = true;
      hintBtn.disabled = true;
      var l = U.pick(pending);
      used[l] = true;
      errors++;
      markKey(l, true);
      reveal(l);
      ctx.sfx('tick');
      ctx.vibrate(15);
      msg.textContent = 'pista: ' + l.toUpperCase() + ' (-1 vida)';
      refresh();
      if (allRevealed()) endGame(true);
    }

    ctx.onKey(function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key && e.key.length === 1) guess(e.key);
    });
    refresh();
  }

  C.register({
    id: 'ahorcado',
    name: 'Ahorcado',
    desc: 'Salva a Nitro antes de que se desvanezca por completo.',
    tag: 'palabras',
    color: '#ff5a5f',
    unit: 'pts',
    icon: ['..####..', '.######.', '##.##.##', '########', '########', '########', '##.##.##', '#..#..#.'],
    how: 'Adivina la palabra letra por letra.\nCada error borra un pedacito de Nitro.\nTeclado en pantalla o el de tu compu. Menos errores = más puntos.',
    start: function (ctx) {
      ctx.choose(
        {
          title: '¿qué tan difícil?',
          options: [
            { id: 'f', label: 'fácil', desc: 'palabras cortas · 8 errores' },
            { id: 'm', label: 'normal', desc: 'palabras medias · 6 errores' },
            { id: 'd', label: 'experto', desc: 'palabras largas · 6 errores · 1 pista (-1 vida)' }
          ]
        },
        function (id) { play(ctx, MODES[id]); }
      );
    }
  });
})();
