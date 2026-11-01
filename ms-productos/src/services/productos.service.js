// CAPA DE SERVICIO (lógica de negocio)
const repo = require('../repositories/productos.repository');
const { validarProducto, construirProducto, CATEGORIAS_VALIDAS } = require('../models/producto');
const HttpError = require('../utils/http-error');

async function listar(filtros = {}) {
  if (filtros.categoria !== undefined) {
    const categoria = filtros.categoria.trim().toLowerCase();
    if (!Number.isNaN(Number(categoria))) {
      throw new HttpError(400, 'La categoría debe ingresarse con su nombre, no con un número');
    }
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      throw new HttpError(
        400,
        `La categoría ingresada no es válida; debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`
      );
    }
    filtros = { ...filtros, categoria };
  }

  const productos = await repo.findAll(filtros);

  if (filtros.ids && productos.length === 0) {
    const pedidos = [...new Set(filtros.ids)];
    throw new HttpError(404, `No existe ningún producto con id: ${pedidos.join(', ')}`);
  }
  return productos;
}

async function obtener(id) {
  const producto = await repo.findById(id);
  if (!producto) throw new HttpError(404, `No existe el producto con id ${id}`);
  return producto;
}

async function crear(datos) {
  const errores = validarProducto(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const producto = construirProducto(datos);
  if (await repo.findByNombre(producto.nombre)) {
    throw new HttpError(409, `Ya existe un producto con el nombre ${producto.nombre}`);
  }
  return repo.create(producto);
}

async function actualizar(id, datos) {
  const errores = validarProducto(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  await obtener(id); // lanza 404 si no existe

  const producto = construirProducto(datos);
  const repetido = await repo.findByNombre(producto.nombre);
  if (repetido && repetido.id !== id) {
    throw new HttpError(409, `Ya existe un producto con el nombre ${producto.nombre}`);
  }
  return repo.update(id, producto);
}

async function eliminar(id) {
  const eliminado = await repo.remove(id);
  if (!eliminado) throw new HttpError(404, `No existe el producto con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };