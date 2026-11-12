// =====================================================================
// ÚNICO lugar que sabe de dónde vienen los pedidos:
//  - MODO 'ejemplo': usa datos/pedidos.json (y simula las reglas de ms-pedidos)
//  - MODO 'real': llama a ms-pedidos con el token (Taller 3)
// =====================================================================
const ApiPedidos = (() => {
  const DATOS_PEDIDOS = 'datos/pedidos.json';
  const ESTADOS = ['recibido', 'despachado', 'entregado'];
  const CENTROS = ['Bogotá', 'Cali'];
  const FECHA = /^\d{4}-\d{2}-\d{2}$/;
  const CLIENTES_EJEMPLO = [
    { id: 1, nombre: 'Distribuidora El Valle' },
    { id: 2, nombre: 'Comercial Andina' },
    { id: 3, nombre: 'Agrocomercial Antioquia' }
  ];
  const PRODUCTOS_EJEMPLO = [
    { id: 1, nombre: 'Mango' },
    { id: 2, nombre: 'Tomate' },
    { id: 3, nombre: 'Jugo de mora' }
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
    const numero = (v) => (v === '' || v == null ? null : Number(v));
    const datos = {
      cliente_id: numero(d.cliente_id),
      producto_id: numero(d.producto_id),
      cantidad: numero(d.cantidad),
      centro_distribucion: d.centro_distribucion
    };
    if (d.estado) datos.estado = d.estado;      // opcional: por defecto 'recibido'
    if (d.fecha) datos.fecha = d.fecha;         // opcional: por defecto hoy
    return datos;
  }

  // ---- Reglas iguales a las de ms-pedidos ----
  function validar(d) {
    const e = [];
    const positivo = (v) => Number.isInteger(v) && v > 0;
    if (!positivo(d.cliente_id)) e.push('cliente_id es obligatorio y debe ser un entero positivo');
    if (!positivo(d.producto_id)) e.push('producto_id es obligatorio y debe ser un entero positivo');
    if (!positivo(d.cantidad)) e.push('cantidad es obligatoria y debe ser un entero mayor que 0');
    if (!CENTROS.includes(d.centro_distribucion)) e.push(`centro_distribucion debe ser uno de: ${CENTROS.join(', ')}`);
    if (d.estado !== undefined && !ESTADOS.includes(d.estado)) e.push(`estado debe ser uno de: ${ESTADOS.join(', ')}`);
    if (d.fecha !== undefined && !FECHA.test(d.fecha)) e.push('fecha debe tener el formato AAAA-MM-DD y ser una fecha real');
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
      const r = await fetch(DATOS_PEDIDOS);
      if (!r.ok) throw fallo(r.status, 'No se pudo leer datos/pedidos.json');
      memoria = await r.json();
    }
    return memoria;
  }

  // Simula la validación de ms-pedidos contra ms-clientes y ms-productos (400)
  function relacionados(c) {
    const cliente = CLIENTES_EJEMPLO.find((x) => x.id === c.cliente_id);
    if (!cliente) throw fallo(400, `No existe el cliente con id ${c.cliente_id}`);
    const producto = PRODUCTOS_EJEMPLO.find((x) => x.id === c.producto_id);
    if (!producto) throw fallo(400, `No existe el producto con id ${c.producto_id}`);
    return { cliente: { ...cliente }, producto: { ...producto } };
  }

  const ejemplo = {
    async listar() { await pausa(); return (await cargar()).map((p) => ({ ...p })); },
    async clientes() { await pausa(150); return CLIENTES_EJEMPLO.map((c) => ({ ...c })); },
    async productos() { await pausa(150); return PRODUCTOS_EJEMPLO.map((p) => ({ ...p })); },
    async crear(d) {
      await pausa();
      const datos = await cargar();
      const c = normalizar(d);
      const e = validar(c);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      const rel = relacionados(c);
      const nuevo = {
        id: Math.max(0, ...datos.map((x) => x.id)) + 1,
        ...c, estado: c.estado || 'recibido', fecha: c.fecha || hoy(), ...rel
      };
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
      if (i === -1) throw fallo(404, `No existe el pedido con id ${id}`);
      const rel = relacionados(c);
      datos[i] = { id, ...c, estado: c.estado || 'recibido', fecha: c.fecha || hoy(), ...rel };
      return { ...datos[i] };
    },
    async eliminar(id) {
      await pausa(250);
      const datos = await cargar();
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el pedido con id ${id}`);
      datos.splice(i, 1);
      return null;
    }
  };

  const real = {
    listar: () => http('/pedidos'),
    clientes: () => http('/clientes'),
    productos: () => http('/productos'),
    crear: (d) => http('/pedidos', { method: 'POST', body: JSON.stringify(normalizar(d)) }),
    actualizar: (id, d) => http(`/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(normalizar(d)) }),
    eliminar: (id) => http(`/pedidos/${id}`, { method: 'DELETE' })
  };

  return CONFIG.MODO === 'real' ? real : ejemplo;
})();
