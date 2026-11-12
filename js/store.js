(function () {
  'use strict';
  var C = window.Nitro;
  var KEY = 'nitro.v1';
  var LEGACY = 'calo.v1';
  var data = null;

  function fresh() {
    return {
      v: 2,
      name: '',
      visits: 0,
      days: [],
      streak: 0,
      xp: 0,
      rings: 0,
      ringsTotal: 0,
      muted: false,
      vibrate: true,
      pokes: 0,
      skin: 'nitro',
      owned: ['nitro'],
      games: {},
      badges: {},
      daily: { date: '', id: '', done: false }
    };
  }

  function dayStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  C.store = {
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) raw = localStorage.getItem(LEGACY);
        data = Object.assign(fresh(), raw ? JSON.parse(raw) : {});
        if (!data.daily) data.daily = { date: '', id: '', done: false };
        if (!Array.isArray(data.owned)) data.owned = [];
        if (data.owned.indexOf('nitro') < 0) data.owned.unshift('nitro');
        data.owned = data.owned.filter(function (id) { return C.skins.has(id); });
        if (!C.skins.has(data.skin) || data.owned.indexOf(data.skin) < 0) data.skin = 'nitro';
        data.v = 2;
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
    addRings: function (n) {
      var d = this.get();
      n = Math.max(0, Math.round(n || 0));
      d.rings += n;
      d.ringsTotal += n;
      this.save();
      return d.rings;
    },
    owns: function (id) {
      return this.get().owned.indexOf(id) >= 0;
    },
    buySkin: function (id) {
      var d = this.get();
      if (!C.skins.has(id)) return { ok: false, reason: 'missing' };
      if (this.owns(id)) return { ok: false, reason: 'owned' };
      var price = C.skins.byId(id).price;
      if (d.rings < price) return { ok: false, reason: 'poor', need: price - d.rings };
      d.rings -= price;
      d.owned.push(id);
      this.save();
      return { ok: true, rings: d.rings };
    },
    equipSkin: function (id) {
      var d = this.get();
      if (!C.skins.has(id) || !this.owns(id)) return false;
      d.skin = id;
      this.save();
      return true;
    },
    dailyChallenge: function (list) {
      var d = this.get();
      var t = dayStr();
      if (!d.daily || d.daily.date !== t || !d.daily.id) {
        d.daily = { date: t, id: list[hash(t) % list.length].id, done: false };
        this.save();
      }
      return d.daily;
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
