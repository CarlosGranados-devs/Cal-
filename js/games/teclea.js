(function () {
  'use strict';
  var C = window.Nitro;
  var h = C.h;
  var U = C.util;

  var WORDS = [
    'git status', 'git add .', 'git commit -m', 'git push origin main', 'git pull', 'git clone', 'git branch', 'git checkout -b',
    'git merge', 'git stash', 'git log --oneline', 'git diff', 'git rebase', 'git reset --hard',
    'docker ps', 'docker build -t app .', 'docker run -d', 'docker compose up', 'docker images', 'docker stop',
    'pip install', 'pip freeze', 'python3 main.py', 'python -m venv env', 'npm install', 'npm run dev', 'npm start', 'npx tsc --init',
    'node index.js', 'yarn add', 'SELECT * FROM users', 'INSERT INTO', 'UPDATE SET', 'DELETE FROM', 'DROP TABLE', 'CREATE TABLE',
    'ORDER BY id', 'GROUP BY', 'LEFT JOIN', 'WHERE id = 1', 'cd ..', 'ls -la', 'mkdir', 'rm -rf', 'cat file.txt', 'chmod +x',
    'sudo apt update', 'grep -r', 'echo hola', 'touch index.html', 'ssh user@host', 'curl -X GET', 'ping localhost', 'kill -9',
    'const x = 1;', 'let i = 0;', 'function main()', 'return null;', 'console.log()', 'import pandas as pd', 'def main():',
    'for i in range', 'while true', 'if else', 'try catch', 'async await', 'export default', 'npm test', 'tsc --watch',
    'ipconfig', 'traceroute', 'nslookup', 'localhost:3000', 'main.py', 'package.json', 'README.md', 'index.html',
    'pull request', 'merge conflict', 'hola mundo'
  ];

  var TOTAL_P = 20;
  var SECS = 30;

  function injectStyle() {
    if (document.getElementById('nitro-style-teclea')) return;
    var s = document.createElement('style');
    s.id = 'nitro-style-teclea';
    s.textContent =
      '.tcl-word{font-family:var(--pix,monospace);font-size:clamp(18px,6vw,28px);line-height:1.5;text-align:center;min-height:2.6em;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 6px;word-break:break-all;width:100%}' +
      '.tcl-ch{color:var(--dim);opacity:.6;white-space:pre}' +
      '.tcl-ok{color:#fff;opacity:1}' +
      '.tcl-next{color:var(--red);opacity:1;border-bottom:3px solid var(--red)}' +
      '.tcl-next.tcl-sp{border-bottom-width:3px}' +
      '.tcl-bar{height:6px;width:100%;background:var(--panel2);border-radius:4px;overflow:hidden}' +
      '.tcl-bar i{display:block;height:100%;width:100%;background:var(--red);transition:width .1s linear}' +
      '.tcl-queue{color:var(--dim);font-size:13px;text-align:center;min-height:20px}' +
      '.tcl-in{text-align:center;letter-spacing:1px;max-width:360px}';
    document.head.appendChild(s);
  }

  function play(ctx, mode) {
    injectStyle();
    var queue = [];
    function nextWord() {
      var w;
      do { w = U.pick(WORDS); } while (queue.length && w === queue[queue.length - 1]);
      return w;
    }
    for (var i = 0; i < 3; i++) queue.push(nextWord());

    var typed = 0;
    var chars = 0;
    var words = 0;
    var errors = 0;
    var started = false;
    var left = SECS;
    var t0 = 0;

    var wordEl = h('div', { class: 'tcl-word' });
    var queueEl = h('div', { class: 'tcl-queue' });
    var barFill = h('i');
    var bar = h('div', { class: 'tcl-bar' }, barFill);
    var input = h('input', {
      class: 'g-input tcl-in',
      type: 'text',
      autocapitalize: 'off',
      autocorrect: 'off',
      autocomplete: 'off',
      spellcheck: 'false',
      inputmode: 'text',
      enterkeyhint: 'done',
      placeholder: 'escribe aqui',
      'aria-label': 'escribe el comando'
    });
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    var hint = h('p', { class: 'g-msg', text: mode.timed ? 'el reloj empieza con tu primera tecla' : '20 comandos, cada error te cuesta' });
    var tapBtn = h('button', { class: 'g-btn', text: 'tocar para escribir', onclick: function () { input.focus(); } });

    ctx.root.appendChild(h('div', { class: 'g-wrap' }, mode.timed ? bar : null, wordEl, queueEl, input, hint, tapBtn));

    function target() { return queue[0]; }

    function ppm() {
      var el = mode.timed ? Math.max(1, SECS - left) : Math.max(1, (performance.now() - t0) / 1000);
      return Math.round((chars / 5) / (el / 60));
    }

    function hud() {
      if (mode.timed) {
        ctx.status(Math.ceil(left) + ' s');
        ctx.score(ppm() + ' ppm');
      } else {
        ctx.status('comando ' + Math.min(words + 1, TOTAL_P) + '/' + TOTAL_P);
        ctx.score('errores: ' + errors);
      }
    }

    function render() {
      var t = target();
      wordEl.textContent = '';
      for (var i = 0; i < t.length; i++) {
        var cls = 'tcl-ch' + (i < typed ? ' tcl-ok' : i === typed ? ' tcl-next' : '');
        wordEl.appendChild(h('span', { class: cls, text: t.charAt(i) }));
      }
      queueEl.textContent = queue.slice(1).join('   ');
    }

    function begin() {
      if (started) return;
      started = true;
      t0 = performance.now();
      hint.textContent = mode.timed ? 'dale, que el tiempo corre' : 'sin prisa, pero sin errores';
      if (mode.timed) {
        ctx.every(100, function () {
          left = Math.max(0, SECS - (performance.now() - t0) / 1000);
          barFill.style.width = (left / SECS * 100) + '%';
          hud();
          if (left <= 0) endTimed();
        });
      }
    }

    function endTimed() {
      if (ctx.isDone()) return;
      chars += typed;
      var p = Math.round((chars / 5) / (SECS / 60));
      ctx.sfx(p > 0 ? 'win' : 'lose');
      ctx.finish({
        win: p > 0,
        score: p,
        scoreText: p + ' ppm',
        better: 'high',
        title: 'se acabo el tiempo',
        msg: words + (words === 1 ? ' comando' : ' comandos') + ' completos · ' + errors + ' errores'
      });
    }

    function endPrecision() {
      var total = chars + errors;
      var acc = total ? Math.round(chars / total * 100) : 100;
      var secs = (performance.now() - t0) / 1000;
      var p = Math.round((chars / 5) / (secs / 60));
      var win = acc >= 90;
      ctx.finish({
        win: win,
        scoreText: acc + '% precision',
        title: win ? 'limpio como un commit atomico' : 'demasiados typos',
        msg: p + ' ppm · ' + errors + (errors === 1 ? ' error' : ' errores') + (win ? '' : ' · necesitas 90% para ganar')
      });
    }

    function wordDone() {
      var t = target();
      chars += t.length + 1;
      words++;
      typed = 0;
      input.value = '';
      ctx.sfx('good');
      if (!mode.timed && words >= TOTAL_P) {
        chars -= 1;
        return endPrecision();
      }
      queue.shift();
      queue.push(nextWord());
      render();
      hud();
    }

    function wrong() {
      errors++;
      ctx.sfx('bad');
      ctx.vibrate(20);
      input.classList.remove('g-shake');
      void input.offsetWidth;
      input.classList.add('g-shake');
      if (!mode.timed) hud();
    }

    input.addEventListener('input', function () {
      if (ctx.isDone()) return;
      var v = input.value;
      var t = target();
      if (v.length < typed) {
        typed = v.length;
        render();
        return;
      }
      begin();
      var ok = typed;
      for (var i = typed; i < v.length; i++) {
        if (v.charAt(i).toLowerCase() === t.charAt(ok).toLowerCase()) ok++;
        else { wrong(); break; }
      }
      if (ok > typed) ctx.sfx('tick');
      typed = ok;
      input.value = t.slice(0, typed);
      if (typed >= t.length) return wordDone();
      render();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') e.preventDefault();
    });
    input.addEventListener('blur', function () {
      ctx.after(150, function () { if (!('ontouchstart' in window)) input.focus(); });
    });
    ctx.root.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.g-choose')) return;
      ctx.after(0, function () { input.focus(); });
    });

    render();
    hud();
    if (mode.timed) barFill.style.width = '100%';
    try { input.focus(); } catch (x) {}
    ctx.after(60, function () { try { input.focus(); } catch (x) {} });
  }

  C.register({
    id: 'teclea',
    name: 'Teclea',
    desc: 'Escribe comandos tech lo mas rapido que puedas.',
    tag: 'palabras',
    color: '#38d9ff',
    unit: 'ppm',
    icon: ['########', '#.#.#.##', '########', '#.#.#.##', '########', '#.####.#', '########', '........'],
    how: 'Escribe el comando que ves: lo que aciertas se pone blanco y la siguiente letra va en rojo.\nNo importan las mayusculas. Una letra mala no avanza y cuenta como error.\nEn 30 s gana el que lleve mas PPM; en precision son 20 comandos.',
    start: function (ctx) {
      ctx.choose(
        {
          title: 'elige modo',
          options: [
            { id: 't', label: '30 segundos', desc: 'cuantos mas comandos mejor (ppm)' },
            { id: 'p', label: 'precision', desc: '20 comandos, los errores pesan' }
          ]
        },
        function (id) { play(ctx, { timed: id === 't' }); }
      );
    }
  });
})();
