// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
// En el Taller 3 aquí se validará que cliente_id y producto_id existan
// consultando a ms-clientes y ms-productos por REST.
// =====================================================================
const repo = require('../repositories/pedidos.repository');
const { validarPedido, construirPedido } = require('../models/pedido');
const HttpError = require('../utils/http-error');

async function listar() {
  return repo.findAll();
}

async function obtener(id) {
  const pedido = await repo.findById(id);
  if (!pedido) throw new HttpError(404, `No existe el pedido con id ${id}`);
  return pedido;
}

async function crear(datos) {
  const errores = validarPedido(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  return repo.create(construirPedido(datos));
}

module.exports = { listar, obtener, crear };
