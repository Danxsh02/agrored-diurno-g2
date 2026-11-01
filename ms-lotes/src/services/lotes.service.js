// =====================================================================
// CAPA DE SERVICIO (lógica de negocio Lotes)
// =====================================================================
const repo = require('../repositories/lotes.repository');
const { validarLote, construirLote } = require('../models/lote');
const HttpError = require('../utils/http-error');

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const lote = await repo.findById(id);
  if (!lote) throw new HttpError(404, `No existe el lote con id ${id}`);
  return lote;
}

async function crear(datos) {
  const errores = validarLote(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const lote = construirLote(datos);
  if (await repo.findByCodigo(lote.codigo_lote)) {
    throw new HttpError(409, `Ya existe un lote con el código ${lote.codigo_lote}`);
  }
  return repo.create(lote);
}

async function actualizar(id, datos) {
  const errores = validarLote(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  await obtener(id); // 404 si no existe
  const lote = construirLote(datos);
  const repetido = await repo.findByCodigo(lote.codigo_lote);
  if (repetido && repetido.id !== id) {
    throw new HttpError(409, `Ya existe un lote con el código ${lote.codigo_lote}`);
  }
  return repo.update(id, lote);
}

async function eliminar(id) {
  if (!(await repo.remove(id))) throw new HttpError(404, `No existe el lote con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };