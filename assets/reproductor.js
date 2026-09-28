/* ═══════════════════════════════════════════════════════════════
   juliansequeira.com — reproductor de video compartido
   Cada video es un enlace a su página pública (youtu.be, Dailymotion)
   con el atributo data-video. Sin JS, sin <dialog> o con Ctrl/⌘ el
   enlace navega normal; con un clic simple se abre acá, en un <dialog>
   modal que arma este archivo: foco atrapado, Escape, ✕ siempre a la
   vista y el video nunca más alto que la ventana.
     data-video="vertical"  abre en 9:16.
     data-salida="URL"      cambia el enlace «Ver en…» del reproductor.
   Va con defer: sólo necesita el DOM. El aspecto está en reproductor.css.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!('HTMLDialogElement' in window) || typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  var enlaces = document.querySelectorAll('a[href][data-video]');
  if (!enlaces.length) return;

  /* De la URL pública sale la de embed. Si no se reconoce, el enlace navega. */
  function embed(url) {
    var m;
    if ((m = url.match(/^https?:\/\/(?:www\.)?youtu\.be\/([\w-]{6,})/)) ||
        (m = url.match(/^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/))) {
      return 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0';
    }
    if ((m = url.match(/^https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-z0-9]+)/i))) {
      return 'https://www.dailymotion.com/embed/video/' + m[1] + '?autoplay=1';
    }
    return null;
  }
  function nombreSitio(url) {
    if (/youtu/.test(url)) return 'YouTube';
    if (/dailymotion/.test(url)) return 'Dailymotion';
    if (/imdb/.test(url)) return 'IMDb';
    return 'el sitio';
  }

  var dialogo = document.createElement('dialog');
  dialogo.className = 'visor';
  dialogo.id = 'reproductor';
  dialogo.setAttribute('aria-label', 'Reproductor de video');
  dialogo.innerHTML =
    '<div class="visor-controles">' +
      '<a class="visor-boton visor-salida" target="_blank" rel="noopener"></a>' +
      '<button class="visor-boton" type="button" data-cerrar aria-label="Cerrar el video">✕</button>' +
    '</div>' +
    '<div class="visor-caja visor-caja-video"></div>';
  document.body.appendChild(dialogo);
  var caja = dialogo.querySelector('.visor-caja-video');
  var salida = dialogo.querySelector('.visor-salida');
  var cerrar = dialogo.querySelector('[data-cerrar]');
  var vuelveA = null;

  function clicSimple(e) {
    return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }

  function abrir(enlace, src) {
    vuelveA = enlace;
    var fuera = enlace.getAttribute('data-salida') || enlace.href;
    salida.href = fuera;
    salida.textContent = 'Ver en ' + nombreSitio(fuera) + ' ↗';
    caja.classList.toggle('vertical', enlace.getAttribute('data-video') === 'vertical');
    /* El iframe se crea al abrir y se saca al cerrar: así el video para. */
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = enlace.getAttribute('aria-label') || 'Reproductor de video';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; web-share');
    iframe.setAttribute('allowfullscreen', '');
    caja.appendChild(iframe);
    dialogo.showModal();
    document.documentElement.classList.add('visor-abierto');
    cerrar.focus();
  }

  enlaces.forEach(function (enlace) {
    enlace.addEventListener('click', function (e) {
      if (!clicSimple(e)) return;
      var src = embed(enlace.href);
      if (!src) return;
      e.preventDefault();
      abrir(enlace, src);
    });
  });

  cerrar.addEventListener('click', function () { dialogo.close(); });
  /* Un clic fuera del video cierra; sobre el video, no. */
  dialogo.addEventListener('click', function (e) { if (e.target === dialogo) dialogo.close(); });
  dialogo.addEventListener('close', function () {
    caja.textContent = '';
    document.documentElement.classList.remove('visor-abierto');
    if (vuelveA && vuelveA.focus) vuelveA.focus();
    vuelveA = null;
  });
  /* Escape también por el teclado de la página: el cierre nativo no
     siempre llega, por ejemplo si se abrió sin una interacción previa. */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialogo.open) dialogo.close();
  });
})();
