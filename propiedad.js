/* NIDUS — ficha de inmueble */
'use strict';
(function () {
  const { D, $, $$, esc, num, euro, precio, habTxt, propiedad, tarjeta, botonFav, aviso, observar, mios, guardar, usuario } = window.Nidus;
  const main = $('#contenido');
  const p = propiedad(new URLSearchParams(location.search).get('id'));

  if (!p) {
    main.innerHTML = `<section class="no-esta"><h1 class="titular">Este inmueble ya no está publicado</h1>
      <p>Puede que se haya vendido o que el enlace esté incompleto.</p><a class="boton boton-oscuro" href="buscar.html">Ver el catálogo</a></section>`;
    return;
  }
  const ag = D.AGENTES[p.agente], venta = p.op === 'venta';
  document.title = `${p.titulo}, ${p.barrio} — Nidus`;

  /* Fechas y agenda del agente */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const deIso = s => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
  const HORAS = ['10:00', '12:00', '16:30', '18:30'];
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const dias = []; for (let i = 1, d = new Date(); dias.length < 10; i++) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i); if (x.getDay() !== 0) dias.push(iso(x)); }
  const libres = f => HORAS.map(h => ({ h, libre: hash(p.agente + f + h) % 100 >= 40 && !mios().visitas.some(v => v.estado === 'confirmada' && v.fecha === f && v.hora === h) }));
  const miVisita = () => mios().visitas.find(v => v.prop === p.id && v.estado === 'confirmada' && new Date(`${v.fecha}T${v.hora}`) > new Date());
  const fechaLarga = f => deIso(f).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  /* Texto descriptivo */
  const parrafos = [
    p.entradilla,
    `${p.tipo === 'Estudio' ? 'Un único ambiente' : `${p.hab} ${p.hab === 1 ? 'dormitorio' : 'dormitorios'}`} y ${p.banos} ${p.banos === 1 ? 'baño' : 'baños'} en ${p.m2} m² ${p.planta.includes('planta') ? 'repartidos en ' + p.planta.toLowerCase() : 'en planta ' + p.planta.toLowerCase()}. El edificio es de ${p.anio}${p.anio < 1980 ? ' y conserva la estructura original, con las instalaciones renovadas' : ''}. Certificado energético ${p.energia}.`,
    venta ? `Se vende ${p.extras.includes('amueblado') ? 'amueblado' : 'sin muebles'} y libre de cargas. El precio equivale a ${num(p.precio / p.m2)} €/m², frente a una media de ${num(D.CIUDADES[p.ciudad].m2)} €/m² en ${p.ciudad}.`
          : `Se alquila ${p.extras.includes('amueblado') ? 'amueblado' : 'sin muebles'}, con contrato de larga duración. Se pide un mes de fianza y un mes de garantía adicional${p.extras.includes('mascotas') ? '; se admiten mascotas' : ''}.`
  ];

  main.innerHTML = `
    <nav class="migas" aria-label="Ruta"><a href="index.html">Inicio</a><a href="buscar.html?op=${p.op}">${venta ? 'Venta' : 'Alquiler'}</a><a href="buscar.html?op=${p.op}&ciudad=${encodeURIComponent(p.ciudad)}">${esc(p.ciudad)}</a><span aria-current="page">${esc(p.titulo)}</span></nav>

    <header class="ficha-cabeza">
      <div>
        <h1 class="ficha-titulo">${esc(p.titulo)}</h1>
        <p class="ficha-lugar">${esc(p.direccion)}, ${esc(p.barrio)}, ${esc(p.ciudad)}</p>
      </div>
      <div class="ficha-acciones">
        ${botonFav(p.id)}
        <button type="button" class="boton boton-linea" id="compartir">Compartir</button>
      </div>
    </header>

    <section class="mosaico mosaico-${Math.min(p.fotos.length, 5)}" aria-label="Fotografías">
      ${p.fotos.slice(0, 5).map((f, i) => `<button type="button" data-foto="${i}" aria-label="Ampliar fotografía ${i + 1} de ${p.fotos.length}">
        <img src="${D.foto(f, i === 0 ? 1400 : 700, i === 0 ? 940 : 470)}" alt="${i === 0 ? esc(p.titulo) : ''}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></button>`).join('')}
      <button type="button" class="boton boton-claro mosaico-todas" data-foto="0">Ver las ${p.fotos.length} fotos</button>
    </section>

    <div class="ficha-cuerpo">
      <div class="ficha-principal">
        <dl class="claves">
          <div><dt>Superficie</dt><dd>${p.m2} m²</dd></div>
          <div><dt>Dormitorios</dt><dd>${p.hab || 'Estudio'}</dd></div>
          <div><dt>Baños</dt><dd>${p.banos}</dd></div>
          <div><dt>Planta</dt><dd>${esc(p.planta)}</dd></div>
          <div><dt>Año</dt><dd>${p.anio}</dd></div>
          <div><dt>Energía</dt><dd><span class="energia energia-${p.energia}">${p.energia}</span></dd></div>
        </dl>

        <section class="ficha-seccion">
          <h2>Sobre este ${p.tipo.toLowerCase()}</h2>
          <div class="descripcion">${parrafos.map((t, i) => `<p ${i === 0 ? 'class="entradilla"' : ''}>${esc(t)}</p>`).join('')}</div>
        </section>

        <section class="ficha-seccion">
          <h2>Qué incluye</h2>
          <ul class="incluye">${p.extras.map(x => `<li>${esc(D.EXTRAS[x])}</li>`).join('')}</ul>
        </section>

        <section class="ficha-seccion" id="calc"></section>

        <section class="ficha-seccion">
          <h2>Dónde está</h2>
          <p class="ficha-lugar">${esc(p.barrio)}, ${esc(p.ciudad)}. La posición exacta se confirma al reservar la visita.</p>
          <div id="mapa-ficha" class="mapa-ficha"></div>
        </section>
      </div>

      <aside class="ficha-lateral">
        <div class="caja-precio">
          <p class="caja-ref">${venta ? 'Venta' : 'Alquiler'} · Ref. ${p.ref}</p>
          <p class="caja-cifra">${precio(p)}</p>
          <p class="caja-m2">${num(p.precio / p.m2)} €/m²${venta ? '' : ' al mes'}</p>
          <div class="agente">
            <img src="${D.foto(ag.foto, 120, 120)}&crop=faces" width="56" height="56" alt="">
            <div><strong>${esc(ag.nombre)}</strong><span>Agente en ${esc(ag.zona)}</span><a href="tel:${ag.tel.replace(/\s/g, '')}">${ag.tel}</a></div>
          </div>
          <div id="visita"></div>
        </div>
      </aside>
    </div>

    <section class="bloque similares"><header class="bloque-cabeza"><h2 class="titular">Parecidos en ${esc(p.ciudad)}</h2></header><div class="rejilla rejilla-3" id="similares"></div></section>`;

  /* Galería */
  const visor = $('#visor'); let iV = 0, foco = null;
  const verFoto = () => { $('#visor-img').src = D.foto(p.fotos[iV], 1800); $('#visor-img').alt = `${p.titulo}, fotografía ${iV + 1}`; $('#visor-cuenta').textContent = `${iV + 1} / ${p.fotos.length}`; };
  const cerrarVisor = () => { visor.hidden = true; document.body.classList.remove('sin-scroll'); if (foco) foco.focus(); };
  main.addEventListener('click', e => { const b = e.target.closest('[data-foto]'); if (!b) return; foco = b; iV = Number(b.dataset.foto); visor.hidden = false; document.body.classList.add('sin-scroll'); verFoto(); $('.visor-cerrar').focus(); });
  visor.addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (!b) { if (e.target === visor) cerrarVisor(); return; }
    if (b.dataset.v === 'cerrar') return cerrarVisor();
    iV = (iV + Number(b.dataset.v) + p.fotos.length) % p.fotos.length; verFoto();
  });
  addEventListener('keydown', e => { if (visor.hidden) return; if (e.key === 'Escape') cerrarVisor(); if (e.key === 'ArrowRight') { iV = (iV + 1) % p.fotos.length; verFoto(); } if (e.key === 'ArrowLeft') { iV = (iV - 1 + p.fotos.length) % p.fotos.length; verFoto(); } });

  /* Compartir */
  $('#compartir').onclick = async () => {
    const datos = { title: `${p.titulo} — Nidus`, text: `${p.titulo}, ${p.barrio}. ${euro(p.precio)}${venta ? '' : '/mes'}`, url: location.href };
    try { if (navigator.share) await navigator.share(datos); else { await navigator.clipboard.writeText(location.href); aviso('Enlace copiado'); } }
    catch (e) { if (e.name !== 'AbortError') aviso('No se pudo copiar el enlace'); }
  };

  /* Visitas */
  const V = { fecha: '', hora: '' };
  function pintarVisita() {
    const caja = $('#visita'), mv = miVisita(), u = usuario();
    if (mv) {
      caja.innerHTML = `<div class="visita-ok"><p class="visita-ok-titulo">Visita reservada</p>
        <p><strong>${esc(fechaLarga(mv.fecha))}</strong>, a las ${mv.hora}. ${esc(ag.nombre.split(' ')[0])} te espera en el portal.</p>
        <button type="button" class="enlace" id="visita-cancelar">Cancelar visita</button></div>`;
      $('#visita-cancelar').onclick = () => { mv.estado = 'cancelada'; guardar(); pintarVisita(); aviso('Visita cancelada'); };
      return;
    }
    if (!V.fecha) V.fecha = dias.find(d => libres(d).some(x => x.libre)) || dias[0];
    const hs = libres(V.fecha); if (!hs.some(x => x.h === V.hora && x.libre)) V.hora = '';
    caja.innerHTML = `<form class="visita" id="visita-form" novalidate>
      <h2>Reserva una visita</h2>
      <div class="dias" role="radiogroup" aria-label="Día">${dias.map(d => { const n = libres(d).filter(x => x.libre).length; const dt = deIso(d);
        return `<label class="${n ? '' : 'lleno'}"><input type="radio" name="fecha" value="${d}" ${d === V.fecha ? 'checked' : ''} ${n ? '' : 'disabled'}>
          <span><small>${dt.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</small><b>${dt.getDate()}</b><small>${dt.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</small></span></label>`; }).join('')}</div>
      <div class="horas" role="radiogroup" aria-label="Hora">${hs.map(x => `<label class="${x.libre ? '' : 'lleno'}"><input type="radio" name="hora" value="${x.h}" ${x.h === V.hora ? 'checked' : ''} ${x.libre ? '' : 'disabled'}><span>${x.h}</span></label>`).join('')}</div>
      <label>Nombre<input name="nombre" autocomplete="name" value="${esc(u ? u.nombre : '')}" required></label>
      <label>Teléfono<input name="telefono" type="tel" autocomplete="tel" value="${esc(u ? u.telefono || '' : '')}" required></label>
      <p class="form-error" role="alert"></p>
      <button class="boton boton-oscuro boton-ancho" type="submit">${V.hora ? `Reservar el ${deIso(V.fecha).getDate()} a las ${V.hora}` : 'Elige una hora'}</button>
      <p class="visita-nota">Sin coste ni compromiso. Puedes cancelarla cuando quieras.</p>
    </form>`;
    const f = $('#visita-form');
    f.addEventListener('change', e => {
      if (e.target.name === 'fecha') { V.fecha = e.target.value; V.hora = ''; const n = f.nombre.value, t = f.telefono.value; pintarVisita(); const g = $('#visita-form'); g.nombre.value = n; g.telefono.value = t; $(`input[name=fecha][value="${V.fecha}"]`).focus(); }
      if (e.target.name === 'hora') { V.hora = e.target.value; $('button[type=submit]', f).textContent = `Reservar el ${deIso(V.fecha).getDate()} a las ${V.hora}`; }
    });
    f.addEventListener('submit', e => {
      e.preventDefault(); const err = $('.form-error', f);
      if (!V.hora) { err.textContent = 'Elige una de las horas libres.'; return; }
      if (f.nombre.value.trim().length < 2) { err.textContent = 'Escribe tu nombre.'; return f.nombre.focus(); }
      if (f.telefono.value.replace(/\D/g, '').length < 9) { err.textContent = 'Escribe un teléfono de nueve cifras.'; return f.telefono.focus(); }
      mios().visitas.push({ id: 'v' + Date.now().toString(36), prop: p.id, fecha: V.fecha, hora: V.hora, nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), estado: 'confirmada', creada: new Date().toISOString() });
      if (usuario() && !usuario().telefono) window.Nidus.cuenta.actualizar({ telefono: f.telefono.value.trim() });
      guardar(); pintarVisita(); aviso('Visita reservada. La tienes en Mi espacio.');
    });
  }
  pintarVisita();

  /* Calculadora */
  const calc = $('#calc');
  if (venta) {
    calc.innerHTML = `<h2>Calcula tu hipoteca</h2>
      <form class="hipoteca" id="hipoteca">
        <div class="hipoteca-campos">
          <label>Entrada <output id="h-entrada-o"></output><input type="range" name="entrada" min="10" max="60" step="1" value="20"></label>
          <label>Plazo <output id="h-plazo-o"></output><input type="range" name="plazo" min="10" max="40" step="1" value="30"></label>
          <label>Interés fijo <output id="h-interes-o"></output><input type="range" name="interes" min="1" max="7" step="0.05" value="3.1"></label>
        </div>
        <div class="hipoteca-salida" aria-live="polite">
          <p class="hipoteca-cuota"><span>Cuota mensual</span><strong id="h-cuota"></strong></p>
          <div class="hipoteca-barra" aria-hidden="true"><i id="h-barra"></i></div>
          <dl>
            <div><dt>Capital financiado</dt><dd id="h-capital"></dd></div>
            <div><dt>Intereses en todo el plazo</dt><dd id="h-intereses"></dd></div>
            <div><dt>Ahorro necesario (entrada + 10 % de impuestos y gastos)</dt><dd id="h-ahorro"></dd></div>
            <div><dt>Ingresos netos recomendados (cuota ≤ 35 %)</dt><dd id="h-ingresos"></dd></div>
          </dl>
        </div>
      </form><p class="nota">Cálculo orientativo con sistema de amortización francés. No es una oferta de financiación.</p>`;
    const h = $('#hipoteca');
    const calcular = () => {
      const ent = Number(h.entrada.value) / 100, n = Number(h.plazo.value) * 12, i = Number(h.interes.value) / 100 / 12;
      const capital = p.precio * (1 - ent), cuota = capital * i / (1 - Math.pow(1 + i, -n)), intereses = cuota * n - capital;
      $('#h-entrada-o').textContent = `${h.entrada.value} % · ${euro(p.precio * ent)}`; $('#h-plazo-o').textContent = `${h.plazo.value} años`;
      $('#h-interes-o').textContent = `${Number(h.interes.value).toFixed(2).replace('.', ',')} %`;
      $('#h-cuota').textContent = euro(cuota); $('#h-capital').textContent = euro(capital); $('#h-intereses').textContent = euro(intereses);
      $('#h-ahorro').textContent = euro(p.precio * ent + p.precio * 0.1); $('#h-ingresos').textContent = euro(cuota / 0.35) + ' al mes';
      $('#h-barra').style.width = (capital / (capital + intereses) * 100).toFixed(1) + '%';
    };
    h.addEventListener('input', calcular); calcular();
  } else {
    calc.innerHTML = `<h2>Qué necesitas para entrar</h2>
      <dl class="entrada-alquiler">
        <div><dt>Primer mes</dt><dd>${euro(p.precio)}</dd></div>
        <div><dt>Fianza legal (un mes)</dt><dd>${euro(p.precio)}</dd></div>
        <div><dt>Garantía adicional (un mes)</dt><dd>${euro(p.precio)}</dd></div>
        <div class="total"><dt>Total a la firma</dt><dd>${euro(p.precio * 3)}</dd></div>
        <div><dt>Ingresos netos recomendados (alquiler ≤ 35 %)</dt><dd>${euro(p.precio / 0.35)} al mes</dd></div>
      </dl><p class="nota">Los honorarios de gestión los paga el propietario.</p>`;
  }

  /* Mapa */
  if (window.L) {
    const m = L.map('mapa-ficha', { scrollWheelZoom: false, zoomControl: true }).setView([p.lat, p.lng], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }).addTo(m);
    L.circle([p.lat, p.lng], { radius: 180, color: '#24332b', weight: 1.5, fillColor: '#7a9e7e', fillOpacity: 0.3 }).addTo(m);
  } else $('#mapa-ficha').innerHTML = '<p class="mapa-fallo">No se pudo cargar el mapa.</p>';

  /* Similares */
  const sim = D.PROPIEDADES.filter(x => x.id !== p.id && x.op === p.op)
    .sort((a, b) => ((a.ciudad === p.ciudad ? 0 : 1e9) + Math.abs(a.precio - p.precio)) - ((b.ciudad === p.ciudad ? 0 : 1e9) + Math.abs(b.precio - p.precio))).slice(0, 3);
  $('#similares').innerHTML = sim.map(x => tarjeta(x)).join('');
  if (!sim.some(x => x.ciudad === p.ciudad)) $('.similares .titular').textContent = venta ? 'Otros inmuebles en venta' : 'Otros alquileres';
  observar();
})();
