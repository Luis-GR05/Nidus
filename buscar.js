/* NIDUS — buscador con filtros, orden y mapa sincronizado */
'use strict';
(function () {
  const { D, $, $$, esc, euro, precio, tarjeta, aviso, mios, guardar } = window.Nidus;
  const P = D.PROPIEDADES, f = $('#filtros');
  const CAMPOS = ['op', 'q', 'ciudad', 'tipo', 'min', 'max', 'hab', 'm2'];

  f.ciudad.insertAdjacentHTML('beforeend', Object.keys(D.CIUDADES).map(c => `<option>${c}</option>`).join(''));
  f.tipo.insertAdjacentHTML('beforeend', D.TIPOS.map(t => `<option>${t}</option>`).join(''));
  $('#f-extras').innerHTML = Object.entries(D.EXTRAS).map(([k, v]) => `<label><input type="checkbox" name="extras" value="${k}"><span>${v}</span></label>`).join('');

  /* Estado ⇄ URL */
  function leerUrl() {
    const q = new URLSearchParams(location.search);
    CAMPOS.forEach(c => { const v = q.get(c) || ''; if (c === 'op') { $$('input[name=op]', f).forEach(r => { r.checked = r.value === v; }); } else f[c].value = v; });
    const ex = (q.get('extras') || '').split(',').filter(Boolean);
    $$('input[name=extras]', f).forEach(c => { c.checked = ex.includes(c.value); });
    $('#orden').value = q.get('orden') || 'recientes';
    if (!$('#orden').value) $('#orden').value = 'recientes';
  }
  function estado() {
    const d = new FormData(f);
    return { op: d.get('op') || '', q: (d.get('q') || '').trim(), ciudad: d.get('ciudad'), tipo: d.get('tipo'), min: Number(d.get('min')) || 0, max: Number(d.get('max')) || 0,
      hab: Number(d.get('hab')) || 0, m2: Number(d.get('m2')) || 0, extras: d.getAll('extras'), orden: $('#orden').value };
  }
  function aQuery(s) {
    const q = new URLSearchParams();
    CAMPOS.forEach(c => { if (s[c]) q.set(c, s[c]); });
    if (s.extras.length) q.set('extras', s.extras.join(','));
    if (s.orden !== 'recientes') q.set('orden', s.orden);
    return q.toString();
  }
  const sinAcentos = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  function filtrar(s, omitir) {
    const q = sinAcentos(s.q);
    return P.filter(p =>
      (omitir === 'op' || !s.op || p.op === s.op) &&
      (!s.ciudad || p.ciudad === s.ciudad) && (!s.tipo || p.tipo === s.tipo) &&
      (omitir === 'precio' || ((!s.min || p.precio >= s.min) && (!s.max || p.precio <= s.max))) &&
      (!s.hab || p.hab >= s.hab) && (!s.m2 || p.m2 >= s.m2) &&
      (omitir === 'extras' || s.extras.every(x => p.extras.includes(x))) &&
      (!q || sinAcentos([p.titulo, p.barrio, p.ciudad, p.direccion, p.ref, p.tipo].join(' ')).includes(q)));
  }
  const ORDEN = {
    recientes: (a, b) => a.publicado - b.publicado, 'precio-asc': (a, b) => a.precio - b.precio, 'precio-desc': (a, b) => b.precio - a.precio,
    'm2-desc': (a, b) => b.m2 - a.m2, 'pm2-asc': (a, b) => a.precio / a.m2 - b.precio / b.m2
  };

  /* Mapa */
  let mapa = null; const marcas = new Map();
  function iniciarMapa() {
    if (!window.L) { $('#mapa').innerHTML = '<p class="mapa-fallo">No se pudo cargar el mapa.</p>'; return; }
    mapa = L.map('mapa', { scrollWheelZoom: true, zoomControl: false, attributionControl: true }).setView([40.2, -3.7], 6);
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' }).addTo(mapa);
  }
  const corto = p => p.op === 'alquiler' ? euro(p.precio) : (p.precio >= 1e6 ? (p.precio / 1e6).toFixed(2).replace('.', ',').replace(/,?0+$/, '') + ' M€' : Math.round(p.precio / 1000) + ' mil €');
  function pintarMapa(lista) {
    if (!mapa) return;
    marcas.forEach(m => m.remove()); marcas.clear();
    lista.forEach(p => {
      const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'pin', html: `<span>${corto(p)}</span>`, iconSize: null }), title: p.titulo, riseOnHover: true }).addTo(mapa);
      m.bindPopup(`<a class="globo" href="propiedad.html?id=${p.id}"><img src="${D.foto(p.fotos[0], 360, 220)}" alt=""><strong>${esc(p.titulo)}</strong><span>${esc(p.barrio)} · ${p.m2} m²</span><b>${precio(p)}</b></a>`, { closeButton: false, minWidth: 220, maxWidth: 220, offset: [0, -8] });
      m.on('mouseover', () => resaltar(p.id, true)); m.on('mouseout', () => resaltar(p.id, false));
      marcas.set(p.id, m);
    });
    if (lista.length) mapa.fitBounds(L.latLngBounds(lista.map(p => [p.lat, p.lng])).pad(0.25), { maxZoom: 14, animate: true });
  }
  function resaltar(id, si) {
    const m = marcas.get(id); if (m && m._icon) m._icon.classList.toggle('pin-activo', si);
    const t = $(`.tarjeta[data-id="${id}"]`); if (t) t.classList.toggle('tarjeta-activa', si);
  }

  /* Pintado */
  function pintar(empujar = true) {
    const s = estado(), lista = filtrar(s).sort(ORDEN[s.orden] || ORDEN.recientes);
    const donde = s.ciudad ? ` en ${s.ciudad}` : '', que = s.tipo ? (s.tipo.toLowerCase() + (lista.length === 1 ? '' : 's')) : (lista.length === 1 ? 'inmueble' : 'inmuebles');
    const opt = s.op === 'venta' ? ' en venta' : s.op === 'alquiler' ? ' en alquiler' : '';
    $('#lista-titulo').textContent = `${lista.length} ${que}${opt}${donde}`;
    document.title = `${lista.length} ${que}${opt}${donde} — Nidus`;
    $('#rejilla').innerHTML = lista.map((p, i) => tarjeta(p, { eager: i < 4 })).join('');
    $('#rejilla').hidden = !lista.length; $('#sin-resultados').hidden = !!lista.length;
    if (!lista.length) {
      const pistas = [];
      if (s.min || s.max) { const n = filtrar(s, 'precio').length; if (n) pistas.push(`sin límite de precio hay ${n}`); }
      if (s.extras.length) { const n = filtrar(s, 'extras').length; if (n) pistas.push(`sin los imprescindibles hay ${n}`); }
      if (s.op) { const n = filtrar(s, 'op').length; if (n) pistas.push(`en ${s.op === 'venta' ? 'alquiler' : 'venta'} hay ${n}`); }
      $('#sugerencia').textContent = pistas.length ? `Prueba a relajar algo: ${pistas.join('; ')}.` : 'Prueba con otra ciudad o quita algún filtro.';
    }
    const activos = (s.min ? 1 : 0) + (s.max ? 1 : 0) + (s.hab ? 1 : 0) + (s.m2 ? 1 : 0) + s.extras.length;
    $('#n-filtros').textContent = activos ? `(${activos})` : '';
    const hay = !!aQuery(Object.assign({}, s, { orden: 'recientes' }));
    $('#limpiar').hidden = !hay;
    if (empujar) history.replaceState(null, '', location.pathname + (aQuery(s) ? '?' + aQuery(s) : ''));
    pintarMapa(lista);
  }

  /* Eventos */
  let espera; f.addEventListener('input', e => { clearTimeout(espera); espera = setTimeout(pintar, e.target.type === 'search' || e.target.type === 'number' ? 220 : 0); });
  f.addEventListener('submit', e => e.preventDefault());
  $('#orden').addEventListener('change', () => pintar());
  $('#mas-filtros').onclick = e => { const x = $('#filtros-extra'); x.hidden = !x.hidden; e.currentTarget.setAttribute('aria-expanded', String(!x.hidden)); if (mapa) setTimeout(() => mapa.invalidateSize(), 50); };
  const limpiar = () => { f.reset(); $$('input[name=op]', f)[0].checked = true; $('#orden').value = 'recientes'; pintar(); };
  $('#limpiar').onclick = limpiar; $('#limpiar-2').onclick = limpiar;
  $('#guardar-busqueda').onclick = () => {
    const s = estado(), q = aQuery(s), b = mios().busquedas;
    if (b.some(x => x.q === q)) return aviso('Esa búsqueda ya estaba guardada');
    b.push({ id: 'b' + Date.now().toString(36), q, nombre: q ? $('#lista-titulo').textContent.replace(/^\d+\s/, '').replace(/^./, c => c.toUpperCase()) + (s.q ? ` · «${s.q}»` : '') : 'Todo el catálogo', fecha: new Date().toISOString() });
    guardar(); aviso('Búsqueda guardada en Mi espacio');
  };
  $('#rejilla').addEventListener('mouseover', e => { const t = e.target.closest('.tarjeta'); if (t) resaltar(t.dataset.id, true); });
  $('#rejilla').addEventListener('mouseout', e => { const t = e.target.closest('.tarjeta'); if (t) resaltar(t.dataset.id, false); });
  $('#ver-mapa').onclick = e => {
    const ab = document.body.classList.toggle('mapa-abierto'); e.currentTarget.textContent = ab ? 'Ver lista' : 'Ver mapa';
    if (mapa) setTimeout(() => { mapa.invalidateSize(); pintar(false); }, 60); scrollTo(0, 0);
  };

  leerUrl();
  if (estado().min || estado().max || estado().hab || estado().m2 || estado().extras.length) { $('#filtros-extra').hidden = false; $('#mas-filtros').setAttribute('aria-expanded', 'true'); }
  iniciarMapa(); pintar(false);
})();
