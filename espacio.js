/* NIDUS — Mi espacio */
'use strict';
(function () {
  const { D, $, esc, euro, propiedad, tarjeta, aviso, mios, guardar, usuario, cuenta } = window.Nidus;
  const main = $('#contenido');
  const fecha = s => new Date(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const diaLargo = f => { const [a, m, d] = f.split('-').map(Number); return new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); };

  function contar(q) {
    const s = new URLSearchParams(q); const ex = (s.get('extras') || '').split(',').filter(Boolean);
    return D.PROPIEDADES.filter(p => (!s.get('op') || p.op === s.get('op')) && (!s.get('ciudad') || p.ciudad === s.get('ciudad')) && (!s.get('tipo') || p.tipo === s.get('tipo')) &&
      (!s.get('min') || p.precio >= Number(s.get('min'))) && (!s.get('max') || p.precio <= Number(s.get('max'))) && (!s.get('hab') || p.hab >= Number(s.get('hab'))) &&
      (!s.get('m2') || p.m2 >= Number(s.get('m2'))) && ex.every(x => p.extras.includes(x))).length;
  }

  function pintar() {
    const u = usuario(), m = mios();
    const favs = m.favoritos.map(propiedad).filter(Boolean);
    const ahora = new Date();
    const visitas = m.visitas.filter(v => v.estado === 'confirmada' && new Date(`${v.fecha}T${v.hora}`) > ahora).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
    main.innerHTML = `
      <header class="espacio-cabeza">
        <h1 class="titular">${u ? `Hola, ${esc(u.nombre.split(' ')[0])}` : 'Mi espacio'}</h1>
        ${u ? `<p>${esc(u.email)}</p>` : `<div class="invitado"><p>Estás como invitado: lo que guardes se queda en este navegador. Con una cuenta lo tendrás a tu nombre y tus datos rellenarán los formularios.</p>
          <div><button type="button" class="boton boton-oscuro" data-acceso="registro">Crear cuenta</button> <button type="button" class="boton boton-linea" data-acceso="entrar">Entrar</button></div></div>`}
      </header>

      <section class="espacio-seccion"><h2>Favoritos <span>${favs.length}</span></h2>
        ${favs.length ? `<div class="rejilla rejilla-3">${favs.map(p => tarjeta(p)).join('')}</div>`
          : `<p class="espacio-vacio">Marca el corazón de un inmueble para compararlo aquí más tarde. <a class="enlace" href="buscar.html">Buscar inmuebles</a></p>`}
      </section>

      <section class="espacio-seccion"><h2>Visitas <span>${visitas.length}</span></h2>
        ${visitas.length ? `<ul class="filas">${visitas.map(v => { const p = propiedad(v.prop); const a = D.AGENTES[p.agente];
          return `<li><img src="${D.foto(p.fotos[0], 240, 180)}" width="120" height="90" alt="">
            <div><strong><a href="propiedad.html?id=${p.id}">${esc(p.titulo)}</a></strong><span>${esc(diaLargo(v.fecha))}, ${v.hora}</span><span>${esc(p.direccion)}, ${esc(p.ciudad)}. Con ${esc(a.nombre)}, ${a.tel}</span></div>
            <button type="button" class="enlace" data-cancelar="${v.id}">Cancelar</button></li>`; }).join('')}</ul>`
          : `<p class="espacio-vacio">Reserva una visita desde la ficha de cualquier inmueble: verás aquí el día, la hora y el agente.</p>`}
      </section>

      <section class="espacio-seccion"><h2>Búsquedas guardadas <span>${m.busquedas.length}</span></h2>
        ${m.busquedas.length ? `<ul class="filas">${m.busquedas.map(b => `<li>
            <div><strong><a href="buscar.html?${esc(b.q)}">${esc(b.nombre)}</a></strong><span>${contar(b.q)} inmuebles ahora mismo. Guardada el ${fecha(b.fecha)}</span></div>
            <button type="button" class="enlace" data-borrar-busqueda="${b.id}">Borrar</button></li>`).join('')}</ul>`
          : `<p class="espacio-vacio">En el buscador, pulsa «Guardar búsqueda» para volver a ella con un clic.</p>`}
      </section>

      ${m.tasaciones.length ? `<section class="espacio-seccion"><h2>Tasaciones pedidas <span>${m.tasaciones.length}</span></h2><ul class="filas">${m.tasaciones.map(t => `<li>
        <div><strong>${esc(t.tipo)} de ${t.m2} m² en ${esc(t.ciudad)}</strong><span>Estimación: ${euro(t.min)} a ${euro(t.max)}</span><span>Pedida el ${fecha(t.fecha)}. Contacto: ${esc(t.contacto)}</span></div>
        <button type="button" class="enlace" data-borrar-tasacion="${t.id}">Borrar</button></li>`).join('')}</ul></section>` : ''}

      ${m.consultas.length ? `<section class="espacio-seccion"><h2>Consultas <span>${m.consultas.length}</span></h2><ul class="filas">${m.consultas.map(c => `<li>
        <div><strong>${esc(c.motivo)}</strong><span>${esc(c.mensaje)}</span><span>${fecha(c.fecha)}</span></div>
        <button type="button" class="enlace" data-borrar-consulta="${c.id}">Borrar</button></li>`).join('')}</ul></section>` : ''}

      ${u ? `<section class="espacio-seccion"><h2>Tu cuenta</h2>
        <form class="cuenta-form" id="cuenta-form" novalidate>
          <div class="fila-2"><label>Nombre<input name="nombre" value="${esc(u.nombre)}" required></label><label>Teléfono<input name="telefono" type="tel" value="${esc(u.telefono || '')}"></label></div>
          <div class="cuenta-acciones"><button class="boton boton-oscuro" type="submit">Guardar cambios</button>
          <button type="button" class="boton boton-linea" id="salir">Cerrar sesión</button>
          <button type="button" class="enlace peligro" id="borrar-cuenta">Borrar mi cuenta y mis datos</button></div>
        </form></section>` : ''}`;
  }

  main.addEventListener('click', e => {
    const q = s => e.target.closest(s), m = mios();
    const quitar = (lista, id) => { const i = m[lista].findIndex(x => x.id === id); if (i >= 0) m[lista].splice(i, 1); guardar(); };
    if (q('[data-cancelar]')) { m.visitas.find(v => v.id === q('[data-cancelar]').dataset.cancelar).estado = 'cancelada'; guardar(); aviso('Visita cancelada'); }
    else if (q('[data-borrar-busqueda]')) quitar('busquedas', q('[data-borrar-busqueda]').dataset.borrarBusqueda);
    else if (q('[data-borrar-tasacion]')) quitar('tasaciones', q('[data-borrar-tasacion]').dataset.borrarTasacion);
    else if (q('[data-borrar-consulta]')) quitar('consultas', q('[data-borrar-consulta]').dataset.borrarConsulta);
    else if (q('#salir')) { cuenta.salir(); aviso('Sesión cerrada'); }
    else if (q('#borrar-cuenta')) { const b = q('#borrar-cuenta'); if (b.dataset.seguro) { cuenta.borrar(); aviso('Cuenta borrada'); } else { b.dataset.seguro = '1'; b.textContent = 'Pulsa otra vez para borrarla definitivamente'; } }
  });
  main.addEventListener('submit', e => {
    if (e.target.id !== 'cuenta-form') return; e.preventDefault();
    const f = e.target; if (f.nombre.value.trim().length < 2) return f.nombre.focus();
    cuenta.actualizar({ nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim() }); aviso('Cambios guardados');
  });
  document.addEventListener('nidus:cambio', pintar);
  pintar();
})();
