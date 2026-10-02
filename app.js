/* NIDUS — núcleo compartido por todas las páginas */
'use strict';
(function () {
  const D = window.NIDUS_DATOS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(Math.round(n));
  const euro = n => num(n) + ' €';
  const precio = p => euro(p.precio) + (p.op === 'alquiler' ? '<small>/mes</small>' : '');
  const habTxt = p => p.hab === 0 ? 'Estudio' : `${p.hab} hab.`;
  const propiedad = id => D.PROPIEDADES.find(p => p.id === id);
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  /* ───── Almacén ───── */
  const CLAVE = 'nidus.v1';
  const vacio = () => ({ favoritos: [], visitas: [], busquedas: [], tasaciones: [], consultas: [] });
  let E = { cuentas: {}, sesion: null, datos: { invitado: vacio() } };
  try { E = Object.assign(E, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) { /* sin almacenamiento */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) { /* sin persistencia */ } document.dispatchEvent(new CustomEvent('nidus:cambio')); };
  const usuario = () => (E.sesion && E.cuentas[E.sesion]) ? Object.assign({ email: E.sesion }, E.cuentas[E.sesion]) : null;
  const mios = () => { const k = E.sesion || 'invitado'; return (E.datos[k] = Object.assign(vacio(), E.datos[k])); };

  async function resumen(texto) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (let i = 0; i < texto.length; i++) h = (h * 33) ^ texto.charCodeAt(i); return 'x' + (h >>> 0).toString(16);
  }
  function fusionarInvitado(email) {
    const inv = E.datos.invitado || vacio(); const yo = (E.datos[email] = Object.assign(vacio(), E.datos[email]));
    yo.favoritos = [...new Set([...yo.favoritos, ...inv.favoritos])];
    ['visitas', 'busquedas', 'tasaciones', 'consultas'].forEach(k => { yo[k] = yo[k].concat(inv[k]); });
    E.datos.invitado = vacio();
  }
  const cuenta = {
    async registrar(nombre, email, clave) {
      email = email.trim().toLowerCase();
      if (E.cuentas[email]) throw new Error('Ya existe una cuenta con ese email. Entra con tu contraseña.');
      const sal = Math.random().toString(36).slice(2) + Date.now().toString(36);
      E.cuentas[email] = { nombre: nombre.trim(), sal, hash: await resumen(sal + clave), telefono: '' };
      E.sesion = email; fusionarInvitado(email); guardar();
    },
    async entrar(email, clave) {
      email = email.trim().toLowerCase(); const c = E.cuentas[email];
      if (!c || c.hash !== await resumen(c.sal + clave)) throw new Error('Email o contraseña incorrectos.');
      E.sesion = email; fusionarInvitado(email); guardar();
    },
    salir() { E.sesion = null; guardar(); },
    actualizar(campos) { if (E.sesion) { Object.assign(E.cuentas[E.sesion], campos); guardar(); } },
    borrar() { if (!E.sesion) return; delete E.datos[E.sesion]; delete E.cuentas[E.sesion]; E.sesion = null; guardar(); }
  };

  /* ───── Favoritos ───── */
  const esFav = id => mios().favoritos.includes(id);
  function alternarFav(id) {
    const f = mios().favoritos, i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    guardar();
    $$(`[data-fav="${id}"]`).forEach(b => { b.setAttribute('aria-pressed', String(i < 0)); b.setAttribute('aria-label', i < 0 ? 'Quitar de favoritos' : 'Guardar en favoritos'); });
    aviso(i < 0 ? 'Guardado en tus favoritos' : 'Quitado de tus favoritos');
  }

  /* ───── Avisos ───── */
  function aviso(texto) {
    let c = $('#avisos'); if (!c) { c = Object.assign(document.createElement('div'), { id: 'avisos', className: 'avisos' }); c.setAttribute('aria-live', 'polite'); document.body.append(c); }
    const el = Object.assign(document.createElement('div'), { className: 'aviso', textContent: texto });
    c.append(el); setTimeout(() => { el.classList.add('fuera'); setTimeout(() => el.remove(), 400); }, 3600);
  }

  /* ───── Plantillas ───── */
  const CORAZON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  function botonFav(id) {
    return `<button type="button" class="fav" data-fav="${id}" aria-pressed="${esFav(id)}" aria-label="${esFav(id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${CORAZON}</button>`;
  }
  function tarjeta(p, opciones = {}) {
    return `<article class="tarjeta" data-id="${p.id}">
      <a class="tarjeta-foto" href="propiedad.html?id=${p.id}" tabindex="-1" aria-hidden="true">
        <img src="${D.foto(p.fotos[0], 720, 540)}" width="720" height="540" alt="" loading="${opciones.eager ? 'eager' : 'lazy'}">
      </a>
      ${botonFav(p.id)}
      <div class="tarjeta-cuerpo">
        <p class="tarjeta-lugar">${esc(p.barrio)}, ${esc(p.ciudad)}</p>
        <h3 class="tarjeta-titulo"><a href="propiedad.html?id=${p.id}">${esc(p.titulo)}</a></h3>
        <p class="tarjeta-datos"><span>${p.m2} m²</span><span>${habTxt(p)}</span><span>${p.banos} ${p.banos === 1 ? 'baño' : 'baños'}</span></p>
        <p class="tarjeta-precio">${precio(p)}<span class="tarjeta-op">${p.op === 'alquiler' ? 'Alquiler' : 'Venta'}</span></p>
      </div>
    </article>`;
  }

  /* ───── Cabecera, pie y acceso ───── */
  function pintarCabecera() {
    const hueco = $('[data-nidus="cabecera"]'); if (!hueco) return;
    const u = usuario(), nf = mios().favoritos.length, pag = document.body.dataset.pagina;
    hueco.innerHTML = `
      <a href="#contenido" class="salto">Saltar al contenido</a>
      <header class="cab ${document.body.dataset.cab || ''}" id="cab">
        <a href="index.html" class="logo" aria-label="Nidus, inicio">Nidus</a>
        <nav class="cab-nav" id="cab-nav" aria-label="Principal">
          <a href="buscar.html?op=venta" ${pag === 'buscar' && new URLSearchParams(location.search).get('op') === 'venta' ? 'aria-current="page"' : ''}>Comprar</a>
          <a href="buscar.html?op=alquiler" ${pag === 'buscar' && new URLSearchParams(location.search).get('op') === 'alquiler' ? 'aria-current="page"' : ''}>Alquilar</a>
          <a href="index.html#tasacion">Vender</a>
          <a href="index.html#servicios">Servicios</a>
        </nav>
        <div class="cab-acc">
          <a href="mi-espacio.html" class="cab-fav" aria-label="Favoritos: ${nf}">${CORAZON}<span>${nf}</span></a>
          ${u ? `<a href="mi-espacio.html" class="cab-usuario">${esc(u.nombre.split(' ')[0])}</a>`
              : `<button type="button" class="boton boton-claro" data-acceso>Acceder</button>`}
          <button type="button" class="cab-menu" id="cab-menu" aria-label="Abrir menú" aria-expanded="false" aria-controls="cab-nav"><span></span><span></span></button>
        </div>
      </header>`;
    const cab = $('#cab'), bm = $('#cab-menu'), nav = $('#cab-nav');
    let ultimo = scrollY;
    const alScroll = () => {
      cab.classList.toggle('cab-solida', scrollY > 30);
      cab.classList.toggle('cab-oculta', scrollY > ultimo && scrollY > 400 && !nav.classList.contains('abierto'));
      ultimo = scrollY;
    };
    if (!pintarCabecera.listo) { addEventListener('scroll', () => { const c = $('#cab'); if (c) alScrollGlobal(); }, { passive: true }); pintarCabecera.listo = true; }
    alScrollGlobal = alScroll; alScroll();
    bm.onclick = () => { const ab = nav.classList.toggle('abierto'); bm.setAttribute('aria-expanded', String(ab)); document.body.classList.toggle('sin-scroll', ab); };
  }
  let alScrollGlobal = () => {};

  function pintarPie() {
    const hueco = $('[data-nidus="pie"]'); if (!hueco) return;
    const cs = Object.keys(D.CIUDADES);
    hueco.innerHTML = `<footer class="pie">
      <div class="pie-rejilla">
        <div><a href="index.html" class="logo logo-pie">Nidus</a><p class="pie-lema">El espacio que defines tú.</p></div>
        <nav aria-label="Comprar"><h2>Comprar</h2>${cs.map(c => `<a href="buscar.html?op=venta&ciudad=${encodeURIComponent(c)}">${c}</a>`).join('')}</nav>
        <nav aria-label="Alquilar"><h2>Alquilar</h2>${cs.map(c => `<a href="buscar.html?op=alquiler&ciudad=${encodeURIComponent(c)}">${c}</a>`).join('')}</nav>
        <nav aria-label="Nidus"><h2>Nidus</h2><a href="index.html#tasacion">Valorar mi vivienda</a><a href="index.html#servicios">Servicios</a><a href="mi-espacio.html">Mi espacio</a><a href="index.html#contacto">Contacto</a></nav>
      </div>
      <p class="pie-legal">© 2026 Nidus Inmobiliaria. Proyecto de demostración: inmuebles, agentes y precios son ficticios. Tus datos se guardan solo en este navegador. Fotografías de Unsplash, mapas © OpenStreetMap y CARTO.</p>
    </footer>`;
  }

  function abrirAcceso(modo = 'entrar') {
    let m = $('#acceso');
    if (!m) {
      m = document.createElement('dialog'); m.id = 'acceso'; m.className = 'modal';
      document.body.append(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-cerrar]')) m.close(); });
    }
    const pintar = () => {
      const reg = modo === 'registro';
      m.innerHTML = `
        <button type="button" class="modal-cerrar" data-cerrar aria-label="Cerrar">Cerrar</button>
        <h2 class="modal-titulo">${reg ? 'Crea tu cuenta' : 'Entra en Nidus'}</h2>
        <p class="modal-nota">${reg ? 'Guarda favoritos, visitas y búsquedas a tu nombre.' : 'Recupera tus favoritos y tus visitas.'}</p>
        <form id="acceso-form" novalidate>
          ${reg ? '<label>Nombre<input name="nombre" autocomplete="name" required></label>' : ''}
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          <label>Contraseña<input name="clave" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required></label>
          <p class="form-error" role="alert"></p>
          <button class="boton boton-oscuro boton-ancho" type="submit">${reg ? 'Crear cuenta' : 'Entrar'}</button>
        </form>
        <p class="modal-cambio">${reg ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'} <button type="button" class="enlace" id="acceso-cambio">${reg ? 'Entrar' : 'Crear una'}</button></p>
        <p class="modal-pie">La cuenta se crea en este navegador; no se envía a ningún servidor.</p>`;
      $('#acceso-cambio', m).onclick = () => { modo = reg ? 'entrar' : 'registro'; pintar(); $('input', m).focus(); };
      $('#acceso-form', m).onsubmit = async e => {
        e.preventDefault(); const f = e.target, err = $('.form-error', f);
        const nombre = reg ? f.nombre.value.trim() : '', email = f.email.value.trim(), clave = f.clave.value;
        if (reg && nombre.length < 2) { err.textContent = 'Escribe tu nombre.'; return f.nombre.focus(); }
        if (!emailOk(email)) { err.textContent = 'Escribe un email válido.'; return f.email.focus(); }
        if (clave.length < 6) { err.textContent = 'La contraseña necesita al menos 6 caracteres.'; return f.clave.focus(); }
        try {
          if (reg) await cuenta.registrar(nombre, email, clave); else await cuenta.entrar(email, clave);
          m.close(); aviso(`Hola, ${usuario().nombre.split(' ')[0]}`);
        } catch (ex) { err.textContent = ex.message; }
      };
    };
    pintar(); m.showModal();
  }

  /* ───── Aparición al hacer scroll (una sola vez, discreta) ───── */
  function observar(raiz = document) {
    const els = $$('[data-rev]:not(.visto)', raiz);
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(e => e.classList.add('visto')); return; }
    const io = observar.io || (observar.io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('visto'); observar.io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }));
    els.forEach(e => io.observe(e));
  }

  /* ───── Imágenes: respaldo ───── */
  const RESPALDO = ['1560448204-e02f11c3d0e2', '1600596542815-ffad4c1539a9', '1493246318656-5bfd4cfb29b8'];
  document.addEventListener('error', e => {
    const img = e.target; if (!(img instanceof HTMLImageElement) || img.closest('.leaflet-container')) return;
    const n = Number(img.dataset.fb || 0);
    if (n < RESPALDO.length) { img.dataset.fb = n + 1; img.src = D.foto(RESPALDO[n], 900, 675); } else img.classList.add('sin-foto');
  }, true);

  /* ───── Eventos globales ───── */
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-fav]'); if (f) { e.preventDefault(); return alternarFav(f.dataset.fav); }
    const a = e.target.closest('[data-acceso]'); if (a) { e.preventDefault(); return abrirAcceso(a.dataset.acceso || 'entrar'); }
  });
  document.addEventListener('nidus:cambio', pintarCabecera);

  window.Nidus = { D, $, $$, esc, num, euro, precio, habTxt, propiedad, emailOk, tarjeta, botonFav, aviso, observar, abrirAcceso,
    usuario, mios, guardar, cuenta, esFav, alternarFav, estado: () => E };

  const arrancar = () => { pintarCabecera(); pintarPie(); observar(); document.documentElement.classList.add('listo'); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
