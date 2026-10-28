// =====================================================================
// CAPA DE ACCESO A DATOS (repositorio)
// Única capa que sabe DÓNDE se guardan los datos.
// Versión del Taller 1: datos en memoria (se pierden al reiniciar).
// En el Taller 2 se reemplaza por MySQL SIN tocar las otras capas.
// Todas las funciones son async (devuelven promesas) para que el cambio
// a una base de datos real no obligue a modificar la capa de servicio.
// =====================================================================
const pedidos = [
  { id: 1, cliente_id: 1, producto_id: 1, cantidad: 50, centro_distribucion: 'Cali', estado: 'recibido', fecha: '2026-10-20' },
  { id: 2, cliente_id: 2, producto_id: 2, cantidad: 120, centro_distribucion: 'Bogotá', estado: 'despachado', fecha: '2026-10-22' },
  { id: 3, cliente_id: 1, producto_id: 3, cantidad: 30, centro_distribucion: 'Cali', estado: 'entregado', fecha: '2026-10-25' },
];
let siguienteId = 4;

async function findAll() {
  return pedidos;
}

async function findById(id) {
  return pedidos.find((p) => p.id === id) || null;
}

async function create(pedido) {
  const nuevo = { id: siguienteId++, ...pedido };
  pedidos.push(nuevo);
  return nuevo;
}

module.exports = { findAll, findById, create };
