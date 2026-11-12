(function () {
  'use strict';
  var C = window.Nitro;
  var S = C.store;
  var cfg = C.config || {};
  var timer = null;
  var ready = null;

  function noop() {}

  function configured() {
    return !!(cfg.supabaseUrl && cfg.supabaseKey);
  }

  function active() {
    return configured() && S.get().online === true;
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 3) | 8).toString(16);
    });
  }

  function modeKey(id) {
    return String(id == null ? '' : id).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  }

  function pid() {
    var d = S.get();
    if (!d.pid) {
      d.pid = uuid();
      S.save();
    }
    return d.pid;
  }

  function rpc(name, body) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, 9000) : null;
    var headers = { apikey: cfg.supabaseKey, 'Content-Type': 'application/json' };
    if (String(cfg.supabaseKey).indexOf('eyJ') === 0) headers.Authorization = 'Bearer ' + cfg.supabaseKey;
    return fetch(cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body || {}),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (t) clearTimeout(t);
      return r.text().then(function (txt) {
        if (!r.ok) throw new Error(txt || String(r.status));
        return txt ? JSON.parse(txt) : null;
      });
    }, function (e) {
      if (t) clearTimeout(t);
      throw e;
    });
  }

  function sendProfile() {
    var d = S.get();
    return rpc('submit_profile', { p_id: pid(), p_name: d.name || 'viajero', p_xp: d.xp, p_rings: d.ringsTotal });
  }

  function ensure() {
    if (!ready) {
      ready = sendProfile().catch(function (e) {
        ready = null;
        throw e;
      });
    }
    return ready;
  }

  C.online = {
    configured: configured,
    active: active,
    modeKey: modeKey,
    join: function () {
      S.set({ online: true });
      ready = null;
      return ensure().catch(noop);
    },
    leave: function () {
      S.set({ online: false });
      ready = null;
      clearTimeout(timer);
      return rpc('delete_player', { p_id: pid() }).catch(noop);
    },
    wipe: function () {
      ready = null;
      clearTimeout(timer);
      return rpc('delete_player', { p_id: pid() }).catch(noop);
    },
    start: function () {
      if (active()) ensure().catch(noop);
    },
    submitProfile: function () {
      if (!active()) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        ensure().then(function () { return sendProfile(); }).catch(noop);
      }, 1500);
    },
    submitScore: function (game, mode, score, text) {
      if (!active()) return Promise.resolve();
      mode = mode || { id: '', label: '' };
      return ensure().then(function () {
        return rpc('submit_score', {
          p_id: pid(),
          p_game: game,
          p_mode_id: modeKey(mode.id),
          p_mode_label: mode.label || '',
          p_score: score,
          p_info: text || ''
        });
      }).catch(noop);
    },
    topPlayers: function (sort) {
      return rpc('get_top_players', { p_sort: sort, p_limit: 20 });
    },
    myRank: function (sort) {
      return rpc('get_my_rank', { p_id: pid(), p_sort: sort });
    },
    topScores: function (game, modeId) {
      return rpc('get_top_scores', { p_game: game, p_mode: modeId || '', p_limit: 10 });
    },
    modes: function (game) {
      return rpc('get_game_modes', { p_game: game });
    }
  };
})();
