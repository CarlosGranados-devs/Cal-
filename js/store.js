(function () {
  'use strict';
  var C = window.Calo;
  var KEY = 'calo.v1';
  var data = null;

  function fresh() {
    return {
      v: 1,
      name: '',
      visits: 0,
      days: [],
      streak: 0,
      xp: 0,
      muted: false,
      vibrate: true,
      pokes: 0,
      games: {},
      badges: {}
    };
  }

  function dayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  C.store = {
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        data = Object.assign(fresh(), raw ? JSON.parse(raw) : {});
      } catch (e) {
        data = fresh();
      }
      return data;
    },
    save: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {}
    },
    get: function () {
      return data || this.load();
    },
    set: function (patch) {
      Object.assign(this.get(), patch);
      this.save();
    },
    visit: function () {
      var d = this.get();
      var t = dayStr();
      var last = d.days[d.days.length - 1];
      if (last !== t) {
        var y = new Date();
        y.setDate(y.getDate() - 1);
        d.streak = last === dayStr(y) ? d.streak + 1 : 1;
        d.days.push(t);
        if (d.days.length > 90) d.days.shift();
      }
      d.visits++;
      this.save();
    },
    bestOf: function (id) {
      var g = this.get().games[id];
      return g ? g.best : null;
    },
    recordGame: function (id, o) {
      var games = this.get().games;
      var g = games[id] || (games[id] = { plays: 0, wins: 0, best: null, last: 0 });
      g.plays++;
      g.last = Date.now();
      if (o.win) g.wins++;
      var isRecord = false;
      if (o.score != null && isFinite(o.score)) {
        if (g.best == null) isRecord = true;
        else if (o.better === 'low') isRecord = o.score < g.best;
        else isRecord = o.score > g.best;
        if (isRecord) g.best = o.score;
      }
      this.save();
      return { isRecord: isRecord, first: g.plays === 1, plays: g.plays };
    },
    levelInfo: function (xp) {
      var L = Math.floor(Math.sqrt(xp / 12)) + 1;
      var lo = 12 * (L - 1) * (L - 1);
      var hi = 12 * L * L;
      return { level: L, cur: xp - lo, need: hi - lo, pct: (xp - lo) / (hi - lo) };
    },
    addXp: function (n) {
      var d = this.get();
      var before = this.levelInfo(d.xp).level;
      d.xp += n;
      this.save();
      var after = this.levelInfo(d.xp).level;
      return { before: before, after: after, up: after > before };
    },
    badge: function (id) {
      var b = this.get().badges;
      if (b[id]) return false;
      b[id] = Date.now();
      this.save();
      return true;
    },
    stats: function () {
      var g = this.get().games;
      var played = 0;
      var plays = 0;
      var wins = 0;
      Object.keys(g).forEach(function (k) {
        if (g[k].plays > 0) played++;
        plays += g[k].plays;
        wins += g[k].wins;
      });
      return { played: played, plays: plays, wins: wins };
    },
    reset: function () {
      data = fresh();
      this.save();
    }
  };
})();
