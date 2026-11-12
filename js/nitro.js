(function () {
  'use strict';
  var C = window.Nitro;
  var U = C.util;
  var counter = 0;

  var BLUE = '#2f9bff';
  var BLUE_D = '#1b6fd6';
  var BLUE_S = '#0b3d91';
  var TAN = '#f7c98b';
  var TAN_D = '#d99b54';
  var WHITE = '#f7fbff';
  var INK = '#071426';
  var RED = '#e8323c';
  var RED_D = '#a81722';
  var GOLD = '#ffcf33';

  function pupil(cx, cy, rx, ry) {
    return '<ellipse class="eye" cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + INK + '"/>' +
      '<circle cx="' + (cx + 2) + '" cy="' + (cy - 3) + '" r="1.6" fill="#fff"/>';
  }

  function smile(d, color, w) {
    return '<path d="' + d + '" stroke="' + (color || TAN_D) + '" stroke-width="' + (w || 3) + '" fill="none" stroke-linecap="round"/>';
  }

  function moods() {
    return (
      '<g class="mood mood-idle">' + pupil(49, 53, 4.4, 7) + pupil(71, 53, 4.4, 7) + smile('M52 72 Q60 78 68 72') + '</g>' +
      '<g class="mood mood-happy">' +
        '<path class="eye" d="M42 54 Q49 45 56 54" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path class="eye" d="M64 54 Q71 45 78 54" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        smile('M48 68 Q60 82 72 68', INK, 3.6) +
        '<path d="M36 64 q4 -3 8 0" stroke="#ff9a9f" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M76 64 q4 -3 8 0" stroke="#ff9a9f" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '</g>' +
      '<g class="mood mood-sad">' + pupil(49, 56, 4.2, 6) + pupil(71, 56, 4.2, 6) +
        '<path d="M40 43 L54 48 M80 43 L66 48" stroke="' + BLUE_S + '" stroke-width="3" stroke-linecap="round"/>' +
        smile('M51 77 Q60 70 69 77', INK, 3.2) +
        '<path d="M82 67 q-3 5 0 8 q3 -3 0 -8" fill="#8fd0ff" opacity=".8"/>' +
      '</g>' +
      '<g class="mood mood-wow">' +
        '<ellipse class="eye" cx="49" cy="52" rx="6" ry="9" fill="' + INK + '"/>' +
        '<ellipse class="eye" cx="71" cy="52" rx="6" ry="9" fill="' + INK + '"/>' +
        '<circle cx="51" cy="48" r="2" fill="#fff"/><circle cx="73" cy="48" r="2" fill="#fff"/>' +
        '<ellipse cx="60" cy="75" rx="6" ry="7" fill="' + INK + '" stroke="' + TAN_D + '" stroke-width="2"/>' +
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

  C.mascot = {
    html: function (level, mood) {
      var id = 'nb' + ++counter;
      level = level || 1;
      mood = mood || 'idle';
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
      if (level >= 4) {
        acc += '<g class="speedlines" stroke="' + BLUE + '" stroke-width="3" stroke-linecap="round" opacity=".55">' +
          '<path d="M4 54 H22"/><path d="M0 74 H18"/><path d="M6 94 H24"/></g>';
      }
      if (level >= 6) {
        acc += '<rect x="18" y="90" width="16" height="7" rx="3.5" fill="' + GOLD + '"/>' +
          '<rect x="86" y="90" width="16" height="7" rx="3.5" fill="' + GOLD + '"/>';
      }

      return (
        '<svg class="nitro" data-mood="' + mood + '" viewBox="0 0 120 150" role="img" aria-label="Nitro, el erizo azul">' +
        '<defs>' +
        '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3aa7ff"/><stop offset="1" stop-color="#1b6fd6"/></linearGradient>' +
        '<radialGradient id="' + id + 'a"><stop offset="0" stop-color="#ffe680" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf33" stop-opacity="0"/></radialGradient>' +
        '</defs>' +
        '<ellipse class="shadow" cx="60" cy="143" rx="33" ry="5" fill="#000" opacity=".42"/>' +
        '<g class="float">' +
          acc +
          '<g class="quills" fill="' + BLUE_D + '" stroke="' + BLUE_S + '" stroke-width="2" stroke-linejoin="round">' +
            '<path d="M34 40 L4 24 L26 48 L2 52 L27 64 L8 80 L35 78 Z"/>' +
            '<path d="M86 40 L116 24 L94 48 L118 52 L93 64 L112 80 L85 78 Z"/>' +
            '<path d="M43 22 L37 2 L54 16 L60 0 L66 16 L83 2 L77 22 Z"/>' +
          '</g>' +
          '<g class="ears" fill="' + BLUE + '" stroke="' + BLUE_S + '" stroke-width="2" stroke-linejoin="round">' +
            '<path d="M31 28 L24 8 L46 20 Z"/><path d="M89 28 L96 8 L74 20 Z"/>' +
            '<path d="M32 25 L29 15 L39 20 Z" fill="' + TAN + '" stroke="none"/>' +
            '<path d="M88 25 L91 15 L81 20 Z" fill="' + TAN + '" stroke="none"/>' +
          '</g>' +
          '<path d="M38 78 Q60 70 82 78 L86 118 Q60 128 34 118 Z" fill="url(#' + id + 'g)" stroke="' + BLUE_S + '" stroke-width="2.5"/>' +
          '<ellipse cx="60" cy="103" rx="19" ry="17" fill="' + TAN + '" stroke="' + TAN_D + '" stroke-width="2"/>' +
          '<rect x="42" y="114" width="13" height="16" rx="5" fill="' + BLUE_D + '"/>' +
          '<rect x="65" y="114" width="13" height="16" rx="5" fill="' + BLUE_D + '"/>' +
          '<g class="shoes">' +
            '<path d="M28 130 Q28 122 39 122 H54 Q60 122 60 130 L58 137 Q46 141 30 137 Z" fill="' + RED + '" stroke="' + RED_D + '" stroke-width="2"/>' +
            '<path d="M92 130 Q92 122 81 122 H66 Q60 122 60 130 L62 137 Q74 141 90 137 Z" fill="' + RED + '" stroke="' + RED_D + '" stroke-width="2"/>' +
            '<rect x="31" y="126" width="27" height="4" rx="2" fill="' + WHITE + '"/>' +
            '<rect x="62" y="126" width="27" height="4" rx="2" fill="' + WHITE + '"/>' +
            '<rect x="41" y="124.5" width="6" height="7" rx="1.5" fill="' + GOLD + '" stroke="' + TAN_D + '" stroke-width="1"/>' +
            '<rect x="73" y="124.5" width="6" height="7" rx="1.5" fill="' + GOLD + '" stroke="' + TAN_D + '" stroke-width="1"/>' +
          '</g>' +
          '<g class="arms">' +
            '<path d="M40 86 Q28 88 25 96" stroke="' + BLUE_D + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<path d="M80 86 Q92 88 95 96" stroke="' + BLUE_D + '" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<circle cx="24" cy="98" r="10" fill="' + WHITE + '" stroke="#c9d8e8" stroke-width="1.5"/>' +
            '<circle cx="96" cy="98" r="10" fill="' + WHITE + '" stroke="#c9d8e8" stroke-width="1.5"/>' +
            '<path d="M18 94 q6 -4 12 0" stroke="#dbe8f5" stroke-width="2" fill="none" stroke-linecap="round"/>' +
            '<path d="M90 94 q6 -4 12 0" stroke="#dbe8f5" stroke-width="2" fill="none" stroke-linecap="round"/>' +
          '</g>' +
          '<ellipse cx="60" cy="52" rx="38" ry="34" fill="url(#' + id + 'g)" stroke="' + BLUE_S + '" stroke-width="2.5"/>' +
          '<path d="M28 42 Q34 24 52 20" stroke="#8fd0ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>' +
          '<ellipse cx="60" cy="67" rx="25" ry="17" fill="' + TAN + '" stroke="' + TAN_D + '" stroke-width="2"/>' +
          '<ellipse class="eye" cx="49" cy="51" rx="13" ry="16" fill="' + WHITE + '" stroke="' + INK + '" stroke-width="2"/>' +
          '<ellipse class="eye" cx="71" cy="51" rx="13" ry="16" fill="' + WHITE + '" stroke="' + INK + '" stroke-width="2"/>' +
          '<ellipse cx="60" cy="64" rx="5.5" ry="4.2" fill="' + INK + '"/>' +
          '<path d="M53 70 Q60 76 67 70" stroke="' + TAN_D + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
          moods() +
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
