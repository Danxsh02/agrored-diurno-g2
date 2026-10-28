// CAPA DE ACCESO A DATOS (repositorio)

const clientes = [
  { id: 1, nombre: 'Distribuidora El Valle', nit: '900123456-7', ciudad: 'Cali', telefono: '3001234567', tipo: 'distribuidor', direccion: 'Calle 10 # 20-30', email: 'compras@distribuidora.com' },
  { id: 2, nombre: 'Comercial Andina', nit: '800987654-3', ciudad: 'Bogotá', telefono: '3109876543', tipo: 'comercio', direccion: 'Carrera 15 # 80-12', email: 'ventas@andina.com' },
];
let siguienteId = 3;

async function findAll() {
  return clientes;
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

module.exports = { findAll, findById, findByNit, create };