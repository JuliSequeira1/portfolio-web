/* ═══════════════════════════════════════════════════════════════
   julisequeira.com — navegación compartida
   Integración de la prueba de navegación 02 (13/09/2026).

   1. Continuidad tarjeta ↔ caso. La foto y el título de la tarjeta pasan
      a la cabecera del caso con una transición nativa entre documentos.
      Sólo en tres recorridos: listado → caso por su tarjeta, caso →
      listado por «Volver», y Atrás/Adelante entre esos dos. El menú, las
      anclas, los videos y el paso de un caso a otro navegan directo.
   2. Rótulo. Al señalar o enfocar un enlace del menú, la palabra rueda
      una vez dentro de su renglón.
   3. Regreso. «Volver» lleva al listado de origen con su filtro, su
      posición y el foco en la tarjeta. Si en el camino se pasó a otro caso
      que ese filtro no muestra, vuelve a la tarjeta desde la que se salió.
      Si se entró directo al caso, deja el href del HTML: work.html.

   La ventana al siguiente proyecto es HTML y CSS (navegacion.css).

   Va en el <head> y sin defer: tiene que escuchar pagereveal antes del
   primer render. Sin soporte, sin este archivo o con movimiento
   reducido, los enlaces siguen siendo enlaces.
   Referencia: developer.mozilla.org/docs/Web/API/View_Transition_API
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var PREFIJO = 'portfolio-nav:';
  var LISTADOS = { '/': true, '/work': true };
  var CASOS = { '/cdbi': true, '/flama-squad': true, '/la-noche': true };

  /* Una sola forma de nombrar páginas: /work, /work.html y /index.html
     llegan distinto según el servidor. */
  function ruta(url) {
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) return null;
      return u.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '') || '/';
    } catch (e) { return null; }
  }
  var aqui = ruta(location.href);

  function leer(clave) {
    try { return JSON.parse(sessionStorage.getItem(PREFIJO + clave)); }
    catch (e) { return null; }
  }
  function guardar(clave, valor) {
    try {
      if (valor === null) sessionStorage.removeItem(PREFIJO + clave);
      else sessionStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    } catch (e) { /* sin almacenamiento, la navegación queda directa */ }
  }

  var menosMovimiento = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function hayMovimiento() { return !(menosMovimiento && menosMovimiento.matches); }

  /* La transición se declara desde acá y no en el CSS: si este archivo no
     carga, ninguna página anima nada. */
  if ((LISTADOS[aqui] || CASOS[aqui]) && hayMovimiento()) {
    var declaracion = document.createElement('style');
    declaracion.textContent = '@view-transition { navigation: auto; }';
    document.head.appendChild(declaracion);
  }

  /* ─── QUÉ NAVEGACIÓN ES ─────────────────────────────────────────── */
  var elegida = null;     /* la tarjeta que se tocó en este listado */
  var intencion = null;   /* 'abrir' o 'volver', según el último clic */

  function clicSimple(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }
  function esTarjeta(a) {
    return a.matches('a.proj-card, a.work-item') && !!a.querySelector('img');
  }
  function tarjetaPara(caso) {
    var enlaces = document.querySelectorAll('a.proj-card[href], a.work-item[href]');
    for (var i = 0; i < enlaces.length; i++) {
      if (ruta(enlaces[i].href) === caso && !enlaces[i].closest('.hidden, [hidden]')) return enlaces[i];
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    elegida = null;
    intencion = null;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || !clicSimple(e) || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var destino = ruta(a.href);
    if (!destino) return;
    if (LISTADOS[aqui] && CASOS[destino] && esTarjeta(a)) {
      elegida = a;
      intencion = 'abrir';
      guardar('origen', {
        listado: aqui,
        url: location.pathname + location.search,
        y: Math.round(window.scrollY),
        caso: destino
      });
    } else if (CASOS[aqui] && a.hasAttribute('data-volver')) {
      intencion = 'volver';
    }
  }, true);

  /* ─── PAREJA IMAGEN / TÍTULO ────────────────────────────────────── */
  function pareja(caso) {
    if (CASOS[aqui]) {
      return {
        imagen: document.querySelector('[data-vt="imagen"]'),
        titulo: document.querySelector('[data-vt="titulo"]')
      };
    }
    var t = elegida && ruta(elegida.href) === caso ? elegida : tarjetaPara(caso);
    return {
      imagen: t ? t.querySelector('img') : null,
      titulo: t ? t.querySelector('.proj-name, .item-name') : null
    };
  }
  function marcar(el) {
    el.setAttribute('data-vt-marca', '');
  }
  function nombrar(el, nombre) {
    if (!el) return;
    el.style.viewTransitionName = nombre;
    marcar(el);
  }
  function limpiar() {
    var marcados = document.querySelectorAll('[data-vt-marca]');
    for (var i = 0; i < marcados.length; i++) {
      marcados[i].style.viewTransitionName = '';
      marcados[i].style.transform = '';
      marcados[i].style.transition = '';
      marcados[i].removeAttribute('data-vt-marca');
    }
    raiz.removeAttribute('data-vt-caso');
  }
  function enVista(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }

  /* Sólo se nombra la pareja elegida: dos elementos con el mismo nombre
     anulan la transición entera. */
  function preparar(caso, llegada) {
    limpiar();
    var p = pareja(caso);
    if (!p.imagen || !p.titulo || !enVista(p.imagen)) return false;
    /* Al salir, la foto tiene que estar cargada; al llegar es la misma
       imagen que acaba de verse, así que ya está en caché. */
    if (!llegada && !(p.imagen.complete && p.imagen.naturalWidth)) return false;
    /* Una tarjeta todavía sin su animación de entrada saldría transparente. */
    var aparece = p.imagen.closest('.reveal');
    if (aparece && !aparece.classList.contains('visible')) {
      aparece.style.transition = 'none';
      aparece.classList.add('visible');
      marcar(aparece);
    }
    /* El zoom del hover agranda la foto más allá de su caja: la captura
       tiene que salir con el tamaño real. */
    p.imagen.style.transition = 'none';
    p.imagen.style.transform = 'none';
    nombrar(p.imagen, 'vt-imagen');
    nombrar(p.titulo, 'vt-titulo');
    nombrar(document.querySelector('body > nav'), 'vt-nav');
    raiz.setAttribute('data-vt-caso', caso.slice(1));
    return true;
  }

  /* ─── SALIDA ────────────────────────────────────────────────────── */
  window.addEventListener('pageswap', function (e) {
    var motivo = intencion;
    intencion = null;
    var vt = e.viewTransition;
    if (!vt) return;
    vt.ready.catch(function () {});
    var act = e.activation;
    var destino = act && act.entry ? ruta(act.entry.url) : null;
    var viaje = act ? act.navigationType : '';
    var caso = null;
    if (destino && hayMovimiento()) {
      if (LISTADOS[aqui] && CASOS[destino] && (viaje === 'traverse' || motivo === 'abrir')) caso = destino;
      else if (CASOS[aqui] && LISTADOS[destino] && (viaje === 'traverse' || motivo === 'volver')) caso = aqui;
    }
    if (!caso || !preparar(caso, false)) {
      guardar('transicion', null);
      vt.skipTransition();
      return;
    }
    guardar('transicion', { hacia: destino, caso: caso });
  });

  /* ─── LLEGADA ───────────────────────────────────────────────────── */
  var transitando = false;

  window.addEventListener('pagereveal', function (e) {
    iniciar();
    restaurarRegreso();
    var info = leer('transicion');
    guardar('transicion', null);
    var vt = e.viewTransition;
    if (!vt) return;
    vt.ready.catch(function () {});
    if (!info || info.hacia !== aqui || !hayMovimiento() || !preparar(info.caso, true)) {
      vt.skipTransition();
      limpiar();
      return;
    }
    transitando = true;
    vt.finished.then(function () {
      transitando = false;
      limpiar();
      var titulo = CASOS[aqui] ? document.querySelector('[data-vt="titulo"]') : null;
      if (titulo) titulo.focus({ preventScroll: true });
    });
  });

  /* Una página que vuelve desde la caché de Atrás conserva los nombres
     de su última salida: se limpian, salvo que esté animando. */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && !transitando) limpiar();
    iniciar();
    restaurarRegreso();
  });

  /* ─── REGRESO AL LISTADO ────────────────────────────────────────── */
  function restaurarRegreso() {
    if (!LISTADOS[aqui] || !document.body) return;
    var r = leer('regreso');
    if (!r || r.listado !== aqui) return;
    var tarjeta = tarjetaPara(r.caso);
    var enSuLugar = r.caso === r.casoOrigen;
    /* Si se pasó de un caso a otro, el último puede no estar en el filtro
       de origen (CDBI no es Films): se vuelve a la tarjeta desde la que se
       salió, a la altura en que estaba. El filtro no se toca. */
    if (!tarjeta && r.casoOrigen && r.casoOrigen !== r.caso) {
      tarjeta = tarjetaPara(r.casoOrigen);
      enSuLugar = !!tarjeta;
    }
    if (!tarjeta && document.readyState === 'loading') return;  /* se reintenta al terminar de leer */
    guardar('regreso', null);
    if (enSuLugar && typeof r.y === 'number') {
      window.scrollTo({ top: r.y, left: 0, behavior: 'instant' });
    } else if (tarjeta) {
      tarjeta.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    if (!tarjeta) return;
    var aparece = tarjeta.closest('.reveal');
    if (aparece) aparece.classList.add('visible');
    tarjeta.focus({ preventScroll: true });
  }

  function prepararVolver() {
    var volver = document.querySelector('[data-volver]');
    if (!volver || volver.hasAttribute('data-volver-listo')) return;
    volver.setAttribute('data-volver-listo', '');
    var ref = document.referrer ? ruta(document.referrer) : null;
    var origen = leer('origen');
    if (ref && LISTADOS[ref]) {
      /* Se llegó desde un listado: se vuelve a ese, con su filtro. */
      var u = new URL(document.referrer);
      if (!origen || origen.listado !== ref || origen.caso !== aqui) {
        origen = { listado: ref, url: u.pathname + u.search, y: null, caso: aqui };
      }
    } else if (!(ref && CASOS[ref] && origen && LISTADOS[origen.listado])) {
      return;   /* Entrada directa: queda el href del HTML. */
    }
    volver.href = origen.url;
    if (origen.listado === '/') volver.textContent = '← Volver a proyectos';
    volver.addEventListener('click', function (e) {
      if (!clicSimple(e)) return;
      guardar('regreso', { listado: origen.listado, caso: aqui, casoOrigen: origen.caso, y: origen.y });
    });
  }

  /* ─── RÓTULO DEL MENÚ ───────────────────────────────────────────── */
  function armarRotulo(a) {
    if (a.querySelector('.rotulo')) return;
    var texto = a.textContent.trim();
    if (!texto) return;
    var caja = document.createElement('span');
    caja.className = 'rotulo';
    var palabra = document.createElement('span');
    palabra.className = 'rotulo-palabra';
    palabra.textContent = texto;
    var copia = document.createElement('span');
    copia.className = 'rotulo-copia';
    copia.setAttribute('aria-hidden', 'true');
    copia.textContent = texto;
    caja.appendChild(palabra);
    caja.appendChild(copia);
    a.textContent = '';
    a.appendChild(caja);

    function rodar() {
      if (!hayMovimiento() || a.classList.contains('rotulo-rueda')) return;
      a.classList.add('rotulo-rueda');
    }
    function terminar() { a.classList.remove('rotulo-rueda'); }
    a.addEventListener('pointerenter', rodar);
    a.addEventListener('focus', rodar);
    palabra.addEventListener('animationend', terminar);
    palabra.addEventListener('animationcancel', terminar);
  }

  function iniciar() {
    if (!document.body) return;
    var enlaces = document.querySelectorAll('nav .nav-links a');
    for (var i = 0; i < enlaces.length; i++) armarRotulo(enlaces[i]);
    if (CASOS[aqui]) prepararVolver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      iniciar();
      restaurarRegreso();
    });
  } else {
    iniciar();
    restaurarRegreso();
  }
})();
