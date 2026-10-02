# Nidus

Portal inmobiliario. Sitio estático (HTML, CSS y JavaScript), sin dependencias que instalar.

- `index.html`: portada con buscador, destacados, ciudades, tasación orientativa y contacto.
- `buscar.html`: catálogo con filtros, orden y mapa sincronizado; el estado de la búsqueda va en la URL.
- `propiedad.html?id=…`: ficha con galería, calculadora de hipoteca, mapa, reserva de visitas e inmuebles parecidos.
- `mi-espacio.html`: favoritos, visitas, búsquedas guardadas, tasaciones, consultas y cuenta.

Favoritos, visitas y cuentas se guardan en el navegador (localStorage). Inmuebles, agentes y precios son ficticios y viven en `datos.js`.

## Abrirlo

Abre `index.html`, o sírvelo:

```bash
npx serve .
```

Fotografías de Unsplash. Mapa con Leaflet (incluido en `vendor/`) y teselas de CARTO/OpenStreetMap, que necesitan conexión.
