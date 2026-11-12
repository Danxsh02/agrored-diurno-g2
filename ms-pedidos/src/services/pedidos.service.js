// =====================================================================
// CAPA DE SERVICIO (lógica de negocio)
// Aplica las reglas del negocio y las validaciones.
// No sabe nada de HTTP (req/res) ni de cómo se guardan los datos.
//
// Reglas propias de Pedido (responden 400 con la lista de detalles):
//   - cantidad: entero mayor que 0
//   - centro_distribucion: Bogotá o Cali
//   - estado: recibido, despachado o entregado
// Relaciones: el cliente (ms-clientes) y el producto (ms-productos) deben existir.
// Pedido no tiene un campo único, así que no hay regla de 409.
// =====================================================================
const repo = require('../repositories/pedidos.repository');
const { validarPedido, construirPedido } = require('../models/pedido');
const HttpError = require('../utils/http-error');
const clientesClient = require('../clients/clientes.client');
const productosClient = require('../clients/productos.client');

function noExiste(id) {
  return new HttpError(404, `No existe el pedido con id ${id}`);
}

// Relación: el cliente referenciado debe existir en ms-clientes
async function validarCliente(clienteId, token) {
  if (!(await clientesClient.existeCliente(clienteId, token))) {
    throw new HttpError(400, `No existe el cliente con id ${clienteId}`);
  }
}

// Relación: el producto referenciado debe existir en ms-productos
async function validarProducto(productoId, token) {
  if (!(await productosClient.existeProducto(productoId, token))) {
    throw new HttpError(400, `No existe el producto con id ${productoId}`);
  }
}

// Agrega a cada pedido su cliente y su producto, con UNA consulta a cada servicio.
// Si un servicio no responde, solo ese campo queda en null (degradación controlada).
async function componer(pedidos, token) {
  const idsClientes = [...new Set(pedidos.map((p) => p.cliente_id))];
  const idsProductos = [...new Set(pedidos.map((p) => p.producto_id))];
  const [clientes, productos] = await Promise.all([
    clientesClient.clientesPorIds(idsClientes, token),
    productosClient.productosPorIds(idsProductos, token),
  ]);
  return pedidos.map((p) => {
    const resultado = {
      ...p,
      cliente: clientes ? clientes.get(p.cliente_id) || null : null,
      producto: productos ? productos.get(p.producto_id) || null : null,
    };
    const avisos = [];
    if (!clientes) avisos.push('ms-clientes no disponible');
    if (!productos) avisos.push('ms-productos no disponible');
    if (avisos.length > 0) resultado.aviso = avisos.join('; ');
    return resultado;
  });
}

async function listar(filtros, token) {
  return componer(await repo.findAll(filtros), token);
}

async function obtener(id, token) {
  const pedido = await repo.findById(id);
  if (!pedido) throw noExiste(id);
  const [compuesto] = await componer([pedido], token);
  return compuesto;
}

async function crear(datos, token) {
  const errores = validarPedido(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const pedido = construirPedido(datos);
  await validarCliente(pedido.cliente_id, token);
  await validarProducto(pedido.producto_id, token);
  const nuevo = await repo.create(pedido);
  const [compuesto] = await componer([nuevo], token);
  return compuesto;
}

// PUT: valida igual que crear y responde 404 si el pedido no existe
async function actualizar(id, datos, token) {
  const errores = validarPedido(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);
  const pedido = construirPedido(datos);
  await validarCliente(pedido.cliente_id, token);
  await validarProducto(pedido.producto_id, token);
  const actualizado = await repo.update(id, pedido);
  if (!actualizado) throw noExiste(id);
  const [compuesto] = await componer([actualizado], token);
  return compuesto;
}

// DELETE: responde 404 si el pedido no existe
async function eliminar(id) {
  const eliminado = await repo.remove(id);
  if (!eliminado) throw noExiste(id);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };