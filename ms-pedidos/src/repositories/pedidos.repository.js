// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión en memoria (se pierden al reiniciar). En la Parte 3 se
// reemplaza por MySQL SIN tocar las otras capas: las funciones
// conservan el mismo nombre, los mismos parámetros y el mismo resultado.
// =====================================================================
const pedidos = [
  { id: 1, cliente_id: 1, producto_id: 1, cantidad: 50, centro_distribucion: 'Cali', estado: 'recibido', fecha: '2026-10-20' },
  { id: 2, cliente_id: 2, producto_id: 2, cantidad: 120, centro_distribucion: 'Bogotá', estado: 'despachado', fecha: '2026-10-22' },
  { id: 3, cliente_id: 1, producto_id: 3, cantidad: 30, centro_distribucion: 'Cali', estado: 'entregado', fecha: '2026-10-25' },
];
let siguienteId = 4;

async function findAll(filtros = {}) {
  let lista = pedidos;
  if (filtros.estado) lista = lista.filter((p) => p.estado === filtros.estado);
  return lista;
}

async function findById(id) {
  return pedidos.find((p) => p.id === id) || null;
}

async function create(pedido) {
  const nuevo = { id: siguienteId++, ...pedido };
  pedidos.push(nuevo);
  return nuevo;
}

// Devuelve el pedido actualizado, o null si no existe
async function update(id, datos) {
  const i = pedidos.findIndex((p) => p.id === id);
  if (i === -1) return null;
  pedidos[i] = { id, ...datos };
  return pedidos[i];
}

// Devuelve true si eliminó algo, false si no existía
async function remove(id) {
  const i = pedidos.findIndex((p) => p.id === id);
  if (i === -1) return false;
  pedidos.splice(i, 1);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
