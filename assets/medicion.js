/* ═══════════════════════════════════════════════════════════════
   juliansequeira.com — medición
   Va con defer y antes que el script de Vercel Analytics, así su cola
   ya tiene el filtro cuando arranca. No usa cookies ni pide permiso.
     Visitas propias: abrir el sitio una vez con ?yo=1 en cada
     navegador las deja fuera de las métricas. ?yo=0 lo revierte.
     Clics que dicen algo (videos, CV, contacto, mail y enlaces a otros
     sitios) van a Vercel con track; los guarda sólo en plan Pro o
     durante el trial.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var propia = false;
  try {
    var params = new URLSearchParams(location.search);
    var yo = params.get('yo');
    if (yo === '1') localStorage.setItem('va-disable', '1');
    if (yo === '0') localStorage.removeItem('va-disable');
    if (yo !== null) {  // la marca no viaja si se comparte el enlace
      params.delete('yo');
      var resto = params.toString();
      history.replaceState(history.state, '', location.pathname + (resto ? '?' + resto : '') + location.hash);
    }
    propia = !!localStorage.getItem('va-disable');
  } catch (e) { /* sin localStorage se mide igual */ }

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  window.va('beforeSend', function (evento) { return propia ? null : evento; });
  if (propia) return;

  function registrar(nombre, detalle) {
    window.va('event', { name: nombre, data: { detalle: String(detalle).slice(0, 120), pagina: location.pathname } });
  }

  function rotulo(a, url) {
    var texto = a.getAttribute('aria-label') || a.textContent.replace(/\s+/g, ' ').trim();
    return texto || url.href;
  }

  /* En captura: el reproductor frena la navegación del enlace, no el clic. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (a.hasAttribute('data-video')) return registrar('video', rotulo(a, url));
    if (url.protocol === 'mailto:') return registrar('mail', url.pathname);
    if (/\.pdf$/i.test(url.pathname)) return registrar('cv', url.pathname.split('/').pop());
    if (url.hostname && url.hostname !== location.hostname) {
      registrar('salida', url.hostname.replace(/^www\./, ''));
    }
  }, true);

  /* Un envío del formulario es un intento; los recibidos se cuentan en Formspree. */
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'contacto') registrar('contacto', 'formulario');
  }, true);
})();
