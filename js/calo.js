(function () {
  'use strict';
  var C = window.Calo;
  var U = C.util;
  var counter = 0;

  var BODY =
    'M18 74 C18 40 36 16 60 16 C84 16 102 40 102 74 L102 122 L90 112 L78 124 L66 112 L54 124 L42 112 L30 124 L18 114 Z';

  var RED = '#ff2c2c';
  var WHITE = '#ececf0';

  function eyesRect(x, y, w, hgt) {
    return '<rect class="eye" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hgt + '" rx="2.5" fill="' + RED + '"/>';
  }
  function arc(x) {
    return '<path d="M' + x + ' 70 Q' + (x + 7) + ' 58 ' + (x + 14) + ' 70" stroke="' + RED + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
  }
  function smile() {
    return '<path d="M48 88 Q60 102 72 88" stroke="' + WHITE + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  }

  function moods() {
    return (
      '<g class="mood mood-idle">' + eyesRect(38, 55, 12, 20) + eyesRect(70, 55, 12, 20) +
      '<rect x="54" y="93" width="12" height="3.5" rx="1.75" fill="' + WHITE + '" opacity=".85"/></g>' +
      '<g class="mood mood-happy">' + arc(37) + arc(69) + smile() + '</g>' +
      '<g class="mood mood-sad">' + eyesRect(38, 60, 12, 14) + eyesRect(70, 60, 12, 14) +
      '<path d="M35 50 L52 57 M85 50 L68 57" stroke="' + RED + '" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M49 99 Q60 88 71 99" stroke="' + WHITE + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M82 78 q-3.5 6 0 8.5 q3.5 -2.5 0 -8.5" fill="' + WHITE + '" opacity=".55"/></g>' +
      '<g class="mood mood-wow"><circle cx="44" cy="66" r="9" fill="none" stroke="' + RED + '" stroke-width="4"/>' +
      '<circle cx="76" cy="66" r="9" fill="none" stroke="' + RED + '" stroke-width="4"/>' +
      '<ellipse cx="60" cy="95" rx="6" ry="8" fill="#0a0a0c" stroke="' + WHITE + '" stroke-width="3"/></g>' +
      '<g class="mood mood-think">' + eyesRect(38, 55, 12, 20) + eyesRect(70, 62, 12, 10) +
      '<path d="M50 94 q5 -5 10 0 t10 0" stroke="' + WHITE + '" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="mood mood-sleep"><path d="M37 68 H51 M69 68 H83" stroke="' + RED + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<circle cx="60" cy="94" r="3" fill="none" stroke="' + WHITE + '" stroke-width="2.5"/>' +
      '<text x="94" y="36" fill="' + WHITE + '" font-size="15" opacity=".7" font-family="monospace">z</text></g>' +
      '<g class="mood mood-wink">' + arc(37) + eyesRect(70, 55, 12, 20) + smile() + '</g>'
    );
  }

  C.mascot = {
    html: function (level, mood) {
      var id = 'cb' + ++counter;
      level = level || 1;
      mood = mood || 'idle';
      var acc = '';
      if (level >= 4) {
        acc +=
          '<g clip-path="url(#' + id + 'c)"><path d="M16 102 Q60 116 104 102 L104 112 Q60 126 16 112 Z" fill="' + RED + '"/></g>' +
          '<path d="M78 113 L86 136 L97 131 L90 111 Z" fill="#c81e1e"/>';
      }
      if (level >= 6) {
        acc +=
          '<rect x="30" y="52" width="60" height="28" rx="9" fill="rgba(255,44,44,.15)" stroke="' + RED + '" stroke-width="2"/>' +
          '<path d="M38 58 L48 58" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>';
      }
      if (level >= 9) {
        acc += '<ellipse cx="56" cy="9" rx="20" ry="5" fill="none" stroke="' + RED + '" stroke-width="2.5"/>';
      }
      if (level >= 2) {
        acc +=
          '<line x1="80" y1="22" x2="90" y2="6" stroke="' + RED + '" stroke-width="3" stroke-linecap="round"/>' +
          '<circle class="pulse" cx="90" cy="6" r="4.5" fill="' + RED + '"/>';
      }
      return (
        '<svg class="calo" data-mood="' + mood + '" viewBox="0 0 120 150" role="img" aria-label="Calo, el fantasma de la terminal">' +
        '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a33"/><stop offset="1" stop-color="#0e0e12"/></linearGradient>' +
        '<clipPath id="' + id + 'c"><path d="' + BODY + '"/></clipPath></defs>' +
        '<ellipse class="shadow" cx="60" cy="143" rx="30" ry="4.5" fill="#000" opacity=".5"/>' +
        '<g class="float"><path d="' + BODY + '" fill="url(#' + id + 'g)" stroke="' + RED + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M29 62 C31 42 44 30 58 27" stroke="#fff" stroke-opacity=".12" stroke-width="4" stroke-linecap="round" fill="none"/>' +
        '<circle class="led" cx="31" cy="86" r="3.2" fill="' + RED + '"/><circle class="led" cx="89" cy="86" r="3.2" fill="' + RED + '"/>' +
        moods() + acc + '</g></svg>'
      );
    }
  };

  var LINES = {
    first: [
      'hola, {name}. soy calo, un proceso que vive en tu navegador.',
      'encantado, {name}. tengo 25 juegos y cero responsabilidades.'
    ],
    morning: [
      'buenos días, {name}. el café aún se está compilando.',
      'arriba, {name}. los bugs madrugan, tú también.'
    ],
    afternoon: [
      'buenas tardes, {name}. ¿un juego mientras carga el día?',
      'hey {name}. la tarde es perfecta para un récord.'
    ],
    night: [
      'ya es de noche, {name}. los mejores bugs aparecen ahora.',
      '{name}, el servidor duerme. nosotros no.'
    ],
    streak: [
      'racha de {streak} días. no rompas el pipeline.',
      '{streak} días seguidos, {name}. eso es constancia.'
    ],
    many: [
      'ya van {visits} visitas. empiezo a guardarte en caché.',
      'otra vez por aquí, {name}. me caes bien.'
    ],
    idle: [
      'pssst. elige un juego, yo solo hago byte.',
      'si algo falla, lo llamamos "feature".',
      'dato: yo no duermo. solo hago sleep().',
      'un buen pipeline es como un buen juego: entra caos, sale orden.',
      'no te distraigas: mi memoria es de 0 y 1, la tuya también.',
      'consejo: guarda tus récords antes de que los borre el destino.',
      'estoy hecho de CSS y malas decisiones.',
      'me pregunto qué hay en la nube. spoiler: servidores.',
      'tengo un fantasma en la máquina. soy yo.',
      'cada juego que ganas me hace subir de nivel un poquito.',
      '404: aburrimiento no encontrado.',
      'toca a este fantasma. a ver qué pasa.'
    ],
    win: [
      '¡limpio! eso fue un commit sin conflictos.',
      'ganaste, {name}. voy a anotar eso en el log.',
      'victoria. mi script de aplausos sigue en beta.',
      'eso sí fue un deploy a la primera.',
      '¡bien jugado! el CI está en verde.'
    ],
    lose: [
      'error 418: soy una tetera. tú perdiste, con cariño.',
      'no pasa nada. hasta los mejores hacen rollback.',
      'ese intento va al log de errores. otro round.',
      'perdiste, pero el build sigue vivo.',
      'tranquilo, {name}. los récords también compilan al segundo intento.'
    ],
    record: [
      '¡nuevo récord! eso va directo a producción.',
      'récord roto. voy a enmarcar ese número.',
      'ese score es historia, {name}.'
    ],
    levelup: [
      '¡subí de nivel contigo! mira, me salió algo nuevo.',
      'level up. mi código se ve mejor con ese upgrade.'
    ],
    poke: [
      '¡ey! eso hizo cosquillas en mi kernel.',
      'auch. eso fue un segfault emocional.',
      'cuidado, que soy de píxeles.',
      'no me toques, estoy en producción.',
      'jeje. otra vez, otra vez.'
    ],
    poke10: ['ok, ok, ya entendí: te gusto. tú a mí también.']
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
