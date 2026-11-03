// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
//
// Reglas propias de Pedido (responden 400 con la lista de detalles):
//   - cantidad: entero mayor que 0
//   - centro_distribucion: Bogotá o Cali
//   - estado: recibido, despachado o entregado
// Pedido no tiene un campo único, así que no hay regla de 409.
// En el Taller 2 (semana 2) cliente_id y producto_id se validarán
// consultando a ms-clientes y ms-productos.
// =====================================================================
const repo = require('../repositories/pedidos.repository');
const { validarPedido, construirPedido } = require('../models/pedido');
const HttpError = require('../utils/http-error');

function noExiste(id) {
  return new HttpError(404, `No existe el pedido con id ${id}`);
}

async function listar(filtros) {
  return repo.findAll(filtros);
}

async function obtener(id) {
  const pedido = await repo.findById(id);
  if (!pedido) throw noExiste(id);
  return pedido;
}

async function crear(datos) {
  const errores = validarPedido(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  return repo.create(construirPedido(datos));
}

// PUT: valida igual que crear y responde 404 si el pedido no existe
async function actualizar(id, datos) {
  const errores = validarPedido(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const actualizado = await repo.update(id, construirPedido(datos));
  if (!actualizado) throw noExiste(id);
  return actualizado;
}

// DELETE: responde 404 si el pedido no existe
async function eliminar(id) {
  const eliminado = await repo.remove(id);
  if (!eliminado) throw noExiste(id);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
