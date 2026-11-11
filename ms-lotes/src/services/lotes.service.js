// =====================================================================
// CAPA DE SERVICIO (lógica de negocio Lotes)
// =====================================================================
const repo = require('../repositories/lotes.repository');
const { validarLote, construirLote } = require('../models/lote');
const productosClient = require('../clients/productos.client');
const HttpError = require('../utils/http-error');

// Función auxiliar para agregar el objeto "producto" a los lotes (Composición)
async function componer(lotes, token) {
  // Sacamos los IDs únicos de productos para hacer una sola petición
  const ids = [...new Set(lotes.map((l) => l.producto_id))];
  
  // Consultamos al microservicio de productos
  const productos = await productosClient.productosPorIds(ids, token);
  
  // Degradación controlada: si ms-productos está caído, devolvemos null
  if (!productos) { 
    return lotes.map((l) => ({ ...l, producto: null, aviso: 'ms-productos no disponible' }));
  }
  
  // Si respondió bien, pegamos el objeto producto a cada lote
  return lotes.map((l) => ({ ...l, producto: productos.get(l.producto_id) || null }));
}

async function listar(filtros, token) {
  const lotes = await repo.findAll(filtros);
  return componer(lotes, token); // Pasamos por la composición
}

async function obtener(id, token) {
  const lote = await repo.findById(id);
  if (!lote) throw new HttpError(404, `No existe el lote con id ${id}`);
  
  const [compuesto] = await componer([lote], token);
  return compuesto;
}

async function crear(datos, token) {
  const errores = validarLote(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  // VALIDACIÓN: Verificar que el producto exista en ms-productos
  if (!(await productosClient.existeProducto(datos.producto_id, token))) {
    throw new HttpError(400, `No existe el producto con id ${datos.producto_id}`);
  }

  const lote = construirLote(datos);
  if (await repo.findByCodigo(lote.codigo_lote)) {
    throw new HttpError(409, `Ya existe un lote con el código ${lote.codigo_lote}`);
  }

  const nuevo = await repo.create(lote);
  const [compuesto] = await componer([nuevo], token);
  return compuesto;
}

async function actualizar(id, datos, token) {
  const existe = await repo.findById(id);
  if (!existe) throw new HttpError(404, `No existe el lote con id ${id}`);

  const errores = validarLote(datos);
  if (errores.length > 0) throw new HttpError(400, 'Datos inválidos', errores);

  // VALIDACIÓN: Verificar que el producto exista
  if (!(await productosClient.existeProducto(datos.producto_id, token))) {
    throw new HttpError(400, `No existe el producto con id ${datos.producto_id}`);
  }

  const lote = construirLote(datos);
  const repetido = await repo.findByCodigo(lote.codigo_lote);
  if (repetido && repetido.id !== id) {
    throw new HttpError(409, `Ya existe un lote con el código ${lote.codigo_lote}`);
  }

  const actualizado = await repo.update(id, lote);
  const [compuesto] = await componer([actualizado], token);
  return compuesto;
}

async function eliminar(id) {
  if (!(await repo.remove(id))) throw new HttpError(404, `No existe el lote con id ${id}`);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };