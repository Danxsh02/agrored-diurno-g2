// =====================================================================
// ÚNICO lugar que sabe de dónde vienen los productos:
//  - MODO 'ejemplo': usa datos/productos.json (y simula las reglas de ms-productos)
//  - MODO 'real': llama a ms-productos con el token (Taller 3)
// =====================================================================
const ApiProductos = (() => {
  const DATOS_PRODUCTOS = 'datos/productos.json';
  const CATEGORIAS = ['fruta', 'hortaliza', 'procesado'];
  const UNIDADES = ['kg', 'caja'];
  let memoria = null;

  const pausa = (ms = 350) => new Promise((r) => setTimeout(r, ms));

  function fallo(status, mensaje, detalles) {
    const e = new Error(mensaje);
    e.status = status;
    e.detalles = detalles;
    return e;
  }

  // ---- Reglas iguales a las de ms-productos ----
  function validar(d) {
    const e = [];
    if (typeof d.nombre !== 'string' || d.nombre.trim() === '') e.push('nombre es obligatorio');
    else if (d.nombre.trim().length > 100) e.push('nombre no puede superar 100 caracteres');
    if (!CATEGORIAS.includes(d.categoria)) e.push(`categoria debe ser una de: ${CATEGORIAS.join(', ')}`);
    if (!UNIDADES.includes(d.unidad)) e.push(`unidad debe ser una de: ${UNIDADES.join(', ')}`);
    if (typeof d.precio !== 'number' || !(d.precio > 0)) e.push('precio es obligatorio y debe ser un número mayor que 0');
    return e;
  }

  function limpiar(d) {
    return {
      nombre: d.nombre.trim(), categoria: d.categoria, unidad: d.unidad,
      precio: d.precio, activo: d.activo === undefined ? true : d.activo
    };
  }

  const repetido = (datos, nombre, idPropio) =>
    datos.some((x) => x.nombre.toLowerCase() === nombre.toLowerCase() && x.id !== idPropio);

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
      const r = await fetch(DATOS_PRODUCTOS);
      if (!r.ok) throw fallo(r.status, 'No se pudo leer datos/productos.json');
      memoria = await r.json();
    }
    return memoria;
  }

  const ejemplo = {
    async listar() { await pausa(); return (await cargar()).map((p) => ({ ...p })); },
    async crear(d) {
      await pausa();
      const datos = await cargar();
      const e = validar(d);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      const p = limpiar(d);
      if (repetido(datos, p.nombre)) throw fallo(409, `Ya existe un producto con el nombre ${p.nombre}`);
      const nuevo = { id: Math.max(0, ...datos.map((x) => x.id)) + 1, ...p };
      datos.push(nuevo);
      return { ...nuevo };
    },
    async actualizar(id, d) {
      await pausa();
      const datos = await cargar();
      const e = validar(d);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el producto con id ${id}`);
      const p = limpiar(d);
      if (repetido(datos, p.nombre, id)) throw fallo(409, `Ya existe un producto con el nombre ${p.nombre}`);
      datos[i] = { id, ...p };
      return { ...datos[i] };
    },
    async eliminar(id) {
      await pausa(250);
      const datos = await cargar();
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el producto con id ${id}`);
      datos.splice(i, 1);
      return null;
    }
  };

  const real = {
    listar: () => http('/productos'),
    crear: (d) => http('/productos', { method: 'POST', body: JSON.stringify(limpiar(d)) }),
    actualizar: (id, d) => http(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(limpiar(d)) }),
    eliminar: (id) => http(`/productos/${id}`, { method: 'DELETE' })
  };

  return CONFIG.MODO === 'real' ? real : ejemplo;
})();