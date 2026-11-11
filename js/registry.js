(function () {
  'use strict';
  var C = (window.Calo = window.Calo || {});

  C.games = [];
  C.register = function (def) {
    C.games.push(def);
  };

  C.util = {
    rand: function (a, b) {
      return Math.floor(Math.random() * (b - a + 1)) + a;
    },
    pick: function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      return a;
    },
    clamp: function (v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    },
    pad: function (n, len) {
      return String(n).padStart(len || 2, '0');
    }
  };

  C.h = function (tag, props) {
    var el = document.createElement(tag);
    var kids = Array.prototype.slice.call(arguments, 2);
    if (props) {
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    (function add(list) {
      list.forEach(function (c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) add(c);
        else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
      });
    })(kids);
    return el;
  };

  C.pixicon = function (rows, cls) {
    var n = rows.length;
    var w = rows[0].length;
    var r = '';
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < w; x++) {
        var ch = rows[y][x];
        if (ch === '#' || ch === '1' || ch === 'X') {
          r += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
        }
      }
    }
    return (
      '<svg class="pxicon ' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + n +
      '" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>'
    );
  };
})();
