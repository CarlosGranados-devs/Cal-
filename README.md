# Nitro · arcade de bolsillo

Nitro es un erizo azul original que vive en tu navegador. Este proyecto es una
reinterpretación mejorada de [yoro](https://github.com/YonaZakkart/yoro): 25
minijuegos, progreso persistente, anillos, logros y un reto diario, todo en HTML,
CSS y JavaScript sin dependencias.

## Demo

Juega en GitHub Pages o abre `index.html` en cualquier navegador moderno.
No hay build, ni instalación, ni servidor obligatorio.

## Qué incluye

- **25 minijuegos** de mente, reflejos, palabras, arcade y estrategia.
- **Anillos** como moneda: se ganan al terminar partidas, con récords y con el
  reto diario.
- **Reto del día**: un juego distinto cada día con bonus de +20 anillos.
- **Progreso**: XP, niveles, rachas de días, récords por juego y 15 logros.
- **Nitro**: mascota SVG con estados de ánimo, accesorios por nivel y diálogos.
- **PWA**: manifest, iconos y service worker para instalarlo y jugar sin conexión.
- **Audio generado** con Web Audio API, sin archivos externos.
- **Responsive**: teclado, mouse, táctil, pad en pantalla y gestos.

## Los 25 juegos

| Juego | Categoría |
| --- | --- |
| Adivina | mente |
| Memoria | mente |
| Mates | mente |
| 2048 | estrategia |
| Buscaminas | estrategia |
| Lights Out | estrategia |
| Puzzle 15 | estrategia |
| Torres de Hanói | estrategia |
| Código secreto | estrategia |
| Stroop | mente |
| Simón | memoria |
| Reflejo | reflejos |
| Caza bugs | reflejos |
| Snake | arcade |
| Pong | arcade |
| Ladrillos | arcade |
| Flap Nitro | arcade |
| Esquiva | arcade |
| Ahorcado | palabras |
| Palabrle | palabras |
| Teclea | palabras |
| **Anillos** | arcade |
| **Turbillo** | reflejos |
| **Caos** | reflejos |
| **Laberinto** | estrategia |

Los cuatro últimos son nuevos en esta versión.

## Cómo jugar

1. Abre `index.html` con doble clic, o sirve la carpeta con cualquier servidor
   estático.
2. Elige un juego desde la rejilla o toca el reto del día.
3. Gana partidas para conseguir anillos, XP y logros.

Para probar el service worker hace falta `http://localhost` o HTTPS:

```bash
# con Python instalado
python -m http.server 8080
# luego abre http://localhost:8080
```

## Estructura

```
index.html          arranque y orden de scripts
css/style.css       tema, componentes y animaciones
js/registry.js      API de juegos, helpers y utilidades
js/store.js         guardado en localStorage, anillos, XP y reto diario
js/audio.js         efectos de sonido sintetizados
js/nitro.js         mascota SVG y diálogos
js/main.js          hub, router, HUD, resultados y logros
js/games/*.js       los 25 minijuegos
manifest.json       configuración PWA
sw.js               caché offline
assets/             iconos y favicon
```

Cada juego se registra con `Nitro.register({ id, name, desc, tag, color, icon,
how, start })` y recibe un contexto con canvas, teclado, pad, audio, tiempo y
`finish()`.

## Créditos

- Inspirado en [yoro](https://github.com/YonaZakkart/yoro) de YonaZakkart.
- Hecho por [Carlos Granados](https://github.com/CarlosGranados-devs).
- Nitro es un personaje original homenaje a los plataformas de 16 bits. Este
  proyecto no tiene afiliación con SEGA.

## Licencia

Uso personal y educativo. Revisa la licencia del repositorio original antes de
redistribuir assets o ideas derivadas.
