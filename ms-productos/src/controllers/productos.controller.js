// CAPA DE PRESENTACIÓN (controlador)
const service = require('../services/productos.service');
const HttpError = require('../utils/http-error');

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
  return id;
}

// GET /productos  (?categoria=fruta  ?ids=1,3,8)
async function listar(req, res) {
  const filtros = {};
  if (req.query.categoria) filtros.categoria = String(req.query.categoria);
  if (req.query.ids) {
    filtros.ids = String(req.query.ids).split(',').map(Number);
    if (filtros.ids.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new HttpError(400, 'ids debe ser una lista de enteros separados por comas');
    }
  }

  const productos = await service.listar(filtros);

  // Si pidieron varios ids y solo existen algunos, se avisa en una cabecera
  if (filtros.ids) {
    const encontrados = new Set(productos.map((p) => p.id));
    const faltantes = [...new Set(filtros.ids)].filter((id) => !encontrados.has(id));
    if (faltantes.length > 0) res.set('X-Ids-No-Encontrados', faltantes.join(','));
  }
  res.status(200).json(productos);
}

// GET /productos/:id
async function obtener(req, res) {
  res.status(200).json(await service.obtener(leerId(req)));
}

// POST /productos
async function crear(req, res) {
  const nuevo = await service.crear(req.body);
  res.status(201).location(`${req.baseUrl}/${nuevo.id}`).json(nuevo);
}

// PUT /productos/:id
async function actualizar(req, res) {
  res.status(200).json(await service.actualizar(leerId(req), req.body));
}

// DELETE /productos/:id
async function eliminar(req, res) {
  const id = leerId(req);
  await service.eliminar(id);
  console.log(`Producto con id ${id} eliminado correctamente`);
  res.status(204).end(); // 204 No Content: éxito, sin cuerpo
}

module.exports = { listar, obtener, crear, actualizar, eliminar };