// =====================================================================
// CAPA DE PRESENTACIÓN (controlador)
// Traduce HTTP <-> servicio: lee la petición (params, query, body),
// llama al servicio y arma la respuesta (código de estado + JSON).
// =====================================================================
const service = require('../services/pedidos.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /pedidos            -> todos
// GET /pedidos?estado=recibido -> solo los de ese estado
async function listar(req, res) {
  const filtros = {
    estado: typeof req.query.estado === 'string' ? req.query.estado : undefined,
  };
  const pedidos = await service.listar(filtros);
  res.status(200).json(pedidos);
}

// GET /pedidos/:id
async function obtener(req, res) {
  const pedido = await service.obtener(leerId(req));
  res.status(200).json(pedido);
}

// POST /pedidos
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

// PUT /pedidos/:id  (reemplaza el pedido completo)
async function actualizar(req, res) {
  const pedido = await service.actualizar(leerId(req), req.body);
  res.status(200).json(pedido);
}

// DELETE /pedidos/:id
async function eliminar(req, res) {
  await service.eliminar(leerId(req));
  res.status(204).end(); // 204 No Content: éxito, sin cuerpo
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
