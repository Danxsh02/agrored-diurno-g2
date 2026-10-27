// =====================================================================
// CAPA DE PRESENTACIÓN (controlador Lotes)
// =====================================================================
const service = require('../services/lotes.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /lotes
async function listar(req, res) {
  const lotes = await service.listar();
  res.status(200).json(lotes);
}

// GET /lotes/:id
async function obtener(req, res) {
  const lote = await service.obtener(leerId(req));
  res.status(200).json(lote);
}

// POST /lotes
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

module.exports = { listar, obtener, crear };