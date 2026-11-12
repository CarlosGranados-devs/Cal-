(function () {
  'use strict';
  var C = window.Nitro;
  var ctx = null;

  var SFX = {
    click: [[620, 0.04, 'square', 0.035, 0]],
    tick: [[920, 0.025, 'square', 0.025, 0]],
    pop: [[300, 0.05, 'sine', 0.09, 0], [520, 0.06, 'sine', 0.07, 0.03]],
    ring: [[988, 0.055, 'square', 0.045, 0], [1319, 0.11, 'square', 0.045, 0.055]],
    jump: [[260, 0.07, 'square', 0.05, 0], [620, 0.09, 'square', 0.04, 0.055]],
    spin: [[160, 0.16, 'sawtooth', 0.035, 0], [420, 0.12, 'square', 0.03, 0.06], [780, 0.08, 'square', 0.025, 0.14]],
    good: [[523, 0.07, 'square', 0.045, 0], [784, 0.1, 'square', 0.045, 0.07]],
    bad: [[220, 0.12, 'sawtooth', 0.045, 0], [165, 0.18, 'sawtooth', 0.045, 0.1]],
    win: [
      [523, 0.08, 'square', 0.05, 0],
      [659, 0.08, 'square', 0.05, 0.08],
      [784, 0.08, 'square', 0.05, 0.16],
      [1047, 0.2, 'square', 0.05, 0.24]
    ],
    lose: [
      [392, 0.14, 'sawtooth', 0.045, 0],
      [330, 0.14, 'sawtooth', 0.045, 0.14],
      [262, 0.14, 'sawtooth', 0.045, 0.28],
      [196, 0.3, 'sawtooth', 0.045, 0.42]
    ],
    level: [
      [392, 0.09, 'square', 0.05, 0],
      [523, 0.09, 'square', 0.05, 0.09],
      [659, 0.09, 'square', 0.05, 0.18],
      [784, 0.09, 'square', 0.05, 0.27],
      [1047, 0.25, 'square', 0.05, 0.36]
    ]
  };

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  C.audio = {
    play: function (name) {
      if (C.store.get().muted) return;
      var list = SFX[name];
      if (!list) return;
      var a = ensure();
      if (!a) return;
      var t0 = a.currentTime;
      list.forEach(function (n) {
        var start = t0 + (n[4] || 0);
        var o = a.createOscillator();
        var g = a.createGain();
        o.type = n[2] || 'square';
        o.frequency.setValueAtTime(n[0], start);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(n[3] || 0.05, start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, start + n[1]);
        o.connect(g);
        g.connect(a.destination);
        o.start(start);
        o.stop(start + n[1] + 0.03);
      });
    },
    tone: function (freq, dur, type, vol) {
      if (C.store.get().muted) return;
      var a = ensure();
      if (!a) return;
      var start = a.currentTime;
      var o = a.createOscillator();
      var g = a.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol || 0.06, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start(start);
      o.stop(start + dur + 0.03);
    }
  };

  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { ensure(); }, { once: true, passive: true });
  });
})();
