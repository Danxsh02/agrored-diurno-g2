// =====================================================================
// ÚNICO lugar que sabe de dónde vienen los lotes:
//  - MODO 'ejemplo': usa datos/lotes.json (y simula las reglas de ms-lotes)
//  - MODO 'real': llama a ms-lotes con el token (Taller 3)
// =====================================================================
const ApiLotes = (() => {
  const DATOS_LOTES = 'datos/lotes.json';
  const RESULTADOS = ['pendiente', 'aprobado', 'rechazado'];
  const FECHA = /^\d{4}-\d{2}-\d{2}$/;
  const PRODUCTOS_EJEMPLO = [
    { id: 1, nombre: 'Mango', categoria: 'fruta' },
    { id: 2, nombre: 'Tomate', categoria: 'hortaliza' },
    { id: 3, nombre: 'Papaya', categoria: 'fruta' }
  ];
  let memoria = null;

  const pausa = (ms = 350) => new Promise((r) => setTimeout(r, ms));
  const hoy = () => new Date().toLocaleDateString('en-CA');

  function fallo(status, mensaje, detalles) {
    const e = new Error(mensaje);
    e.status = status;
    e.detalles = detalles;
    return e;
  }

  // Convierte lo que escribe el formulario al formato del contrato
  function normalizar(d) {
    const texto = (v) => (typeof v === 'string' ? v.trim() : v);
    return {
      codigo_lote: texto(d.codigo_lote),
      producto_id: d.producto_id === '' || d.producto_id == null ? null : Number(d.producto_id),
      fecha_produccion: texto(d.fecha_produccion),
      cantidad: d.cantidad === '' || d.cantidad == null ? null : Number(d.cantidad),
      resultado_calidad: d.resultado_calidad,
      fecha_vencimiento: texto(d.fecha_vencimiento) || null,
      centro_produccion: texto(d.centro_produccion) || null
    };
  }

  // ---- Reglas iguales a las de ms-lotes ----
  function validar(d) {
    const e = [];
    if (!d.codigo_lote || typeof d.codigo_lote !== 'string') e.push('codigo_lote es obligatorio');
    if (!Number.isInteger(d.producto_id) || d.producto_id <= 0) e.push('producto_id es obligatorio y debe ser un entero positivo');
    if (!d.fecha_produccion || !FECHA.test(d.fecha_produccion)) e.push('fecha_produccion es obligatoria (formato YYYY-MM-DD)');
    else if (d.fecha_produccion > hoy()) e.push('fecha_produccion no puede ser futura');
    if (typeof d.cantidad !== 'number' || !(d.cantidad > 0)) e.push('cantidad debe ser un número mayor a 0');
    if (!RESULTADOS.includes(d.resultado_calidad)) e.push(`resultado_calidad debe ser uno de: ${RESULTADOS.join(', ')}`);
    if (d.fecha_vencimiento && !FECHA.test(d.fecha_vencimiento)) e.push('fecha_vencimiento debe tener formato YYYY-MM-DD');
    return e;
  }

  // ---- MODO real ----
  async function http(ruta, opciones = {}) {
    const resp = await fetch(CONFIG.API_BASE + ruta, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Sesion.token()}` }
    });
    if (resp.status === 204) return null;
    const cuerpo = await resp.json().catch(() => ({}));
    if (!resp.ok) throw fallo(resp.status, cuerpo.error || 'Error inesperado', cuerpo.detalles);
    return cuerpo;
  }

  // ---- MODO ejemplo ----
  async function cargar() {
    if (!memoria) {
      const r = await fetch(DATOS_LOTES);
      if (!r.ok) throw fallo(r.status, 'No se pudo leer datos/lotes.json');
      memoria = await r.json();
    }
    return memoria;
  }

  const ejemplo = {
    async listar() { await pausa(); return (await cargar()).map((l) => ({ ...l })); },
    async productos() { await pausa(150); return PRODUCTOS_EJEMPLO.map((p) => ({ ...p })); },
    async crear(d) {
      await pausa();
      const datos = await cargar();
      const c = normalizar(d);
      const e = validar(c);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      if (datos.some((x) => x.codigo_lote === c.codigo_lote)) throw fallo(409, `Ya existe un lote con el código ${c.codigo_lote}`);
      const producto = PRODUCTOS_EJEMPLO.find((p) => p.id === c.producto_id);
      if (!producto) throw fallo(400, `No existe el producto con id ${c.producto_id}`);
      const nuevo = { id: Math.max(0, ...datos.map((x) => x.id)) + 1, ...c, producto: { ...producto } };
      datos.push(nuevo);
      return { ...nuevo };
    },
    async actualizar(id, d) {
      await pausa();
      const datos = await cargar();
      const c = normalizar(d);
      const e = validar(c);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el lote con id ${id}`);
      if (datos.some((x) => x.codigo_lote === c.codigo_lote && x.id !== id)) throw fallo(409, `Ya existe un lote con el código ${c.codigo_lote}`);
      const producto = PRODUCTOS_EJEMPLO.find((p) => p.id === c.producto_id);
      if (!producto) throw fallo(400, `No existe el producto con id ${c.producto_id}`);
      datos[i] = { id, ...c, producto: { ...producto } };
      return { ...datos[i] };
    },
    async eliminar(id) {
      await pausa(250);
      const datos = await cargar();
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el lote con id ${id}`);
      datos.splice(i, 1);
      return null;
    }
  };

  const real = {
    listar: () => http('/lotes'),
    productos: () => http('/productos'),
    crear: (d) => http('/lotes', { method: 'POST', body: JSON.stringify(normalizar(d)) }),
    actualizar: (id, d) => http(`/lotes/${id}`, { method: 'PUT', body: JSON.stringify(normalizar(d)) }),
    eliminar: (id) => http(`/lotes/${id}`, { method: 'DELETE' })
  };

  return CONFIG.MODO === 'real' ? real : ejemplo;
})();