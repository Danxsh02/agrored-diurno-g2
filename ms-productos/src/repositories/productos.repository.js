// CAPA DE ACCESO A DATOS (repositorio). Datos en memoria (Taller 1)
const productos = [
  { id: 1, nombre: 'Mango', categoria: 'fruta', unidad: 'caja', precio: 45000, activo: true },
  { id: 2, nombre: 'Tomate', categoria: 'hortaliza', unidad: 'kg', precio: 3500, activo: true },
];

async function findAll() {
  return productos;
}

async function findById(id) {
  return productos.find((p) => p.id === id) || null;
}

async function create(producto) {
  productos.push(producto);
  return producto;
}

module.exports = { findAll, findById, create };