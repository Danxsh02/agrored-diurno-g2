// CAPA DE ACCESO A DATOS (repositorio)

const clientes = [
  { id: 1, nombre: 'Distribuidora El Valle', nit: '900123456-7', ciudad: 'Cali', telefono: '3001234567', tipo: 'distribuidor', direccion: 'Calle 10 # 20-30', email: 'compras@distribuidora.com' },
  { id: 2, nombre: 'Comercial Andina', nit: '800987654-3', ciudad: 'Bogotá', telefono: '3109876543', tipo: 'comercio', direccion: 'Carrera 15 # 80-12', email: 'ventas@andina.com' },
];
let siguienteId = 3;

async function findAll(filtros = {}) {
  let resultado = clientes;
  if (filtros.ciudad) {
    resultado = resultado.filter((c) => c.ciudad.toLowerCase() === filtros.ciudad.toLowerCase());
  }
  if (filtros.tipo) {
    resultado = resultado.filter((c) => c.tipo === filtros.tipo);
  }
  if (filtros.ids) {
    resultado = resultado.filter((c) => filtros.ids.includes(c.id));
  }
  return resultado;
}

async function findById(id) {
  return clientes.find((c) => c.id === id) || null;
}

async function findByNit(nit) {
  return clientes.find((c) => c.nit === nit) || null;
}

async function create(cliente) {
  const nuevo = { id: siguienteId++, ...cliente };
  clientes.push(nuevo);
  return nuevo;
}

async function update(id, datos) {
  const indice = clientes.findIndex((c) => c.id === id);
  if (indice === -1) return null;
  clientes[indice] = { id, ...datos };
  return clientes[indice];
}

async function remove(id) {
  const indice = clientes.findIndex((c) => c.id === id);
  if (indice === -1) return false;
  clientes.splice(indice, 1);
  return true;
}

module.exports = { findAll, findById, findByNit, create, update, remove };