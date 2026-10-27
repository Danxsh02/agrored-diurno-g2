// =====================================================================
// CAPA DE SERVICIO (lógica de negocio Lotes)
// =====================================================================
const repo = require('../repositories/lotes.repository');
const { validarLote, construirLote } = require('../models/lote');
const HttpError = require('../utils/http-error');

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const lote = await repo.findById(id);
  if (!lote) throw new HttpError(404, `No existe el lote con id ${id}`);
  return lote;
}

async function crear(datos) {
  // 1. Validar que los datos tengan el formato correcto
  const errores = validarLote(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  const lote = construirLote(datos);

  // 2. Regla de negocio: el codigo_lote debe ser único (409 = Conflict)
  if (await repo.findByCodigo(lote.codigo_lote)) {
    throw new HttpError(409, `Ya existe un lote con el código ${lote.codigo_lote}`);
  }

  // 3. Guardar
  return repo.create(lote);
}

module.exports = { listar, obtener, crear };