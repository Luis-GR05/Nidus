/* NIDUS — catálogo. Fotografías: Unsplash (licencia Unsplash, uso libre). Inmuebles y agentes ficticios. */
(function () {
  const foto = (id, w, h) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=72&w=${w}` + (h ? `&h=${h}` : '');

  const CIUDADES = {
    Madrid:    { foto: '1570698473651-b2de99bae12f', m2: 4300, centro: [40.4168, -3.7038], frase: 'Barrios con nombre propio' },
    Barcelona: { foto: '1583167607431-5e8d3de517d5', m2: 4500, centro: [41.3874, 2.1686], frase: 'Entre el mar y el Eixample' },
    Valencia:  { foto: '1698141825633-a34c5f129225', m2: 2600, centro: [39.4699, -0.3763], frase: 'Luz todo el año' },
    Sevilla:   { foto: '1661442196003-f2f6eb54bd94', m2: 2400, centro: [37.3891, -5.9845], frase: 'Patios y azoteas' },
    Málaga:    { foto: '1642872593087-eef0fa7a2f5d', m2: 3100, centro: [36.7213, -4.4214], frase: 'La costa que no se acaba' }
  };

  const AGENTES = {
    mireia: { nombre: 'Mireia Alcántara', zona: 'Barcelona y Valencia', foto: '1592275772614-ec71b19e326f', tel: '+34 930 000 142' },
    andres: { nombre: 'Andrés Villalba', zona: 'Madrid', foto: '1647580427155-0483906cb9de', tel: '+34 910 000 218' },
    rocio:  { nombre: 'Rocío Benjumea', zona: 'Sevilla y Málaga', foto: '1585240975858-7264fd020798', tel: '+34 950 000 377' }
  };

  const EXTRAS = { terraza: 'Terraza', garaje: 'Garaje', piscina: 'Piscina', ascensor: 'Ascensor', mascotas: 'Admite mascotas', amueblado: 'Amueblado', aire: 'Aire acondicionado', trastero: 'Trastero', jardin: 'Jardín', vistas: 'Vistas despejadas' };
  const TIPOS = ['Piso', 'Ático', 'Loft', 'Estudio', 'Casa', 'Villa'];

  // id, título, tipo, operación, ciudad, barrio, dirección, lat, lng, precio, m², hab, baños, planta, año, energía, agente, extras, fotos, destacado, entradilla
  const F = [
    ['penthouse-barceloneta', 'Ático frente al mar', 'Ático', 'venta', 'Barcelona', 'La Barceloneta', 'Passeig Marítim 142', 41.3790, 2.1905, 1250000, 180, 4, 3, '5.ª', 2021, 'A', 'mireia',
      ['terraza', 'garaje', 'piscina', 'ascensor', 'aire', 'vistas', 'trastero'],
      ['1785129495552-d0d0ce25212b', '1776362355123-ca966d36e29c', '1671197244266-73129c97c096', '1765279333918-949ddcb655ba', '1733426107854-ee00a25d72a7'], true,
      'Última planta en primera línea, con 60 m² de terraza orientada al sureste y el Mediterráneo en cada ventana.'],
    ['loft-malasana', 'Loft industrial reformado', 'Loft', 'alquiler', 'Madrid', 'Malasaña', 'Calle del Pez 18', 40.4252, -3.7062, 1850, 89, 1, 1, '1.ª', 1932, 'D', 'andres',
      ['ascensor', 'amueblado', 'aire', 'mascotas'],
      ['1759264244827-1dde5bee00a5', '1783990349147-906f62b882c1', '1649083048337-4aeb6dda80bb', '1724582586413-6b69e1c94a17'], true,
      'Antigua imprenta convertida en vivienda: techos de 4,2 m, ladrillo visto y ventanales a una calle peatonal.'],
    ['villa-marbella', 'Villa con jardín y piscina', 'Villa', 'venta', 'Málaga', 'Marbella, Nagüeles', 'Camino de la Cruz 9', 36.5154, -4.9120, 875000, 320, 5, 4, 'Dos plantas', 2008, 'B', 'rocio',
      ['piscina', 'jardin', 'garaje', 'terraza', 'aire', 'vistas'],
      ['1787868377879-98168d69cfe2', '1780257562963-3389a4105371', '1759147960461-b74a7e9a75d4', '1750420556288-d0e32a6f517b', '1646974400439-8472d58bb19e'], true,
      'Parcela de 1.100 m² a diez minutos de la playa, con piscina de sal, porche y un olivo centenario en el jardín.'],
    ['estudio-ruzafa', 'Estudio céntrico y luminoso', 'Estudio', 'alquiler', 'Valencia', 'Ruzafa', 'Carrer de Sueca 31', 39.4612, -0.3742, 780, 42, 0, 1, '3.ª', 1958, 'E', 'mireia',
      ['ascensor', 'amueblado', 'aire'],
      ['1629042306558-7d1e15cc02fa', '1722605090433-41d1183a792d', '1572742482459-e04d6cfdd6f3'], true,
      'Un solo ambiente bien resuelto, balcón a la calle y el mercado de Ruzafa a dos minutos andando.'],
    ['piso-chamberi', 'Piso señorial con balcones', 'Piso', 'venta', 'Madrid', 'Chamberí', 'Calle de Zurbano 54', 40.4349, -3.6925, 965000, 162, 4, 2, '2.ª', 1924, 'D', 'andres',
      ['ascensor', 'trastero', 'aire'],
      ['1780257562941-d9a6923befa1', '1635321350281-e2a91ecffd00', '1560448075-57d0285fc59b', '1564540579594-0930edb6de43'], false,
      'Finca clásica rehabilitada: suelos de roble en espiga, molduras originales y cinco balcones a Zurbano.'],
    ['atico-salamanca', 'Ático con terraza panorámica', 'Ático', 'venta', 'Madrid', 'Salamanca', 'Calle de Ayala 77', 40.4288, -3.6790, 1480000, 145, 3, 3, '7.ª', 2019, 'A', 'andres',
      ['terraza', 'garaje', 'ascensor', 'aire', 'vistas', 'trastero'],
      ['1493246318656-5bfd4cfb29b8', '1560448204-e02f11c3d0e2', '1649083048391-1c9e82472f65', '1631048501786-4e97f20eac71', '1742134131017-44d377a611b1'], true,
      'Terraza de 48 m² sobre los tejados del barrio de Salamanca y un interior de obra reciente, sin nada que tocar.'],
    ['piso-lavapies', 'Piso con patio interior', 'Piso', 'alquiler', 'Madrid', 'Lavapiés', 'Calle del Ave María 22', 40.4101, -3.7003, 1250, 68, 2, 1, 'Bajo', 1910, 'F', 'andres',
      ['mascotas', 'amueblado'],
      ['1612419299101-6c294dc2901d', '1725257928373-dc6d2ac7b145', '1633948393301-d43e3ec0e5cd'], false,
      'Corrala restaurada con patio propio de 15 m², muros gruesos y un silencio raro tan cerca de la plaza.'],
    ['piso-gracia', 'Piso modernista en Gràcia', 'Piso', 'venta', 'Barcelona', 'Vila de Gràcia', 'Carrer de Verdi 86', 41.4046, 2.1565, 595000, 96, 3, 2, 'Principal', 1905, 'E', 'mireia',
      ['ascensor', 'aire'],
      ['1665249934445-1de680641f50', '1683629357935-f3f4777ddf41', '1600210491305-7396500b5b31', '1676371855313-a56044326d31'], false,
      'Suelo hidráulico original, techos con volta catalana y galería acristalada a un interior de manzana.'],
    ['loft-poblenou', 'Loft en antigua fábrica textil', 'Loft', 'venta', 'Barcelona', 'Poblenou', 'Carrer de Pujades 112', 41.4003, 2.1975, 720000, 130, 2, 2, '2.ª', 1961, 'C', 'mireia',
      ['ascensor', 'garaje', 'aire', 'terraza'],
      ['1776090188651-a1ec2cf2bdb0', '1783990349147-906f62b882c1', '1649083048428-3d8ed23a3ce0', '1720420021124-4e18564e070f'], false,
      'Planta diáfana con pilares de fundición, lucernarios y altillo para dormitorio. A seis calles de la playa.'],
    ['piso-eixample', 'Piso exterior en chaflán', 'Piso', 'alquiler', 'Barcelona', 'Eixample Dret', 'Carrer de Girona 65', 41.3945, 2.1702, 2400, 110, 3, 2, '4.ª', 1930, 'D', 'mireia',
      ['ascensor', 'aire', 'amueblado', 'vistas'],
      ['1629042306547-c1d7c6c85ffa', '1671197244266-73129c97c096', '1613685703237-6628de38ddb7', '1609280069865-62f178e2c237'], false,
      'Chaflán con tribuna, tres orientaciones y luz desde primera hora. Portería y ascensor restaurado.'],
    ['casa-cabanyal', 'Casa de pescadores restaurada', 'Casa', 'venta', 'Valencia', 'El Cabanyal', 'Carrer de la Reina 204', 39.4685, -0.3262, 420000, 124, 3, 2, 'Dos plantas', 1920, 'C', 'mireia',
      ['terraza', 'mascotas', 'aire'],
      ['1618411875289-bf1080855b6d', '1600493505873-cddd69453072', '1725257928373-dc6d2ac7b145', '1631048501786-4e97f20eac71'], true,
      'Fachada de azulejo original, patio y azotea transitable. La Malvarrosa queda al final de la calle.'],
    ['atico-ciutat-vella', 'Ático junto al Mercado Central', 'Ático', 'alquiler', 'Valencia', 'Ciutat Vella', 'Plaça del Mercat 6', 39.4737, -0.3790, 1450, 75, 2, 1, '5.ª', 1948, 'D', 'mireia',
      ['terraza', 'ascensor', 'amueblado', 'aire', 'vistas'],
      ['1776363116182-51694a04a1d5', '1613575831056-0acd5da8f085', '1722605090433-41d1183a792d', '1560448075-57d0285fc59b'], false,
      'Terraza de 20 m² con vistas a la cúpula del mercado y a la Lonja. Entrada inmediata.'],
    ['casa-triana', 'Casa patio en Triana', 'Casa', 'venta', 'Sevilla', 'Triana', 'Calle Pureza 48', 37.3838, -6.0029, 685000, 210, 4, 3, 'Tres plantas', 1890, 'D', 'rocio',
      ['terraza', 'jardin', 'aire', 'trastero'],
      ['1760260864042-bdf1a0443aaf', '1780257562941-d9a6923befa1', '1635321350281-e2a91ecffd00', '1750420556288-d0e32a6f517b', '1564540579594-0930edb6de43'], true,
      'Patio central con columnas de mármol y azotea con vistas a la Giralda. Rehabilitación integral en 2020.'],
    ['piso-santa-cruz', 'Piso en el barrio de Santa Cruz', 'Piso', 'alquiler', 'Sevilla', 'Santa Cruz', 'Calle Mateos Gago 15', 37.3862, -5.9904, 1100, 72, 2, 1, '2.ª', 1935, 'E', 'rocio',
      ['amueblado', 'aire', 'ascensor'],
      ['1630699144867-37acec97df5a', '1683629357935-f3f4777ddf41', '1720420021124-4e18564e070f'], false,
      'Balcones a Mateos Gago y la Catedral al fondo de la calle. Reformado, con muros de 60 cm que aíslan del calor.'],
    ['estudio-alameda', 'Estudio con azotea compartida', 'Estudio', 'alquiler', 'Sevilla', 'Alameda de Hércules', 'Calle Feria 73', 37.3991, -5.9925, 690, 38, 0, 1, '1.ª', 1970, 'E', 'rocio',
      ['amueblado', 'aire', 'mascotas'],
      ['1600493505873-cddd69453072', '1649083048337-4aeb6dda80bb', '1776525433347-13ffc965601a'], false,
      'Pequeño, fresco y recién pintado, con acceso a la azotea comunitaria y el mercado de Feria enfrente.'],
    ['piso-soho-malaga', 'Piso de diseño en el Soho', 'Piso', 'venta', 'Málaga', 'Soho', 'Calle Tomás Heredia 12', 36.7172, -4.4236, 398000, 88, 2, 2, '3.ª', 2017, 'B', 'rocio',
      ['ascensor', 'garaje', 'aire', 'trastero'],
      ['1780257562963-3389a4105371', '1759147960461-b74a7e9a75d4', '1765279333918-949ddcb655ba', '1742134131017-44d377a611b1'], false,
      'Edificio de 2017 a tres calles del puerto. Cocina abierta, dos dormitorios en suite y plaza de garaje.'],
    ['casa-pedregalejo', 'Casa mata a pie de playa', 'Casa', 'alquiler', 'Málaga', 'Pedregalejo', 'Calle Bolivia 91', 36.7203, -4.3801, 2100, 115, 3, 2, 'Una planta', 1955, 'D', 'rocio',
      ['terraza', 'mascotas', 'aire', 'vistas', 'jardin'],
      ['1558969763-1e911dcd91e6', '1612419299101-6c294dc2901d', '1649083048391-1c9e82472f65', '1724582586413-6b69e1c94a17'], false,
      'Antigua casa de pescadores a cuarenta pasos del paseo marítimo, con patio delantero y jazmín.'],
    ['villa-el-limonar', 'Villa contemporánea en El Limonar', 'Villa', 'venta', 'Málaga', 'El Limonar', 'Paseo del Limonar 37', 36.7262, -4.3975, 1690000, 410, 5, 5, 'Tres plantas', 2022, 'A', 'rocio',
      ['piscina', 'jardin', 'garaje', 'terraza', 'aire', 'vistas', 'ascensor', 'trastero'],
      ['1706164971302-e30c0640cc3b', '1776362355123-ca966d36e29c', '1671197244266-73129c97c096', '1750420556288-d0e32a6f517b', '1733426107854-ee00a25d72a7'], true,
      'Hormigón, madera y vidrio sobre la bahía. Piscina desbordante, ascensor interior y aerotermia.']
  ];

  const PROPIEDADES = F.map((r, i) => ({
    id: r[0], titulo: r[1], tipo: r[2], op: r[3], ciudad: r[4], barrio: r[5], direccion: r[6], lat: r[7], lng: r[8],
    precio: r[9], m2: r[10], hab: r[11], banos: r[12], planta: r[13], anio: r[14], energia: r[15], agente: r[16],
    extras: r[17], fotos: r[18], destacado: r[19], entradilla: r[20],
    ref: 'NID-' + String(2600 + i * 37).padStart(4, '0'), publicado: i * 3 + 1
  }));

  const OPINIONES = [
    { texto: 'Encontré mi piso en menos de tres semanas. Entendieron lo que buscaba y no perdimos una tarde en visitas que no encajaban.', autor: 'Carmen Molina', rol: 'Compró en Chamberí' },
    { texto: 'Vendí en once días y por encima del precio de salida. Me explicaron cada oferta por teléfono, sin letra pequeña.', autor: 'Javier Romero', rol: 'Vendió en Gràcia' },
    { texto: 'Gestionan mi alquiler desde hace dos años. Cobro el día 5, y si se rompe algo me entero cuando ya está arreglado.', autor: 'Ana Llorente', rol: 'Propietaria en Ruzafa' }
  ];

  const SERVICIOS = [
    { t: 'Compra y venta', d: 'Un agente de tu zona te acompaña desde la primera visita hasta la notaría. Honorarios cerrados por escrito antes de empezar.' },
    { t: 'Alquiler gestionado', d: 'Selección de inquilino, contrato, cobro mensual e incidencias. Tú recibes la transferencia y un resumen cada trimestre.' },
    { t: 'Financiación', d: 'Comparamos hipotecas de nueve entidades y negociamos condiciones con tu documentación ya preparada.' },
    { t: 'Tasación orientativa', d: 'Calcula en esta misma página una horquilla de valor a partir del precio medio del barrio. La visita de un tasador la afina.' },
    { t: 'Visitas a tu ritmo', d: 'Reserva día y hora desde la ficha de cada inmueble. Sin llamadas: la agenda del agente está a la vista.' }
  ];

  window.NIDUS_DATOS = { foto, CIUDADES, AGENTES, EXTRAS, TIPOS, PROPIEDADES, OPINIONES, SERVICIOS };
})();
