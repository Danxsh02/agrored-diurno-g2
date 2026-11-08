// =====================================================================
// ÚNICO lugar que sabe de dónde vienen los clientes:
//  - MODO 'ejemplo': usa datos/clientes.json (y simula las reglas de ms-clientes)
//  - MODO 'real': llama a ms-clientes con el token (Taller 3)
// =====================================================================
const ApiClientes = (() => {
  const TIPOS = ['distribuidor', 'comercio'];
  let memoria = null;

  const pausa = (ms = 350) => new Promise((r) => setTimeout(r, ms));

  function fallo(status, mensaje, detalles) {
    const e = new Error(mensaje);
    e.status = status;
    e.detalles = detalles;
    return e;
  }

  // ---- Reglas iguales a las de ms-clientes ----
  function validar(d) {
    const e = [];
    const vacio = (v) => typeof v !== 'string' || v.trim() === '';
    if (vacio(d.nombre)) e.push('nombre es obligatorio');
    if (vacio(d.nit)) e.push('nit es obligatorio');
    if (vacio(d.ciudad)) e.push('ciudad es obligatoria');
    if (vacio(d.telefono)) e.push('telefono es obligatorio');
    if (!TIPOS.includes(d.tipo)) e.push('tipo debe ser uno de: distribuidor, comercio');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.push('email debe tener un formato válido');
    return e;
  }

  function limpiar(d) {
    return {
      nombre: d.nombre.trim(), nit: d.nit.trim(), ciudad: d.ciudad.trim(),
      telefono: d.telefono.trim(), tipo: d.tipo,
      direccion: (d.direccion || '').trim(), email: (d.email || '').trim().toLowerCase()
    };
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
      const r = await fetch(CONFIG.DATOS_CLIENTES);
      if (!r.ok) throw fallo(r.status, 'No se pudo leer datos/clientes.json');
      memoria = await r.json();
    }
    return memoria;
  }

  const ejemplo = {
    async listar() { await pausa(); return (await cargar()).map((c) => ({ ...c })); },
    async crear(d) {
      await pausa();
      const datos = await cargar();
      const e = validar(d);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      const c = limpiar(d);
      if (datos.some((x) => x.nit === c.nit)) throw fallo(409, `Ya existe un cliente con el NIT ${c.nit}`);
      const nuevo = { id: Math.max(0, ...datos.map((x) => x.id)) + 1, ...c };
      datos.push(nuevo);
      return { ...nuevo };
    },
    async actualizar(id, d) {
      await pausa();
      const datos = await cargar();
      const e = validar(d);
      if (e.length) throw fallo(400, 'Datos inválidos', e);
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el cliente con id ${id}`);
      const c = limpiar(d);
      if (datos.some((x) => x.nit === c.nit && x.id !== id)) throw fallo(409, `Ya existe un cliente con el NIT ${c.nit}`);
      datos[i] = { id, ...c };
      return { ...datos[i] };
    },
    async eliminar(id) {
      await pausa(250);
      const datos = await cargar();
      const i = datos.findIndex((x) => x.id === id);
      if (i === -1) throw fallo(404, `No existe el cliente con id ${id}`);
      datos.splice(i, 1);
      return null;
    }
  };

  const real = {
    listar: () => http('/clientes'),
    crear: (d) => http('/clientes', { method: 'POST', body: JSON.stringify(limpiar(d)) }),
    actualizar: (id, d) => http(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(limpiar(d)) }),
    eliminar: (id) => http(`/clientes/${id}`, { method: 'DELETE' })
  };

  return CONFIG.MODO === 'real' ? real : ejemplo;
})();