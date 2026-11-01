// CAPA DE ACCESO A DATOS (repositorio), simulando una base de datos en memoria
const productos = [
  { id: 1, nombre: 'Mango', categoria: 'fruta', unidad: 'caja', precio: 45000, activo: true },
  { id: 2, nombre: 'Tomate', categoria: 'hortaliza', unidad: 'kg', precio: 3500, activo: true },
];

let siguienteId = 3;

async function findAll(filtros = {}) {
  let resultado = productos;
  if (filtros.categoria) {
    resultado = resultado.filter((p) => p.categoria === filtros.categoria);
  }
  if (filtros.ids) {
    resultado = resultado.filter((p) => filtros.ids.includes(p.id));
  }
  return resultado;
}

async function findById(id) {
  return productos.find((p) => p.id === id) || null;
}

async function findByNombre(nombre) {
  const buscado = nombre.toLowerCase();
  return productos.find((p) => p.nombre.toLowerCase() === buscado) || null;
}

async function create(producto) {
  const nuevo = { id: siguienteId++, ...producto };
  productos.push(nuevo);
  return nuevo;
}

// Devuelve el producto actualizado, o null si no existe
async function update(id, datos) {
  const indice = productos.findIndex((p) => p.id === id);
  if (indice === -1) return null;
  productos[indice] = { id, ...datos };
  return productos[indice];
}

// Devuelve true si eliminó, false si no existía
async function remove(id) {
  const indice = productos.findIndex((p) => p.id === id);
  if (indice === -1) return false;
  productos.splice(indice, 1);
  return true;
}

module.exports = { findAll, findById, findByNombre, create, update, remove };