(function () {
  'use strict';
  var C = (window.Nitro = window.Nitro || {});

  var BLUE = {
    top: '#3aa7ff', main: '#2f9bff', mainD: '#1b6fd6', line: '#0b3d91', hi: '#8fd0ff',
    belly: '#f7c98b', bellyD: '#d99b54', shoe: '#e8323c', shoeD: '#a81722'
  };

  var LIST = [
    { id: 'nitro', name: 'Nitro', kind: 'erizo', price: 0, pal: BLUE, blurb: 'el erizo azul de siempre' },
    { id: 'brasa', name: 'Nitro Brasa', kind: 'erizo', price: 40, blurb: 'púas rojas, cero paciencia',
      pal: { main: '#ff6a5c', mainD: '#d63a2f', line: '#7a1410', hi: '#ffc2b8', belly: '#ffd9a8', bellyD: '#d99b54', shoe: '#2f9bff', shoeD: '#1b6fd6' } },
    { id: 'hielo', name: 'Nitro Hielo', kind: 'erizo', price: 60, blurb: 'frío por fuera, rápido por dentro',
      pal: { main: '#7fe3ff', mainD: '#38b6e8', line: '#0f5a7e', hi: '#e6fbff', belly: '#f4fcff', bellyD: '#a8d4e6', shoe: '#5b7cff', shoeD: '#3a52c4' } },
    { id: 'jade', name: 'Nitro Jade', kind: 'erizo', price: 60, blurb: 'verde como la zona de inicio',
      pal: { main: '#4fe08a', mainD: '#23a85a', line: '#0d5a2f', hi: '#c8ffd9', belly: '#fff0b8', bellyD: '#d9b85a', shoe: '#ff9f2e', shoeD: '#b3650b' } },
    { id: 'violeta', name: 'Nitro Violeta', kind: 'erizo', price: 80, blurb: 'misterio morado',
      pal: { main: '#a78bfa', mainD: '#7452e0', line: '#35208a', hi: '#e2d6ff', belly: '#ffe3f1', bellyD: '#d98bb0', shoe: '#ffcf33', shoeD: '#b8860b' } },
    { id: 'cool', name: 'Nitro Cool', kind: 'erizo', price: 90, pal: BLUE, acc: ['gafas'], blurb: 'con gafas de sol, obvio' },
    { id: 'mishi', name: 'Mishi', kind: 'gato', price: 100, blurb: 'gata naranja, siempre cae de pie',
      pal: { main: '#ffa24d', mainD: '#e0781a', line: '#7a3b05', hi: '#ffe0b8', belly: '#fff1dc', bellyD: '#e0b080', shoe: '#43d17a', shoeD: '#238a50' } },
    { id: 'brinco', name: 'Brinco', kind: 'conejo', price: 120, blurb: 'conejo saltarín de orejas largas',
      pal: { main: '#f4ecdf', mainD: '#d4c4a8', line: '#6b5a40', hi: '#ffffff', belly: '#ffd6dc', bellyD: '#e898a6', shoe: '#a78bfa', shoeD: '#6a4ed0' } },
    { id: 'bruma', name: 'Bruma', kind: 'gato', price: 130, acc: ['bufanda'], blurb: 'gata gris con bufanda',
      pal: { main: '#9fb4cc', mainD: '#6f8aab', line: '#2c3e57', hi: '#e3edf8', belly: '#f4f8fc', bellyD: '#b8c8da', shoe: '#ff6bb5', shoeD: '#b3367f' } },
    { id: 'sombra', name: 'Nitro Sombra', kind: 'erizo', price: 140, blurb: 'corre de noche, brilla en rojo',
      pal: { main: '#3b3f58', mainD: '#1f2236', line: '#0a0b14', hi: '#8a90c0', belly: '#d9dbe8', bellyD: '#8a8ea8', shoe: '#e8323c', shoeD: '#a81722' } },
    { id: 'saltin', name: 'Saltín', kind: 'rana', price: 140, blurb: 'rana verde lima con mucho brinco',
      pal: { main: '#9be34a', mainD: '#5fb01f', line: '#2a5a0a', hi: '#e4ffb8', belly: '#fff5a8', bellyD: '#d4c040', shoe: '#ff6a5c', shoeD: '#b8352a' } },
    { id: 'neon', name: 'Nitro Neón', kind: 'erizo', price: 150, blurb: 'rosa eléctrico y menta',
      pal: { main: '#ff5ec4', mainD: '#d6249a', line: '#6b0b4f', hi: '#ffc4ec', belly: '#c8fff0', bellyD: '#5fd1b0', shoe: '#38d9ff', shoeD: '#0f93b8' } },
    { id: 'piloto', name: 'Nitro Piloto', kind: 'erizo', price: 160, pal: BLUE, acc: ['casco'], blurb: 'casco puesto, listo para la pista' },
    { id: 'bolt', name: 'Bolt', kind: 'robot', price: 200, blurb: 'robot de bolsillo con antena',
      pal: { main: '#c9d4e2', mainD: '#8796ab', line: '#2b3648', hi: '#ffffff', belly: '#5a6a82', bellyD: '#2b3648', shoe: '#ffcf33', shoeD: '#b8860b' } },
    { id: 'rey', name: 'Nitro Rey', kind: 'erizo', price: 300, pal: BLUE, acc: ['corona'], blurb: 'el rey de la tabla de récords' },
    { id: 'oro', name: 'Nitro Oro', kind: 'erizo', price: 400, blurb: 'dorado de punta a punta',
      pal: { main: '#ffd84d', mainD: '#e6a817', line: '#7a5300', hi: '#fff3b0', belly: '#fff6d6', bellyD: '#d9a94e', shoe: '#e8323c', shoeD: '#a81722' } }
  ];

  LIST.forEach(function (s) {
    s.acc = s.acc || [];
  });

  function rarity(s) {
    if (s.price <= 0) return 'inicial';
    if (s.price <= 60) return 'común';
    if (s.price <= 140) return 'raro';
    if (s.price <= 200) return 'épico';
    return 'legendario';
  }

  C.skins = {
    list: LIST,
    byId: function (id) {
      for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
      return LIST[0];
    },
    has: function (id) {
      for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return true;
      return false;
    },
    rarity: rarity
  };
})();
