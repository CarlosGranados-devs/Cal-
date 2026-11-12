/* Nitro service worker · cache-first para jugar sin conexión */
'use strict';

var VERSION = 'nitro-v3';
var CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './js/config.js',
  './js/registry.js',
  './js/skins.js',
  './js/store.js',
  './js/online.js',
  './js/audio.js',
  './js/nitro.js',
  './js/main.js',
  './js/games/adivina.js',
  './js/games/memoria.js',
  './js/games/mates.js',
  './js/games/2048.js',
  './js/games/buscaminas.js',
  './js/games/lightsout.js',
  './js/games/puzzle15.js',
  './js/games/hanoi.js',
  './js/games/codigo.js',
  './js/games/stroop.js',
  './js/games/simon.js',
  './js/games/reflejo.js',
  './js/games/bugs.js',
  './js/games/snake.js',
  './js/games/pong.js',
  './js/games/ladrillos.js',
  './js/games/flap.js',
  './js/games/esquiva.js',
  './js/games/ahorcado.js',
  './js/games/palabrle.js',
  './js/games/teclea.js',
  './js/games/anillos.js',
  './js/games/turbillo.js',
  './js/games/caos.js',
  './js/games/laberinto.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(CORE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== VERSION) return caches.delete(key);
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      });
    })
  );
});
