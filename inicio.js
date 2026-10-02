/* NIDUS — página de inicio */
'use strict';
(function () {
  const { D, $, $$, esc, num, euro, precio, tarjeta, aviso, observar, mios, guardar, usuario, emailOk } = window.Nidus;
  const P = D.PROPIEDADES;

  /* Hero */
  const nC = Object.keys(D.CIUDADES).length;
  $('#hero-entrada').textContent = `${P.length} inmuebles en ${nC} ciudades, con la agenda de visitas de cada agente a la vista. Sin llamadas para saber si sigue disponible.`;
  $('#busca-ciudad').insertAdjacentHTML('beforeend', Object.keys(D.CIUDADES).map(c => `<option>${c}</option>`).join(''));
  $('#busca-tipo').insertAdjacentHTML('beforeend', D.TIPOS.map(t => `<option>${t}</option>`).join(''));
  const TOPES = { venta: [0, 300000, 500000, 750000, 1000000, 1500000], alquiler: [0, 800, 1200, 1800, 2500] };
  const form = $('#busca');
  function topes() {
    const op = form.op.value;
    $('#busca-max').innerHTML = TOPES[op].map(v => `<option value="${v || ''}">${v ? euro(v) + (op === 'alquiler' ? '/mes' : '') : 'Sin límite'}</option>`).join('');
  }
  function cuenta() {
    const f = new FormData(form);
    const n = P.filter(p => p.op === f.get('op') && (!f.get('ciudad') || p.ciudad === f.get('ciudad')) && (!f.get('tipo') || p.tipo === f.get('tipo')) && (!f.get('max') || p.precio <= Number(f.get('max')))).length;
    $('#busca-boton').textContent = n ? `Ver ${n} ${n === 1 ? 'inmueble' : 'inmuebles'}` : 'Sin resultados: ampliar';
  }
  form.addEventListener('change', e => { if (e.target.name === 'op') topes(); cuenta(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); const q = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (v) q.set(k, v);
    location.href = 'buscar.html?' + q.toString();
  });
  topes(); cuenta();

  const dest = P.filter(p => p.destacado);
  const arco = $('#hero-arco'); let iArco = 0;
  arco.innerHTML = dest.slice(0, 4).map((p, i) => `
    <a href="propiedad.html?id=${p.id}" class="arco-capa ${i === 0 ? 'activa' : ''}" ${i ? 'tabindex="-1"' : ''}>
      <img src="${D.foto(p.fotos[0], 1000, 1300)}" alt="${esc(p.titulo)} en ${esc(p.barrio)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
      <figcaption><span>${esc(p.titulo)}</span><span>${esc(p.barrio)}, ${precio(p)}</span></figcaption>
    </a>`).join('');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      if (document.hidden || arco.matches(':hover, :focus-within')) return;
      const capas = $$('.arco-capa', arco); capas[iArco].classList.remove('activa'); capas[iArco].tabIndex = -1;
      iArco = (iArco + 1) % capas.length; capas[iArco].classList.add('activa'); capas[iArco].tabIndex = 0;
    }, 5200);
    addEventListener('scroll', () => { if (scrollY < innerHeight) arco.style.setProperty('--desp', (scrollY * 0.08).toFixed(1) + 'px'); }, { passive: true });
  }

  /* Destacados */
  const carril = $('#carril');
  carril.innerHTML = dest.map(p => tarjeta(p)).join('');
  const paso = () => ($('.tarjeta', carril).offsetWidth + 24) * (innerWidth > 900 ? 2 : 1);
  $('#carril-prev').onclick = () => carril.scrollBy({ left: -paso(), behavior: 'smooth' });
  $('#carril-next').onclick = () => carril.scrollBy({ left: paso(), behavior: 'smooth' });
  const estadoNav = () => { $('#carril-prev').disabled = carril.scrollLeft < 8; $('#carril-next').disabled = carril.scrollLeft + carril.clientWidth > carril.scrollWidth - 8; };
  carril.addEventListener('scroll', estadoNav, { passive: true }); estadoNav();

  /* Ciudades */
  $('#lista-ciudades').innerHTML = Object.entries(D.CIUDADES).map(([c, d]) => {
    const n = P.filter(p => p.ciudad === c).length;
    return `<a class="ciudad" href="buscar.html?ciudad=${encodeURIComponent(c)}" data-rev>
      <span class="ciudad-foto"><img src="${D.foto(d.foto, 560, 760)}" width="560" height="760" alt="" loading="lazy"></span>
      <span class="ciudad-nombre">${c}</span><span class="ciudad-dato">${n} inmuebles. ${esc(d.frase)}</span></a>`;
  }).join('');

  const barrios = [...new Set(P.map(p => p.barrio.split(',')[0]))];
  $('#cinta').innerHTML = [0, 1].map(() => barrios.map(b => `<span>${esc(b)}</span>`).join('')).join('');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!quieto) {
    const fotos = $$('.ciudad-foto img'); let pendiente = false;
    const mover = () => { pendiente = false; fotos.forEach(im => { const r = im.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; im.style.setProperty('--py', (((r.top + r.height / 2) / innerHeight - 0.5) * -34).toFixed(1) + 'px'); }); };
    addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }, { passive: true }); mover();
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      const punt = Object.assign(document.createElement('div'), { className: 'puntero', textContent: 'Ver' }); punt.setAttribute('aria-hidden', 'true'); document.body.append(punt);
      let x = 0, y = 0, tx = 0, ty = 0, vivo = false;
      const paso = () => { x += (tx - x) * 0.18; y += (ty - y) * 0.18; punt.style.transform = `translate(${x}px,${y}px)`; if (vivo) requestAnimationFrame(paso); };
      carril.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; const sobre = !!e.target.closest('.tarjeta-foto'); punt.classList.toggle('activo', sobre); if (sobre && !vivo) { vivo = true; x = tx; y = ty; paso(); } });
      carril.addEventListener('mouseleave', () => { punt.classList.remove('activo'); vivo = false; });
    }
  }

  /* Servicios */
  $('#lista-servicios').innerHTML = D.SERVICIOS.map(s => `<li data-rev><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></li>`).join('');

  /* Tasación */
  const tf = $('#tas-form'); const FACTOR = { Piso: 1, 'Ático': 1.2, Loft: 1.1, Estudio: 1.08, Casa: 1.05, Villa: 1.15 };
  $('#tas-ciudad').innerHTML = Object.keys(D.CIUDADES).map(c => `<option>${c}</option>`).join('');
  $('#tas-tipo').innerHTML = D.TIPOS.map(t => `<option>${t}</option>`).join('');
  let ultima = null, cifras = [0, 0], cuadro = 0;
  function tasar() {
    const f = new FormData(tf); const m2 = Math.min(900, Math.max(20, Number(f.get('m2')) || 0));
    const extra = f.getAll('x').reduce((a, v) => a + Number(v), 0);
    const pm2 = D.CIUDADES[f.get('ciudad')].m2 * FACTOR[f.get('tipo')] * Number(f.get('estado')) * (1 + extra);
    const centro = pm2 * m2; ultima = { ciudad: f.get('ciudad'), tipo: f.get('tipo'), m2, min: Math.round(centro * 0.93 / 1000) * 1000, max: Math.round(centro * 1.07 / 1000) * 1000, pm2: Math.round(pm2) };
    const previa = cifras.slice(); cifras = [ultima.min, ultima.max];
    $('#tas-resultado').innerHTML = `<span class="tas-cifra"><b></b><i>a</i><b></b></span>
      <span class="tas-detalle">${num(ultima.pm2)} €/m² para ${ultima.tipo.toLowerCase()} de ${m2} m² en ${esc(ultima.ciudad)}</span>`;
    const bs = $$('#tas-resultado b'); cancelAnimationFrame(cuadro); const t0 = performance.now();
    const tic = t => { const k = quieto ? 1 : Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3);
      bs.forEach((b, i) => { b.textContent = euro(Math.round((previa[i] + (cifras[i] - previa[i]) * e) / 1000) * 1000); });
      if (k < 1) cuadro = requestAnimationFrame(tic); };
    cuadro = requestAnimationFrame(tic);
  }
  tf.addEventListener('input', tasar); tasar();
  const u0 = usuario(); if (u0) { tf.nombre.value = u0.nombre; tf.contacto.value = u0.email; }
  tf.addEventListener('submit', e => {
    e.preventDefault(); const err = $('.form-error', tf); const nombre = tf.nombre.value.trim(), contacto = tf.contacto.value.trim();
    if (nombre.length < 2) { err.textContent = 'Dinos a nombre de quién.'; return tf.nombre.focus(); }
    if (!emailOk(contacto) && contacto.replace(/\D/g, '').length < 9) { err.textContent = 'Deja un teléfono o un email para poder llamarte.'; return tf.contacto.focus(); }
    err.textContent = '';
    mios().tasaciones.push(Object.assign({ id: 't' + Date.now().toString(36), nombre, contacto, fecha: new Date().toISOString() }, ultima));
    guardar(); aviso('Tasación solicitada. La tienes en Mi espacio.');
    tf.nombre.value = ''; tf.contacto.value = '';
  });

  /* Opiniones */
  let iOp = 0; const op = $('#opinion'), opNav = $('#opinion-nav');
  function pintarOpinion() {
    const o = D.OPINIONES[iOp];
    op.innerHTML = `<p>«${esc(o.texto)}»</p><footer><strong>${esc(o.autor)}</strong><span>${esc(o.rol)}</span></footer>`;
    opNav.innerHTML = D.OPINIONES.map((x, i) => `<button type="button" aria-pressed="${i === iOp}" data-i="${i}">${esc(x.autor.split(' ')[0])}</button>`).join('');
  }
  opNav.onclick = e => { const b = e.target.closest('button'); if (!b || Number(b.dataset.i) === iOp) return; iOp = Number(b.dataset.i); op.classList.add('cambia'); setTimeout(() => { pintarOpinion(); op.classList.remove('cambia'); }, 380); };
  pintarOpinion();

  /* Contacto */
  $('#lista-agentes').innerHTML = Object.values(D.AGENTES).map(a => `<li>
    <img src="${D.foto(a.foto, 160, 160)}&crop=faces" width="80" height="80" alt="" loading="lazy">
    <div><strong>${esc(a.nombre)}</strong><span>${esc(a.zona)}</span><a href="tel:${a.tel.replace(/\s/g, '')}">${a.tel}</a></div></li>`).join('');
  const cf = $('#contacto-form'); if (u0) { cf.nombre.value = u0.nombre; cf.email.value = u0.email; }
  cf.addEventListener('submit', e => {
    e.preventDefault(); const err = $('.form-error', cf);
    if (cf.nombre.value.trim().length < 2) { err.textContent = 'Escribe tu nombre.'; return cf.nombre.focus(); }
    if (!emailOk(cf.email.value.trim())) { err.textContent = 'Escribe un email válido.'; return cf.email.focus(); }
    if (cf.mensaje.value.trim().length < 10) { err.textContent = 'Cuéntanos un poco más para poder ayudarte.'; return cf.mensaje.focus(); }
    err.textContent = '';
    mios().consultas.push({ id: 'c' + Date.now().toString(36), motivo: cf.motivo.value, nombre: cf.nombre.value.trim(), email: cf.email.value.trim(), mensaje: cf.mensaje.value.trim(), fecha: new Date().toISOString() });
    guardar(); cf.mensaje.value = ''; aviso('Consulta registrada. La tienes en Mi espacio.');
  });

  observar();
})();
