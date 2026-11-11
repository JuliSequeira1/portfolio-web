/* ═══════════════════════════════════════════════════════════════
   Fichas de proyecto compartidas · comportamiento
   Mejora progresiva. Sin este archivo cada enlace hace lo que dice
   su href: el video abre en YouTube y la imagen grande, sola.
   Con él, los dos abren en un <dialog> modal: el fondo queda inerte,
   Esc o «Close» lo cierran y el foco vuelve al control que lo abrió.
   El iframe existe sólo mientras el diálogo está abierto y se pide
   recién al hacer clic: nada suena sin una acción de quien mira.

   YouTube exige el Referer: no poner Referrer-Policy: no-referrer
   en el sitio o el reproductor da error 153.

   Fuente: Proyectos creativos/_CASOS WEB/_FICHAS-COMPARTIDAS/ficha.js
   generar.py lo copia a assets/fichas/ de cada sitio.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (typeof HTMLDialogElement !== 'function') return;
  /* Con esto, el póster y la fachada muestran que se pueden tocar. */
  document.documentElement.classList.add('js-fx');

  var es = (document.documentElement.lang || '').slice(0, 2) === 'es';
  var CLOSE = es ? 'Cerrar' : 'Close';

  var dialog, titleEl, closeBtn, body, back = null;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'fx-dialog';
    dialog.setAttribute('aria-labelledby', 'fx-dialog-title');
    dialog.innerHTML =
      '<div class="fx-dialog-bar">' +
        '<p class="fx-dialog-title" id="fx-dialog-title"></p>' +
        '<button class="fx-dialog-close" type="button"></button>' +
      '</div>' +
      '<div class="fx-dialog-body"></div>';
    document.body.appendChild(dialog);
    titleEl = dialog.querySelector('.fx-dialog-title');
    closeBtn = dialog.querySelector('.fx-dialog-close');
    body = dialog.querySelector('.fx-dialog-body');
    closeBtn.textContent = CLOSE;
    closeBtn.addEventListener('click', function () { dialog.close(); });
    /* Un clic en el fondo, fuera del cuadro, también cierra. */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      body.replaceChildren();          /* cerrar es parar el video */
      if (back && back.isConnected) back.focus();
      back = null;
    });
  }

  function open(origin, title, node) {
    if (!dialog) build();
    /* La fachada y el póster no reciben foco de teclado: el foco vuelve
       al botón que hace lo mismo (data-fx-return). */
    var ret = origin.getAttribute('data-fx-return');
    back = (ret && document.getElementById(ret)) || origin;
    titleEl.textContent = title;
    body.replaceChildren(node);
    dialog.showModal();
    closeBtn.focus();
  }

  function embedUrl(spec) {
    var m = /^youtube:([\w-]{6,})$/.exec((spec || '').trim());
    if (!m) return null;
    return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&playsinline=1';
  }

  function video(a) {
    var src = embedUrl(a.getAttribute('data-fx-video'));
    if (!src) return false;
    var title = a.getAttribute('data-fx-title') || a.textContent.trim();
    var box = document.createElement('div');
    box.className = 'fx-dialog-video';
    var f = document.createElement('iframe');
    f.src = src;
    f.title = title;
    f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    f.setAttribute('allowfullscreen', '');
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    box.appendChild(f);
    open(a, title, box);
    return true;
  }

  /* Imagen ampliada. Las del mismo grupo (data-fx-zoom="grupo") se
     numeran: «3 / 20». El pie sale de data-fx-caption y el texto
     alternativo, de la miniatura o de data-fx-alt. */
  function zoom(a) {
    var group = a.getAttribute('data-fx-zoom');
    var all = document.querySelectorAll('[data-fx-zoom="' + group + '"]:not([data-fx-return])');
    var list = Array.prototype.slice.call(all);
    var i = list.indexOf(a);
    var thumb = a.tagName === 'IMG' ? a : a.querySelector('img');
    var fig = document.createElement('figure');
    fig.className = 'fx-dialog-figure';
    var img = document.createElement('img');
    img.src = a.getAttribute('href') || a.getAttribute('data-fx-href');
    img.alt = a.getAttribute('data-fx-alt') || (thumb ? thumb.alt : '');
    var w = a.getAttribute('data-fx-w'), h = a.getAttribute('data-fx-h');
    if (w && h) { img.width = +w; img.height = +h; }
    img.decoding = 'async';
    fig.appendChild(img);
    var cap = a.getAttribute('data-fx-caption');
    if (cap) {
      var fc = document.createElement('figcaption');
      fc.textContent = cap;
      fig.appendChild(fc);
    }
    var title = list.length > 1 && i > -1 ? (i + 1) + ' / ' + list.length : (a.getAttribute('data-fx-title') || '');
    open(a, title, fig);
    return true;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('[data-fx-video], [data-fx-zoom]') : null;
    if (!a) return;
    var done = a.hasAttribute('data-fx-video') ? video(a) : zoom(a);
    if (done) e.preventDefault();
  });
})();
