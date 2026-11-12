(function () {
  'use strict';
  var C = window.Nitro;
  var U = C.util;
  var counter = 0;

  var WHITE = '#f7fbff';
  var INK = '#071426';
  var GOLD = '#ffcf33';

  function glow(hex) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',.38)';
  }

  function pupil(cx, cy, rx, ry) {
    return '<ellipse class="eye" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + INK + '"/>' +
      '<circle cx="' + (cx + 2) + '" cy="' + (cy - 3) + '" r="1.6" fill="#fff"/>';
  }

  function smile(d, color, w) {
    return '<path d="' + d + '" stroke="' + color + '" stroke-width="' + (w || 3) + '" fill="none" stroke-linecap="round"/>';
  }

  function moods(p) {
    return (
      '<g class="mood mood-idle">' + pupil(49, 53, 4.4, 7) + pupil(71, 53, 4.4, 7) + smile('M52 72 Q60 78 68 72', p.bellyD) + '</g>' +
      '<g class="mood mood-happy">' +
        '<path class="eye" d="M42 54 Q49 45 56 54" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path class="eye" d="M64 54 Q71 45 78 54" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        smile('M48 68 Q60 82 72 68', INK, 3.6) +
        '<path d="M36 64 q4 -3 8 0" stroke="#ff9a9f" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M76 64 q4 -3 8 0" stroke="#ff9a9f" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '</g>' +
      '<g class="mood mood-sad">' + pupil(49, 56, 4.2, 6) + pupil(71, 56, 4.2, 6) +
        '<path d="M40 43 L54 48 M80 43 L66 48" stroke="' + p.line + '" stroke-width="3" stroke-linecap="round"/>' +
        smile('M51 77 Q60 70 69 77', INK, 3.2) +
        '<path d="M82 67 q-3 5 0 8 q3 -3 0 -8" fill="#8fd0ff" opacity=".8"/>' +
      '</g>' +
      '<g class="mood mood-wow">' +
        '<ellipse class="eye" cx="49" cy="52" rx="6" ry="9" fill="' + INK + '"/>' +
        '<ellipse class="eye" cx="71" cy="52" rx="6" ry="9" fill="' + INK + '"/>' +
        '<circle cx="51" cy="48" r="2" fill="#fff"/><circle cx="73" cy="48" r="2" fill="#fff"/>' +
        '<ellipse cx="60" cy="75" rx="6" ry="7" fill="' + INK + '" stroke="' + p.bellyD + '" stroke-width="2"/>' +
      '</g>' +
      '<g class="mood mood-think">' + pupil(49, 53, 4.4, 7) +
        '<path class="eye" d="M66 55 Q71 49 77 55" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        smile('M52 74 Q57 70 62 74 T72 74', INK, 3) +
        '<circle cx="94" cy="34" r="2" fill="' + WHITE + '" opacity=".7"/>' +
        '<circle cx="101" cy="26" r="3" fill="' + WHITE + '" opacity=".5"/>' +
      '</g>' +
      '<g class="mood mood-sleep">' +
        '<path class="eye" d="M40 54 Q49 60 58 54 M62 54 Q71 60 80 54" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        smile('M54 74 Q60 78 66 74', INK, 3) +
        '<text x="94" y="32" fill="' + WHITE + '" font-size="16" opacity=".8" font-family="monospace" font-weight="bold">z</text>' +
        '<text x="105" y="20" fill="' + WHITE + '" font-size="11" opacity=".55" font-family="monospace" font-weight="bold">z</text>' +
      '</g>' +
      '<g class="mood mood-wink">' + pupil(49, 53, 4.4, 7) +
        '<path class="eye" d="M64 54 Q71 45 78 54" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        smile('M50 70 Q60 80 70 70', INK, 3.4) +
      '</g>'
    );
  }

  function kindParts(kind, p) {
    var back = '';
    var ears = '';
    var front = '';

    if (kind === 'gato') {
      back =
        '<path d="M84 114 Q114 108 110 80 Q108 70 99 74" stroke="' + p.line + '" stroke-width="13" fill="none" stroke-linecap="round"/>' +
        '<path d="M84 114 Q114 108 110 80 Q108 70 99 74" stroke="' + p.mainD + '" stroke-width="8" fill="none" stroke-linecap="round"/>';
      ears =
        '<g fill="' + p.main + '" stroke="' + p.line + '" stroke-width="2" stroke-linejoin="round">' +
        '<path d="M29 36 L24 6 L52 22 Z"/><path d="M91 36 L96 6 L68 22 Z"/>' +
        '<path d="M31 30 L28 14 L43 23 Z" fill="' + p.belly + '" stroke="none"/>' +
        '<path d="M89 30 L92 14 L77 23 Z" fill="' + p.belly + '" stroke="none"/></g>';
      front =
        '<path d="M56 22 v8 M60 20 v10 M64 22 v8" stroke="' + p.mainD + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M31 66 H11 M32 72 L13 79 M89 66 H109 M88 72 L107 79" stroke="' + p.line + '" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>';
    } else if (kind === 'conejo') {
      back =
        '<circle cx="95" cy="118" r="9" fill="' + p.hi + '" stroke="' + p.line + '" stroke-width="2"/>';
      ears =
        '<g stroke="' + p.line + '" stroke-width="2">' +
        '<ellipse cx="44" cy="10" rx="9.5" ry="21" fill="' + p.main + '" transform="rotate(-10 44 10)"/>' +
        '<ellipse cx="76" cy="10" rx="9.5" ry="21" fill="' + p.main + '" transform="rotate(10 76 10)"/>' +
        '<ellipse cx="44" cy="12" rx="4.5" ry="14" fill="' + p.belly + '" stroke="none" transform="rotate(-10 44 10)"/>' +
        '<ellipse cx="76" cy="12" rx="4.5" ry="14" fill="' + p.belly + '" stroke="none" transform="rotate(10 76 10)"/></g>';
      front =
        '<rect x="56.5" y="74" width="3.4" height="5.5" rx="1" fill="#fff" stroke="' + p.line + '" stroke-width="1"/>' +
        '<rect x="60.1" y="74" width="3.4" height="5.5" rx="1" fill="#fff" stroke="' + p.line + '" stroke-width="1"/>';
    } else if (kind === 'rana') {
      back =
        '<circle cx="37" cy="26" r="15" fill="' + p.main + '" stroke="' + p.line + '" stroke-width="2.5"/>' +
        '<circle cx="83" cy="26" r="15" fill="' + p.main + '" stroke="' + p.line + '" stroke-width="2.5"/>';
      ears =
        '<ellipse cx="33" cy="22" rx="5" ry="3.5" fill="' + p.hi + '" opacity=".6"/>' +
        '<ellipse cx="79" cy="22" rx="5" ry="3.5" fill="' + p.hi + '" opacity=".6"/>';
      front =
        '<circle cx="60" cy="27" r="3.2" fill="' + p.mainD + '" opacity=".7"/>' +
        '<circle cx="48" cy="32" r="2.4" fill="' + p.mainD + '" opacity=".6"/>' +
        '<circle cx="72" cy="32" r="2.4" fill="' + p.mainD + '" opacity=".6"/>';
    } else if (kind === 'robot') {
      back =
        '<path d="M60 20 V4" stroke="' + p.line + '" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle class="led" cx="60" cy="3" r="5.5" fill="' + p.shoe + '" stroke="' + p.line + '" stroke-width="2"/>';
      ears =
        '<g fill="' + p.mainD + '" stroke="' + p.line + '" stroke-width="2">' +
        '<rect x="12" y="42" width="14" height="22" rx="4"/><rect x="94" y="42" width="14" height="22" rx="4"/></g>' +
        '<g fill="' + p.hi + '"><circle cx="19" cy="48" r="2"/><circle cx="19" cy="58" r="2"/><circle cx="101" cy="48" r="2"/><circle cx="101" cy="58" r="2"/></g>';
      front =
        '<g fill="' + p.hi + '"><circle cx="35" cy="30" r="2.4"/><circle cx="85" cy="30" r="2.4"/></g>' +
        '<path d="M40 82 H80" stroke="' + p.line + '" stroke-width="1.6" stroke-dasharray="3 3" opacity=".6"/>';
    } else {
      back =
        '<g class="quills" fill="' + p.mainD + '" stroke="' + p.line + '" stroke-width="2" stroke-linejoin="round">' +
        '<path d="M34 40 L4 24 L26 48 L2 52 L27 64 L8 80 L35 78 Z"/>' +
        '<path d="M86 40 L116 24 L94 48 L118 52 L93 64 L112 80 L85 78 Z"/>' +
        '<path d="M43 22 L37 2 L54 16 L60 0 L66 16 L83 2 L77 22 Z"/></g>';
      ears =
        '<g class="ears" fill="' + p.main + '" stroke="' + p.line + '" stroke-width="2" stroke-linejoin="round">' +
        '<path d="M31 28 L24 8 L46 20 Z"/><path d="M89 28 L96 8 L74 20 Z"/>' +
        '<path d="M32 25 L29 15 L39 20 Z" fill="' + p.belly + '" stroke="none"/>' +
        '<path d="M88 25 L91 15 L81 20 Z" fill="' + p.belly + '" stroke="none"/></g>';
    }
    return { back: back, ears: ears, front: front };
  }

  function accessory(name, p) {
    if (name === 'gafas') {
      return (
        '<g>' +
        '<rect x="32" y="43" width="26" height="17" rx="7" fill="#0a0f1c" stroke="#fff" stroke-width="1.6" opacity=".93"/>' +
        '<rect x="62" y="43" width="26" height="17" rx="7" fill="#0a0f1c" stroke="#fff" stroke-width="1.6" opacity=".93"/>' +
        '<path d="M58 49 H62 M32 47 L22 42 M88 47 L98 42" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M37 47 l6 -2 M67 47 l6 -2" stroke="#8fd0ff" stroke-width="2" stroke-linecap="round" opacity=".8"/>' +
        '</g>'
      );
    }
    if (name === 'corona') {
      return (
        '<g stroke-linejoin="round">' +
        '<path d="M38 26 L42 6 L52 17 L60 2 L68 17 L78 6 L82 26 Z" fill="' + GOLD + '" stroke="#b8860b" stroke-width="2"/>' +
        '<rect x="38" y="24" width="44" height="6" rx="2" fill="#ffb800" stroke="#b8860b" stroke-width="1.5"/>' +
        '<circle cx="60" cy="9" r="2.6" fill="#e8323c"/><circle cx="43" cy="11" r="2" fill="#2f9bff"/><circle cx="77" cy="11" r="2" fill="#43d17a"/>' +
        '</g>'
      );
    }
    if (name === 'casco') {
      return (
        '<g stroke-linejoin="round">' +
        '<path d="M24 46 Q24 12 60 12 Q96 12 96 46 L88 40 Q60 30 32 40 Z" fill="' + p.shoe + '" stroke="' + p.shoeD + '" stroke-width="2.5"/>' +
        '<path d="M60 12 V33" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M34 24 q6 -8 16 -9" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".6"/>' +
        '</g>'
      );
    }
    if (name === 'bufanda') {
      return (
        '<g stroke="' + p.shoeD + '" stroke-width="2" stroke-linejoin="round">' +
        '<path d="M34 80 Q60 94 86 80 L88 91 Q60 105 32 91 Z" fill="' + p.shoe + '"/>' +
        '<path d="M76 94 L84 116 L71 113 L69 97 Z" fill="' + p.shoe + '"/>' +
        '<path d="M74 105 L82 107" stroke="#fff" stroke-width="2" opacity=".7" fill="none"/>' +
        '</g>'
      );
    }
    return '';
  }

  function levelAcc(level, id) {
    var acc = '';
    if (level >= 9) {
      acc += '<circle cx="60" cy="74" r="58" fill="url(#' + id + 'a)" opacity=".55"/>' +
        '<path d="M14 40 l4 -10 4 10 10 4 -10 4 -4 10 -4 -10 -10 -4z" fill="' + GOLD + '" opacity=".9"/>' +
        '<path d="M104 92 l3 -8 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3z" fill="' + GOLD + '" opacity=".8"/>';
    }
    if (level >= 2) {
      acc += '<ellipse class="pulse" cx="100" cy="72" rx="16" ry="20" fill="none" stroke="' + GOLD + '" stroke-width="4.5"/>' +
        '<path d="M93 58 q4 -4 9 -3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>';
    }
    return acc;
  }

  function speedAcc(level, p) {
    if (level < 4) return '';
    return '<g class="speedlines" stroke="' + p.main + '" stroke-width="3" stroke-linecap="round" opacity=".55">' +
      '<path d="M4 54 H22"/><path d="M0 74 H18"/><path d="M6 94 H24"/></g>';
  }

  function goldShoes(level) {
    if (level < 6) return '';
    return '<rect x="18" y="90" width="16" height="7" rx="3.5" fill="' + GOLD + '"/>' +
      '<rect x="86" y="90" width="16" height="7" rx="3.5" fill="' + GOLD + '"/>';
  }

  C.mascot = {
    html: function (level, mood, skinId) {
      var id = 'nb' + ++counter;
      level = level || 1;
      mood = mood || 'idle';
      var sk = C.skins.byId(skinId || (C.store && C.store.get().skin));
      var p = sk.pal;
      var parts = kindParts(sk.kind, p);
      var top = p.top || p.main;
      var acc = levelAcc(level, id) + speedAcc(level, p) + goldShoes(level);
      var worn = '';
      sk.acc.forEach(function (a) { worn += accessory(a, p); });

      return (
        '<svg class="nitro" data-mood="' + mood + '" viewBox="0 0 120 150" role="img" aria-label="' + sk.name + '" style="filter:drop-shadow(0 0 16px ' + glow(p.main) + ')">' +
        '<defs>' +
        '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + p.mainD + '"/></linearGradient>' +
        '<radialGradient id="' + id + 'a"><stop offset="0" stop-color="#ffe680" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf33" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        '<ellipse class="shadow" cx="60" cy="143" rx="33" ry="5" fill="#000" opacity=".42"/>' +
        '<g class="float">' +
          acc +
          parts.back +
          parts.ears +
          '<path d="M38 78 Q60 70 82 78 L86 118 Q60 128 34 118 Z" fill="url(#' + id + 'g)" stroke="' + p.line + '" stroke-width="2.5"/>' +
          '<ellipse cx="60" cy="103" rx="19" ry="17" fill="' + p.belly + '" stroke="' + p.bellyD + '" stroke-width="2"/>' +
          '<rect x="42" y="114" width="13" height="16" rx="5" fill="' + p.mainD + '"/>' +
          '<rect x="65" y="114" width="13" height="16" rx="5" fill="' + p.mainD + '"/>' +
          '<g class="shoes">' +
            '<path d="M28 130 Q28 122 39 122 H54 Q60 122 60 130 L58 137 Q46 141 30 137 Z" fill="' + p.shoe + '" stroke="' + p.shoeD + '" stroke-width="2"/>' +
            '<path d="M92 130 Q92 122 81 122 H66 Q60 122 60 130 L62 137 Q74 141 90 137 Z" fill="' + p.shoe + '" stroke="' + p.shoeD + '" stroke-width="2"/>' +
            '<rect x="31" y="126" width="27" height="4" rx="2" fill="' + WHITE + '"/>' +
            '<rect x="62" y="126" width="27" height="4" rx="2" fill="' + WHITE + '"/>' +
            '<rect x="41" y="124.5" width="6" height="7" rx="1.5" fill="' + GOLD + '" stroke="#d99b54" stroke-width="1"/>' +
            '<rect x="73" y="124.5" width="6" height="7" rx="1.5" fill="' + GOLD + '" stroke="#d99b54" stroke-width="1"/>' +
          '</g>' +
          '<g class="arms">' +
            '<path d="M40 86 Q28 88 25 96" stroke="' + p.mainD + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<path d="M80 86 Q92 88 95 96" stroke="' + p.mainD + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<circle cx="24" cy="98" r="10" fill="' + WHITE + '" stroke="#c9d8e8" stroke-width="1.5"/>' +
            '<circle cx="96" cy="98" r="10" fill="' + WHITE + '" stroke="#c9d8e8" stroke-width="1.5"/>' +
            '<path d="M18 94 q6 -4 12 0" stroke="#dbe8f5" stroke-width="2" fill="none" stroke-linecap="round"/>' +
            '<path d="M90 94 q6 -4 12 0" stroke="#dbe8f5" stroke-width="2" fill="none" stroke-linecap="round"/>' +
          '</g>' +
          '<ellipse cx="60" cy="52" rx="38" ry="34" fill="url(#' + id + 'g)" stroke="' + p.line + '" stroke-width="2.5"/>' +
          '<path d="M28 42 Q34 24 52 20" stroke="' + p.hi + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>' +
          '<ellipse cx="60" cy="67" rx="25" ry="17" fill="' + p.belly + '" stroke="' + p.bellyD + '" stroke-width="2"/>' +
          parts.front +
          '<ellipse class="eye" cx="49" cy="51" rx="13" ry="16" fill="' + WHITE + '" stroke="' + INK + '" stroke-width="2"/>' +
          '<ellipse class="eye" cx="71" cy="51" rx="13" ry="16" fill="' + WHITE + '" stroke="' + INK + '" stroke-width="2"/>' +
          '<ellipse cx="60" cy="64" rx="5.5" ry="4.2" fill="' + INK + '"/>' +
          '<path d="M53 70 Q60 76 67 70" stroke="' + p.bellyD + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
          moods(p) +
          worn +
        '</g></svg>'
      );
    }
  };

  var LINES = {
    first: [
      '¡hola, {name}! soy nitro, un erizo que vive en tu navegador y colecciona anillos.',
      'encantado, {name}. tengo 25 juegos, púas azules y cero ganas de quedarme quieto.'
    ],
    morning: [
      'buenos días, {name}. la zona está despejada y los anillos brillan.',
      'arriba, {name}. hoy es un buen día para romper un récord.'
    ],
    afternoon: [
      'buenas tardes, {name}. ¿una carrera por la tabla de récords?',
      'hey {name}. la tarde tiene velocidad de sobra.'
    ],
    night: [
      'ya es de noche, {name}. los anillos también brillan en la oscuridad.',
      '{name}, la zona duerme. nosotros no.'
    ],
    streak: [
      'racha de {streak} días. velocidad constante, nada de frenar.',
      '{streak} días seguidos, {name}. eso sí es un buen sprint.'
    ],
    many: [
      'ya van {visits} visitas. empiezo a considerar esto mi zona favorita.',
      'otra vez por aquí, {name}. me caes bien, no lo digas por ahí.'
    ],
    idle: [
      'las cajas de madera no se rompen solas. bueno, sí, pero ayuda.',
      'un anillo vale más que mil bugs. comprobado.',
      'la velocidad sin control es solo caos. la velocidad con estilo es otra cosa.',
      '¿sabías que puedo girar como una bola? yo tampoco lo entiendo del todo.',
      'los checkpoints existen para volver a intentarlo sin empezar de cero.',
      'cada récord es un anillo más en el contador.',
      'toca a este erizo. a ver si acelero.',
      'mi dieta es chili dogs y píxeles.',
      'el doctor malo no está invitado a este arcade.',
      'sube el volumen: esta zona suena mejor con música de 16 bits.',
      'si pierdes, respira. si ganas, celebra. si empatas, corre otra vez.',
      'las púas no se peinan. es una decisión de diseño.'
    ],
    win: [
      '¡zona completada! anillos asegurados.',
      'récord a la vista, {name}. eso fue velocidad pura.',
      '¡spin dash perfecto! mi script de aplausos va a 60 fps.',
      'victoria. hasta el cronómetro se quedó atrás.',
      '¡bien jugado! el check point queda guardado.'
    ],
    lose: [
      'te faltó un anillo, {name}. otra vuelta y listo.',
      'los pinchos ganaron esta vez. no se lo cuentes a nadie.',
      'no pasa nada: checkpoint, respirar y acelerar de nuevo.',
      'hasta el erizo más rápido tropieza con una caja mal puesta.',
      'esa vuelta no cuenta. la siguiente sí.'
    ],
    record: [
      '¡nuevo récord! eso va directo a la tabla de zonas.',
      'récord roto. los anillos vuelan, {name}.',
      'ese número ya es leyenda en esta zona.'
    ],
    levelup: [
      '¡subí de nivel! siento más velocidad en las patas.',
      'level up. creo que ya puedo romper la barrera del sonido.'
    ],
    poke: [
      '¡hey! eso fue un pinchazo de púas.',
      'cuidado, las púas pinchan de verdad.',
      '¿me estás peinando o midiendo la velocidad?',
      'un anillo por cada toque, ¿va?',
      'jeje. ¿quieres ver un spin dash?'
    ],
    poke10: ['ok, ok, ya sé que te caigo bien. yo también te aprecio, {name}.']
  };

  C.say = {
    line: function (key, vars) {
      var arr = LINES[key] || [''];
      var s = U.pick(arr);
      vars = vars || {};
      return s.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] != null ? vars[k] : m;
      });
    },
    greet: function (st, first) {
      var vars = { name: st.name, streak: st.streak, visits: st.visits };
      if (first) return this.line('first', vars);
      var hr = new Date().getHours();
      var pool = [];
      if (st.streak >= 3) pool.push('streak');
      if (st.visits >= 6) pool.push('many');
      pool.push(hr < 5 || hr >= 19 ? 'night' : hr < 12 ? 'morning' : 'afternoon');
      return this.line(U.pick(pool), vars);
    }
  };
})();
