/* ═══════════════════════════════════════════════════════════════
   juliansequeira.com — páginas de videoclip
   Dos cosas, las mismas que en La Noche:
     1. Visor de imágenes: los enlaces .ampliable abren la imagen en el
        <dialog id="visor"> de la página. Sin <dialog>, sin visor en la
        página o con Ctrl/⌘, el enlace abre el archivo.
     2. Aparición al scrollear de lo marcado con .reveal.
   Va al final del <body>, sin defer, como el script en línea de La Noche.
   El video lo maneja assets/reproductor.js, como todos los del sitio.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── VISOR DE IMÁGENES ─────────────────────────────────────────── */
  var visor = document.getElementById('visor');
  if (visor && typeof visor.showModal === 'function') {
    var visorImg = document.getElementById('visor-img');
    var visorPie = document.getElementById('visor-pie');
    var vuelveA = null;

    var clicSimple = function (e) {
      return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
    };

    document.querySelectorAll('a.ampliable').forEach(function (enlace) {
      enlace.addEventListener('click', function (e) {
        if (!clicSimple(e)) return;
        e.preventDefault();
        var img = enlace.querySelector('img');
        var figura = enlace.closest('figure');
        var leyenda = figura ? figura.querySelector('figcaption') : null;
        visorImg.src = enlace.href;
        visorImg.alt = img ? img.alt : '';
        if (img) {
          visorImg.setAttribute('width', img.getAttribute('width'));
          visorImg.setAttribute('height', img.getAttribute('height'));
        }
        visorPie.textContent = enlace.getAttribute('data-pie') || (leyenda ? leyenda.textContent.trim() : '');
        vuelveA = enlace;
        visor.showModal();
        document.documentElement.classList.add('visor-abierto');
        var cerrar = visor.querySelector('[data-cerrar]');
        if (cerrar) cerrar.focus();
      });
    });

    visor.addEventListener('close', function () {
      visorImg.removeAttribute('src');
      document.documentElement.classList.remove('visor-abierto');
      if (vuelveA && vuelveA.focus) vuelveA.focus();
      vuelveA = null;
    });
    visor.querySelector('[data-cerrar]').addEventListener('click', function () { visor.close(); });
    /* Un clic fuera de la imagen cierra; sobre la imagen, no. */
    visor.addEventListener('click', function (e) { if (e.target === visor) visor.close(); });
    /* Escape también por el teclado de la página: el cierre nativo del
       <dialog> no siempre llega si se abrió sin una interacción previa. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && visor.open) visor.close();
    });
  }

  /* ─── APARICIÓN AL SCROLLEAR ────────────────────────────────────── */
  document.documentElement.classList.add('js-reveal');
  var els = document.querySelectorAll('.reveal');
  function mostrar(el) { el.classList.add('visible'); }
  function enVista() {
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.classList.contains('visible') && el.getBoundingClientRect().top < innerHeight * 0.95) mostrar(el);
    }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mostrar(e.target); });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(mostrar);
  }
  window.addEventListener('scroll', enVista, { passive: true });
  window.addEventListener('resize', enVista, { passive: true });
  window.addEventListener('load', function () { setTimeout(enVista, 200); });
  enVista();
})();
