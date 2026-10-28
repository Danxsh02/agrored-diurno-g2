// CAPA DE SERVICIO (lógica de negocio)
const repo = require('../repositories/productos.repository');
const { validarProducto, construirProducto } = require('../models/producto');
const HttpError = require('../utils/http-error');

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const producto = await repo.findById(id);
  if (!producto) throw new HttpError(404, `No existe el producto con id ${id}`);
  return producto;
}

async function crear(datos) {
  const errores = validarProducto(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  return repo.create(construirProducto(datos));
}

module.exports = { listar, obtener, crear };