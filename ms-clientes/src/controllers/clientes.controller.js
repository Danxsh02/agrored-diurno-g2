// CAPA DE PRESENTACIÓN (controlador)

const service = require('../services/clientes.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /clientes
async function listar(req, res) {
  res.status(200).json(await service.listar());
}

// GET /clientes/:id
async function obtener(req, res) {
  res.status(200).json(await service.obtener(leerId(req)));
}

// POST /clientes
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

module.exports = { listar, obtener, crear };