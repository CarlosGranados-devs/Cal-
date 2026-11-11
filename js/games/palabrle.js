(function () {
  'use strict';
  var C = window.Calo;
  var h = C.h;
  var U = C.util;

  var WORDS = ('abeja abrir actor adios aguja ahora aldea algas altar amigo ancho antes anual apoyo arena arbol aroma arroz asado atomo audio avion ayuda ' +
    'banco barco barro baile bajar besar blusa bomba bravo brazo brisa broma bruja bueno burro cabra cajon calle calor campo canal canto carne carta casco causa cerca cerdo cerro chico cielo cifra cinco circo clase clave cobre coche color comer corte corto crema cruce cubos curva ' +
    'dados danza datos deber debil dedos dejar dieta disco dolor dosis ducha dulce echar enero entre epoca error exito extra fecha feliz feria fibra fiera firma final flaco flora fondo forma fresa frase freno frito fruta fuego fuera furia ' +
    'gafas ganar gasto gatos genio gente globo golpe grado grano grave grito grupo guapo guion gusto hacer harto hasta hecho hielo hijos hogar hojas hondo horas hotel huevo humor ideal igual islas jaula joven jugar julio junio junto justo ' +
    'labio lagos lanza largo leche lejos lento letra libre lider limon linea lista llama llave lobos local logro lucha luego luces lunar lunes madre magia manga manos mapas marca marco mares medio mejor menos mente mesas metal meter miedo mismo mitad monte morir mosca motor mover mucho mudar mujer mundo museo ' +
    'nacer nadar nariz nieve nivel noche norte notas novio nubes nueve nunca obras ondas opera orden otros oveja pagar palma panes papel parar parte pasar paseo pasta patio pausa pecho pedir pelea perla perro pesar piano picar pilas pinos pista pizza plana plano plata playa plaza pluma pobre poder poema polvo poner potro prado presa primo prisa ' +
    'queso quien radio rampa rango rasgo ratas rayas razon reina reloj renta resto rezar ritmo robar rocas rojos rosal rosas rueda ruido rumbo sabor sacar salir salsa salto salud santo sapos secar sello senda sexto sigla signo silla sirve sitio sobre socio sofas solar sonar sopas sorbo suave subir sucio suelo sumar surco ' +
    'tabla tacos talla tanto tarde tarea tazas techo tecla temas temor tener tenis tigre tinta tipos tirar tocar todos tomar torre total trago traje trama trato trece trigo tripa tropa trozo truco tumba turno unico union usted vacas vagon valer valle vamos vapor vasos veces vejez venir venta verde verso viaje video vidas vigor vinos virus visor vista vital vivir vivos vocal volar votos vuelo yates zonas').split(/\s+/);

  var ROWS = 6;
  var COLS = 5;
  var KEYROWS = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'];
  var RANK = { a: 0, p: 1, e: 2 };
  var LABEL = { a: 'ausente', p: 'presente', e: 'exacta' };

  // Evalúa un intento: 'e' exacta, 'p' presente, 'a' ausente. Maneja letras repetidas.
  function evaluate(guess, answer) {
    var res = [];
    var left = {};
    var i;
    for (i = 0; i < COLS; i++) {
      if (guess[i] === answer[i]) {
        res[i] = 'e';
      } else {
        res[i] = 'a';
        left[answer[i]] = (left[answer[i]] || 0) + 1;
      }
    }
    for (i = 0; i < COLS; i++) {
      if (res[i] === 'a' && left[guess[i]] > 0) {
        res[i] = 'p';
        left[guess[i]]--;
      }
    }
    return res;
  }

  function injectCss() {
    if (document.getElementById('calo-style-palabrle')) return;
    var s = document.createElement('style');
    s.id = 'calo-style-palabrle';
    s.textContent =
      '.pl-wrap{--ts:min(54px,calc((100vw - 56px) / 5 - 5px),calc((100vh - 360px) / 6));gap:8px}' +
      '.pl-grid{display:grid;grid-template-rows:repeat(6,var(--ts));gap:5px}' +
      '.pl-row{display:grid;grid-template-columns:repeat(5,var(--ts));gap:5px}' +
      '.pl-t{position:relative;display:grid;place-items:center;border:2px solid var(--line);border-radius:6px;background:var(--panel);font-family:var(--pix);font-size:calc(var(--ts) * .38);color:var(--fg);text-transform:uppercase}' +
      '.pl-t.on{border-color:var(--dim);animation:pop .12s}' +
      '.pl-t.flip{animation:pl-flip .5s}' +
      '.pl-t[data-s]{color:#fff;border-color:transparent}' +
      '.pl-t[data-s=e]{background:var(--red)}' +
      '.pl-t[data-s=p]{background:var(--c2);color:#0a0a0c}' +
      '.pl-t[data-s=a]{background:#3a3a44}' +
      '.pl-t[data-s]::after,.pl-k[data-s]::after{content:"";position:absolute;top:3px;right:3px;width:7px;height:7px}' +
      '.pl-t[data-s=e]::after,.pl-k[data-s=e]::after{background:#fff}' +
      '.pl-t[data-s=p]::after,.pl-k[data-s=p]::after{border:2px solid #0a0a0c;border-radius:50%;box-sizing:border-box}' +
      '.pl-t[data-s=a]::after,.pl-k[data-s=a]::after{top:6px;height:2px;background:#9a9aa4}' +
      '.pl-k[data-s]::after{top:2px;right:2px;width:6px;height:6px}' +
      '.pl-k[data-s=a]::after{top:4px;height:2px}' +
      '.pl-kb{display:flex;flex-direction:column;gap:5px;width:100%;max-width:460px}' +
      '.pl-kr{display:flex;gap:4px;justify-content:center}' +
      '.pl-k{position:relative;flex:1 1 0;min-width:0;padding:0;height:44px;text-transform:uppercase}' +
      '.pl-k.wide{flex:1.55 1 0;font-size:11px}' +
      '.pl-k[data-s]{border-color:transparent;color:#fff}' +
      '.pl-k[data-s=e]{background:var(--red)}' +
      '.pl-k[data-s=p]{background:var(--c2);color:#0a0a0c}' +
      '.pl-k[data-s=a]{background:#2a2a32;color:var(--dim)}' +
      '@keyframes pl-flip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}';
    document.head.appendChild(s);
  }

  function play(ctx) {
    injectCss();
    var answer = U.pick(WORDS);
    var row = 0;
    var col = 0;
    var letters = [];
    var tiles = [];
    var keyState = {};
    var keyEls = {};
    var busy = false;

    var grid = h('div', { class: 'pl-grid', role: 'grid', 'aria-label': 'cuadrícula de intentos' });
    var r, c;
    for (r = 0; r < ROWS; r++) {
      var rowEl = h('div', { class: 'pl-row', role: 'row' });
      tiles[r] = [];
      for (c = 0; c < COLS; c++) {
        var t = h('div', { class: 'pl-t', role: 'gridcell', 'aria-label': 'vacía' });
        tiles[r][c] = t;
        rowEl.appendChild(t);
      }
      grid.appendChild(rowEl);
    }
    var msg = h('p', { class: 'g-msg', text: 'escribe una palabra de 5 letras' });
    var kb = h('div', { class: 'pl-kb' });
    KEYROWS.forEach(function (rowStr) {
      var kr = h('div', { class: 'pl-kr' });
      rowStr.split('').forEach(function (ch) {
        var k;
        var press = function (e) { e.preventDefault(); };
        if (ch === '+') {
          k = h('button', { class: 'g-key pl-k wide', text: 'enter', tabindex: '-1', 'aria-label': 'enviar', onmousedown: press, onclick: submit });
        } else if (ch === '-') {
          k = h('button', { class: 'g-key pl-k wide', text: 'borrar', tabindex: '-1', 'aria-label': 'borrar', onmousedown: press, onclick: del });
        } else {
          k = h('button', { class: 'g-key pl-k', text: ch, tabindex: '-1', 'aria-label': 'letra ' + ch, onmousedown: press, onclick: function () { typeLetter(ch); } });
          keyEls[ch] = k;
        }
        kr.appendChild(k);
      });
      kb.appendChild(kr);
    });
    ctx.root.appendChild(h('div', { class: 'g-wrap pl-wrap' }, grid, msg, kb));

    function refresh() {
      ctx.status('intento ' + Math.min(row + 1, ROWS) + '/' + ROWS);
      ctx.score('exacta ■ · presente ●');
    }

    function typeLetter(l) {
      if (busy || ctx.isDone() || col >= COLS) return;
      letters[col] = l;
      var t = tiles[row][col];
      t.textContent = l;
      t.classList.remove('on');
      void t.offsetWidth;
      t.classList.add('on');
      t.setAttribute('aria-label', l);
      col++;
      ctx.sfx('tick');
    }

    function del() {
      if (busy || ctx.isDone() || col <= 0) return;
      col--;
      var t = tiles[row][col];
      t.textContent = '';
      t.classList.remove('on');
      t.setAttribute('aria-label', 'vacía');
      letters[col] = '';
    }

    function shakeRow(text) {
      msg.textContent = text;
      ctx.sfx('bad');
      var el = grid.children[row];
      el.classList.remove('g-shake');
      void el.offsetWidth;
      el.classList.add('g-shake');
    }

    function paintKeys() {
      for (var l in keyState) {
        var el = keyEls[l];
        if (el) {
          el.setAttribute('data-s', keyState[l]);
          el.setAttribute('aria-label', 'letra ' + l + ', ' + LABEL[keyState[l]]);
        }
      }
    }

    function submit() {
      if (busy || ctx.isDone()) return;
      if (col < COLS) {
        shakeRow('faltan letras, necesito 5');
        return;
      }
      var guess = letters.slice(0, COLS).join('');
      var res = evaluate(guess, answer);
      var myRow = row;
      busy = true;
      msg.textContent = '...';
      var i;
      for (i = 0; i < COLS; i++) {
        (function (i) {
          ctx.after(i * 260, function () {
            tiles[myRow][i].classList.add('flip');
            ctx.sfx('tick');
          });
          ctx.after(i * 260 + 240, function () {
            var t = tiles[myRow][i];
            t.setAttribute('data-s', res[i]);
            t.setAttribute('aria-label', guess[i] + ', ' + LABEL[res[i]]);
            var cur = keyState[guess[i]];
            if (cur == null || RANK[res[i]] > RANK[cur]) keyState[guess[i]] = res[i];
          });
        })(i);
      }
      ctx.after(COLS * 260 + 80, function () {
        paintKeys();
        var won = guess === answer;
        row++;
        col = 0;
        letters = [];
        if (won) {
          var left = ROWS - row;
          var score = left * 20 + 20;
          msg.textContent = '¡esa era!';
          ctx.mood('happy');
          ctx.sfx('good');
          ctx.after(450, function () {
            ctx.finish({
              win: true,
              score: score,
              scoreText: score + ' pts',
              title: '¡palabra descifrada!',
              msg: answer.toUpperCase() + ' en ' + row + (row === 1 ? ' intento' : ' intentos')
            });
          });
          return;
        }
        if (row >= ROWS) {
          msg.textContent = 'era ' + answer.toUpperCase();
          ctx.mood('sad');
          ctx.after(700, function () {
            ctx.finish({ win: false, title: 'sin intentos', msg: 'la palabra era ' + answer.toUpperCase() });
          });
          return;
        }
        var exact = res.filter(function (x) { return x === 'e'; }).length;
        msg.textContent = exact >= 3 ? 'casi casi, ' + exact + ' en su sitio' : 'sigue, tú puedes';
        refresh();
        busy = false;
      });
    }

    ctx.onKey(function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        del();
      } else if (e.key && /^[a-zA-Z]$/.test(e.key)) {
        typeLetter(e.key.toLowerCase());
      }
    });
    refresh();
  }

  C.register({
    id: 'palabrle',
    name: 'Palabrle',
    desc: 'Descubre la palabra de 5 letras en 6 intentos.',
    tag: 'palabras',
    color: '#ffb020',
    unit: 'pts',
    icon: ['########', '#.#.#.##', '########', '#.##.#.#', '########', '#..#.###', '########', '........'],
    how: 'Adivina la palabra secreta de 5 letras en 6 intentos.\nRojo con cuadrito: letra en su sitio. Ámbar con círculo: está, pero en otro lugar. Gris: no hay.\nMás intentos sobrantes = más puntos.',
    start: function (ctx) { play(ctx); },
    _words: WORDS,
    _eval: evaluate
  });
})();
